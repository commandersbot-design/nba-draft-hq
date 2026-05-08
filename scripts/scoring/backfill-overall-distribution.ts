/**
 * backfill-overall-distribution.ts
 *
 * Runs the full grading + comp + overall pipeline on every historical with
 * cbbAdv, collects the resulting overall scores, and writes a sorted
 * distribution to src/data/overallScoreDistribution.json.
 *
 * That distribution drives the percentile-based UI rescaling layer:
 *   display = percentile rank of raw score within historical distribution.
 *
 * After this runs, scoreRescale.rescaleOverallScore() can map any raw
 * overall (e.g., 60.9 for Trae LOO) to a display score (e.g., 92 — the
 * 92nd percentile within the historical pool).
 *
 * Run with:  npx tsx scripts/scoring/backfill-overall-distribution.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { loadCohortStats, getEraBucket, getPositionFamily } from "../../src/grading/cohortStats";
import { featuresFromHistorical } from "../../src/grading/featureExtractor";
import { computeAllAxisScores, loadAxisConfigs, loadTranslateConfig } from "../../src/grading/axisScores";
import { projectAxesToTraits, loadTraitProjection } from "../../src/grading/traitProjection";
import { getArchetypeAnchors } from "../../src/grading/archetypeLookup";
import { computeOverallScore } from "../../src/grading/overall";
import { loadCandidatePool } from "../../src/comps/candidatePool";
import type { PositionFamily } from "../../src/grading/cohortStats";

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local  = path.dirname(__filename_local);
const ROOT             = path.resolve(__dirname_local, "..", "..");
const HIST_PATH        = path.join(ROOT, "src", "data", "historicalProspects.json");
const HASS_PATH        = path.join(ROOT, "src", "data", "historicalAdvancedStats.json");
const OUT_PATH         = path.join(ROOT, "src", "data", "overallScoreDistribution.json");

function r1(n: number): number { return Math.round(n * 10) / 10; }

async function main() {
  console.log("=== BUILD OVERALL SCORE DISTRIBUTION ===\n");

  const cohortStats = loadCohortStats();
  const axisConfigs = loadAxisConfigs();
  const translateCfg = loadTranslateConfig();
  const projection = loadTraitProjection();
  const pool = loadCandidatePool();

  const historicals = JSON.parse(fs.readFileSync(HIST_PATH, "utf8"));
  const adv         = JSON.parse(fs.readFileSync(HASS_PATH, "utf8"));

  console.log(`Loaded ${historicals.length} historicals, ${pool.length} in candidate pool`);

  const allScores: number[] = [];
  const byPosFam: Record<PositionFamily, number[]> = { guard: [], wing: [], big: [] };

  let processed = 0, scored = 0, skipped = 0;
  for (const p of historicals) {
    processed++;
    const advBlock = adv[p.id];
    if (!advBlock?.cbbAdv) { skipped++; continue; }
    const features = featuresFromHistorical(p, advBlock);
    const era = getEraBucket(p.draftYear);
    const posFam = getPositionFamily(p);
    if (!era) { skipped++; continue; }

    const archAnchors = getArchetypeAnchors(p.archetype);
    const axes = computeAllAxisScores(
      { features, archetypeKey: p.archetype ?? null, proseTags: [], positionFamily: posFam, era, age: features.age ?? null },
      cohortStats, axisConfigs, translateCfg, archAnchors,
    );
    const traits = projectAxesToTraits(axes, projection);

    // LOO pool — exclude self so scores aren't biased toward self-similarity
    const looPool = pool.filter((c) => c.id !== p.id);
    const overall = computeOverallScore({
      prospect: { id: p.id, name: p.name, features, archetypeKey: p.archetype ?? null, positionFamily: posFam, era },
      traitScores: traits,
      axisScores: axes,
      candidatePool: looPool,
    }, cohortStats);

    if (overall.score == null) { skipped++; continue; }
    allScores.push(overall.score);
    byPosFam[posFam].push(overall.score);
    scored++;
  }

  console.log(`  ${processed} processed, ${scored} scored, ${skipped} skipped (no NCAA data)`);

  // Sort + report
  allScores.sort((a, b) => a - b);
  byPosFam.guard.sort((a, b) => a - b);
  byPosFam.wing.sort((a, b) => a - b);
  byPosFam.big.sort((a, b) => a - b);

  const pct = (xs: number[], p: number) => xs.length === 0 ? null : xs[Math.min(xs.length - 1, Math.floor(xs.length * p))];

  console.log("\n  Pooled distribution:");
  console.log(`    n=${allScores.length}`);
  console.log(`    p10=${r1(pct(allScores, 0.10) ?? 0)}  p25=${r1(pct(allScores, 0.25) ?? 0)}  p50=${r1(pct(allScores, 0.50) ?? 0)}  p75=${r1(pct(allScores, 0.75) ?? 0)}  p90=${r1(pct(allScores, 0.90) ?? 0)}  p95=${r1(pct(allScores, 0.95) ?? 0)}  p99=${r1(pct(allScores, 0.99) ?? 0)}`);
  console.log(`    min=${r1(allScores[0])}  max=${r1(allScores[allScores.length - 1])}`);

  console.log("\n  By position family:");
  for (const posFam of ["guard", "wing", "big"] as PositionFamily[]) {
    const xs = byPosFam[posFam];
    console.log(`    ${posFam.padEnd(6)} n=${String(xs.length).padStart(4)}  p50=${r1(pct(xs, 0.5) ?? 0)}  p90=${r1(pct(xs, 0.9) ?? 0)}  p99=${r1(pct(xs, 0.99) ?? 0)}`);
  }

  // Write output
  const out = {
    _meta: {
      generatedAt: new Date().toISOString(),
      generatedBy: "scripts/scoring/backfill-overall-distribution.ts",
      historicalsScored: scored,
      calibrationVersion: cohortStats.meta.version,
    },
    pooled: { sortedScores: allScores, n: allScores.length },
    byPositionFamily: {
      guard: { sortedScores: byPosFam.guard, n: byPosFam.guard.length },
      wing:  { sortedScores: byPosFam.wing,  n: byPosFam.wing.length  },
      big:   { sortedScores: byPosFam.big,   n: byPosFam.big.length   },
    },
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${OUT_PATH} (${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
