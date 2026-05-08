/**
 * cohortStats.ts — z-score machinery, percentile binning, cohort cache.
 *
 * This module is the foundation of the grading pipeline. It owns:
 *   - Era bucket derivation (regime-based, NOT calendar-quintile)
 *   - Position-family inference (3 families: guard/wing/big)
 *   - Loading + caching the frozen calibration normalizers
 *   - Z-score computation against the appropriate (era × posFam) cell
 *   - Percentile binning for letter-grade gates
 *
 * The cache is a deliberately-explicit module-level singleton. Tests and
 * recalibration jobs invalidate it via clearCohortCache(). Runtime callers
 * should never have to think about cache invalidation.
 *
 * Pure functions: every helper below (getEraBucket, getPositionFamily,
 * heightToInches, zScore, percentileBin) is referentially transparent and
 * testable in isolation. Only loadCohortStats() touches I/O.
 */

import calibrationData from "../data/scoringCalibration.json";

// =============================================================================
// TYPES
// =============================================================================

/** Era buckets keyed off draftYear. See config rationale in eraBuckets.json. */
export type Era = "PRE_SPACING" | "TRANSITIONAL" | "SPACING" | "MODERN";

/** Three position families used as the primary cohort partition. */
export type PositionFamily = "guard" | "wing" | "big";

/**
 * Reported with every grade output so the UI can render a data-quality affordance.
 *  - "full":           all required features present, calibration cell n >= MIN_CELL_N
 *  - "partial":        some features missing or fell back to pool normalizer
 *  - "scout_anchored": no quantitative features; archetype anchor + prose only
 *  - "blocked":        not enough signal to produce any grade. Score is null.
 */
export type DataMode = "full" | "partial" | "scout_anchored" | "blocked";

/**
 * Canonical feature keys. Matches the 16-feature vector in scoringCalibration.json
 * and src/lib/scoring/featureMap.js. Do not reorder — calibration coefficients
 * are stored by name, not position, so the order is documentary only.
 */
export type FeatureKey =
  | "tsPct"     | "efgPct"   | "usgPct"   | "astPct"   | "tovPct"
  | "stlPct"   | "blkPct"   | "orbPct"   | "drbPct"
  | "bpm"      | "obpm"     | "dbpm"     | "per"      | "threePAr"
  | "age"      | "heightIn";

export const FEATURE_KEYS: readonly FeatureKey[] = [
  "tsPct", "efgPct", "usgPct", "astPct", "tovPct",
  "stlPct", "blkPct", "orbPct", "drbPct",
  "bpm", "obpm", "dbpm", "per", "threePAr",
  "age", "heightIn",
] as const;

/** Sample feature vector — null indicates missing. */
export type FeatureVector = Partial<Record<FeatureKey, number | null>>;

/** Per-cell-per-feature normalizer from the calibration job. */
export interface FeatureNormalizer {
  mean: number | null;
  std: number | null;
  n: number;
}

/** Source of a normalizer: per-cell (preferred) or per-pool fallback. */
export type NormalizerSource = "cell" | "pool";

export interface ResolvedNormalizer extends FeatureNormalizer {
  source: NormalizerSource;
}

/** Quantile thresholds for letter-grade gating. */
export interface PercentileThresholds {
  p25: number | null;
  p50: number | null;
  p60: number | null;
  p85: number | null;
  p95: number | null;
  n: number;
}

/** The historical outcome distribution for a cohort cell — base-rate anchor. */
export interface OutcomeBaseRate {
  n: number;
  p_legend: number;
  p_star: number;
  p_hit: number;
  p_swing: number;
  p_bust: number;
}

/** Logistic-derived per-feature distance weight (mean=1, floor 0.1). */
export interface CompDistanceWeight {
  feature: FeatureKey;
  coef: number;
  absCoef: number;
  distanceWeight: number;
  mean: number;
  std: number;
}

export interface CompDistanceConfig {
  featureKeys: readonly FeatureKey[];
  logisticCoefficients: CompDistanceWeight[];
  intercept: number;
  n: number;
  accuracy: number;
  recallPositive: number;
}

/**
 * Empirical (mean, std) of composite z-score per axis, per positionFamily.
 * Built by the historical backfill. axisScores uses this to normalize the
 * combined_z so that final score std → 15 and mean → 50, matching the design
 * target distribution.
 *
 * When absent, axisScores falls back to raw `50 + 15·combined_z` mapping.
 */
export interface AxisRuntimeStats {
  axis: string;          // axis key
  posFam: PositionFamily;
  zMean: number;         // empirical mean of combined_z in the historical pool
  zStd: number;          // empirical std
  n: number;
}

export type AxisRuntimeCalibration = Record<string, Partial<Record<PositionFamily, AxisRuntimeStats>>>;

/** Top-level cohort stats returned by loadCohortStats(). */
export interface CohortStats {
  /** Map keyed by `${era}|${positionFamily}`. */
  cells: Map<string, Record<FeatureKey, FeatureNormalizer>>;
  /** Map keyed by positionFamily, used as fallback when cell n < MIN_CELL_N. */
  pools: Map<PositionFamily, Record<FeatureKey, FeatureNormalizer>>;
  /** Map keyed by positionFamily, holds {p25,p50,p60,p85,p95,n} per feature. */
  thresholds: Map<PositionFamily, Record<FeatureKey, PercentileThresholds>>;
  /** Map keyed by `${era}|${positionFamily}`. */
  outcomeBaseRates: Map<string, OutcomeBaseRate>;
  /** Comp-engine distance weights from the global logistic. */
  compDistance: CompDistanceConfig | null;
  /** Empirical per-axis composite-z stats for runtime score normalization. */
  axisRuntime: AxisRuntimeCalibration | null;
  /** Calibration metadata. */
  meta: {
    version: string;
    generatedAt: string;
    poolSize: number;
    poolWithMinimumFeatures: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum cell sample size before falling back to pool normalizer. */
export const MIN_CELL_N = 20;

/** Float comparison tolerance — never compare floats with ===. */
export const EPSILON = 1e-9;

const ERA_BUCKETS: Record<Era, [number, number]> = {
  PRE_SPACING:  [1900, 2009],
  TRANSITIONAL: [2010, 2014],
  SPACING:      [2015, 2019],
  MODERN:       [2020, 2999],
};

// =============================================================================
// PURE HELPERS
// =============================================================================

/** Compare two floats within EPSILON tolerance. Use this, never ===. */
export function approxEqual(a: number, b: number, eps: number = EPSILON): boolean {
  return Math.abs(a - b) <= eps;
}

/** Era bucket from draftYear. Returns null if year is invalid. */
export function getEraBucket(year: number | null | undefined): Era | null {
  if (year == null || !Number.isFinite(year)) return null;
  for (const [era, [lo, hi]] of Object.entries(ERA_BUCKETS) as [Era, [number, number]][]) {
    if (year >= lo && year <= hi) return era;
  }
  return null;
}

/** Position family from a prospect's positionFamily / archetypeFamily / position string. */
export function getPositionFamily(prospect: {
  positionFamily?: string | null;
  archetypeFamily?: string | null;
  position?: string | null;
  pos?: string | null;
}): PositionFamily {
  const fam = prospect.positionFamily ?? prospect.archetypeFamily;
  if (fam) {
    const lower = String(fam).toLowerCase();
    if (lower === "guard" || lower === "wing" || lower === "big") return lower;
  }
  const pos = String(prospect.position ?? prospect.pos ?? "").toUpperCase();
  if (/PG|SG/.test(pos) && !/PF|SF/.test(pos)) return "guard";
  if (/SF|PF/.test(pos)) return "wing";
  if (/^C$|\bC\b/.test(pos)) return "big";
  return "wing"; // sensible default for ambiguous; matches existing behavior
}

/** Parse "6-9" or "6'9" or "81" → inches. Returns null if unparseable. */
export function heightToInches(s: string | number | null | undefined): number | null {
  if (s == null) return null;
  const str = String(s).trim();
  if (/^\d{2,3}$/.test(str)) {
    const n = Number(str);
    return n >= 60 && n <= 90 ? n : null;
  }
  const m = str.match(/^(\d)[\-'](\d{1,2})/);
  if (!m) return null;
  const ft = Number(m[1]);
  const inch = Number(m[2]);
  if (!Number.isFinite(ft) || !Number.isFinite(inch)) return null;
  return ft * 12 + inch;
}

/** Convert "57.4%" or 57.4 or 0.574 → 57.4 (always 0-100 percent scale). */
export function toPctScale(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const m = v.match(/(-?\d+\.?\d*)/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
  if (!Number.isFinite(v)) return null;
  return Math.abs(v) < 2 ? v * 100 : v;
}

/** Z-score a value against a normalizer. Returns null if value missing or std invalid. */
export function zScore(value: number | null | undefined, normalizer: FeatureNormalizer | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (!normalizer || normalizer.mean == null || normalizer.std == null) return null;
  if (approxEqual(normalizer.std, 0)) return null;
  return (value - normalizer.mean) / normalizer.std;
}

/**
 * Percentile bin against precomputed thresholds. Returns the bin label or null
 * if value/thresholds are insufficient. Used by letterGrades to apply the
 * dual-gate (cohort percentile AND z-score floor).
 */
export type PercentileBin = "p95+" | "p85+" | "p60+" | "p25+" | "below";

export function percentileBin(value: number | null, thresholds: PercentileThresholds | null): PercentileBin | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (!thresholds) return null;
  if (thresholds.p95 != null && value >= thresholds.p95) return "p95+";
  if (thresholds.p85 != null && value >= thresholds.p85) return "p85+";
  if (thresholds.p60 != null && value >= thresholds.p60) return "p60+";
  if (thresholds.p25 != null && value >= thresholds.p25) return "p25+";
  return "below";
}

// =============================================================================
// CACHE — explicit singleton, invalidatable
// =============================================================================

let _cohortStatsCache: CohortStats | null = null;

/**
 * Load + cache cohort stats from the bundled calibration JSON. Idempotent.
 * Subsequent calls return the same object reference.
 */
export function loadCohortStats(): CohortStats {
  if (_cohortStatsCache) return _cohortStatsCache;
  _cohortStatsCache = buildCohortStatsFromCalibration(calibrationData as RawCalibration);
  return _cohortStatsCache;
}

/** Test/recalibration hook — clears the cache so the next load() rebuilds. */
export function clearCohortCache(): void {
  _cohortStatsCache = null;
}

/**
 * Build CohortStats from the raw calibration JSON shape. Exposed for tests
 * that want to inject synthetic calibration data without touching the bundled
 * JSON file.
 */
export function buildCohortStatsFromCalibration(raw: RawCalibration): CohortStats {
  const cells = new Map<string, Record<FeatureKey, FeatureNormalizer>>();
  for (const [k, v] of Object.entries(raw.cellNormalizers ?? {})) {
    cells.set(k, v as Record<FeatureKey, FeatureNormalizer>);
  }
  const pools = new Map<PositionFamily, Record<FeatureKey, FeatureNormalizer>>();
  for (const [k, v] of Object.entries(raw.poolNormalizers ?? {})) {
    pools.set(k as PositionFamily, v as Record<FeatureKey, FeatureNormalizer>);
  }
  const thresholds = new Map<PositionFamily, Record<FeatureKey, PercentileThresholds>>();
  for (const [k, v] of Object.entries(raw.cohortThresholds ?? {})) {
    thresholds.set(k as PositionFamily, v as Record<FeatureKey, PercentileThresholds>);
  }
  const outcomeBaseRates = new Map<string, OutcomeBaseRate>();
  for (const [k, v] of Object.entries(raw.outcomeBaseRates ?? {})) {
    outcomeBaseRates.set(k, v as OutcomeBaseRate);
  }
  return {
    cells,
    pools,
    thresholds,
    outcomeBaseRates,
    compDistance: (raw.compDistanceWeights as CompDistanceConfig | null) ?? null,
    axisRuntime: (raw.axisRuntimeCalibration as AxisRuntimeCalibration | null) ?? null,
    meta: {
      version: raw._meta?.version ?? "unknown",
      generatedAt: raw._meta?.generatedAt ?? "unknown",
      poolSize: raw._meta?.poolSize ?? 0,
      poolWithMinimumFeatures: raw._meta?.poolWithMinimumFeatures ?? 0,
    },
  };
}

/**
 * Look up the runtime axis calibration for (axis, posFam). Returns null when
 * absent — caller (axisScores) should fall back to raw 50+15·z mapping.
 */
export function getAxisRuntime(
  stats: CohortStats,
  axisKey: string,
  posFam: PositionFamily,
): AxisRuntimeStats | null {
  return stats.axisRuntime?.[axisKey]?.[posFam] ?? null;
}

// =============================================================================
// NORMALIZER RESOLUTION
// =============================================================================

/**
 * Resolve the right normalizer for a given (feature, era, posFam). Falls back
 * to pool-level when the cell sample is too small.
 *
 * Returns null only when neither cell NOR pool have data — the caller should
 * treat this as a missing-feature signal and downgrade dataMode accordingly.
 */
export function resolveNormalizer(
  stats: CohortStats,
  era: Era,
  posFam: PositionFamily,
  feature: FeatureKey,
  minCellN: number = MIN_CELL_N,
): ResolvedNormalizer | null {
  const cellKey = `${era}|${posFam}`;
  const cell = stats.cells.get(cellKey);
  const cellNorm = cell?.[feature];
  if (cellNorm && cellNorm.n >= minCellN && cellNorm.std != null && !approxEqual(cellNorm.std, 0)) {
    return { ...cellNorm, source: "cell" };
  }
  const pool = stats.pools.get(posFam);
  const poolNorm = pool?.[feature];
  if (poolNorm && poolNorm.std != null && !approxEqual(poolNorm.std, 0)) {
    return { ...poolNorm, source: "pool" };
  }
  return null;
}

/** Convenience: get cohort percentile thresholds for a (posFam, feature) pair. */
export function getPercentileThresholds(
  stats: CohortStats,
  posFam: PositionFamily,
  feature: FeatureKey,
): PercentileThresholds | null {
  return stats.thresholds.get(posFam)?.[feature] ?? null;
}

/** Convenience: get the outcome base rate for an (era, posFam) cell. */
export function getOutcomeBaseRate(
  stats: CohortStats,
  era: Era,
  posFam: PositionFamily,
): OutcomeBaseRate | null {
  return stats.outcomeBaseRates.get(`${era}|${posFam}`) ?? null;
}

// =============================================================================
// RAW JSON SHAPE — internal type for parsing scoringCalibration.json
// =============================================================================

interface RawCalibration {
  _meta?: {
    version?: string;
    generatedAt?: string;
    poolSize?: number;
    poolWithMinimumFeatures?: number;
  };
  cellNormalizers?: Record<string, unknown>;
  poolNormalizers?: Record<string, unknown>;
  cohortThresholds?: Record<string, unknown>;
  outcomeBaseRates?: Record<string, unknown>;
  compDistanceWeights?: unknown;
  axisRuntimeCalibration?: unknown;
}
