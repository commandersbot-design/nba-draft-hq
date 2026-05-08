/**
 * similarity.ts — Module 2 (comps) distance + similarity functions.
 *
 * Standardizes a prospect's raw FeatureVector to z-scores against the
 * (era × positionFamily) cell, then computes a weighted Euclidean distance
 * to a candidate historical. Weights come from cohortStats.compDistance
 * (per-feature distance weight from the global logistic regression on
 * outcome-tier).
 *
 * All functions pure. Standardization is the same z-score path used by
 * grading/axisScores — so a prospect's distance to a comp is era-and-
 * position-aware out of the box.
 *
 * Falls back to pool normalizer when cell sample is small. Features missing
 * on EITHER prospect are dropped from the distance calc, with the count of
 * dropped features exposed so callers can downgrade dataMode appropriately.
 */

import {
  type CohortStats,
  type FeatureKey,
  type FeatureVector,
  type Era,
  type PositionFamily,
  type CompDistanceConfig,
  FEATURE_KEYS,
  resolveNormalizer,
  zScore,
  EPSILON,
} from "../grading/cohortStats";

// =============================================================================
// TYPES
// =============================================================================

/** Standardized vector — feature key → z-score (null if feature missing). */
export type StandardizedVector = Partial<Record<FeatureKey, number | null>>;

/** Per-feature contribution to the distance — exposed for UI explanation. */
export interface FeatureDelta {
  feature: FeatureKey;
  pZ: number;
  cZ: number;
  diff: number;             // |pZ - cZ|
  weight: number;           // distance weight from compDistanceWeights
  contribution: number;     // weight × diff^2
}

export interface DistanceResult {
  /** Total weighted Euclidean distance. Null when no shared features. */
  distance: number | null;
  /** Similarity score, 0-100. 100 = identical fingerprint. */
  similarity: number;
  /** How many features contributed (both prospects had non-null z). */
  sharedFeatureCount: number;
  /** All per-feature deltas, sorted by `contribution` ascending (smallest first). */
  perFeature: FeatureDelta[];
}

// =============================================================================
// STANDARDIZATION
// =============================================================================

/**
 * Z-score a FeatureVector against the (era × positionFamily) cell. Falls back
 * to pool normalizer when cell sample is too small. Missing features come back
 * as null — caller decides how to handle (drop from distance, downgrade mode).
 */
export function standardize(
  features: FeatureVector,
  era: Era,
  positionFamily: PositionFamily,
  cohortStats: CohortStats,
): StandardizedVector {
  const out: StandardizedVector = {};
  for (const key of FEATURE_KEYS) {
    const raw = features[key];
    if (raw == null || !Number.isFinite(raw)) {
      out[key] = null;
      continue;
    }
    const norm = resolveNormalizer(cohortStats, era, positionFamily, key);
    if (!norm) { out[key] = null; continue; }
    out[key] = zScore(raw, norm);
  }
  return out;
}

// =============================================================================
// DISTANCE
// =============================================================================

/** Build a feature → distanceWeight lookup from CompDistanceConfig. */
function buildWeightLookup(cfg: CompDistanceConfig): Map<FeatureKey, number> {
  const out = new Map<FeatureKey, number>();
  for (const c of cfg.logisticCoefficients) {
    out.set(c.feature, c.distanceWeight);
  }
  return out;
}

/**
 * Weighted Euclidean distance between two standardized vectors.
 *
 * d = sqrt( Σ_i v_i × (z_i^p - z_i^c)^2 )  for features present in both
 *
 * - Drops features missing from either prospect or candidate (no imputation).
 * - Returns distance=null + similarity=0 when fewer than MIN_SHARED features
 *   are common — caller should treat as "too sparse to compare."
 *
 * Similarity = 100 × exp(-distance / DISTANCE_DECAY). DISTANCE_DECAY is tuned
 * so that distance ≈ 4 (a "moderately different fingerprint" in z-space)
 * maps to similarity ≈ 50. Distance 0 → similarity 100.
 */
const MIN_SHARED = 8;        // Need ≥half the 16 features to trust the distance
const DISTANCE_DECAY = 5.77; // ln(2) / 0.12 ≈ 5.77; calibrated so dist=4 → sim=50

export function computeDistance(
  p: StandardizedVector,
  c: StandardizedVector,
  distanceConfig: CompDistanceConfig,
): DistanceResult {
  const weights = buildWeightLookup(distanceConfig);
  const perFeature: FeatureDelta[] = [];
  let sumWeightedSq = 0;
  let sharedCount = 0;

  for (const key of FEATURE_KEYS) {
    const pZ = p[key];
    const cZ = c[key];
    if (pZ == null || cZ == null) continue;
    const diff = Math.abs(pZ - cZ);
    const weight = weights.get(key) ?? 1.0;
    const contribution = weight * diff * diff;
    perFeature.push({ feature: key, pZ, cZ, diff, weight, contribution });
    sumWeightedSq += contribution;
    sharedCount++;
  }

  if (sharedCount < MIN_SHARED) {
    return {
      distance: null,
      similarity: 0,
      sharedFeatureCount: sharedCount,
      perFeature: perFeature.sort((a, b) => a.contribution - b.contribution),
    };
  }

  const distance = Math.sqrt(sumWeightedSq);
  const similarity = clamp01to100(100 * Math.exp(-distance / DISTANCE_DECAY));

  perFeature.sort((a, b) => a.contribution - b.contribution);

  return { distance, similarity, sharedFeatureCount: sharedCount, perFeature };
}

function clamp01to100(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

// =============================================================================
// FEATURE-MATCH ATTRIBUTION
// =============================================================================

/**
 * Top-N matching features (smallest |z-diff|) — surfaces "they match on these
 * stats." Use perFeature is already sorted ascending by contribution; just
 * take the head.
 */
export function topMatchingFeatures(result: DistanceResult, n: number = 3): FeatureDelta[] {
  return result.perFeature.slice(0, n);
}

/**
 * The largest divergent feature — the one where prospect and candidate differ
 * most. The "warning" the spec calls out.
 *
 * We weight the divergence by the feature's distance weight so a tiny diff on
 * a high-weight feature can outrank a big diff on a low-weight feature.
 */
export function largestDivergence(result: DistanceResult): FeatureDelta | null {
  if (result.perFeature.length === 0) return null;
  let max = result.perFeature[0];
  let maxC = max.contribution;
  for (const fd of result.perFeature) {
    if (fd.contribution > maxC) { max = fd; maxC = fd.contribution; }
  }
  return max;
}

// =============================================================================
// SAFETY: tolerance check for distance comparisons
// =============================================================================

export function distanceLessThan(a: number, b: number, eps: number = EPSILON): boolean {
  return a < b - eps;
}
