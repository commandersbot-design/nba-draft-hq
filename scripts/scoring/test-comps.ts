/**
 * test-comps.ts — exercise the comp engine on a few fixture prospects + report
 * aggregate stats over the active 2026 class to validate tier-rationing.
 *
 * Usage: npx tsx scripts/scoring/test-comps.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { loadCohortStats, getEraBucket, getPositionFamily, heightToInches } from "../../src/grading/cohortStats";
import { featuresFromActive, featuresFromHistorical } from "../../src/grading/featureExtractor";
import { loadCandidatePool } from "../../src/comps/candidatePool";
import { findComps, type CompProspectInput } from "../../src/comps/compEngine";
import { computeAllAxisScores, loadAxisConfigs, loadTranslateConfig } from "../../src/grading/axisScores";
import { projectAxesToTraits, loadTraitProjection } from "../../src/grading/traitProjection";
import { getArchetypeAnchors } from "../../src/grading/archetypeLookup";
import { computeOverallScore } from "../../src/grading/overall";

const __filename_local = fileURLToPath(import.meta.url);
const __dirname_local  = path.dirname(__filename_local);
const ROOT             = path.resolve(__dirname_local, "..", "..");

const PROS_PATH = path.join(ROOT, "src", "data", "prospects.json");
const PROFILE_PATH = path.join(ROOT, "src", "data", "profileStats.json");
const EXTRAS_PATH  = path.join(ROOT, "src", "data", "prospectAdvancedExtras.json");
const ALIASES_PATH = path.join(ROOT, "src", "data", "prospectAliases.json");
const HIST_PATH    = path.join(ROOT, "src", "data", "historicalProspects.json");
const HASS_PATH    = path.join(ROOT, "src", "data", "historicalAdvancedStats.json");

function slug(n: string) { return String(n||'').toLowerCase().replace(/[^a-z0-9]/g, ''); }

async function main() {
  console.log("=== COMP ENGINE TEST ===\n");
  const cohortStats = loadCohortStats();
  const pool        = loadCandidatePool();

  console.log(`Cohort calibration v${cohortStats.meta.version}; runtime calibration cells: ${
    cohortStats.axisRuntime ? Object.values(cohortStats.axisRuntime).reduce((s, m) => s + Object.keys(m||{}).length, 0) : 0
  }`);
  console.log(`Candidate pool: ${pool.length} historicals\n`);

  // ============================================================
  // FIXTURE 1: AJ Dybantsa
  // ============================================================
  const prospects = JSON.parse(fs.readFileSync(PROS_PATH, "utf8"));
  const profileStats = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
  const extras = JSON.parse(fs.readFileSync(EXTRAS_PATH, "utf8"));

  function activeProspectInput(name: string): CompProspectInput | null {
    const p = prospects.find((x: { name?: string }) => x.name === name);
    if (!p) return null;
    const slugKey = slug(name);
    const ps = profileStats[slugKey];
    const ex = extras[slugKey];
    const features = featuresFromActive(p, ps, ex);
    const era = getEraBucket(2026);
    const posFam = getPositionFamily(p);
    if (!era) return null;
    return {
      id: p.id,
      name: p.name,
      features,
      archetypeKey: p.archetype ?? null,
      positionFamily: posFam,
      era,
    };
  }

  const axisConfigs  = loadAxisConfigs();
  const translateCfg = loadTranslateConfig();
  const projection   = loadTraitProjection();

  const fixturesActive = ["AJ Dybantsa", "Cameron Boozer", "Darryn Peterson"];
  for (const name of fixturesActive) {
    console.log(`\n--- ${name} ---`);
    const input = activeProspectInput(name);
    if (!input) { console.log("  not in prospects.json"); continue; }

    // ---- Module 1: axes + traits (for star-shape + archetype red flag)
    const archAnchors = getArchetypeAnchors(input.archetypeKey);
    const axesOut = computeAllAxisScores(
      { features: input.features, archetypeKey: input.archetypeKey, proseTags: [], positionFamily: input.positionFamily, era: input.era, age: input.features.age ?? null },
      cohortStats, axisConfigs, translateCfg, archAnchors,
    );
    const traits = projectAxesToTraits(axesOut, projection);

    // ---- Module 2: comps
    const result = findComps(input, pool, cohortStats);
    console.log(`  dataMode: ${result.dataMode}`);
    console.log(`  candidates: ${result.candidatesConsidered} → top-${result.nnUsed}`);
    console.log(`  NN tier dist: L=${result.nnDistribution.counts.Legend} S=${result.nnDistribution.counts.Star} H=${result.nnDistribution.counts.Hit} Sw=${result.nnDistribution.counts.Swing} B=${result.nnDistribution.counts.Bust}`);
    console.log(`  rationing: ${result.rationing.reason}`);
    if (result.headline) console.log(`  HEADLINE: ${result.headline.candidate.name} (${result.headline.candidate.draftYear}, ${result.headline.candidate.outcomeTier ?? "?"}) sim=${result.headline.similarity?.toFixed(1)}%`);
    if (result.shadow)   console.log(`  SHADOW:   ${result.shadow.candidate.name} (${result.shadow.candidate.draftYear}, ${result.shadow.candidate.outcomeTier ?? "?"}) sim=${result.shadow.similarity?.toFixed(1)}%`);
    for (const b of result.body) console.log(`  body:     ${b.candidate.name} (${b.candidate.draftYear}, ${b.candidate.outcomeTier ?? "?"}) sim=${b.similarity?.toFixed(1)}%`);
    if (result.headline) {
      const top3 = result.headline.topMatches.slice(0, 3).map(m => `${m.feature}(Δ${m.diff.toFixed(2)})`).join(", ");
      console.log(`  why headline matches: ${top3}`);
      const div = result.headline.largestDivergence;
      if (div) console.log(`  largest divergence: ${div.feature} (${div.pZ.toFixed(2)}σ vs ${div.cZ.toFixed(2)}σ)`);
    }

    // ---- Module 3: overall composite
    const p = prospects.find((x: { name?: string }) => x.name === name);
    const wingspanIn = p?.wingspan ? heightToInches(p.wingspan) : null;
    const overall = computeOverallScore({
      prospect: input,
      traitScores: traits,
      axisScores: axesOut,
      wingspanInches: wingspanIn,
      candidatePool: pool,
    }, cohortStats);
    const dispRange = overall.displayRange ? `[${overall.displayRange[0].toFixed(0)}, ${overall.displayRange[1].toFixed(0)}]` : "n/a";
    console.log(`  OVERALL: raw=${overall.score} ± ${overall.scoreSigma}  range=[${overall.range?.[0].toFixed(0)}, ${overall.range?.[1].toFixed(0)}]`);
    console.log(`           DISPLAY=${overall.display?.display} ± ${overall.displaySigma}  range=${dispRange}  (p${overall.display?.percentile.toFixed(1)}, dataMode=${overall.dataMode})`);
    console.log(`    breakdown: E[outcome]=${overall.breakdown.eOutcome}  star=+${overall.breakdown.starBonus}  flags=${overall.breakdown.redFlagTotal}  σ_var=${overall.breakdown.sigmaFromOutcomeVariance}  σ_miss=${overall.breakdown.sigmaFromMissingData}`);
    if (overall.breakdown.redFlags.length) {
      for (const f of overall.breakdown.redFlags) console.log(`    flag: ${f.name} (${f.deduction}) — ${f.reason}`);
    }
  }

  // ============================================================
  // FIXTURE 2: A few historicals (LOO check)
  // ============================================================
  const hist = JSON.parse(fs.readFileSync(HIST_PATH, "utf8"));
  const adv  = JSON.parse(fs.readFileSync(HASS_PATH, "utf8"));

  function historicalProspectInput(name: string): CompProspectInput | null {
    const p = hist.find((x: { name?: string }) => x.name === name);
    if (!p) return null;
    const advBlock = adv[p.id];
    const features = featuresFromHistorical(p, advBlock);
    const era = getEraBucket(p.draftYear);
    const posFam = getPositionFamily(p);
    if (!era) return null;
    return {
      id: p.id,
      name: p.name,
      features,
      archetypeKey: p.archetype ?? null,
      positionFamily: posFam,
      era,
    };
  }

  const fixturesHistorical = ["LeBron James", "Stephen Curry", "Jayson Tatum", "Trae Young", "Hasheem Thabeet", "Mason Plumlee", "Tre Jones"];
  console.log("\n=== HISTORICAL LOO CHECK ===");
  for (const name of fixturesHistorical) {
    console.log(`\n--- ${name} ---`);
    const input = historicalProspectInput(name);
    if (!input) { console.log("  not found"); continue; }
    // Filter pool to exclude self — leave-one-out
    const looPool = pool.filter((c) => c.id !== input.id);
    const result = findComps(input, looPool, cohortStats);
    console.log(`  rationing: ${result.rationing.reason}`);
    if (result.headline) console.log(`  HEADLINE: ${result.headline.candidate.name} (${result.headline.candidate.draftYear}, outcome=${result.headline.candidate.outcomeTier})`);
    if (result.shadow)   console.log(`  SHADOW:   ${result.shadow.candidate.name} (${result.shadow.candidate.draftYear}, outcome=${result.shadow.candidate.outcomeTier})`);
    for (const b of result.body) console.log(`  body:     ${b.candidate.name} (outcome=${b.candidate.outcomeTier})`);

    // Compute overall for historicals (LOO)
    const archAnchors = getArchetypeAnchors(input.archetypeKey);
    const axesOut = computeAllAxisScores(
      { features: input.features, archetypeKey: input.archetypeKey, proseTags: [], positionFamily: input.positionFamily, era: input.era, age: input.features.age ?? null },
      cohortStats, axisConfigs, translateCfg, archAnchors,
    );
    const traits = projectAxesToTraits(axesOut, projection);
    const overall = computeOverallScore({
      prospect: input,
      traitScores: traits,
      axisScores: axesOut,
      candidatePool: looPool,
    }, cohortStats);
    console.log(`  OVERALL (LOO): ${overall.score} ± ${overall.scoreSigma}  range=[${overall.range?.[0].toFixed(0)}, ${overall.range?.[1].toFixed(0)}]`);
    console.log(`    breakdown: E[outcome]=${overall.breakdown.eOutcome}  star=+${overall.breakdown.starBonus}  flags=${overall.breakdown.redFlagTotal}`);
    if (overall.breakdown.redFlags.length) {
      for (const f of overall.breakdown.redFlags) console.log(`    flag: ${f.name} ${f.deduction} — ${f.reason}`);
    }
  }

  // ============================================================
  // AGGREGATE: full active class — count Legend/Star comps issued
  // ============================================================
  const aliases = JSON.parse(fs.readFileSync(ALIASES_PATH, "utf8"));
  const activeNames = (aliases.entries || []).filter((e: { active?: boolean }) => e.active !== false).map((e: { name: string }) => e.name);

  console.log("\n=== AGGREGATE OVER ACTIVE CLASS ===");
  let totalLegendComps = 0;
  let totalStarComps   = 0;
  let prospectsWithLegend = 0;
  let prospectsWithStar   = 0;
  let scoutAnchored       = 0;
  let processed           = 0;

  for (const name of activeNames) {
    const input = activeProspectInput(name);
    if (!input) continue;
    processed++;
    const result = findComps(input, pool, cohortStats);
    if (result.dataMode === "scout_anchored") { scoutAnchored++; continue; }
    const allComps = [result.headline, result.shadow, ...result.body].filter((c): c is NonNullable<typeof c> => c != null);
    const legendCount = allComps.filter((c) => c.candidate.outcomeTier === "Legend").length;
    const starCount   = allComps.filter((c) => c.candidate.outcomeTier === "Star").length;
    totalLegendComps += legendCount;
    totalStarComps   += starCount;
    if (legendCount > 0) prospectsWithLegend++;
    if (starCount > 0)   prospectsWithStar++;
  }
  console.log(`  Active prospects processed: ${processed} (${scoutAnchored} scout-anchored)`);
  console.log(`  Prospects receiving any Legend comp: ${prospectsWithLegend} (target: ≤ 5 of 60)`);
  console.log(`  Prospects receiving any Star comp:   ${prospectsWithStar}`);
  console.log(`  Total Legend comps issued: ${totalLegendComps}`);
  console.log(`  Total Star   comps issued: ${totalStarComps}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
