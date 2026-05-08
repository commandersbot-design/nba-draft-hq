/**
 * calibration.ts — Module 2 (comps) tier-distribution + tier-rationing logic.
 *
 * Two responsibilities:
 *   1. Build outcome-tier distributions from a list of comp candidates
 *   2. Decide whether a prospect's NN distribution is rare-elite enough to
 *      "earn" Legend/Star comps in the output set.
 *
 * The point: kill the "5 Legend comps for everyone" failure mode in the old
 * engine. Per the design — if the top-15 NN don't actually skew rare-elite,
 * we forbid Legend/Star comps in the output regardless of how the user wants
 * the comp tree to look.
 *
 * Pure functions. The baseline distribution comes from cohortStats.outcomeBaseRates
 * (per era × posFam from the historical pool).
 */

import {
  type CohortStats,
  type Era,
  type PositionFamily,
  type OutcomeBaseRate,
  approxEqual,
  EPSILON,
  getOutcomeBaseRate,
} from "../grading/cohortStats";

// =============================================================================
// TYPES
// =============================================================================

/** Outcome tiers used in historicalProspects.json. */
export type OutcomeTier = "Legend" | "Star" | "Hit" | "Swing" | "Bust";
export const OUTCOME_TIERS: readonly OutcomeTier[] = ["Legend", "Star", "Hit", "Swing", "Bust"] as const;

/** Tier "score" used to weight expected outcomes in overall composite (Module 3). */
export const OUTCOME_TIER_SCORES: Record<OutcomeTier, number> = {
  Legend: 100,
  Star:    85,
  Hit:     70,
  Swing:   50,
  Bust:    30,
};

/** Distribution as counts + fractions. */
export interface OutcomeTierDistribution {
  n: number;
  counts: Record<OutcomeTier, number>;
  fractions: Record<OutcomeTier, number>;
  /** Anything in the source not mapping to a known tier. */
  unknownCount: number;
}

/** Tier-rationing decision applied to comp output selection. */
export interface TierRationing {
  allowLegend: boolean;
  allowStar: boolean;
  /** Required minimum count of Legend+Star in top-K NN to allow them in output. */
  minRareElite: number;
  /** Actual count of Legend+Star in top-K NN. */
  actualRareElite: number;
  reason: string;
}

/** Per-tier elevation: how much a prospect's NN distribution exceeds the baseline. */
export interface TierElevation {
  tier: OutcomeTier;
  baseline: number;       // e.g., 0.022 for Legend (2.2% historical base rate)
  observed: number;       // e.g., 0.13 for a strong-fingerprint prospect
  /** observed - baseline. Positive = NN over-represents this tier. */
  delta: number;
  /** (observed - baseline) / baseline — proportional elevation. */
  ratio: number | null;
}

// =============================================================================
// DISTRIBUTION BUILDING
// =============================================================================

function emptyCounts(): Record<OutcomeTier, number> {
  return { Legend: 0, Star: 0, Hit: 0, Swing: 0, Bust: 0 };
}

/** Build an OutcomeTierDistribution from a list of historicals' outcome tiers. */
export function buildDistribution(tiers: (string | null | undefined)[]): OutcomeTierDistribution {
  const counts = emptyCounts();
  let n = 0;
  let unknownCount = 0;
  for (const t of tiers) {
    if (!t) { continue; }
    if (t === "Legend" || t === "Star" || t === "Hit" || t === "Swing" || t === "Bust") {
      counts[t]++;
      n++;
    } else {
      unknownCount++;
    }
  }
  const fractions = emptyCounts();
  for (const tier of OUTCOME_TIERS) {
    fractions[tier] = n > 0 ? counts[tier] / n : 0;
  }
  return { n, counts, fractions, unknownCount };
}

/** Convert an OutcomeBaseRate (from cohortStats) to OutcomeTierDistribution shape. */
export function baseRateToDistribution(br: OutcomeBaseRate): OutcomeTierDistribution {
  return {
    n: br.n,
    counts: emptyCounts(),  // base rates only carry fractions
    fractions: {
      Legend: br.p_legend,
      Star:   br.p_star,
      Hit:    br.p_hit,
      Swing:  br.p_swing,
      Bust:   br.p_bust,
    },
    unknownCount: 0,
  };
}

/** Pull the baseline distribution for a (era, posFam). Falls back to pool if absent. */
export function getBaselineDistribution(
  cohortStats: CohortStats,
  era: Era,
  posFam: PositionFamily,
): OutcomeTierDistribution | null {
  const cell = getOutcomeBaseRate(cohortStats, era, posFam);
  if (cell) return baseRateToDistribution(cell);
  // No fallback because we don't have a per-posFam pool baseline. Caller must
  // handle null (e.g., compute from full historical pool on the fly).
  return null;
}

// =============================================================================
// TIER ELEVATION
// =============================================================================

export function computeElevation(
  observed: OutcomeTierDistribution,
  baseline: OutcomeTierDistribution,
): TierElevation[] {
  const out: TierElevation[] = [];
  for (const tier of OUTCOME_TIERS) {
    const o = observed.fractions[tier];
    const b = baseline.fractions[tier];
    out.push({
      tier,
      baseline: b,
      observed: o,
      delta: o - b,
      ratio: b > EPSILON ? (o - b) / b : null,
    });
  }
  return out;
}

// =============================================================================
// TIER RATIONING
// =============================================================================

/**
 * Decide whether a prospect's NN distribution is rare-elite enough to allow
 * Legend/Star comps in the output. Hard rule from the design:
 *
 *   if count(Legend ∪ Star) in top-K NN < 2 → forbid Legend/Star comps
 *
 * Rationale: returning Legend comps for non-rare-elite prospects is the #1
 * complaint about old comp engines. The 2-comp floor means the NN itself
 * has to over-represent the rare tier before we trust it as signal.
 *
 * Configurable via `minRareElite` (default 2). Higher = stricter.
 */
export function applyTierRationing(
  nnDistribution: OutcomeTierDistribution,
  minRareElite: number = 2,
): TierRationing {
  const rareElite = nnDistribution.counts.Legend + nnDistribution.counts.Star;
  const allow = rareElite >= minRareElite;
  let reason: string;
  if (allow) {
    reason = `top-K NN has ${rareElite} Legend+Star (≥ ${minRareElite}) — Legend/Star comps allowed.`;
  } else if (rareElite === 0) {
    reason = `top-K NN has 0 Legend/Star — Legend & Star comps forbidden.`;
  } else {
    reason = `top-K NN has only ${rareElite} Legend+Star (< ${minRareElite}) — Legend & Star comps forbidden.`;
  }
  return {
    allowLegend: allow,
    allowStar: allow,
    minRareElite,
    actualRareElite: rareElite,
    reason,
  };
}

/**
 * Stronger variant: separately ration Legend vs Star. Allows Star but not Legend
 * in cases where the NN has e.g. 3 Stars but 0 Legends.
 */
export function applyTieredRationing(
  nnDistribution: OutcomeTierDistribution,
  minLegend: number = 1,
  minStar: number = 2,
): TierRationing {
  const legendCount = nnDistribution.counts.Legend;
  const starCount   = nnDistribution.counts.Star;
  const allowLegend = legendCount >= minLegend;
  const allowStar   = (legendCount + starCount) >= minStar;
  const reason = `NN: ${legendCount} Legend, ${starCount} Star → Legend ${allowLegend ? "allowed" : "forbidden"}, Star ${allowStar ? "allowed" : "forbidden"}`;
  return {
    allowLegend, allowStar,
    minRareElite: minStar,
    actualRareElite: legendCount + starCount,
    reason,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/** Sanity check: distribution fractions sum to ~1.0 (or 0 if empty). */
export function isValidDistribution(d: OutcomeTierDistribution): boolean {
  if (d.n === 0) {
    return OUTCOME_TIERS.every((t) => approxEqual(d.fractions[t], 0));
  }
  const sum = OUTCOME_TIERS.reduce((s, t) => s + d.fractions[t], 0);
  return approxEqual(sum, 1.0, 1e-6);
}
