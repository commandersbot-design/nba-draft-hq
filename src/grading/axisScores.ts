/**
 * axisScores.ts — Module 1 core: per-axis score computation.
 *
 * Computes a 0-100 score for each of the 9 first-class axes (initiate, extend,
 * close, space, connect, contain, disrupt, switch, transition) plus the
 * derived `translate` meta-axis. Each axis blends three signal sources per
 * the axisConfig:
 *
 *   raw_z      = Σ (sign_i × weight_i × zScore(feature_i)) / Σ weight_i
 *   anchor_z   = (archetype_anchor_value − 50) / 15   (linear z-score from 0-100 anchor)
 *   prose_z    = Σ (polarityWeight × tagWeight)       (signed contribution from authored prose)
 *   axis_z     = (1 − αA − αP) · raw_z  +  αA · anchor_z  +  αP · prose_z
 *   axis_score = clamp(50 + 15 · axis_z, 0, 100)
 *
 * When required features are missing, weight redistributes to anchor + prose.
 * When NO source is present (no required features, no anchor, no prose), the
 * function returns score=null with dataMode='blocked' — never a fake number.
 *
 * The `translate` axis is special: it has no direct features. It's a weighted
 * blend of other axis scores plus stat-side modifiers (BPM, age curve). It's
 * computed last by computeAllAxisScores after the 9 first-class axes resolve.
 *
 * RULES enforced here:
 *   - Pure functions (no I/O, no module state mutation)
 *   - Explicit null returns when data is insufficient
 *   - Every output carries dataMode + coverage
 *   - Float comparisons via approxEqual
 *   - All weights/configs loaded from @config/axisFeatureWeights.json
 */

import {
  type CohortStats,
  type FeatureKey,
  type FeatureVector,
  type Era,
  type PositionFamily,
  type DataMode,
  resolveNormalizer,
  getAxisRuntime,
  zScore,
  EPSILON,
} from "./cohortStats";

import axisFeatureWeightsRaw from "../../config/axisFeatureWeights.json";

// =============================================================================
// TYPES
// =============================================================================

/** First-class axes — each has direct feature contributors. */
export type AxisKey =
  | "initiate" | "extend" | "close" | "space" | "connect"
  | "contain" | "disrupt" | "switch" | "transition";

/** Derived meta-axis. Not a member of AxisKey. */
export type DerivedAxisKey = "translate";

/** Union for callers that handle both. */
export type AnyAxisKey = AxisKey | DerivedAxisKey;

export const AXIS_KEYS: readonly AxisKey[] = [
  "initiate", "extend", "close", "space", "connect",
  "contain", "disrupt", "switch", "transition",
] as const;

/** Sign direction for a contributor — '+' = higher feature → higher axis. */
export type FeatureSign = "+" | "-";

export interface AxisFeatureWeight {
  feature: FeatureKey;
  weight: number;
  sign: FeatureSign;
  required: boolean;
}

export interface AxisConfig {
  features: AxisFeatureWeight[];
  archetypeAnchorWeight: number;   // 0..1
  proseWeight: number;              // 0..1
  // featureWeight = 1 - archetypeAnchorWeight - proseWeight (implicit)
}

export type AxisConfigMap = Record<AxisKey, AxisConfig>;

export interface TranslateConfig {
  axisBlend: Record<AxisKey, number>;  // weights summing to ~1; renormalized internally
  statSideModifiers: AxisFeatureWeight[];
}

export interface ProseTag {
  axis: AnyAxisKey;
  polarity: "pos" | "neg" | "swing";
  weight: number;  // 0..1, intensity of the tag
}

export interface AxisInputs {
  features: FeatureVector;
  archetypeKey: string | null;
  proseTags: ProseTag[];
  positionFamily: PositionFamily;
  era: Era;
  age: number | null;
}

export interface AxisContribution {
  feature: FeatureKey;
  rawValue: number | null;
  zScore: number | null;
  weight: number;
  sign: FeatureSign;
  signedZ: number;              // signed weighted contribution (z × weight × sign)
  normalizerN: number;
  normalizerSource: "cell" | "pool";
}

export interface CoverageReport {
  /** Required features present and z-scored. */
  available: number;
  /** Required features defined in the axis config. */
  required: number;
  /** All features defined (required + optional). */
  total: number;
  /** Optional features that were also present. */
  optionalPresent: number;
  /** Optional features that were defined. */
  optionalDefined: number;
}

export interface AxisScore {
  axis: AnyAxisKey;
  score: number | null;          // 0-100; null when blocked
  scoreZ: number | null;          // raw z-score (pre-clamp)
  dataMode: DataMode;
  coverage: CoverageReport;
  contributions: {
    stat: AxisContribution[];      // present, z-scored features
    statSum: number | null;         // weighted average z across present features
    archetypeAnchor: number | null; // 0-100 anchor value (raw)
    archetypeAnchorZ: number | null; // (anchor - 50) / 15
    prose: number | null;            // signed -∞..+∞ from prose tags (typically -2..+2)
  };
  /** Effective blend weights applied (after redistribution for missing data). */
  effectiveBlend: {
    statWeight: number;
    anchorWeight: number;
    proseWeight: number;
  };
  notes: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Slope of z → 0-100 mapping. score = 50 + Z_TO_SCORE_SLOPE * z. */
export const Z_TO_SCORE_SLOPE = 15;

/** Anchor scale: 0-100 anchor score → z-score by (anchor - 50) / ANCHOR_TO_Z_SLOPE. */
export const ANCHOR_TO_Z_SLOPE = 15;

/**
 * Minimum effective stat weight before we declare an axis "scout_anchored".
 * If less than this fraction of the original featureWeight survives feature
 * dropouts, the axis is considered to have no quantitative spine.
 */
export const SCOUT_ANCHORED_THRESHOLD = 0.20;

// =============================================================================
// CONFIG LOADING
// =============================================================================

/**
 * Load + validate the axis-feature-weights config. Validates types and that
 * archetypeAnchorWeight + proseWeight ≤ 1 for each axis.
 */
export function loadAxisConfigs(): AxisConfigMap {
  const raw = axisFeatureWeightsRaw as RawAxisConfigFile;
  const out = {} as AxisConfigMap;
  for (const axis of AXIS_KEYS) {
    const cfg = raw.axes?.[axis];
    if (!cfg) {
      throw new Error(`axisFeatureWeights.json missing config for axis "${axis}"`);
    }
    const aw = cfg.archetypeAnchorWeight;
    const pw = cfg.proseWeight;
    if (aw < 0 || aw > 1) throw new Error(`axis ${axis}: archetypeAnchorWeight must be 0..1, got ${aw}`);
    if (pw < 0 || pw > 1) throw new Error(`axis ${axis}: proseWeight must be 0..1, got ${pw}`);
    if (aw + pw > 1 + EPSILON) {
      throw new Error(`axis ${axis}: anchorWeight + proseWeight must be <= 1, got ${aw + pw}`);
    }
    out[axis] = {
      features: cfg.features.map((f) => ({
        feature: f.feature as FeatureKey,
        weight: f.weight,
        sign: f.sign as FeatureSign,
        required: f.required ?? false,
      })),
      archetypeAnchorWeight: aw,
      proseWeight: pw,
    };
  }
  return out;
}

export function loadTranslateConfig(): TranslateConfig {
  const raw = axisFeatureWeightsRaw as RawAxisConfigFile;
  if (!raw.translate) throw new Error("axisFeatureWeights.json missing 'translate' block");
  return {
    axisBlend: raw.translate.axisBlend as Record<AxisKey, number>,
    statSideModifiers: raw.translate.statSideModifiers.map((f) => ({
      feature: f.feature as FeatureKey,
      weight: f.weight,
      sign: f.sign as FeatureSign,
      required: f.required ?? false,
    })),
  };
}

// =============================================================================
// CORE — single-axis computation
// =============================================================================

/**
 * Compute the score for a single first-class axis.
 *
 * @param axis             axis key (must be one of AXIS_KEYS)
 * @param inputs           prospect's features + prose + identity
 * @param cohortStats      from loadCohortStats()
 * @param axisConfig       per-axis weights from loadAxisConfigs()
 * @param archetypeAnchor  the anchor value for THIS axis from archetypeCatalog (0-100), or null
 * @returns                AxisScore. Score is null only when dataMode='blocked'.
 */
export function computeAxisScore(
  axis: AxisKey,
  inputs: AxisInputs,
  cohortStats: CohortStats,
  axisConfig: AxisConfig,
  archetypeAnchor: number | null,
): AxisScore {
  const notes: string[] = [];
  const contributions: AxisContribution[] = [];

  // -- Stat contribution: z-score each present feature, accumulate weighted sum
  let totalWeightUsed = 0;
  let totalWeightDefined = 0;
  let requiredDefined = 0;
  let requiredAvailable = 0;
  let optionalDefined = 0;
  let optionalPresent = 0;
  let signedZSum = 0;

  for (const fc of axisConfig.features) {
    totalWeightDefined += fc.weight;
    if (fc.required) requiredDefined++; else optionalDefined++;

    const rawValue = inputs.features[fc.feature];
    if (rawValue == null || !Number.isFinite(rawValue)) {
      if (fc.required) {
        notes.push(`required feature "${fc.feature}" missing`);
      } else {
        notes.push(`optional feature "${fc.feature}" missing — dropped`);
      }
      continue;
    }

    const norm = resolveNormalizer(cohortStats, inputs.era, inputs.positionFamily, fc.feature);
    if (!norm) {
      notes.push(`no normalizer for "${fc.feature}" in cohort (${inputs.era} × ${inputs.positionFamily}) — dropped`);
      continue;
    }

    const z = zScore(rawValue, norm);
    if (z == null) {
      notes.push(`z-score failed for "${fc.feature}" (zero std?) — dropped`);
      continue;
    }

    const signMul = fc.sign === "-" ? -1 : 1;
    const signedZ = signMul * fc.weight * z;
    contributions.push({
      feature: fc.feature,
      rawValue,
      zScore: z,
      weight: fc.weight,
      sign: fc.sign,
      signedZ,
      normalizerN: norm.n,
      normalizerSource: norm.source,
    });
    signedZSum += signedZ;
    totalWeightUsed += fc.weight;

    if (fc.required) requiredAvailable++; else optionalPresent++;
    if (norm.source === "pool") {
      notes.push(`"${fc.feature}" normalized via pool fallback (cell sample too small)`);
    }
  }

  const statSum: number | null = totalWeightUsed > EPSILON
    ? signedZSum / totalWeightUsed
    : null;

  // -- Archetype anchor contribution
  const anchorZ: number | null = archetypeAnchor != null && Number.isFinite(archetypeAnchor)
    ? (archetypeAnchor - 50) / ANCHOR_TO_Z_SLOPE
    : null;

  // -- Prose contribution: sum signed weights of tags matching this axis
  const proseForAxis = inputs.proseTags.filter((t) => t.axis === axis);
  let proseZ: number | null = null;
  if (proseForAxis.length > 0) {
    let sum = 0;
    for (const t of proseForAxis) {
      const polarityMul = t.polarity === "pos" ? 1 : t.polarity === "neg" ? -1 : 0;
      // 'swing' tags carry no signed z — they only feed confidence-interval widening downstream
      sum += polarityMul * t.weight;
    }
    proseZ = sum;
  }

  // -- Blend weights with redistribution
  const blend = redistributeBlendWeights(
    axisConfig,
    statSum != null,
    anchorZ != null,
    proseZ != null,
    totalWeightUsed,
    totalWeightDefined,
  );

  // -- Combine
  let combinedZ: number | null = null;
  if (blend.statWeight + blend.anchorWeight + blend.proseWeight > EPSILON) {
    let z = 0;
    if (statSum != null && blend.statWeight > 0)   z += blend.statWeight * statSum;
    if (anchorZ != null && blend.anchorWeight > 0) z += blend.anchorWeight * anchorZ;
    if (proseZ != null && blend.proseWeight > 0)   z += blend.proseWeight * proseZ;
    combinedZ = z;
  }

  // -- Empirical runtime calibration: normalize combinedZ so final score has
  //    std ≈ 15 (and mean ≈ 50) across the historical pool. Falls back to
  //    raw 50+15·z when calibration absent.
  const runtimeCal = getAxisRuntime(cohortStats, axis, inputs.positionFamily);
  const normalizedZ: number | null =
    combinedZ != null && runtimeCal && runtimeCal.zStd > EPSILON
      ? (combinedZ - runtimeCal.zMean) / runtimeCal.zStd
      : combinedZ;
  if (combinedZ != null && runtimeCal == null) {
    notes.push(`no runtime calibration for ${axis}/${inputs.positionFamily} — using raw 50+15·z`);
  }

  // -- Score: 0-100 mapping
  const score: number | null = normalizedZ == null
    ? null
    : clamp(50 + Z_TO_SCORE_SLOPE * normalizedZ, 0, 100);

  // -- Data mode resolution
  const dataMode: DataMode = resolveDataMode(
    statSum != null,
    requiredAvailable,
    requiredDefined,
    anchorZ != null,
    proseZ != null,
    totalWeightUsed,
    totalWeightDefined,
  );

  return {
    axis,
    score,
    scoreZ: combinedZ,
    dataMode,
    coverage: {
      available: requiredAvailable,
      required: requiredDefined,
      total: requiredDefined + optionalDefined,
      optionalPresent,
      optionalDefined,
    },
    contributions: {
      stat: contributions,
      statSum,
      archetypeAnchor,
      archetypeAnchorZ: anchorZ,
      prose: proseZ,
    },
    effectiveBlend: blend,
    notes,
  };
}

// =============================================================================
// TRANSLATE — derived meta-axis
// =============================================================================

/**
 * Compute the `translate` axis from the resolved 9 first-class axes plus
 * stat-side modifiers (BPM, age). Returns null score if too many input axes
 * are themselves null/blocked.
 */
export function computeTranslateAxis(
  axes: Record<AxisKey, AxisScore>,
  inputs: AxisInputs,
  cohortStats: CohortStats,
  translateConfig: TranslateConfig,
): AxisScore {
  const notes: string[] = [];

  // Axis blend — weighted average of axis scoreZ, renormalized over present axes
  let totalAxisWeight = 0;
  let weightedZSum = 0;
  let axesPresent = 0;
  for (const [axisKey, weight] of Object.entries(translateConfig.axisBlend) as [AxisKey, number][]) {
    const axisScore = axes[axisKey];
    if (!axisScore || axisScore.scoreZ == null) {
      notes.push(`axis "${axisKey}" unavailable — dropped from translate blend`);
      continue;
    }
    weightedZSum += weight * axisScore.scoreZ;
    totalAxisWeight += weight;
    axesPresent++;
  }
  const axisBlendZ: number | null = totalAxisWeight > EPSILON
    ? weightedZSum / totalAxisWeight
    : null;

  // Stat-side modifiers (BPM, age) — same z-score machinery
  const modifierContributions: AxisContribution[] = [];
  let modWeightUsed = 0;
  let modWeightDefined = 0;
  let modSignedZSum = 0;
  for (const fc of translateConfig.statSideModifiers) {
    modWeightDefined += fc.weight;
    const rawValue = inputs.features[fc.feature];
    if (rawValue == null || !Number.isFinite(rawValue)) continue;
    const norm = resolveNormalizer(cohortStats, inputs.era, inputs.positionFamily, fc.feature);
    if (!norm) continue;
    const z = zScore(rawValue, norm);
    if (z == null) continue;
    const signMul = fc.sign === "-" ? -1 : 1;
    const signedZ = signMul * fc.weight * z;
    modifierContributions.push({
      feature: fc.feature, rawValue, zScore: z,
      weight: fc.weight, sign: fc.sign, signedZ,
      normalizerN: norm.n, normalizerSource: norm.source,
    });
    modSignedZSum += signedZ;
    modWeightUsed += fc.weight;
  }
  const modSum: number | null = modWeightUsed > EPSILON
    ? modSignedZSum / modWeightUsed
    : null;

  // Combine: 80% axis blend, 20% stat-side modifiers (when both present)
  // If only one is present, it carries 100% weight.
  let combinedZ: number | null = null;
  let statWeight = 0, axisWeight = 0;
  const statShare = 0.20;
  const axisShare = 0.80;
  if (axisBlendZ != null && modSum != null) {
    axisWeight = axisShare;
    statWeight = statShare;
    combinedZ = axisShare * axisBlendZ + statShare * modSum;
  } else if (axisBlendZ != null) {
    axisWeight = 1.0;
    combinedZ = axisBlendZ;
  } else if (modSum != null) {
    statWeight = 1.0;
    combinedZ = modSum;
  }

  // Empirical runtime calibration for translate (same approach as the 9 main axes).
  const translateRuntimeCal = getAxisRuntime(cohortStats, "translate", inputs.positionFamily);
  const normalizedZ: number | null =
    combinedZ != null && translateRuntimeCal && translateRuntimeCal.zStd > EPSILON
      ? (combinedZ - translateRuntimeCal.zMean) / translateRuntimeCal.zStd
      : combinedZ;
  const score: number | null = normalizedZ == null ? null : clamp(50 + Z_TO_SCORE_SLOPE * normalizedZ, 0, 100);

  // Data mode for translate: "full" if at least 6 of 9 source axes are present,
  // "partial" if 3-5, "scout_anchored" if <3 axes present but stat modifiers exist,
  // "blocked" if neither.
  let dataMode: DataMode;
  if (combinedZ == null) dataMode = "blocked";
  else if (axesPresent >= 6) dataMode = "full";
  else if (axesPresent >= 3) dataMode = "partial";
  else dataMode = "scout_anchored";

  return {
    axis: "translate",
    score,
    scoreZ: combinedZ,
    dataMode,
    coverage: {
      available: axesPresent,
      required: Object.keys(translateConfig.axisBlend).length,
      total: Object.keys(translateConfig.axisBlend).length + translateConfig.statSideModifiers.length,
      optionalPresent: modWeightUsed > 0 ? modifierContributions.length : 0,
      optionalDefined: translateConfig.statSideModifiers.length,
    },
    contributions: {
      stat: modifierContributions,
      statSum: modSum,
      archetypeAnchor: null,
      archetypeAnchorZ: null,
      prose: null,
    },
    effectiveBlend: {
      statWeight,
      anchorWeight: axisWeight,  // semantic overload: for translate, this is the axis-blend weight
      proseWeight: 0,
    },
    notes,
  };
}

// =============================================================================
// BATCH — all axes for a prospect in one call
// =============================================================================

export interface AllAxisScoresOutput {
  axes: Record<AxisKey, AxisScore>;
  translate: AxisScore;
}

/**
 * Compute all 9 first-class axis scores + the translate meta-axis for a prospect.
 *
 * @param archetypeAnchors  Map keyed by axis with the prospect's archetype anchor
 *                           values (0-100). Pass null if no archetype is set.
 */
export function computeAllAxisScores(
  inputs: AxisInputs,
  cohortStats: CohortStats,
  axisConfigs: AxisConfigMap,
  translateConfig: TranslateConfig,
  archetypeAnchors: Record<AxisKey, number> | null,
): AllAxisScoresOutput {
  const axes = {} as Record<AxisKey, AxisScore>;
  for (const axis of AXIS_KEYS) {
    const anchor = archetypeAnchors?.[axis] ?? null;
    axes[axis] = computeAxisScore(axis, inputs, cohortStats, axisConfigs[axis], anchor);
  }
  const translate = computeTranslateAxis(axes, inputs, cohortStats, translateConfig);
  return { axes, translate };
}

// =============================================================================
// INTERNALS
// =============================================================================

function clamp(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/**
 * Redistribute blend weights when one or more sources are missing.
 *
 * Original ratios are stat:anchor:prose = (1−αA−αP) : αA : αP.
 * If a source is unavailable, its weight redistributes pro-rata to the
 * remaining sources. If only one source is available, it carries 1.0.
 *
 * Also accounts for partial stat coverage: when only some required features
 * are present (totalWeightUsed < totalWeightDefined), the stat weight is
 * scaled down by the coverage ratio and the surplus redistributes.
 */
function redistributeBlendWeights(
  cfg: AxisConfig,
  hasStat: boolean,
  hasAnchor: boolean,
  hasProse: boolean,
  totalWeightUsed: number,
  totalWeightDefined: number,
): { statWeight: number; anchorWeight: number; proseWeight: number } {
  const baseFeature = 1 - cfg.archetypeAnchorWeight - cfg.proseWeight;
  const featureCoverage = totalWeightDefined > EPSILON
    ? Math.min(1, totalWeightUsed / totalWeightDefined)
    : 0;

  // Apparent weights given source availability + coverage
  let s = hasStat ? baseFeature * featureCoverage : 0;
  let a = hasAnchor ? cfg.archetypeAnchorWeight : 0;
  let p = hasProse ? cfg.proseWeight : 0;

  // If stat coverage was partial, the surplus (baseFeature - s) redistributes to anchor/prose
  // proportionally to their original weights (when those sources are present).
  const surplus = (hasStat ? baseFeature - s : baseFeature);
  const remainingTotal = a + p;
  if (surplus > EPSILON && remainingTotal > EPSILON) {
    const aShare = a / remainingTotal;
    const pShare = p / remainingTotal;
    a += surplus * aShare;
    p += surplus * pShare;
  }
  // If neither anchor nor prose is present, stat absorbs everything (clamp s = featureCoverage)
  if (surplus > EPSILON && remainingTotal <= EPSILON && hasStat) {
    s = featureCoverage; // already accounts for missing features
  }

  // Final renormalize so sum is 1 if anything is present
  const total = s + a + p;
  if (total < EPSILON) return { statWeight: 0, anchorWeight: 0, proseWeight: 0 };
  return {
    statWeight: s / total,
    anchorWeight: a / total,
    proseWeight: p / total,
  };
}

/**
 * Determine dataMode based on which sources contributed and how much of the
 * required-feature spine is intact.
 */
function resolveDataMode(
  hasStat: boolean,
  requiredAvailable: number,
  requiredDefined: number,
  hasAnchor: boolean,
  hasProse: boolean,
  totalWeightUsed: number,
  totalWeightDefined: number,
): DataMode {
  // Nothing — blocked
  if (!hasStat && !hasAnchor && !hasProse) return "blocked";

  // No quantitative spine — scout_anchored
  if (!hasStat) return "scout_anchored";

  // Full required coverage AND >= some optional weight retained → full
  const reqCoverage = requiredDefined > 0 ? requiredAvailable / requiredDefined : 0;
  const totalCoverage = totalWeightDefined > EPSILON ? totalWeightUsed / totalWeightDefined : 0;

  if (reqCoverage >= 1 - EPSILON && totalCoverage >= SCOUT_ANCHORED_THRESHOLD * 2) {
    return "full";
  }
  // Partial — at least some required features but not all, or all required but heavy optional dropouts
  if (reqCoverage > 0 && totalCoverage >= SCOUT_ANCHORED_THRESHOLD) {
    return "partial";
  }
  // Stats present but very thin coverage; effectively running on anchor/prose
  return "scout_anchored";
}

// =============================================================================
// RAW JSON SHAPE
// =============================================================================

interface RawAxisConfigFile {
  axes?: Record<string, RawAxisConfigEntry>;
  translate?: {
    axisBlend: Record<string, number>;
    statSideModifiers: { feature: string; weight: number; sign: string; required?: boolean }[];
  };
}

interface RawAxisConfigEntry {
  features: { feature: string; weight: number; sign: string; required?: boolean }[];
  archetypeAnchorWeight: number;
  proseWeight: number;
}
