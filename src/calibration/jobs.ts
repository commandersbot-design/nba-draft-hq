/**
 * jobs.ts — Module 5: calibration job contracts + drift detection.
 *
 * The actual calibration pipeline is split across two scripts that already
 * exist:
 *   - scripts/scoring/calibrate.js          — fits normalizers, regressions,
 *                                              thresholds, comp-distance weights
 *   - scripts/scoring/backfill-historicals.ts — empirical slope calibration +
 *                                              cohort distributions
 *
 * Recalibration order (annual):
 *   1. node scripts/scoring/calibrate.js       (rebuilds the foundation JSON)
 *   2. npx tsx scripts/scoring/backfill-historicals.ts  (rebuilds runtime calib)
 *
 * This module provides:
 *   - Versioning + snapshot types for tracking calibration history
 *   - Drift detection: compares the active class's z-score distribution
 *     against the historical pool's distribution, flags significant shifts
 *   - A workflow runner stub (placeholder for a shell-script orchestrator)
 *
 * Pure functions. No I/O.
 */

import type { CohortStats, FeatureKey, FeatureVector, PositionFamily } from "../grading/cohortStats";
import { FEATURE_KEYS, resolveNormalizer, zScore, getEraBucket } from "../grading/cohortStats";

// =============================================================================
// VERSIONING
// =============================================================================

export interface CalibrationSnapshot {
  version: string;            // semver: e.g. "1.2.0"
  generatedAt: string;        // ISO timestamp
  historicalPoolSize: number;
  axisCellsCalibrated: number;
  /** Hash of the input historical data — detects upstream changes. */
  inputHash: string | null;
  /** Free-form notes describing this calibration run. */
  notes: string[];
}

/** Metadata block to write into scoringCalibration.json._meta. */
export function buildSnapshotMeta(
  poolSize: number,
  axisCells: number,
  inputHash: string | null,
  prevVersion: string | null,
): CalibrationSnapshot {
  // Bump minor version each calibration run; full semver bumps require manual edit.
  const next = prevVersion ? bumpMinor(prevVersion) : "1.0.0";
  return {
    version: next,
    generatedAt: new Date().toISOString(),
    historicalPoolSize: poolSize,
    axisCellsCalibrated: axisCells,
    inputHash,
    notes: [],
  };
}

function bumpMinor(version: string): string {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return "1.0.0";
  return `${m[1]}.${Number(m[2]) + 1}.0`;
}

// =============================================================================
// DRIFT DETECTION
// =============================================================================

/** Per-feature drift report comparing one cell's distribution to baseline. */
export interface FeatureDrift {
  feature: FeatureKey;
  positionFamily: PositionFamily;
  /** Number of class prospects contributing to the cell. */
  classN: number;
  /** Class mean z-score (against historical normalizer). */
  classZMean: number;
  /** Class std-dev z-score. */
  classZStd: number;
  /** |classZMean| — drift severity. */
  driftMagnitude: number;
  /** True if drift exceeds threshold. */
  flagged: boolean;
}

export interface DriftReport {
  className: string;
  threshold: number;
  totalProspects: number;
  flaggedCount: number;
  drifts: FeatureDrift[];
  /** Free-form summary lines for UI / logs. */
  summary: string[];
}

const DEFAULT_DRIFT_THRESHOLD = 0.5;

/**
 * Detect drift: compare the active class's distribution per (feature, posFam)
 * to the historical normalizer (mean=0, std=1 by construction). If the class's
 * mean z-score deviates by more than `threshold` σ, flag it.
 *
 * Useful for catching: a class with unusually-tall guards, a class with
 * unusually-low usage rates, etc. — signals that the calibration may need
 * to be re-fit, OR that the class genuinely is anomalous.
 */
export function detectDrift(
  classProspects: { features: FeatureVector; positionFamily: PositionFamily; era: string }[],
  cohortStats: CohortStats,
  className: string,
  threshold: number = DEFAULT_DRIFT_THRESHOLD,
): DriftReport {
  const drifts: FeatureDrift[] = [];
  const summary: string[] = [];

  // Bucket by posFam for per-cell drift checks
  const byPosFam = new Map<PositionFamily, typeof classProspects>();
  for (const p of classProspects) {
    const arr = byPosFam.get(p.positionFamily) ?? [];
    arr.push(p);
    byPosFam.set(p.positionFamily, arr);
  }

  for (const [posFam, group] of byPosFam) {
    for (const feature of FEATURE_KEYS) {
      const zs: number[] = [];
      for (const p of group) {
        const raw = p.features[feature];
        if (raw == null || !Number.isFinite(raw)) continue;
        const era = getEraBucket(parseInt(p.era, 10) || 2026); // active class era
        const norm = era ? resolveNormalizer(cohortStats, era, posFam, feature) : null;
        if (!norm) continue;
        const z = zScore(raw, norm);
        if (z != null && Number.isFinite(z)) zs.push(z);
      }
      if (zs.length < 5) continue; // not enough data
      const mean = zs.reduce((s, x) => s + x, 0) / zs.length;
      const v = zs.length > 1
        ? zs.reduce((s, x) => s + (x - mean) ** 2, 0) / (zs.length - 1)
        : 0;
      const std = Math.sqrt(v);
      const drift: FeatureDrift = {
        feature,
        positionFamily: posFam,
        classN: zs.length,
        classZMean: mean,
        classZStd: std,
        driftMagnitude: Math.abs(mean),
        flagged: Math.abs(mean) > threshold,
      };
      drifts.push(drift);
      if (drift.flagged) {
        summary.push(`DRIFT: ${posFam} ${feature} z̄=${mean.toFixed(2)} (n=${zs.length})`);
      }
    }
  }

  const flaggedCount = drifts.filter((d) => d.flagged).length;
  if (flaggedCount === 0) summary.push(`no significant drift detected (threshold ${threshold}σ)`);

  return {
    className,
    threshold,
    totalProspects: classProspects.length,
    flaggedCount,
    drifts: drifts.sort((a, b) => b.driftMagnitude - a.driftMagnitude),
    summary,
  };
}

// =============================================================================
// WORKFLOW
// =============================================================================

/**
 * Conceptual ordering of the recalibration pipeline. This function exists as
 * documentation; actual orchestration is via `scripts/scoring/recalibrate.sh`
 * (or equivalent npm script) since the steps are CLI tools, not in-process.
 */
export const RECALIBRATION_WORKFLOW = [
  {
    step: 1,
    name: "Foundation calibration",
    command: "node scripts/scoring/calibrate.js",
    output: "src/data/scoringCalibration.json (cellNormalizers, poolNormalizers, cohortThresholds, outcomeBaseRates, compDistanceWeights)",
    notes: "Rebuilds from historicalProspects.json + historicalAdvancedStats.json. Idempotent.",
  },
  {
    step: 2,
    name: "Empirical slope calibration",
    command: "npx tsx scripts/scoring/backfill-historicals.ts",
    output: "scoringCalibration.json (axisRuntimeCalibration); historicalScoreDistributions.json",
    notes: "Two-pass: measures composite-z stats per (axis, posFam), normalizes runtime scoring.",
  },
  {
    step: 3,
    name: "Drift detection (current class)",
    command: "npx tsx scripts/scoring/check-drift.ts",
    output: "stdout — flags features that have shifted vs historical baseline",
    notes: "Runs detectDrift() on the active class. Surfaces anomalies. Optional but recommended each draft cycle.",
  },
  {
    step: 4,
    name: "Validation",
    command: "npx tsx scripts/scoring/test-comps.ts",
    output: "stdout — fixture-based smoke tests on AJ Dybantsa, Trae Young, etc.",
    notes: "Confirms grade distributions, comp tier rationing, overall composite ordering.",
  },
] as const;
