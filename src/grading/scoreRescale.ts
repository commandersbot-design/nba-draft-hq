/**
 * scoreRescale.ts — UI presentation rescaling for overall scores.
 *
 * The raw overall composite (Module 3) is statistically calibrated but
 * compressed: top-tier prospects land in the 55-65 range, median around 48.
 * That's correct on the inside but counter-intuitive in a UI ("AJ Dybantsa
 * is a 58?").
 *
 * Solution: rescale to PERCENTILE within the historical pool. A displayed 92
 * means "92nd percentile of all historicals." Median → 50. Top 1% → 99.
 * Easy to interpret, no hand-tuned curve, anchored to real distribution.
 *
 * Pure function. Reads overallScoreDistribution.json (built by
 * backfill-overall-distribution.ts).
 */

import overallDistRaw from "../data/overallScoreDistribution.json";
import type { PositionFamily } from "./cohortStats";

// =============================================================================
// TYPES
// =============================================================================

export interface RescaleConfig {
  /** Use position-family-specific distribution if true; pooled otherwise. */
  byPositionFamily: boolean;
  /** Lower bound on display score. Default 30 — no one displays below this. */
  displayMin: number;
  /** Upper bound. Default 99. */
  displayMax: number;
}

export const DEFAULT_RESCALE_CONFIG: RescaleConfig = {
  byPositionFamily: false,   // pooled is more interpretable for cross-position UI
  displayMin: 30,
  displayMax: 99,
};

interface DistributionBucket {
  sortedScores: number[];
  n: number;
}

interface OverallDistribution {
  pooled: DistributionBucket;
  byPositionFamily: Record<PositionFamily, DistributionBucket>;
}

// =============================================================================
// LOAD
// =============================================================================

let _distCache: OverallDistribution | null = null;

export function loadOverallDistribution(): OverallDistribution {
  if (_distCache) return _distCache;
  const raw = overallDistRaw as { pooled: DistributionBucket; byPositionFamily: Record<PositionFamily, DistributionBucket> };
  _distCache = {
    pooled: raw.pooled,
    byPositionFamily: raw.byPositionFamily,
  };
  return _distCache;
}

export function clearOverallDistributionCache(): void { _distCache = null; }

// =============================================================================
// PERCENTILE LOOKUP
// =============================================================================

/**
 * Percentile rank of `value` within ascending sorted array. Linear-interpolated
 * between adjacent ranks. 0-100 scale.
 */
function percentileRank(value: number, sortedScores: number[]): number {
  if (sortedScores.length === 0) return 50;
  if (!Number.isFinite(value)) return 50;
  // Binary search for first score >= value
  let lo = 0, hi = sortedScores.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedScores[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  const strictlyLess = lo;
  let lessOrEqual = lo;
  while (lessOrEqual < sortedScores.length && sortedScores[lessOrEqual] === value) lessOrEqual++;
  const rank = (strictlyLess + lessOrEqual) / 2;
  return (rank / sortedScores.length) * 100;
}

// =============================================================================
// RESCALE
// =============================================================================

export interface RescaleResult {
  /** 0-100 display score (clamped to [displayMin, displayMax]). */
  display: number;
  /** Raw percentile rank, unclamped. */
  percentile: number;
  /** Original raw score from overall.ts. */
  raw: number;
  /** Distribution bucket used. */
  bucket: "pooled" | PositionFamily;
}

/**
 * Rescale a raw overall score to a display value via percentile mapping.
 *
 * Display = clamp(percentileRank, displayMin, displayMax) — rounded to 1 decimal.
 *
 * Use rawScore=null pass-through: returns null. Caller should not display.
 */
export function rescaleOverallScore(
  rawScore: number | null,
  positionFamily: PositionFamily | null,
  config: RescaleConfig = DEFAULT_RESCALE_CONFIG,
): RescaleResult | null {
  if (rawScore == null || !Number.isFinite(rawScore)) return null;
  const dist = loadOverallDistribution();
  let bucket: "pooled" | PositionFamily = "pooled";
  let sorted: number[];
  if (config.byPositionFamily && positionFamily && dist.byPositionFamily[positionFamily]?.sortedScores.length > 30) {
    sorted = dist.byPositionFamily[positionFamily].sortedScores;
    bucket = positionFamily;
  } else {
    sorted = dist.pooled.sortedScores;
  }
  const percentile = percentileRank(rawScore, sorted);
  const display = Math.max(config.displayMin, Math.min(config.displayMax, percentile));
  return {
    display: Math.round(display * 10) / 10,
    percentile,
    raw: rawScore,
    bucket,
  };
}

/**
 * Rescale a sigma. The display sigma should reflect the same percentile-space
 * uncertainty as the score — but a unit raw-sigma maps to roughly N percentile
 * points depending on local distribution density. We approximate by computing
 * the percentile difference at (score ± raw_sigma), then cap at SIGMA_DISPLAY_CAP
 * to avoid tail-stretch artifacts (a raw-sigma of 12 near the distribution tail
 * can map to ~30 percentile points, which isn't useful for the UI band).
 */
const SIGMA_DISPLAY_CAP = 8;

export function rescaleSigma(
  rawScore: number,
  rawSigma: number,
  positionFamily: PositionFamily | null,
  config: RescaleConfig = DEFAULT_RESCALE_CONFIG,
): number {
  const upper = rescaleOverallScore(rawScore + rawSigma, positionFamily, config);
  const lower = rescaleOverallScore(rawScore - rawSigma, positionFamily, config);
  if (!upper || !lower) return Math.min(rawSigma, SIGMA_DISPLAY_CAP);
  const halfWidth = (upper.display - lower.display) / 2;
  return Math.round(Math.min(halfWidth, SIGMA_DISPLAY_CAP) * 10) / 10;
}
