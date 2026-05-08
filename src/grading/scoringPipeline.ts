/**
 * scoringPipeline.ts — high-level façade for the full grading + comps + overall
 * pipeline. One function in, one structured output. The UI consumes this.
 *
 * This is the integration layer that the React app calls. It encapsulates the
 * coordination between Modules 1-3 + 4 so the UI doesn't need to manage it.
 *
 * Pure function. All inputs explicit. No I/O.
 */

import {
  type CohortStats,
  type DataMode,
  loadCohortStats,
  getEraBucket,
  getPositionFamily,
  heightToInches,
} from "./cohortStats";
import {
  type ActiveProspectRecord,
  type ProfileStatsRecord,
  type AdvancedExtrasRecord,
  type HistoricalProspectRecord,
  type HistoricalAdvancedRecord,
  featuresFromActive,
  featuresFromHistorical,
} from "./featureExtractor";
import {
  type AllAxisScoresOutput,
  type AxisKey,
  computeAllAxisScores,
  loadAxisConfigs,
  loadTranslateConfig,
} from "./axisScores";
import {
  type TraitKey,
  type TraitScore,
  projectAxesToTraits,
  loadTraitProjection,
  TRAIT_KEYS,
} from "./traitProjection";
import {
  type GradeResult,
  type LetterGrade,
  assignLetterGrade,
  loadGradeThresholds,
  traitMetricKey,
} from "./letterGrades";
import { getArchetypeAnchors } from "./archetypeLookup";
import { type OverallScore, computeOverallScore } from "./overall";
import {
  type CompEngineResult,
  type CompCandidate,
  type CompProspectInput,
  findComps,
} from "../comps/compEngine";

// =============================================================================
// PUBLIC OUTPUT SHAPE
// =============================================================================

export interface ProspectScores {
  prospectId: string;
  prospectName: string;

  // Module 1 outputs
  axes: AllAxisScoresOutput;
  traits: Record<TraitKey, TraitScore>;
  traitGrades: Record<TraitKey, GradeResult>;

  // Module 3 output
  overall: OverallScore;

  // Module 2 output
  comps: CompEngineResult;

  // Top-level summary surface for cards / dashboards
  summary: {
    /** Display score, percentile-rescaled 0-100. Null when blocked/unknown. */
    overallDisplay: number | null;
    /** Display sigma in percentile space (capped at 8). */
    overallSigma: number | null;
    /** Letter-grade-derived "spotlight" trait — strongest grade. */
    spotlightTrait: { trait: TraitKey; grade: LetterGrade | null; score: number | null } | null;
    /** Headline comp name + outcome tier. */
    headlineComp: { name: string; tier: string | null; year: number | null; similarity: number | null } | null;
    /** Shadow comp name + outcome tier — the cautionary tale. */
    shadowComp: { name: string; tier: string | null; year: number | null; similarity: number | null } | null;
    /** Coarse data quality flag. */
    dataMode: DataMode;
  };
}

// =============================================================================
// ACTIVE PROSPECT PATH
// =============================================================================

export interface ScoreActiveProspectInput {
  prospect: ActiveProspectRecord;
  profileStats: ProfileStatsRecord | null;
  advancedExtras: AdvancedExtrasRecord | null;
  candidatePool: CompCandidate[];
  cohortStats?: CohortStats;
}

export function scoreActiveProspect(input: ScoreActiveProspectInput): ProspectScores | null {
  const cohortStats = input.cohortStats ?? loadCohortStats();

  const features = featuresFromActive(input.prospect, input.profileStats, input.advancedExtras);
  const era = getEraBucket(2026); // active 2026 class
  const posFam = getPositionFamily(input.prospect);
  if (!era) return null;

  const compInput: CompProspectInput = {
    id: input.prospect.id,
    name: input.prospect.name,
    features,
    archetypeKey: input.prospect.archetype ?? null,
    positionFamily: posFam,
    era,
  };

  return runPipeline(compInput, input.candidatePool, cohortStats, {
    wingspanInches: input.prospect.wingspan ? heightToInches(input.prospect.wingspan) : null,
  });
}

// =============================================================================
// HISTORICAL PROSPECT PATH (for testing / LOO)
// =============================================================================

export interface ScoreHistoricalProspectInput {
  prospect: HistoricalProspectRecord;
  advanced: HistoricalAdvancedRecord | null;
  /** Pool with this historical's id REMOVED if doing LOO. Caller's responsibility. */
  candidatePool: CompCandidate[];
  cohortStats?: CohortStats;
}

export function scoreHistoricalProspect(input: ScoreHistoricalProspectInput): ProspectScores | null {
  const cohortStats = input.cohortStats ?? loadCohortStats();

  const features = featuresFromHistorical(input.prospect, input.advanced);
  const era = getEraBucket(input.prospect.draftYear);
  const posFam = getPositionFamily(input.prospect);
  if (!era) return null;

  const compInput: CompProspectInput = {
    id: input.prospect.id,
    name: input.prospect.name,
    features,
    archetypeKey: input.prospect.archetype ?? null,
    positionFamily: posFam,
    era,
  };

  return runPipeline(compInput, input.candidatePool, cohortStats, { wingspanInches: null });
}

// =============================================================================
// SHARED PIPELINE
// =============================================================================

interface PipelineExtras {
  wingspanInches: number | null;
}

function runPipeline(
  compInput: CompProspectInput,
  candidatePool: CompCandidate[],
  cohortStats: CohortStats,
  extras: PipelineExtras,
): ProspectScores {
  const axisConfigs  = loadAxisConfigs();
  const translateCfg = loadTranslateConfig();
  const projection   = loadTraitProjection();
  const gradeThresh  = loadGradeThresholds();

  // ---- Module 1: axes
  const archAnchors = getArchetypeAnchors(compInput.archetypeKey);
  const axes = computeAllAxisScores(
    {
      features: compInput.features,
      archetypeKey: compInput.archetypeKey,
      proseTags: [],
      positionFamily: compInput.positionFamily,
      era: compInput.era,
      age: compInput.features.age ?? null,
    },
    cohortStats, axisConfigs, translateCfg, archAnchors,
  );

  // ---- Module 1: traits
  const traits = projectAxesToTraits(axes, projection);

  // ---- Letter grades (per trait)
  const traitGrades = {} as Record<TraitKey, GradeResult>;
  for (const trait of TRAIT_KEYS) {
    const gr = assignLetterGrade(traits[trait].score, {
      dataMode: traits[trait].dataMode,
      positionFamily: compInput.positionFamily,
      metricKey: traitMetricKey(trait),
      thresholds: gradeThresh,
    });
    traitGrades[trait] = gr;
  }

  // ---- Module 2: comps
  const comps = findComps(compInput, candidatePool, cohortStats);

  // ---- Module 3: overall
  const overall = computeOverallScore({
    prospect: compInput,
    traitScores: traits,
    axisScores: axes,
    wingspanInches: extras.wingspanInches,
    candidatePool,
  }, cohortStats);

  // ---- Spotlight trait
  let spotlightTrait: ProspectScores["summary"]["spotlightTrait"] = null;
  let bestGradeIdx = -1;
  const gradeOrder: LetterGrade[] = ["A+", "A", "B", "C", "D"];
  let bestZ = -Infinity;
  for (const trait of TRAIT_KEYS) {
    const gr = traitGrades[trait];
    if (!gr.grade) continue;
    const idx = gradeOrder.indexOf(gr.grade);
    const z = traits[trait].scoreZ ?? -Infinity;
    if (idx >= 0 && (bestGradeIdx < 0 || idx < bestGradeIdx || (idx === bestGradeIdx && z > bestZ))) {
      bestGradeIdx = idx;
      bestZ = z;
      spotlightTrait = { trait, grade: gr.grade, score: traits[trait].score };
    }
  }

  // ---- Comp summaries
  const headlineComp = comps.headline ? {
    name: comps.headline.candidate.name,
    tier: comps.headline.candidate.outcomeTier,
    year: comps.headline.candidate.draftYear || null,
    similarity: comps.headline.similarity,
  } : null;
  const shadowComp = comps.shadow ? {
    name: comps.shadow.candidate.name,
    tier: comps.shadow.candidate.outcomeTier,
    year: comps.shadow.candidate.draftYear || null,
    similarity: comps.shadow.similarity,
  } : null;

  // ---- Aggregate dataMode (worst across modules)
  const modes: DataMode[] = [overall.dataMode, comps.dataMode];
  for (const t of Object.values(traits)) modes.push(t.dataMode);
  const severity: Record<DataMode, number> = { full: 0, partial: 1, scout_anchored: 2, blocked: 3 };
  const aggregateMode: DataMode = modes.reduce((worst, m) => severity[m] > severity[worst] ? m : worst, "full" as DataMode);

  return {
    prospectId: compInput.id,
    prospectName: compInput.name,
    axes,
    traits,
    traitGrades,
    overall,
    comps,
    summary: {
      overallDisplay: overall.display?.display ?? null,
      overallSigma: overall.displaySigma ?? null,
      spotlightTrait,
      headlineComp,
      shadowComp,
      dataMode: aggregateMode,
    },
  };
}

// =============================================================================
// AXIS-GRADE CONVENIENCE
// =============================================================================

export function gradeForAxis(scores: ProspectScores, axis: AxisKey): GradeResult {
  return assignLetterGrade(scores.axes.axes[axis].score, {
    dataMode: scores.axes.axes[axis].dataMode,
    positionFamily: getPositionFamilyFromScores(scores),
    thresholds: loadGradeThresholds(),
  });
}

function getPositionFamilyFromScores(scores: ProspectScores) {
  // Fallback to derived from comps prospect if axes don't carry it directly
  const fam = scores.comps.headline?.candidate.positionFamily;
  return fam ?? "wing"; // sensible default
}
