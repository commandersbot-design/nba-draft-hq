/**
 * letterGrades.ts — Module 1d: convert 0-100 scores to A+/A/B/C/D letter grades.
 *
 * Implements the design's DUAL-GATE rule:
 *   1. Absolute score floor — minimum 0-100 score (derived from z-score
 *      thresholds via score = 50 + 15·z). Always operative.
 *   2. Cohort percentile rank — minimum percentile within the historical
 *      positionFamily pool. Operative only when historicalTraitDistributions
 *      is provided (backfill output, not yet generated as of this commit).
 *
 * When both gates are present, a grade requires BOTH to pass. When only the
 * floor is available, the floor alone determines the grade.
 *
 * Pure functions; no I/O. Caller passes any historical distribution object
 * explicitly so tests can inject fixtures.
 *
 * Returns null grade when:
 *   - score is null (blocked)
 *   - dataMode is "scout_anchored" — letter grades require quantitative spine
 *     (configurable via allowScoutAnchoredGrades in options)
 */

import type { DataMode, PositionFamily } from "./cohortStats";
import letterGradeBinsRaw from "../../config/letterGradeBins.json";

// =============================================================================
// TYPES
// =============================================================================

export type LetterGrade = "A+" | "A" | "B" | "C" | "D";

export const LETTER_GRADES: readonly LetterGrade[] = ["A+", "A", "B", "C", "D"] as const;

/** Threshold record per letter grade. Loaded from config/letterGradeBins.json. */
export interface GradeThreshold {
  scoreFloor: number;
  scoreFloorZ: number;
  cohortPercentileMin: number;
}

export type GradeThresholdMap = Record<LetterGrade, GradeThreshold>;

/**
 * Pre-computed historical distribution for a (posFam, metric) pair. The shape
 * is a sorted ascending array of historical scores so that percentile lookup
 * is a binary search. Built by the calibration backfill job.
 */
export interface HistoricalDistribution {
  posFam: PositionFamily;
  metric: string;            // trait/axis/overall key — caller-defined
  sortedScores: number[];    // ascending, finite numbers only
  n: number;                 // sortedScores.length, denormalized for clarity
  generatedAt: string;       // ISO timestamp from the backfill run
}

/**
 * Lookup table: nested map of metric → posFam → distribution. Keep this
 * out of cohortStats.ts because trait-score distributions only exist after
 * the trait scorer has been run on historicals (post-Module-1 step).
 */
export type HistoricalDistributionTable =
  Record<string, Partial<Record<PositionFamily, HistoricalDistribution>>>;

export interface AssignGradeOptions {
  /** From the upstream score's dataMode. Used to gate scout-anchored prospects. */
  dataMode?: DataMode;
  /**
   * Position family for cohort-percentile lookup. Required when distributions
   * are provided; ignored otherwise.
   */
  positionFamily?: PositionFamily;
  /** Metric key — e.g. "trait:ShootingGravity", "axis:initiate", "overall". */
  metricKey?: string;
  /** Backfilled historical distributions. Skip second gate if not provided. */
  historicalDistributions?: HistoricalDistributionTable;
  /**
   * If true, scout_anchored prospects get a letter grade despite lacking a
   * quantitative spine. Default false — scout_anchored returns null because
   * cohort-percentile is meaningless without a stat fingerprint.
   */
  allowScoutAnchoredGrades?: boolean;
  /** Override thresholds for testing. */
  thresholds?: GradeThresholdMap;
}

export interface GradeResult {
  grade: LetterGrade | null;
  score: number | null;
  /** Which thresholds were active for this grading. */
  gatesApplied: ("floor" | "cohort_percentile")[];
  /** Cohort percentile if computed; null if not available. */
  cohortPercentile: number | null;
  /** Per-grade gate-pass detail for debugging / UI explanation. */
  gateTrace: Array<{
    grade: LetterGrade;
    floorPassed: boolean;
    cohortPassed: boolean | null; // null when not evaluated
  }>;
  notes: string[];
}

// =============================================================================
// CONFIG LOADING
// =============================================================================

/** Load + validate letter-grade thresholds. Throws if floors aren't monotone. */
export function loadGradeThresholds(): GradeThresholdMap {
  const raw = letterGradeBinsRaw as RawGradeBinsFile;
  const out = {} as GradeThresholdMap;
  let prevFloor = Infinity;
  for (const grade of LETTER_GRADES) {
    const t = raw.thresholds?.[grade];
    if (!t) throw new Error(`letterGradeBins.json missing thresholds for "${grade}"`);
    if (typeof t.scoreFloor !== "number" || t.scoreFloor < 0 || t.scoreFloor > 100) {
      throw new Error(`letterGradeBins.json: ${grade} scoreFloor must be 0..100`);
    }
    if (t.scoreFloor > prevFloor) {
      throw new Error(`letterGradeBins.json: floor for ${grade} (${t.scoreFloor}) must be <= previous (${prevFloor})`);
    }
    if (typeof t.cohortPercentileMin !== "number" || t.cohortPercentileMin < 0 || t.cohortPercentileMin > 100) {
      throw new Error(`letterGradeBins.json: ${grade} cohortPercentileMin must be 0..100`);
    }
    out[grade] = {
      scoreFloor: t.scoreFloor,
      scoreFloorZ: t.scoreFloorZ,
      cohortPercentileMin: t.cohortPercentileMin,
    };
    prevFloor = t.scoreFloor;
  }
  return out;
}

// =============================================================================
// PERCENTILE LOOKUP
// =============================================================================

/**
 * Percentile rank of `value` within a pre-sorted ascending array. Returns
 * 0-100 where 100 = "top of distribution." Uses linear interpolation between
 * adjacent ranks.
 *
 * Returns null if distribution is empty.
 */
export function percentileRank(value: number, sortedScores: number[]): number | null {
  if (!sortedScores || sortedScores.length === 0) return null;
  if (!Number.isFinite(value)) return null;
  // Binary search for the first score >= value
  let lo = 0, hi = sortedScores.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedScores[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  // lo is the count of scores strictly < value
  // Use the average of (count strictly less) and (count <= value) as the rank
  const strictlyLess = lo;
  let lessOrEqual = lo;
  while (lessOrEqual < sortedScores.length && sortedScores[lessOrEqual] === value) lessOrEqual++;
  const rank = (strictlyLess + lessOrEqual) / 2;
  return (rank / sortedScores.length) * 100;
}

// =============================================================================
// CORE
// =============================================================================

/**
 * Assign a letter grade to a 0-100 score using the dual-gate rule.
 *
 * @returns GradeResult with grade=null when the score is null/scout_anchored
 *          (unless allowScoutAnchoredGrades=true).
 */
export function assignLetterGrade(
  score: number | null,
  options: AssignGradeOptions = {},
): GradeResult {
  const thresholds = options.thresholds ?? loadGradeThresholds();
  const notes: string[] = [];
  const gateTrace: GradeResult["gateTrace"] = [];

  // Hard null cases
  if (score == null || !Number.isFinite(score)) {
    return {
      grade: null, score: null,
      gatesApplied: [], cohortPercentile: null, gateTrace: [],
      notes: ["score unavailable — no grade"],
    };
  }
  if (options.dataMode === "blocked") {
    return {
      grade: null, score,
      gatesApplied: [], cohortPercentile: null, gateTrace: [],
      notes: ["dataMode=blocked — no grade"],
    };
  }
  if (options.dataMode === "scout_anchored" && !options.allowScoutAnchoredGrades) {
    return {
      grade: null, score,
      gatesApplied: [], cohortPercentile: null, gateTrace: [],
      notes: ["scout_anchored prospect — letter grade suppressed (set allowScoutAnchoredGrades to override)"],
    };
  }

  // Resolve cohort percentile if distribution is available
  let cohortPct: number | null = null;
  let canUseCohort = false;
  if (
    options.historicalDistributions &&
    options.metricKey &&
    options.positionFamily
  ) {
    const dist = options.historicalDistributions[options.metricKey]?.[options.positionFamily];
    if (dist && dist.sortedScores && dist.sortedScores.length > 0) {
      cohortPct = percentileRank(score, dist.sortedScores);
      canUseCohort = cohortPct != null;
      if (canUseCohort) {
        notes.push(`cohort percentile: ${cohortPct?.toFixed(1)} (vs ${dist.n} historical ${options.positionFamily}s for ${options.metricKey})`);
      }
    } else {
      notes.push(`historical distribution missing for ${options.metricKey}/${options.positionFamily} — falling back to floor-only`);
    }
  } else {
    notes.push("cohort distribution not provided — using floor gate only");
  }

  const gatesApplied: ("floor" | "cohort_percentile")[] = ["floor"];
  if (canUseCohort) gatesApplied.push("cohort_percentile");

  // Walk grades from highest to lowest; assign first that passes ALL active gates.
  for (const grade of LETTER_GRADES) {
    const t = thresholds[grade];
    const floorPassed = score >= t.scoreFloor;
    const cohortPassed: boolean | null = canUseCohort && cohortPct != null
      ? cohortPct >= t.cohortPercentileMin
      : null;
    gateTrace.push({ grade, floorPassed, cohortPassed });
    if (!floorPassed) continue;
    if (canUseCohort && cohortPassed === false) continue;
    return {
      grade, score,
      gatesApplied, cohortPercentile: cohortPct,
      gateTrace, notes,
    };
  }
  // Floor for D is 0; this fallback is unreachable for valid inputs.
  return {
    grade: "D", score,
    gatesApplied, cohortPercentile: cohortPct,
    gateTrace, notes: [...notes, "fell through to D fallback"],
  };
}

// =============================================================================
// BATCH HELPERS
// =============================================================================

/**
 * Build a metric key for a trait. Convention: "trait:" prefix.
 */
export function traitMetricKey(traitKey: string): string {
  return `trait:${traitKey}`;
}

/** Build a metric key for an axis. Convention: "axis:" prefix. */
export function axisMetricKey(axisKey: string): string {
  return `axis:${axisKey}`;
}

/** Metric key for the overall composite. */
export const OVERALL_METRIC_KEY = "overall";

// =============================================================================
// RAW JSON SHAPE
// =============================================================================

interface RawGradeBinsFile {
  thresholds?: Record<string, {
    scoreFloor: number;
    scoreFloorZ: number;
    cohortPercentileMin: number;
  }>;
}
