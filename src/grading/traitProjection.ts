/**
 * traitProjection.ts — Module 1c: 9-axis → 8-trait projection.
 *
 * The 9-axis system (axisScores.ts) is the canonical scoring layer. The 8-trait
 * UI labels (AdvantageCreation, DecisionMaking, etc.) are a presentation
 * projection of those axes via the fixed weights in @config/traitProjection.json.
 *
 * Design choices:
 *   - Pure function. No I/O, no state. Takes axis scores in, returns trait scores.
 *   - dataMode propagates: a trait inherits the WORST dataMode of its contributing
 *     axes ("blocked" beats "scout_anchored" beats "partial" beats "full").
 *   - When an axis blend partially resolves (some inputs null), weights renormalize
 *     over present inputs. If all blend inputs are null/blocked, the trait is blocked.
 *   - score is a weighted average on the 0-100 scale (axis scores are already 0-100).
 *   - scoreZ is the equivalent z-score reverse-mapped via (score - 50) / 15 so callers
 *     downstream (letterGrades) can apply z-score floors without re-deriving.
 */

import type {
  AxisKey,
  AxisScore,
  AllAxisScoresOutput,
} from "./axisScores";
import { AXIS_KEYS } from "./axisScores";
import {
  type CohortStats,
  type DataMode,
  type PositionFamily,
  EPSILON,
  approxEqual,
  getTraitRuntime,
} from "./cohortStats";
import projectionConfigRaw from "../../config/traitProjection.json";

// =============================================================================
// TYPES
// =============================================================================

/** The 8 UI traits. Order is the canonical display order. */
export type TraitKey =
  | "AdvantageCreation" | "DecisionMaking"  | "PassingCreation"
  | "ShootingGravity"   | "OffBallValue"     | "ProcessingSpeed"
  | "Scalability"        | "DefensiveVersatility";

export const TRAIT_KEYS: readonly TraitKey[] = [
  "AdvantageCreation", "DecisionMaking", "PassingCreation",
  "ShootingGravity", "OffBallValue", "ProcessingSpeed",
  "Scalability", "DefensiveVersatility",
] as const;

/** Weights per axis-blend entry — keyed by AxisKey. Loaded from config. */
export type TraitBlend = Partial<Record<AxisKey, number>>;

export interface TraitProjectionConfig {
  blend: TraitBlend;
}

export type TraitProjectionMap = Record<TraitKey, TraitProjectionConfig>;

export interface TraitContribution {
  axis: AxisKey;
  axisScore: number | null;
  axisScoreZ: number | null;
  blendWeight: number;       // raw weight from config (e.g., 0.60)
  effectiveWeight: number;   // post-renormalization weight (after dropping null axes)
  signedContribution: number; // axisScore × effectiveWeight (in 0-100 score-space)
}

export interface TraitScore {
  trait: TraitKey;
  /** 0-100 weighted projection of axis scores. Null when blocked. */
  score: number | null;
  /** Equivalent z-score: (score - 50) / 15. Null when score is null. */
  scoreZ: number | null;
  /** Worst dataMode across contributing axes. */
  dataMode: DataMode;
  /** Per-axis contribution detail for transparency in the UI. */
  contributions: TraitContribution[];
  /**
   * Coverage: how many of the trait's blend axes were available (had a non-null
   * axisScore) vs how many were defined.
   */
  coverage: { available: number; defined: number };
  /** Free-form notes — explains data downgrades, missing axes, etc. */
  notes: string[];
}

// =============================================================================
// CONFIG LOADING
// =============================================================================

/**
 * Load + validate the trait projection config. Throws on invalid weights.
 */
export function loadTraitProjection(): TraitProjectionMap {
  const raw = projectionConfigRaw as RawProjectionFile;
  const out = {} as TraitProjectionMap;
  for (const trait of TRAIT_KEYS) {
    const cfg = raw.projection?.[trait];
    if (!cfg) {
      throw new Error(`traitProjection.json missing entry for trait "${trait}"`);
    }
    const blend = cfg.blend ?? {};
    let weightSum = 0;
    for (const [axis, w] of Object.entries(blend)) {
      if (!AXIS_KEYS.includes(axis as AxisKey)) {
        throw new Error(`trait "${trait}": unknown axis "${axis}" in blend`);
      }
      if (typeof w !== "number" || w < 0 || w > 1) {
        throw new Error(`trait "${trait}": axis "${axis}" weight must be 0..1, got ${w}`);
      }
      weightSum += w;
    }
    if (!approxEqual(weightSum, 1.0, 1e-6)) {
      throw new Error(`trait "${trait}": blend weights must sum to 1.0 (got ${weightSum})`);
    }
    out[trait] = { blend: blend as TraitBlend };
  }
  return out;
}

// =============================================================================
// CORE
// =============================================================================

/** dataMode severity for "worst-mode" propagation. Higher = worse. */
const DATA_MODE_SEVERITY: Record<DataMode, number> = {
  full: 0,
  partial: 1,
  scout_anchored: 2,
  blocked: 3,
};

function worseDataMode(a: DataMode, b: DataMode): DataMode {
  return DATA_MODE_SEVERITY[a] >= DATA_MODE_SEVERITY[b] ? a : b;
}

export interface ProjectTraitOptions {
  /** Cohort stats — when provided with positionFamily, enables trait-level
   *  empirical normalization (fixes std compression for blended traits). */
  cohortStats?: CohortStats;
  positionFamily?: PositionFamily;
}

/**
 * Project a single trait from the resolved axis scores.
 *
 * Renormalization: if a blend axis has score=null, that axis drops out of the
 * weighted average and the remaining axes' weights are renormalized to sum to 1.
 * If ALL blend axes are null, returns score=null with dataMode='blocked'.
 *
 * When cohortStats + positionFamily are provided AND a TraitRuntimeStats entry
 * exists for (trait, posFam), the score is re-normalized empirically:
 *   z         = (score - 50) / 15
 *   z_norm    = (z - traitMean) / traitStd
 *   score_out = 50 + 15 · z_norm
 * This corrects the variance compression that happens when blending multiple
 * axes (e.g., ProcessingSpeed = 0.5·disrupt + 0.5·connect → std ~0.71 in
 * z-space → final score std ~10 instead of 15).
 */
export function projectTrait(
  trait: TraitKey,
  blend: TraitBlend,
  axisScores: Record<AxisKey, AxisScore>,
  options: ProjectTraitOptions = {},
): TraitScore {
  const contributions: TraitContribution[] = [];
  const notes: string[] = [];
  let definedCount = 0;
  let availableCount = 0;
  let totalDefinedWeight = 0;
  let totalAvailableWeight = 0;
  let weightedSum = 0;
  let worstMode: DataMode = "full";

  for (const [axis, weight] of Object.entries(blend) as [AxisKey, number][]) {
    if (weight == null) continue;
    definedCount++;
    totalDefinedWeight += weight;
    const axisScore = axisScores[axis];
    if (!axisScore) {
      contributions.push({
        axis, axisScore: null, axisScoreZ: null,
        blendWeight: weight, effectiveWeight: 0, signedContribution: 0,
      });
      worstMode = worseDataMode(worstMode, "blocked");
      notes.push(`axis "${axis}" missing — dropped from blend`);
      continue;
    }
    if (axisScore.score == null) {
      contributions.push({
        axis, axisScore: null, axisScoreZ: null,
        blendWeight: weight, effectiveWeight: 0, signedContribution: 0,
      });
      worstMode = worseDataMode(worstMode, axisScore.dataMode);
      notes.push(`axis "${axis}" blocked (${axisScore.dataMode}) — dropped from blend`);
      continue;
    }
    availableCount++;
    totalAvailableWeight += weight;
    weightedSum += weight * axisScore.score;
    worstMode = worseDataMode(worstMode, axisScore.dataMode);
    contributions.push({
      axis,
      axisScore: axisScore.score,
      axisScoreZ: axisScore.scoreZ,
      blendWeight: weight,
      effectiveWeight: 0,         // assigned below after renormalization
      signedContribution: 0,      // assigned below
    });
  }

  // Renormalize effective weights over present axes
  if (totalAvailableWeight > EPSILON) {
    for (const c of contributions) {
      if (c.axisScore == null) continue;
      c.effectiveWeight = c.blendWeight / totalAvailableWeight;
      c.signedContribution = c.effectiveWeight * c.axisScore;
    }
  }

  let score: number | null = totalAvailableWeight > EPSILON
    ? weightedSum / totalAvailableWeight
    : null;

  // Empirical trait-level normalization. Same approach as axisRuntime — bring
  // trait std back to ~15 (i.e., trait z-std back to ~1) for blended traits
  // whose raw projection compresses. Skipped silently when calibration absent.
  if (score != null && options.cohortStats && options.positionFamily) {
    const cal = getTraitRuntime(options.cohortStats, trait, options.positionFamily);
    if (cal && cal.zStd > EPSILON) {
      const rawZ = (score - 50) / 15;
      const normalizedZ = (rawZ - cal.zMean) / cal.zStd;
      score = 50 + 15 * normalizedZ;
      notes.push(`trait-level calibration applied (z: ${rawZ.toFixed(2)} → ${normalizedZ.toFixed(2)})`);
    }
  }

  const scoreZ: number | null = score == null ? null : (score - 50) / 15;

  // Special-case: if no axes present, dataMode is 'blocked' regardless of upstream
  const dataMode: DataMode = score == null ? "blocked" : worstMode;

  return {
    trait,
    score,
    scoreZ,
    dataMode,
    contributions,
    coverage: { available: availableCount, defined: definedCount },
    notes,
  };
}

/**
 * Project all 8 traits from the full axis-scores output.
 *
 * Convenience wrapper around projectTrait — loads the projection config once,
 * iterates over TRAIT_KEYS.
 */
export function projectAxesToTraits(
  axes: AllAxisScoresOutput,
  projectionMap?: TraitProjectionMap,
  options: ProjectTraitOptions = {},
): Record<TraitKey, TraitScore> {
  const map = projectionMap ?? loadTraitProjection();
  const out = {} as Record<TraitKey, TraitScore>;
  for (const trait of TRAIT_KEYS) {
    out[trait] = projectTrait(trait, map[trait].blend, axes.axes, options);
  }
  return out;
}

// =============================================================================
// RAW JSON SHAPE
// =============================================================================

interface RawProjectionFile {
  projection?: Record<string, { blend: Record<string, number> }>;
}
