/**
 * overall.ts — Module 3: overall composite + confidence interval.
 *
 * Pipeline (per design):
 *   1. Compute the 30-NN historical pool around the prospect (reuses Module 2's
 *      distance machinery).
 *   2. E[outcome] = weighted average of tier-score × p_tier in NN.
 *   3. Star-shape bonus: rewards specialist profiles (one elite + one supporting trait).
 *   4. Red-flag deductions: age × OBPM, wingspan < height, archetype mismatch.
 *      SoS flag deferred until KenPom subscription.
 *   5. Point estimate = clip(E_outcome + bonus - flags, 30, 99).
 *   6. Confidence sigma = clip(σ_outcome_var + σ_missing_data, 4, 12).
 *
 * Pure function. Caller assembles candidate pool + trait scores + features.
 *
 * Key non-obvious decisions documented inline.
 */

import {
  type CohortStats,
  type Era,
  type FeatureKey,
  type FeatureVector,
  type PositionFamily,
  type DataMode,
  EPSILON,
  heightToInches,
} from "./cohortStats";
import type { TraitKey, TraitScore } from "./traitProjection";
import type { AllAxisScoresOutput, AxisKey } from "./axisScores";
import {
  type CompCandidate,
  type CompProspectInput,
} from "../comps/compEngine";
import { scoreCandidates, filterCandidatePool } from "../comps/compEngine";
import {
  type OutcomeTier,
  type OutcomeTierDistribution,
  buildDistribution,
  OUTCOME_TIERS,
} from "../comps/calibration";
import { getArchetypeAnchors } from "./archetypeLookup";
import { rescaleOverallScore, rescaleSigma, type RescaleResult } from "./scoreRescale";
import overallConfigRaw from "../../config/overallComposite.json";

// =============================================================================
// CONFIG TYPES
// =============================================================================

interface OverallConfig {
  knnK: number;
  outcomeTierScores: Record<OutcomeTier, number>;
  starShape: {
    eliteThreshold: number;
    supportingThreshold: number;
    slope: number;
    maxBonus: number;
  };
  redFlags: {
    ageFlag: { ageThreshold: number; deduction: number };
    lengthFlag: { applicablePositionFamilies: PositionFamily[]; deduction: number };
    archetypeFingerprintFlag: { fingerprintDistanceSigma: number; deduction: number };
    sosFlag: { enabled: boolean; deduction: number };
    maxTotalDeduction: number;
  };
  confidence: {
    sigmaMin: number;
    sigmaMax: number;
    missingDataPenaltyPerFeature: number;
    missingDataMaxPenalty: number;
    coreFeatures: FeatureKey[];
  };
  scoreClamp: { min: number; max: number };
}

let _configCache: OverallConfig | null = null;

export function loadOverallConfig(): OverallConfig {
  if (_configCache) return _configCache;
  _configCache = overallConfigRaw as unknown as OverallConfig;
  return _configCache;
}

export function clearOverallConfigCache(): void { _configCache = null; }

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export interface OverallProspectInput {
  prospect: CompProspectInput;
  /** From Module 1c. Used to compute star-shape bonus. */
  traitScores: Record<TraitKey, TraitScore>;
  /** From Module 1b. Used for archetype-fingerprint red flag. */
  axisScores: AllAxisScoresOutput;
  /**
   * Wingspan in inches, if known. Used by lengthFlag. Pass null if unknown —
   * the lengthFlag won't fire.
   */
  wingspanInches?: number | null;
  /**
   * Optional precomputed candidate pool. If absent, caller can pass null
   * and we skip the NN step (fail soft — overall returns null with notes).
   */
  candidatePool: CompCandidate[];
}

export interface RedFlag {
  name: string;
  deduction: number;
  reason: string;
}

export interface OverallScore {
  score: number | null;
  scoreSigma: number | null;
  /** [score - sigma, score + sigma] for the UI confidence band. */
  range: [number, number] | null;
  /**
   * UI display score — percentile-rescaled. Display = "this prospect's raw
   * score is at the Nth percentile of historicals." Median historical = 50,
   * top 1% = 99. Rendered in the UI; raw score is the statistical truth.
   */
  display: RescaleResult | null;
  /** Display sigma in percentile-space (re-derived to match display score). */
  displaySigma: number | null;
  /** Display range — same idea as `range` but in percentile space. */
  displayRange: [number, number] | null;
  dataMode: DataMode;

  breakdown: {
    /** Expected outcome value from NN tier distribution. */
    eOutcome: number | null;
    starBonus: number;
    redFlagTotal: number;
    nnDistribution: OutcomeTierDistribution | null;
    nnUsed: number;
    redFlags: RedFlag[];
    maxTraitZ: number | null;
    secondTraitZ: number | null;
    sigmaFromOutcomeVariance: number | null;
    sigmaFromMissingData: number;
  };

  notes: string[];
}

// =============================================================================
// CORE
// =============================================================================

/** E[outcome] = Σ p_tier × score_tier */
function computeExpectedOutcome(
  nnDist: OutcomeTierDistribution,
  tierScores: Record<OutcomeTier, number>,
): number {
  let sum = 0;
  for (const tier of OUTCOME_TIERS) {
    sum += nnDist.fractions[tier] * tierScores[tier];
  }
  return sum;
}

/**
 * Std-dev of NN outcome scores. NOT std-dev of `n` outcome SCORES (which would
 * compress for tight distributions); rather, treat each NN as having its
 * tier's score and compute std over those n samples.
 */
function computeOutcomeVariance(
  nnDist: OutcomeTierDistribution,
  tierScores: Record<OutcomeTier, number>,
): number | null {
  if (nnDist.n === 0) return null;
  const samples: number[] = [];
  for (const tier of OUTCOME_TIERS) {
    const count = nnDist.counts[tier];
    for (let i = 0; i < count; i++) samples.push(tierScores[tier]);
  }
  if (samples.length === 0) return null;
  const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
  const variance = samples.reduce((s, x) => s + (x - mean) * (x - mean), 0) / samples.length;
  return Math.sqrt(variance);
}

/** Star-shape bonus per design — rewards specialist (high peak + supporting trait). */
function computeStarShapeBonus(
  traitScores: Record<TraitKey, TraitScore>,
  cfg: OverallConfig["starShape"],
): { bonus: number; maxZ: number | null; secondZ: number | null } {
  const zs: number[] = [];
  for (const t of Object.values(traitScores)) {
    if (t.scoreZ != null && Number.isFinite(t.scoreZ)) zs.push(t.scoreZ);
  }
  if (zs.length === 0) return { bonus: 0, maxZ: null, secondZ: null };
  zs.sort((a, b) => b - a);
  const maxZ = zs[0];
  const secondZ = zs.length > 1 ? zs[1] : null;
  if (maxZ < cfg.eliteThreshold) return { bonus: 0, maxZ, secondZ };
  if (secondZ == null || secondZ < cfg.supportingThreshold) return { bonus: 0, maxZ, secondZ };
  const bonus = Math.min(cfg.maxBonus, cfg.slope * (maxZ - cfg.eliteThreshold));
  return { bonus, maxZ, secondZ };
}

// =============================================================================
// RED FLAGS
// =============================================================================

/**
 * Age flag: older prospect with weak production.
 *
 * "weak production" = OBPM below posFam-median. We approximate the median by
 * its z-score equivalent (z=0 in a unit-variance distribution). Since OBPM
 * is normalized to N(0,1) in the historical pool by the cell-normalizer
 * step, z=0 is the median.
 */
function computeAgeFlag(
  features: FeatureVector,
  cohortStats: CohortStats,
  era: Era,
  posFam: PositionFamily,
  cfg: OverallConfig["redFlags"]["ageFlag"],
): RedFlag | null {
  const age = features.age;
  if (age == null || !Number.isFinite(age)) return null;
  if (age <= cfg.ageThreshold) return null;
  const obpm = features.obpm;
  if (obpm == null || !Number.isFinite(obpm)) return null;
  const cellKey = `${era}|${posFam}`;
  const norm = cohortStats.cells.get(cellKey)?.obpm ?? cohortStats.pools.get(posFam)?.obpm ?? null;
  if (!norm || norm.mean == null) return null;
  if (obpm >= norm.mean) return null; // not below median
  return {
    name: "ageFlag",
    deduction: cfg.deduction,
    reason: `Age ${age.toFixed(1)} > ${cfg.ageThreshold} AND OBPM ${obpm.toFixed(1)} < posFam median ${norm.mean.toFixed(1)}`,
  };
}

/** Length flag: wingspan less than height for wings/bigs. */
function computeLengthFlag(
  posFam: PositionFamily,
  heightIn: number | null,
  wingspanIn: number | null | undefined,
  cfg: OverallConfig["redFlags"]["lengthFlag"],
): RedFlag | null {
  if (!cfg.applicablePositionFamilies.includes(posFam)) return null;
  if (heightIn == null || wingspanIn == null) return null;
  if (wingspanIn >= heightIn) return null;
  return {
    name: "lengthFlag",
    deduction: cfg.deduction,
    reason: `Wingspan ${wingspanIn}" < height ${heightIn}" — sub-optimal length for ${posFam}`,
  };
}

/**
 * Archetype-fingerprint flag: prospect's actual stat fingerprint diverges
 * from their stated archetype anchor by > 1.5σ in z-space.
 *
 * We compute the L2 distance between (prospect axis z-scores) and (archetype
 * anchor z-scores, mapped from 0-100 anchor to z via (anchor-50)/15). A large
 * distance means "the archetype label doesn't fit the actual production."
 */
function computeArchetypeFingerprintFlag(
  axisScores: AllAxisScoresOutput,
  archetypeKey: string | null,
  cfg: OverallConfig["redFlags"]["archetypeFingerprintFlag"],
): RedFlag | null {
  if (!archetypeKey) return null;
  const anchors = getArchetypeAnchors(archetypeKey);
  if (!anchors) return null;
  let sumSqDiff = 0;
  let n = 0;
  for (const axisKey of Object.keys(anchors) as AxisKey[]) {
    const axisScore = axisScores.axes[axisKey];
    if (!axisScore || axisScore.scoreZ == null) continue;
    const anchorZ = (anchors[axisKey] - 50) / 15; // anchor 0-100 → z
    sumSqDiff += (axisScore.scoreZ - anchorZ) ** 2;
    n++;
  }
  if (n < 4) return null; // not enough data to judge fingerprint match
  const distance = Math.sqrt(sumSqDiff / n); // RMS distance in z-units
  if (distance <= cfg.fingerprintDistanceSigma) return null;
  return {
    name: "archetypeFingerprintFlag",
    deduction: cfg.deduction,
    reason: `Stat fingerprint diverges from archetype "${archetypeKey}" anchor by ${distance.toFixed(2)}σ (threshold ${cfg.fingerprintDistanceSigma}σ)`,
  };
}

// =============================================================================
// CONFIDENCE
// =============================================================================

function countMissingCoreFeatures(features: FeatureVector, coreFeatures: FeatureKey[]): number {
  let n = 0;
  for (const k of coreFeatures) {
    const v = features[k];
    if (v == null || !Number.isFinite(v)) n++;
  }
  return n;
}

// =============================================================================
// MAIN
// =============================================================================

export function computeOverallScore(
  input: OverallProspectInput,
  cohortStats: CohortStats,
  config?: OverallConfig,
): OverallScore {
  const cfg = config ?? loadOverallConfig();
  const notes: string[] = [];
  const redFlags: RedFlag[] = [];

  const { prospect, traitScores, axisScores, candidatePool } = input;

  // ---- 30-NN
  const filteredPool = filterCandidatePool(prospect, candidatePool, {
    nnK: cfg.knnK,
    minLegendCount: 1, minStarCount: 2,
    eraProximity: 1, bodyCount: 0,
    strictPositionMatch: true,
  });
  notes.push(`candidate pool: ${candidatePool.length} → ${filteredPool.length} after era±1 + posFam=${prospect.positionFamily}`);

  let nnDistribution: OutcomeTierDistribution | null = null;
  let eOutcome: number | null = null;
  let sigmaFromOutcomeVariance: number | null = null;
  let nnUsed = 0;

  if (filteredPool.length >= 5 && cohortStats.compDistance) {
    const { scored } = scoreCandidates(prospect, filteredPool, cohortStats);
    const topK = scored.slice(0, cfg.knnK);
    nnUsed = topK.length;
    nnDistribution = buildDistribution(topK.map((sc) => sc.candidate.outcomeTier));
    if (nnDistribution.n > 0) {
      eOutcome = computeExpectedOutcome(nnDistribution, cfg.outcomeTierScores);
      sigmaFromOutcomeVariance = computeOutcomeVariance(nnDistribution, cfg.outcomeTierScores);
    } else {
      notes.push("NN pool has no labeled outcomes — eOutcome unavailable");
    }
  } else {
    notes.push(`insufficient candidate pool (${filteredPool.length}) — skipping NN`);
  }

  // ---- Star-shape bonus
  const star = computeStarShapeBonus(traitScores, cfg.starShape);
  if (star.bonus > 0) {
    notes.push(`star-shape bonus: maxZ=${star.maxZ?.toFixed(2)}, secondZ=${star.secondZ?.toFixed(2)} → +${star.bonus.toFixed(1)}`);
  }

  // ---- Red flags
  const ageFlag = computeAgeFlag(prospect.features, cohortStats, prospect.era, prospect.positionFamily, cfg.redFlags.ageFlag);
  if (ageFlag) redFlags.push(ageFlag);

  const lenFlag = computeLengthFlag(
    prospect.positionFamily,
    heightToInches((prospect.features.heightIn as number | null) ?? null),
    input.wingspanInches ?? null,
    cfg.redFlags.lengthFlag,
  );
  if (lenFlag) redFlags.push(lenFlag);

  const archFlag = computeArchetypeFingerprintFlag(axisScores, prospect.archetypeKey, cfg.redFlags.archetypeFingerprintFlag);
  if (archFlag) redFlags.push(archFlag);

  if (cfg.redFlags.sosFlag.enabled) {
    notes.push("sosFlag: enabled but no implementation yet (deferred until KenPom)");
  }

  let redFlagTotal = redFlags.reduce((s, f) => s + f.deduction, 0);
  if (redFlagTotal < cfg.redFlags.maxTotalDeduction) {
    redFlagTotal = cfg.redFlags.maxTotalDeduction;
    notes.push(`red flag total capped at ${cfg.redFlags.maxTotalDeduction}`);
  }

  // ---- Point estimate
  let score: number | null = null;
  if (eOutcome != null) {
    const raw = eOutcome + star.bonus + redFlagTotal;
    score = Math.max(cfg.scoreClamp.min, Math.min(cfg.scoreClamp.max, raw));
  }

  // ---- Confidence sigma
  const missingCore = countMissingCoreFeatures(prospect.features, cfg.confidence.coreFeatures);
  const sigmaFromMissing = Math.min(
    cfg.confidence.missingDataMaxPenalty,
    missingCore * cfg.confidence.missingDataPenaltyPerFeature,
  );
  let scoreSigma: number | null = null;
  if (score != null && sigmaFromOutcomeVariance != null) {
    const raw = sigmaFromOutcomeVariance + sigmaFromMissing;
    scoreSigma = Math.max(cfg.confidence.sigmaMin, Math.min(cfg.confidence.sigmaMax, raw));
  }

  // ---- Range for UI band
  const range: [number, number] | null = (score != null && scoreSigma != null)
    ? [Math.max(cfg.scoreClamp.min, score - scoreSigma), Math.min(cfg.scoreClamp.max, score + scoreSigma)]
    : null;

  // ---- Data mode
  let dataMode: DataMode;
  if (score == null) dataMode = "blocked";
  else if (filteredPool.length < cfg.knnK || sigmaFromOutcomeVariance == null) dataMode = "partial";
  else if (missingCore > 2) dataMode = "partial";
  else dataMode = "full";

  // ---- Display rescaling (percentile-based)
  const display = rescaleOverallScore(score, prospect.positionFamily);
  const displaySigma = (score != null && scoreSigma != null)
    ? rescaleSigma(score, scoreSigma, prospect.positionFamily)
    : null;
  const displayRange: [number, number] | null = (display != null && displaySigma != null)
    ? [Math.max(30, display.display - displaySigma), Math.min(99, display.display + displaySigma)]
    : null;

  return {
    score: score != null ? Math.round(score * 10) / 10 : null,
    scoreSigma: scoreSigma != null ? Math.round(scoreSigma * 10) / 10 : null,
    range,
    display,
    displaySigma,
    displayRange,
    dataMode,
    breakdown: {
      eOutcome: eOutcome != null ? Math.round(eOutcome * 10) / 10 : null,
      starBonus: Math.round(star.bonus * 10) / 10,
      redFlagTotal,
      nnDistribution,
      nnUsed,
      redFlags,
      maxTraitZ: star.maxZ,
      secondTraitZ: star.secondZ,
      sigmaFromOutcomeVariance: sigmaFromOutcomeVariance != null ? Math.round(sigmaFromOutcomeVariance * 10) / 10 : null,
      sigmaFromMissingData: sigmaFromMissing,
    },
    notes,
  };
}

// =============================================================================
// SAFETY HELPER
// =============================================================================

export function approxEqualOverall(a: number, b: number, eps: number = EPSILON): boolean {
  return Math.abs(a - b) <= eps;
}
