/**
 * compEngine.ts — Module 2 (comps) main engine.
 *
 * Pipeline:
 *   1. CANDIDATE POOL — historicals filtered by positionFamily (strict) and
 *      era (±1 bucket). Era proximity prevents 2024-wing-comped-to-2003-PF.
 *   2. STANDARDIZE — z-score every candidate's features against (era × posFam)
 *      cell, same path as the prospect.
 *   3. DISTANCE — weighted Euclidean using compDistanceWeights from the
 *      logistic-regression calibration.
 *   4. TOP-K — sort ascending by distance, take top NN_K (default 15).
 *   5. RATION — count Legend+Star in top-K. If < minRareElite, forbid
 *      Legend/Star comps in the output.
 *   6. SELECT — 1 headline, 1 shadow, 3 body comps with outcome diversity.
 *   7. ATTRIBUTE — top-3 matching features + largest divergent feature
 *      per comp.
 *
 * Scout-anchored fallback: when the prospect lacks the minimum quantitative
 * spine, distance-based comps aren't trustworthy. Return the archetype's
 * exemplar list as comps with `dataMode: 'scout_anchored'` and no
 * stat-attribution. Same API surface; caller doesn't branch.
 *
 * All functions pure. The caller assembles the candidate pool — the engine
 * never reads from disk.
 */

import {
  type CohortStats,
  type Era,
  type FeatureVector,
  type PositionFamily,
  type DataMode,
  EPSILON,
  approxEqual,
} from "../grading/cohortStats";
import { hasMinimumQuantitativeSpine } from "../grading/featureExtractor";
import {
  type StandardizedVector,
  type DistanceResult,
  type FeatureDelta,
  computeDistance,
  standardize,
  topMatchingFeatures,
  largestDivergence,
} from "./similarity";
import {
  type OutcomeTier,
  type OutcomeTierDistribution,
  type TierRationing,
  buildDistribution,
  getBaselineDistribution,
  computeElevation,
  applyTieredRationing,
  type TierElevation,
} from "./calibration";
import { getArchetype, type ArchetypeAnchor } from "../grading/archetypeLookup";

// =============================================================================
// TYPES
// =============================================================================

/** Era proximity definition — adjacency in chronological order. */
const ERA_ORDER: readonly Era[] = ["PRE_SPACING", "TRANSITIONAL", "SPACING", "MODERN"] as const;

function eraDistance(a: Era, b: Era): number {
  const ai = ERA_ORDER.indexOf(a);
  const bi = ERA_ORDER.indexOf(b);
  if (ai < 0 || bi < 0) return Infinity;
  return Math.abs(ai - bi);
}

/** Engine configuration. All fields optional — defaults defined in DEFAULTS. */
export interface CompEngineConfig {
  /** Top-K nearest neighbors to consider. */
  nnK?: number;
  /** Minimum rare-elite count in NN to allow Legend/Star comps. */
  minLegendCount?: number;
  minStarCount?: number;
  /** Era window — candidates must be within this many era buckets. */
  eraProximity?: number;
  /** Number of body comps to return (in addition to headline + shadow). */
  bodyCount?: number;
  /** Strict position-family match (true) or allow Wing↔Forward overlap (false). */
  strictPositionMatch?: boolean;
}

const DEFAULTS: Required<CompEngineConfig> = {
  nnK: 15,
  minLegendCount: 1,
  minStarCount: 2,
  eraProximity: 1,
  bodyCount: 3,
  strictPositionMatch: true,
};

/** Prospect input to the comp engine. */
export interface CompProspectInput {
  id: string;
  name: string;
  features: FeatureVector;
  archetypeKey: string | null;
  positionFamily: PositionFamily;
  era: Era;
}

/** A historical candidate, fully assembled by the caller. */
export interface CompCandidate {
  id: string;
  name: string;
  draftYear: number;
  draftSlot: number | null;
  school: string | null;
  position: string | null;
  positionFamily: PositionFamily;
  era: Era;
  archetype: string | null;
  archetypeFamily: string | null;
  outcomeTier: OutcomeTier | null;
  roleOutcome: string | null;
  features: FeatureVector;
  /** Optional career outcome data (NBA). */
  nbaCareer: NbaCareerOutcome | null;
}

/** NBA career stats — used in comp attribution to show "how it played out." */
export interface NbaCareerOutcome {
  bpm: number | null;
  ws48: number | null;
  vorp: number | null;
  per: number | null;
  allStarSelections: number;
  teams: string[];
  fromSeason: string | null;
  toSeason: string | null;
}

/** A single comp returned by the engine. */
export interface Comp {
  candidate: CompCandidate;
  /** Weighted Euclidean distance. Null in scout-anchored mode. */
  distance: number | null;
  /** 0-100 similarity score. Null in scout-anchored mode. */
  similarity: number | null;
  /** Top-3 matching features (smallest weighted z-difference). */
  topMatches: FeatureDelta[];
  /** Largest divergent feature — the warning. Null if no shared features. */
  largestDivergence: FeatureDelta | null;
  /** "headline" / "shadow" / "body" / "scout_anchored". */
  role: CompRole;
  /** Free-form attribution string for UI. */
  attribution: string;
}

export type CompRole = "headline" | "shadow" | "body" | "scout_anchored";

/** Engine output. */
export interface CompEngineResult {
  prospectId: string;
  prospectName: string;
  dataMode: DataMode;
  headline: Comp | null;
  shadow: Comp | null;
  body: Comp[];
  /**
   * Full top-K nearest neighbors before headline/shadow/body selection. Used
   * by surfaces (e.g., Constellation Map) that need a wider NN list for
   * visualization. Includes the entries selected as headline/shadow/body.
   */
  topK: Comp[];
  baselineDistribution: OutcomeTierDistribution | null;
  nnDistribution: OutcomeTierDistribution;
  rationing: TierRationing;
  elevation: TierElevation[];
  /** Total candidates considered after filtering. */
  candidatesConsidered: number;
  /** Top-K NN actually used. */
  nnUsed: number;
  notes: string[];
}

// =============================================================================
// CANDIDATE FILTERING
// =============================================================================

/**
 * Filter a candidate pool to those eligible for comp matching with the prospect.
 * Strict positionFamily match (configurable) + eraProximity window.
 */
export function filterCandidatePool(
  prospect: CompProspectInput,
  pool: CompCandidate[],
  config: Required<CompEngineConfig>,
): CompCandidate[] {
  const out: CompCandidate[] = [];
  for (const c of pool) {
    if (config.strictPositionMatch && c.positionFamily !== prospect.positionFamily) continue;
    if (eraDistance(prospect.era, c.era) > config.eraProximity) continue;
    out.push(c);
  }
  return out;
}

// =============================================================================
// NEAREST NEIGHBOR
// =============================================================================

interface ScoredCandidate {
  candidate: CompCandidate;
  result: DistanceResult;
  candidateZ: StandardizedVector;
}

/**
 * Standardize the prospect + every candidate, compute distances, return all
 * scored. The caller picks the top-K from this array.
 */
export function scoreCandidates(
  prospect: CompProspectInput,
  candidates: CompCandidate[],
  cohortStats: CohortStats,
): { prospectZ: StandardizedVector; scored: ScoredCandidate[] } {
  const prospectZ = standardize(prospect.features, prospect.era, prospect.positionFamily, cohortStats);
  if (!cohortStats.compDistance) {
    throw new Error("compDistanceWeights missing from CohortStats — calibrator output incomplete");
  }
  const distanceConfig = cohortStats.compDistance;
  const scored: ScoredCandidate[] = [];
  for (const c of candidates) {
    const cZ = standardize(c.features, c.era, c.positionFamily, cohortStats);
    const result = computeDistance(prospectZ, cZ, distanceConfig);
    if (result.distance == null) continue; // too sparse — skip
    scored.push({ candidate: c, result, candidateZ: cZ });
  }
  scored.sort((a, b) => (a.result.distance ?? Infinity) - (b.result.distance ?? Infinity));
  return { prospectZ, scored };
}

// =============================================================================
// COMP SELECTION
// =============================================================================

/** Tier-priority order, highest-quality first. */
const TIER_PRIORITY: readonly OutcomeTier[] = ["Legend", "Star", "Hit", "Swing", "Bust"] as const;

/** Pick the headline comp — best (highest-quality) among allowed tiers. */
function pickHeadline(
  topK: ScoredCandidate[],
  rationing: TierRationing,
): ScoredCandidate | null {
  for (const tier of TIER_PRIORITY) {
    if (tier === "Legend" && !rationing.allowLegend) continue;
    if (tier === "Star"   && !rationing.allowStar)   continue;
    const match = topK.find((sc) => sc.candidate.outcomeTier === tier);
    if (match) return match;
  }
  // Fallback: first NN regardless of tier (very weak NN pool case)
  return topK[0] ?? null;
}

/** Pick the shadow comp — lowest-quality in top-K. The cautionary tale. */
function pickShadow(topK: ScoredCandidate[]): ScoredCandidate | null {
  for (const tier of [...TIER_PRIORITY].reverse()) {
    const match = topK.find((sc) => sc.candidate.outcomeTier === tier);
    if (match) return match;
  }
  return topK[topK.length - 1] ?? null;
}

/**
 * Pick body comps — N more comps prioritizing outcome-tier diversity. Avoid
 * picking the same prospect as headline/shadow. Avoid duplicate tiers if
 * possible.
 */
function pickBodyComps(
  topK: ScoredCandidate[],
  excludeIds: Set<string>,
  count: number,
  rationing: TierRationing,
): ScoredCandidate[] {
  const tiersUsed = new Set<OutcomeTier | "unknown">();
  const picks: ScoredCandidate[] = [];

  // First pass: prefer tier diversity, respecting rationing.
  for (const sc of topK) {
    if (picks.length >= count) break;
    if (excludeIds.has(sc.candidate.id)) continue;
    const tier = sc.candidate.outcomeTier;
    if (tier === "Legend" && !rationing.allowLegend) continue;
    if (tier === "Star"   && !rationing.allowStar)   continue;
    const key: OutcomeTier | "unknown" = tier ?? "unknown";
    if (tiersUsed.has(key)) continue;
    tiersUsed.add(key);
    picks.push(sc);
  }
  // Second pass: fill remaining with whatever's nearest, no diversity constraint.
  if (picks.length < count) {
    for (const sc of topK) {
      if (picks.length >= count) break;
      if (excludeIds.has(sc.candidate.id)) continue;
      if (picks.includes(sc)) continue;
      const tier = sc.candidate.outcomeTier;
      if (tier === "Legend" && !rationing.allowLegend) continue;
      if (tier === "Star"   && !rationing.allowStar)   continue;
      picks.push(sc);
    }
  }
  return picks;
}

// =============================================================================
// ATTRIBUTION
// =============================================================================

/** Build a one-line attribution string for a comp. */
function buildAttribution(
  prospect: CompProspectInput,
  sc: ScoredCandidate,
  role: CompRole,
): string {
  const c = sc.candidate;
  const matches = topMatchingFeatures(sc.result, 3);
  const matchPart = matches
    .map((m) => `same ${m.feature}`)
    .join(", ");
  const div = largestDivergence(sc.result);
  const divPart = div
    ? `diverges most on ${div.feature} (${prospect.name} ${signedZ(div.pZ)} vs ${c.name} ${signedZ(div.cZ)})`
    : "";
  const tier = c.outcomeTier ? `outcome=${c.outcomeTier}` : "outcome=unknown";
  return `${c.name} (${c.draftYear}, ${tier}): ${matchPart}${divPart ? "; " + divPart : ""} [${role}]`;
}

function signedZ(z: number): string {
  const sign = z >= 0 ? "+" : "";
  return `${sign}${z.toFixed(2)}σ`;
}

function buildComp(sc: ScoredCandidate, prospect: CompProspectInput, role: CompRole): Comp {
  return {
    candidate: sc.candidate,
    distance: sc.result.distance,
    similarity: sc.result.similarity,
    topMatches: topMatchingFeatures(sc.result, 3),
    largestDivergence: largestDivergence(sc.result),
    role,
    attribution: buildAttribution(prospect, sc, role),
  };
}

// =============================================================================
// SCOUT-ANCHORED FALLBACK
// =============================================================================

/**
 * When the prospect lacks the minimum quantitative spine, return the
 * archetype's exemplars as comps. No distance, no attribution beyond archetype
 * tag. Same output shape — caller doesn't branch.
 */
function buildScoutAnchoredResult(
  prospect: CompProspectInput,
  archetype: ArchetypeAnchor | null,
  candidatePool: CompCandidate[],
  config: Required<CompEngineConfig>,
): CompEngineResult {
  const notes: string[] = ["scout_anchored mode — using archetype exemplars"];

  if (!archetype) {
    notes.push("no archetype anchor available either — empty comp set");
    return makeEmptyResult(prospect, "scout_anchored", notes);
  }
  notes.push(`archetype: ${archetype.name} — exemplars: ${archetype.exemplars.join(", ")}`);

  // Try to match exemplar names against the candidate pool — exact name match.
  const exemplarComps: Comp[] = [];
  for (const ex of archetype.exemplars) {
    const cand = candidatePool.find((c) => c.name === ex);
    if (cand) {
      exemplarComps.push({
        candidate: cand,
        distance: null,
        similarity: null,
        topMatches: [],
        largestDivergence: null,
        role: "scout_anchored",
        attribution: `${cand.name} — archetype exemplar (${archetype.name}). No statistical comp available; matched on archetype only.`,
      });
    } else {
      notes.push(`exemplar "${ex}" not found in candidate pool`);
    }
  }

  const headline = exemplarComps[0] ?? null;
  const shadow   = null; // can't compute shadow in scout-anchored mode
  const body     = exemplarComps.slice(1, 1 + config.bodyCount);

  return {
    prospectId:   prospect.id,
    prospectName: prospect.name,
    dataMode:     "scout_anchored",
    headline,
    shadow,
    body,
    topK: exemplarComps,
    baselineDistribution: null,
    nnDistribution: buildDistribution([]),
    rationing: {
      allowLegend: false,
      allowStar:   false,
      minRareElite: config.minStarCount,
      actualRareElite: 0,
      reason: "scout_anchored mode — tier rationing N/A",
    },
    elevation: [],
    candidatesConsidered: candidatePool.length,
    nnUsed: 0,
    notes,
  };
}

function makeEmptyResult(prospect: CompProspectInput, dataMode: DataMode, notes: string[]): CompEngineResult {
  return {
    prospectId:   prospect.id,
    prospectName: prospect.name,
    dataMode,
    headline: null, shadow: null, body: [],
    topK: [],
    baselineDistribution: null,
    nnDistribution: buildDistribution([]),
    rationing: { allowLegend: false, allowStar: false, minRareElite: 0, actualRareElite: 0, reason: "no comps available" },
    elevation: [],
    candidatesConsidered: 0, nnUsed: 0,
    notes,
  };
}

// =============================================================================
// MAIN ENGINE
// =============================================================================

/**
 * Run the full comp engine for one prospect.
 *
 * @param prospect           input prospect (features + metadata)
 * @param candidatePool      assembled list of historical candidates
 * @param cohortStats        loaded calibration (cell normalizers + compDistance)
 * @param config             optional overrides; defaults from DEFAULTS
 * @returns                  CompEngineResult with headline/shadow/body + diagnostics
 */
export function findComps(
  prospect: CompProspectInput,
  candidatePool: CompCandidate[],
  cohortStats: CohortStats,
  config: CompEngineConfig = {},
): CompEngineResult {
  const cfg: Required<CompEngineConfig> = { ...DEFAULTS, ...config };
  const notes: string[] = [];

  // ---- Scout-anchored gate
  if (!hasMinimumQuantitativeSpine(prospect.features)) {
    const archetype = getArchetype(prospect.archetypeKey);
    return buildScoutAnchoredResult(prospect, archetype, candidatePool, cfg);
  }

  // ---- Filter candidate pool
  const filtered = filterCandidatePool(prospect, candidatePool, cfg);
  notes.push(`candidate pool: ${candidatePool.length} → ${filtered.length} after positionFamily=${prospect.positionFamily} + era±${cfg.eraProximity}`);

  if (filtered.length < cfg.nnK) {
    notes.push(`only ${filtered.length} candidates after filtering — fewer than nnK=${cfg.nnK}, using all available`);
  }

  // ---- Score + sort candidates
  const { scored } = scoreCandidates(prospect, filtered, cohortStats);
  if (scored.length === 0) {
    return makeEmptyResult(prospect, "blocked", [...notes, "no candidates produced a valid distance — feature vector too sparse"]);
  }

  // ---- Top-K
  const topK = scored.slice(0, cfg.nnK);
  const nnTiers = topK.map((sc) => sc.candidate.outcomeTier);
  const nnDistribution = buildDistribution(nnTiers);

  // ---- Tier rationing
  const rationing = applyTieredRationing(nnDistribution, cfg.minLegendCount, cfg.minStarCount);
  notes.push(rationing.reason);

  // ---- Baseline + elevation
  const baseline = getBaselineDistribution(cohortStats, prospect.era, prospect.positionFamily);
  const elevation = baseline ? computeElevation(nnDistribution, baseline) : [];

  // ---- Pick headline / shadow / body
  const headlineSc = pickHeadline(topK, rationing);
  const shadowSc   = pickShadow(topK);
  const excludeIds = new Set<string>();
  if (headlineSc) excludeIds.add(headlineSc.candidate.id);
  if (shadowSc)   excludeIds.add(shadowSc.candidate.id);
  const bodyScs = pickBodyComps(topK, excludeIds, cfg.bodyCount, rationing);

  // ---- Build comp objects with attribution
  const headline = headlineSc ? buildComp(headlineSc, prospect, "headline") : null;
  const shadow   = shadowSc && (!headlineSc || shadowSc.candidate.id !== headlineSc.candidate.id)
    ? buildComp(shadowSc, prospect, "shadow") : null;
  const body = bodyScs.map((sc) => buildComp(sc, prospect, "body"));

  // ---- DataMode determination
  // If most features are present and NN pool is healthy, it's "full".
  // Otherwise "partial".
  const dataMode: DataMode = (
    topK.length >= cfg.nnK &&
    topK[0].result.sharedFeatureCount >= 12 &&
    rationing.actualRareElite >= 0
  ) ? "full" : "partial";

  // Build the full top-K comp list (different role tagging — these are the
  // raw NN, not the curated headline/shadow/body set).
  const topKComps: Comp[] = topK.map((sc) => buildComp(sc, prospect, "body"));

  return {
    prospectId:   prospect.id,
    prospectName: prospect.name,
    dataMode,
    headline, shadow, body,
    topK: topKComps,
    baselineDistribution: baseline,
    nnDistribution,
    rationing,
    elevation,
    candidatesConsidered: filtered.length,
    nnUsed: topK.length,
    notes,
  };
}

// =============================================================================
// SAFETY: tolerance-based comparators (keep TS rules happy in callers)
// =============================================================================

export function distanceApproxEqual(a: number, b: number): boolean {
  return approxEqual(a, b, EPSILON);
}
