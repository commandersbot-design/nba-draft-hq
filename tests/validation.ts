/**
 * validation.ts — Module 6 fixture-based test suite.
 *
 * Runs assertions against the full pipeline (grading + comps + overall) on
 * a curated set of historical and active-class fixtures. Exits with status
 * code 1 if any assertion fails.
 *
 * Run with:  npx tsx tests/validation.ts
 *
 * Failure modes typically mean either (a) a regression in scoring logic, or
 * (b) the calibration JSON was rebuilt and shifted the absolute thresholds.
 * In case (b), update the fixture expected values.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import {
  loadCohortStats, getEraBucket, getPositionFamily, heightToInches,
} from "../src/grading/cohortStats";
import {
  featuresFromActive, featuresFromHistorical,
} from "../src/grading/featureExtractor";
import {
  computeAllAxisScores, loadAxisConfigs, loadTranslateConfig,
} from "../src/grading/axisScores";
import {
  projectAxesToTraits, loadTraitProjection,
} from "../src/grading/traitProjection";
import {
  assignLetterGrade, loadGradeThresholds,
} from "../src/grading/letterGrades";
import { getArchetypeAnchors } from "../src/grading/archetypeLookup";
import { computeOverallScore } from "../src/grading/overall";
import { findComps, type CompProspectInput } from "../src/comps/compEngine";
import { loadCandidatePool } from "../src/comps/candidatePool";

// =============================================================================
// PATHS + LOADERS
// =============================================================================

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local  = path.dirname(__filename_local);
const ROOT             = path.resolve(__dirname_local, "..");

function load(name: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "src", "data", name), "utf8"));
}

const prospects     = load("prospects.json");
const profileStats  = load("profileStats.json");
const extras        = load("prospectAdvancedExtras.json");
const aliases       = load("prospectAliases.json");
const historicals   = load("historicalProspects.json");
const histAdv       = load("historicalAdvancedStats.json");

const slug = (n: string) => String(n || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// =============================================================================
// TEST RUNNER
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, message: string): void {
  results.push({ name, passed: condition, message });
  const tag = condition ? "PASS" : "FAIL";
  const color = condition ? "\x1b[32m" : "\x1b[31m";
  console.log(`  ${color}${tag}\x1b[0m  ${name}${condition ? "" : " — " + message}`);
}

// =============================================================================
// PIPELINE HELPERS
// =============================================================================

const cohortStats   = loadCohortStats();
const axisConfigs   = loadAxisConfigs();
const translateCfg  = loadTranslateConfig();
const projection    = loadTraitProjection();
const gradeThresh   = loadGradeThresholds();
const pool          = loadCandidatePool();

interface PipelineOutput {
  input: CompProspectInput;
  traits: ReturnType<typeof projectAxesToTraits>;
  comps: ReturnType<typeof findComps>;
  overall: ReturnType<typeof computeOverallScore>;
}

function runActive(name: string): PipelineOutput | null {
  const p = prospects.find((x: { name?: string }) => x.name === name);
  if (!p) return null;
  const ps = profileStats[slug(name)];
  const ex = extras[slug(name)];
  const features = featuresFromActive(p, ps, ex);
  const era = getEraBucket(2026);
  const posFam = getPositionFamily(p);
  if (!era) return null;
  const input: CompProspectInput = {
    id: p.id, name: p.name, features,
    archetypeKey: p.archetype ?? null,
    positionFamily: posFam, era,
  };
  const archAnchors = getArchetypeAnchors(input.archetypeKey);
  const axes = computeAllAxisScores(
    { features, archetypeKey: input.archetypeKey, proseTags: [], positionFamily: posFam, era, age: features.age ?? null },
    cohortStats, axisConfigs, translateCfg, archAnchors,
  );
  const traits = projectAxesToTraits(axes, projection);
  const comps  = findComps(input, pool, cohortStats);
  const overall = computeOverallScore({
    prospect: input, traitScores: traits, axisScores: axes,
    wingspanInches: p.wingspan ? heightToInches(p.wingspan) : null,
    candidatePool: pool,
  }, cohortStats);
  return { input, traits, comps, overall };
}

function runHistorical(name: string): PipelineOutput | null {
  const p = historicals.find((x: { name?: string }) => x.name === name);
  if (!p) return null;
  const advBlock = histAdv[p.id];
  const features = featuresFromHistorical(p, advBlock);
  const era = getEraBucket(p.draftYear);
  const posFam = getPositionFamily(p);
  if (!era) return null;
  const input: CompProspectInput = {
    id: p.id, name: p.name, features,
    archetypeKey: p.archetype ?? null,
    positionFamily: posFam, era,
  };
  const archAnchors = getArchetypeAnchors(input.archetypeKey);
  const axes = computeAllAxisScores(
    { features, archetypeKey: input.archetypeKey, proseTags: [], positionFamily: posFam, era, age: features.age ?? null },
    cohortStats, axisConfigs, translateCfg, archAnchors,
  );
  const traits = projectAxesToTraits(axes, projection);
  // LOO pool — exclude self
  const looPool = pool.filter((c) => c.id !== input.id);
  const comps  = findComps(input, looPool, cohortStats);
  const overall = computeOverallScore({
    prospect: input, traitScores: traits, axisScores: axes,
    candidatePool: looPool,
  }, cohortStats);
  return { input, traits, comps, overall };
}

// =============================================================================
// ASSERTIONS
// =============================================================================

console.log("\n=== Module 6 · Fixture validation suite ===\n");

// ---------------------------------------------------------------------------
console.log("[Comp tier rationing]");

const aj = runActive("AJ Dybantsa");
assert(
  "AJ Dybantsa headline comp is NOT Legend (rare-elite gate)",
  aj != null && aj.comps.headline?.candidate.outcomeTier !== "Legend",
  `got: ${aj?.comps.headline?.candidate.name} (${aj?.comps.headline?.candidate.outcomeTier})`,
);
assert(
  "AJ Dybantsa headline comp is NOT Star (rare-elite gate)",
  aj != null && aj.comps.headline?.candidate.outcomeTier !== "Star",
  `got: ${aj?.comps.headline?.candidate.name} (${aj?.comps.headline?.candidate.outcomeTier})`,
);
assert(
  "AJ Dybantsa shadow comp exists",
  aj != null && aj.comps.shadow != null,
  `got: ${aj?.comps.shadow}`,
);

const trae = runHistorical("Trae Young");
assert(
  "Trae Young headline (LOO) is Legend or Star (rare-elite passes gate)",
  trae != null && (trae.comps.headline?.candidate.outcomeTier === "Legend" || trae.comps.headline?.candidate.outcomeTier === "Star"),
  `got: ${trae?.comps.headline?.candidate.name} (${trae?.comps.headline?.candidate.outcomeTier})`,
);

// ---------------------------------------------------------------------------
console.log("\n[Red flags]");

const plumlee = runHistorical("Mason Plumlee");
assert(
  "Mason Plumlee receives ageFlag (age 23.3, OBPM below median)",
  plumlee != null && plumlee.overall.breakdown.redFlags.some((f) => f.name === "ageFlag"),
  `got flags: ${plumlee?.overall.breakdown.redFlags.map((f) => f.name).join(", ") || "(none)"}`,
);

// ---------------------------------------------------------------------------
console.log("\n[Star-shape bonus]");

const boozer = runActive("Cameron Boozer");
assert(
  "Cameron Boozer receives star-shape bonus > 0 (elite production)",
  boozer != null && boozer.overall.breakdown.starBonus > 0,
  `got bonus: ${boozer?.overall.breakdown.starBonus}`,
);
assert(
  "Cameron Boozer's max trait z >= 1.5 (elite threshold)",
  boozer != null && boozer.overall.breakdown.maxTraitZ != null && boozer.overall.breakdown.maxTraitZ >= 1.5,
  `got maxTraitZ: ${boozer?.overall.breakdown.maxTraitZ}`,
);

// ---------------------------------------------------------------------------
console.log("\n[Score relative ordering]");

const tatum = runHistorical("Jayson Tatum");
assert(
  "Trae (LOO) overall score >= Tatum (LOO) overall score",
  trae != null && tatum != null && trae.overall.score != null && tatum.overall.score != null
    && trae.overall.score >= tatum.overall.score,
  `Trae=${trae?.overall.score}, Tatum=${tatum?.overall.score}`,
);
assert(
  "Trae (LOO) overall score > Plumlee (LOO) — Legend prospect outranks role-player",
  trae != null && plumlee != null && trae.overall.score != null && plumlee.overall.score != null
    && trae.overall.score > plumlee.overall.score,
  `Trae=${trae?.overall.score}, Plumlee=${plumlee?.overall.score}`,
);

// ---------------------------------------------------------------------------
console.log("\n[Aggregate over active class]");

const activeNames = (aliases.entries || [])
  .filter((e: { active?: boolean }) => e.active !== false)
  .map((e: { name: string }) => e.name);

let totalLegendCompsIssued = 0;
let prospectsWithLegend = 0;
for (const name of activeNames) {
  const out = runActive(name);
  if (!out || out.comps.dataMode === "scout_anchored") continue;
  const all = [out.comps.headline, out.comps.shadow, ...out.comps.body].filter((c): c is NonNullable<typeof c> => c != null);
  const legendCount = all.filter((c) => c.candidate.outcomeTier === "Legend").length;
  totalLegendCompsIssued += legendCount;
  if (legendCount > 0) prospectsWithLegend++;
}

assert(
  "Active class: ≤ 5 prospects receive any Legend comp (tier rationing)",
  prospectsWithLegend <= 5,
  `${prospectsWithLegend} of ${activeNames.length} prospects got Legend comps`,
);

// ---------------------------------------------------------------------------
console.log("\n[Letter grade distribution sanity]");

// On the historical pool, target distribution roughly 5/10/25/35/25 for A+/A/B/C/D
// Allow generous tolerance — this is a sanity check, not a tight calibration.
let aPlusCount = 0, aCount = 0, bCount = 0, cCount = 0, dCount = 0, total = 0;
for (const p of historicals) {
  const advBlock = histAdv[p.id];
  if (!advBlock?.cbbAdv) continue;
  const features = featuresFromHistorical(p, advBlock);
  const era = getEraBucket(p.draftYear);
  const posFam = getPositionFamily(p);
  if (!era) continue;
  const archAnchors = getArchetypeAnchors(p.archetype);
  const axes = computeAllAxisScores(
    { features, archetypeKey: p.archetype ?? null, proseTags: [], positionFamily: posFam, era, age: features.age ?? null },
    cohortStats, axisConfigs, translateCfg, archAnchors,
  );
  const traits = projectAxesToTraits(axes, projection);
  const sg = traits.ShootingGravity;
  const grade = assignLetterGrade(sg.score, { dataMode: sg.dataMode, positionFamily: posFam, thresholds: gradeThresh });
  if (grade.grade === "A+") aPlusCount++;
  else if (grade.grade === "A") aCount++;
  else if (grade.grade === "B") bCount++;
  else if (grade.grade === "C") cCount++;
  else if (grade.grade === "D") dCount++;
  if (grade.grade != null) total++;
}

if (total > 0) {
  const aPlus = aPlusCount / total;
  const a = aCount / total;
  const b = bCount / total;
  const c = cCount / total;
  const d = dCount / total;
  assert(
    `ShootingGravity grade dist: A+ in [0.005, 0.10] (got ${(aPlus * 100).toFixed(1)}%)`,
    aPlus >= 0.005 && aPlus <= 0.10,
    "out of band",
  );
  assert(
    `ShootingGravity grade dist: A in [0.02, 0.20] (got ${(a * 100).toFixed(1)}%)`,
    a >= 0.02 && a <= 0.20,
    "out of band",
  );
  assert(
    `ShootingGravity grade dist: B in [0.15, 0.50] (got ${(b * 100).toFixed(1)}%)`,
    b >= 0.15 && b <= 0.50,
    "out of band",
  );
  assert(
    `ShootingGravity grade dist: C+D in [0.30, 0.70] (got ${((c + d) * 100).toFixed(1)}%)`,
    (c + d) >= 0.30 && (c + d) <= 0.70,
    "out of band",
  );
}

// ---------------------------------------------------------------------------
console.log("\n[Confidence interval bounds]");

assert(
  "AJ Dybantsa overall sigma in [4, 12]",
  aj != null && aj.overall.scoreSigma != null && aj.overall.scoreSigma >= 4 && aj.overall.scoreSigma <= 12,
  `got: ${aj?.overall.scoreSigma}`,
);

// =============================================================================
// SUMMARY
// =============================================================================

console.log("\n=== SUMMARY ===");
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
console.log(`  ${passed}/${results.length} passed, ${failed} failed`);

if (failed > 0) {
  console.log("\nFailed tests:");
  for (const r of results.filter((r) => !r.passed)) {
    console.log(`  - ${r.name}: ${r.message}`);
  }
  process.exit(1);
}

console.log("");
process.exit(0);
