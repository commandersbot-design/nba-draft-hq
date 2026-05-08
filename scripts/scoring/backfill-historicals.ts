/**
 * backfill-historicals.ts
 *
 * Two-pass execution:
 *   PASS 1 — Run the Module 1 pipeline against every historical with cbbAdv,
 *            using NO axis-runtime calibration. Collect raw composite-z values
 *            per (axis, posFam). Compute empirical mean + std per cell. This
 *            becomes the runtime calibration that normalizes axis scores so
 *            std ≈ 15 and mean ≈ 50 in the target distribution.
 *
 *   PASS 2 — Inject the just-computed calibration into the cohortStats object,
 *            re-run the pipeline. The resulting scores ARE the calibrated
 *            outputs. Build the cohort-percentile distributions from these.
 *
 * Outputs:
 *   - Updates src/data/scoringCalibration.json with the new
 *     `axisRuntimeCalibration` block (so the browser runtime gets it)
 *   - Writes src/data/historicalScoreDistributions.json (cohort gate input)
 *
 * Run with:  npx tsx scripts/scoring/backfill-historicals.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import {
  loadCohortStats,
  clearCohortCache,
  getEraBucket,
  getPositionFamily,
  type PositionFamily,
  type AxisRuntimeCalibration,
  type AxisRuntimeStats,
  type CohortStats,
} from "../../src/grading/cohortStats";

import {
  computeAllAxisScores,
  loadAxisConfigs,
  loadTranslateConfig,
  AXIS_KEYS,
  type AxisKey,
  type AxisInputs,
} from "../../src/grading/axisScores";

import {
  projectAxesToTraits,
  loadTraitProjection,
  TRAIT_KEYS,
  type TraitKey,
} from "../../src/grading/traitProjection";

import {
  assignLetterGrade,
  loadGradeThresholds,
  traitMetricKey,
  axisMetricKey,
  type LetterGrade,
} from "../../src/grading/letterGrades";

import {
  featuresFromHistorical,
  type HistoricalProspectRecord,
  type HistoricalAdvancedRecord,
} from "../../src/grading/featureExtractor";

import { getArchetypeAnchors } from "../../src/grading/archetypeLookup";

// =============================================================================
// PATHS
// =============================================================================

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local  = path.dirname(__filename_local);
const ROOT       = path.resolve(__dirname_local, "..", "..");
const HIST_PATH  = path.join(ROOT, "src", "data", "historicalProspects.json");
const HASS_PATH  = path.join(ROOT, "src", "data", "historicalAdvancedStats.json");
const CALIB_PATH = path.join(ROOT, "src", "data", "scoringCalibration.json");
const OUT_PATH   = path.join(ROOT, "src", "data", "historicalScoreDistributions.json");

const POS_FAMS: PositionFamily[] = ["guard", "wing", "big"];
const TRANSLATE_AXIS = "translate";

// =============================================================================
// HELPERS
// =============================================================================

function meanStd(xs: number[]): { mean: number; std: number; n: number } {
  if (xs.length === 0) return { mean: 0, std: 0, n: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  if (xs.length === 1) return { mean, std: 0, n: 1 };
  const v = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1);
  return { mean, std: Math.sqrt(v), n: xs.length };
}

function r2(n: number): number { return Math.round(n * 100) / 100; }

interface PerProspectResult {
  id: string;
  name: string;
  posFam: PositionFamily;
  era: string;
  outcomeTier: string | null;
  axisScoreZ: Partial<Record<AxisKey | "translate", number | null>>;  // RAW combined_z, pre-calibration
  axisScores: Partial<Record<AxisKey | "translate", number | null>>;
  axisDataModes: Partial<Record<AxisKey | "translate", string>>;
  traitScores: Partial<Record<TraitKey, number | null>>;
  traitGrades: Partial<Record<TraitKey, LetterGrade | null>>;
  hadAnchor: boolean;
}

interface PassResult {
  results: PerProspectResult[];
  withCbb: number;
  anchorsFound: number;
  anchorsMissing: number;
  missingArchetypes: Map<string, number>;
  dataModeCounts: Record<string, number>;
}

// =============================================================================
// PIPELINE PASS
// =============================================================================

function runPipeline(
  historicals: HistoricalProspectRecord[],
  adv: Record<string, HistoricalAdvancedRecord>,
  cohortStats: CohortStats,
): PassResult {
  const axisConfigs   = loadAxisConfigs();
  const translateCfg  = loadTranslateConfig();
  const projection    = loadTraitProjection();
  const gradeThresh   = loadGradeThresholds();

  const results: PerProspectResult[] = [];
  let withCbb = 0, anchorsFound = 0, anchorsMissing = 0;
  const missingArchetypes = new Map<string, number>();
  const dataModeCounts: Record<string, number> = { full: 0, partial: 0, scout_anchored: 0, blocked: 0 };

  for (const p of historicals) {
    const advBlock = adv[p.id];
    if (!advBlock?.cbbAdv) continue;
    withCbb++;

    const features = featuresFromHistorical(p, advBlock);
    const era = getEraBucket(p.draftYear);
    const posFam = getPositionFamily(p);
    if (!era) continue;

    const archetypeAnchors = getArchetypeAnchors(p.archetype);
    if (archetypeAnchors) anchorsFound++;
    else {
      anchorsMissing++;
      if (p.archetype) {
        missingArchetypes.set(p.archetype, (missingArchetypes.get(p.archetype) ?? 0) + 1);
      }
    }

    const inputs: AxisInputs = {
      features,
      archetypeKey: p.archetype ?? null,
      proseTags: [],
      positionFamily: posFam,
      era,
      age: features.age ?? null,
    };

    const axesOut = computeAllAxisScores(inputs, cohortStats, axisConfigs, translateCfg, archetypeAnchors);
    const traits = projectAxesToTraits(axesOut, projection);

    dataModeCounts[axesOut.translate.dataMode] = (dataModeCounts[axesOut.translate.dataMode] ?? 0) + 1;

    const axisScoreZ: PerProspectResult["axisScoreZ"] = {};
    const axisScores: PerProspectResult["axisScores"] = {};
    const axisDataModes: PerProspectResult["axisDataModes"] = {};
    for (const ax of AXIS_KEYS) {
      axisScoreZ[ax]    = axesOut.axes[ax].scoreZ;
      axisScores[ax]    = axesOut.axes[ax].score;
      axisDataModes[ax] = axesOut.axes[ax].dataMode;
    }
    axisScoreZ[TRANSLATE_AXIS]    = axesOut.translate.scoreZ;
    axisScores[TRANSLATE_AXIS]    = axesOut.translate.score;
    axisDataModes[TRANSLATE_AXIS] = axesOut.translate.dataMode;

    const traitScores: PerProspectResult["traitScores"] = {};
    const traitGrades: PerProspectResult["traitGrades"] = {};
    for (const t of TRAIT_KEYS) {
      traitScores[t] = traits[t].score;
      const gr = assignLetterGrade(traits[t].score, {
        dataMode: traits[t].dataMode,
        positionFamily: posFam,
        thresholds: gradeThresh,
      });
      traitGrades[t] = gr.grade;
    }

    results.push({
      id: p.id, name: p.name, posFam, era,
      outcomeTier: p.outcomeTier ?? null,
      axisScoreZ, axisScores, axisDataModes,
      traitScores, traitGrades,
      hadAnchor: archetypeAnchors != null,
    });
  }

  return { results, withCbb, anchorsFound, anchorsMissing, missingArchetypes, dataModeCounts };
}

// =============================================================================
// CALIBRATION BUILDER
// =============================================================================

/**
 * From pass-1 results, compute empirical (mean, std) of raw composite-z per
 * (axis, posFam). We use the FULL pool (not era-bucketed) because the spec's
 * z-scoring is era-bucketed at the FEATURE level — by the time we have a
 * combined axis-z, era effects should already be normalized away. Bucketing
 * again would over-correct.
 *
 * Minimum cell n = 30 to trust the std estimate. Cells below are dropped
 * and the runtime falls back to raw 50+15·z mapping for those (axis, posFam)
 * combos. Only matters for low-population cells.
 */
function buildAxisRuntimeCalibration(results: PerProspectResult[]): AxisRuntimeCalibration {
  const MIN_N = 30;
  const cal: AxisRuntimeCalibration = {};

  const axisKeys: (AxisKey | "translate")[] = [...AXIS_KEYS, "translate"];
  for (const axis of axisKeys) {
    cal[axis] = {};
    for (const posFam of POS_FAMS) {
      const zs: number[] = [];
      for (const r of results) {
        if (r.posFam !== posFam) continue;
        const z = r.axisScoreZ[axis];
        if (z == null || !Number.isFinite(z)) continue;
        zs.push(z);
      }
      const stats = meanStd(zs);
      if (stats.n < MIN_N) continue;
      const entry: AxisRuntimeStats = {
        axis, posFam,
        zMean: stats.mean,
        zStd: stats.std,
        n: stats.n,
      };
      cal[axis]![posFam] = entry;
    }
  }
  return cal;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("=== BACKFILL · Module 1 historical pipeline (two-pass) ===\n");
  const historicals = JSON.parse(fs.readFileSync(HIST_PATH, "utf8")) as HistoricalProspectRecord[];
  const adv         = JSON.parse(fs.readFileSync(HASS_PATH, "utf8")) as Record<string, HistoricalAdvancedRecord>;

  // -------- Load + force-clear axisRuntime so PASS 1 runs unscaled --------
  clearCohortCache();
  const cohortStats = loadCohortStats();
  const savedAxisRuntime = cohortStats.axisRuntime;
  cohortStats.axisRuntime = null;

  console.log(`Loaded calibration v${cohortStats.meta.version}, ${cohortStats.meta.poolSize} historical pool`);
  console.log(`Loaded ${historicals.length} historical prospects, ${Object.keys(adv).length} advanced stat blocks\n`);

  // ===================================================================
  // PASS 1 — measure raw composite-z stats
  // ===================================================================
  console.log("PASS 1 — running pipeline with NO axis-runtime calibration...");
  const pass1 = runPipeline(historicals, adv, cohortStats);
  console.log(`  Processed: ${pass1.withCbb} (anchors: ${pass1.anchorsFound}/${pass1.withCbb} = ${(100 * pass1.anchorsFound / pass1.withCbb).toFixed(1)}%)`);

  // -------- Show raw composite-z stats per (axis, posFam) --------
  console.log("\n  Raw composite-z stats (target: built-in N(0,1) approximately):");
  for (const ax of [...AXIS_KEYS, "translate"] as (AxisKey | "translate")[]) {
    for (const posFam of POS_FAMS) {
      const zs = pass1.results
        .filter((r) => r.posFam === posFam)
        .map((r) => r.axisScoreZ[ax])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      const { mean, std, n } = meanStd(zs);
      if (n === 0) continue;
      console.log(`    ${String(ax).padEnd(11)} ${posFam.padEnd(6)} n=${String(n).padStart(4)}  zMean=${r2(mean).toString().padStart(6)}  zStd=${r2(std).toString().padStart(6)}`);
    }
  }

  // -------- Build runtime calibration --------
  console.log("\nBuilding AxisRuntimeCalibration from pass-1 distribution...");
  const axisRuntimeCalibration = buildAxisRuntimeCalibration(pass1.results);
  let cellsBuilt = 0;
  for (const ax of Object.keys(axisRuntimeCalibration)) {
    cellsBuilt += Object.keys(axisRuntimeCalibration[ax]!).length;
  }
  console.log(`  ${cellsBuilt} (axis, posFam) cells calibrated`);

  // ===================================================================
  // PASS 2 — re-run with calibration applied
  // ===================================================================
  console.log("\nPASS 2 — re-running pipeline with empirical slope calibration applied...");
  cohortStats.axisRuntime = axisRuntimeCalibration;
  const pass2 = runPipeline(historicals, adv, cohortStats);
  console.log(`  Processed: ${pass2.withCbb}`);
  console.log("  Translate dataMode distribution:");
  for (const k of ["full", "partial", "scout_anchored", "blocked"]) {
    const n = pass2.dataModeCounts[k] ?? 0;
    console.log(`    ${k.padEnd(16)} ${n} (${(100 * n / pass2.results.length).toFixed(1)}%)`);
  }

  // ---------------- DISTRIBUTION VALIDATION ----------------
  console.log("\n=== Trait score distributions (target: mean ≈ 50, std ≈ 15) ===");
  for (const trait of TRAIT_KEYS) {
    for (const posFam of POS_FAMS) {
      const xs = pass2.results
        .filter((r) => r.posFam === posFam)
        .map((r) => r.traitScores[trait])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      const { mean, std, n } = meanStd(xs);
      const tag = (Math.abs(mean - 50) > 6 || std < 12 || std > 18) ? "⚠ " : "✓ ";
      console.log(
        `  ${tag}${trait.padEnd(22)} ${posFam.padEnd(6)} n=${String(n).padStart(4)}  ` +
        `mean=${r2(mean).toString().padStart(5)}  std=${r2(std).toString().padStart(5)}`
      );
    }
  }

  console.log("\n=== Letter-grade distribution per trait (target ~5/10/25/35/25 A+/A/B/C/D) ===");
  const gradeOrder: LetterGrade[] = ["A+", "A", "B", "C", "D"];
  for (const trait of TRAIT_KEYS) {
    const counts: Record<LetterGrade | "null", number> = { "A+": 0, "A": 0, "B": 0, "C": 0, "D": 0, "null": 0 };
    for (const r of pass2.results) {
      const g = r.traitGrades[trait];
      if (g == null) counts.null++;
      else counts[g]++;
    }
    const total = pass2.results.length;
    const pct = (n: number) => `${((100 * n) / total).toFixed(1)}%`;
    console.log(
      `  ${trait.padEnd(22)} ` +
      gradeOrder.map((g) => `${g}=${pct(counts[g])}`).join("  ") +
      `  null=${pct(counts.null)}`
    );
  }

  // ---------------- BUILD DISTRIBUTION OUTPUT ----------------
  const distributions: Record<string, Partial<Record<PositionFamily, { posFam: PositionFamily; metric: string; sortedScores: number[]; n: number; generatedAt: string }>>> = {};

  function addMetric(metric: string, posFam: PositionFamily, value: number | null | undefined) {
    if (value == null || !Number.isFinite(value)) return;
    if (!distributions[metric]) distributions[metric] = {};
    if (!distributions[metric][posFam]) {
      distributions[metric][posFam] = {
        posFam, metric, sortedScores: [], n: 0,
        generatedAt: new Date().toISOString(),
      };
    }
    distributions[metric][posFam]!.sortedScores.push(value);
  }

  for (const r of pass2.results) {
    for (const trait of TRAIT_KEYS) addMetric(traitMetricKey(trait), r.posFam, r.traitScores[trait]);
    for (const ax of AXIS_KEYS) addMetric(axisMetricKey(ax), r.posFam, r.axisScores[ax]);
  }
  for (const metric of Object.keys(distributions)) {
    for (const posFam of Object.keys(distributions[metric]) as PositionFamily[]) {
      const entry = distributions[metric][posFam]!;
      entry.sortedScores.sort((a, b) => a - b);
      entry.n = entry.sortedScores.length;
    }
  }

  // ---------------- WRITE OUTPUTS ----------------
  // (1) Append axisRuntimeCalibration into scoringCalibration.json
  const calibJson = JSON.parse(fs.readFileSync(CALIB_PATH, "utf8"));
  calibJson.axisRuntimeCalibration = axisRuntimeCalibration;
  if (calibJson._meta) {
    calibJson._meta.lastBackfilledAt = new Date().toISOString();
    calibJson._meta.axisRuntimeCalibrationCells = cellsBuilt;
  }
  fs.writeFileSync(CALIB_PATH, JSON.stringify(calibJson, null, 2) + "\n");
  console.log(`\nUpdated ${CALIB_PATH}`);
  console.log(`  Added axisRuntimeCalibration: ${cellsBuilt} cells`);

  // (2) Write historicalScoreDistributions.json
  const out = {
    _meta: {
      generatedAt: new Date().toISOString(),
      generatedBy: "scripts/scoring/backfill-historicals.ts (two-pass)",
      historicalsProcessed: pass2.withCbb,
      historicalsScored: pass2.results.length,
      anchorsFound: pass2.anchorsFound, anchorsMissing: pass2.anchorsMissing,
      calibrationVersion: cohortStats.meta.version,
      axisRuntimeCalibrationCells: cellsBuilt,
    },
    distributions,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${OUT_PATH} (${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB)`);

  // Restore for any subsequent cache reads (unused — script ends here, but defensive)
  cohortStats.axisRuntime = savedAxisRuntime;
}

main().catch((err) => { console.error(err); process.exit(1); });
