#!/usr/bin/env node
// Calibration pipeline — Phase 1 foundation.
//
// What it does:
//   1. Loads historicalProspects.json + historicalAdvancedStats.json
//   2. Derives proper era buckets from draftYear (overriding the existing
//      coarse "Earlier" field that swallows 93% of the pool)
//   3. Extracts the 16-feature vector for every historical with cbbAdv
//   4. Partitions by (positionFamily × eraBucket) — 12 cells
//   5. Computes per-cell μ, σ for each feature (z-score normalizers)
//   6. Computes per-positionFamily cohort percentile thresholds for
//      letter-grade dual-gate (top 5% / 15% / 40% / 75%)
//   7. Writes src/data/scoringCalibration.json + diagnostics
//
// Phase 1b will add:
//   - Per-trait L2 ridge regression coefficients (8 traits × 3 posFam)
//   - Global logistic regression weights for comp distance
//   - Outcome-tier base rates per cell for k-NN baseline
//
// Usage:
//   node scripts/scoring/calibrate.js
//
// Output:
//   src/data/scoringCalibration.json (committed; runtime-loaded)

const fs = require("fs");
const path = require("path");
const { ridgeFit, logisticFit } = require("./regression.js");

const ROOT       = path.join(__dirname, "..", "..");
const HIST_PATH  = path.join(ROOT, "src", "data", "historicalProspects.json");
const HASS_PATH  = path.join(ROOT, "src", "data", "historicalAdvancedStats.json");
const OUT_PATH   = path.join(ROOT, "src", "data", "scoringCalibration.json");

// Per-trait contributor features. Only includes fields reliably present in
// the historical cbbAdv pool — fields like ftr and wingspan that historicals
// lack are dropped here and only used at runtime for active prospects.
//
// Within each trait, ridge regression learns the weights from outcome labels.
// The resulting coefficients tell us how each contributor SHOULD weigh
// inside the trait composite.
const TRAIT_CONTRIBUTORS = {
  AdvantageCreation:    ["usgPct", "obpm", "bpm", "age"],
  DecisionMaking:       ["astPct", "tovPct", "obpm", "bpm"],
  PassingCreation:      ["astPct", "obpm", "bpm", "usgPct"],
  ShootingGravity:      ["tsPct", "efgPct", "threePAr"],
  OffBallValue:         ["tsPct", "orbPct", "blkPct"],
  ProcessingSpeed:      ["stlPct", "dbpm", "bpm"],
  Scalability:          ["tovPct", "age", "heightIn"],
  DefensiveVersatility: ["dbpm", "blkPct", "stlPct", "heightIn"],
};

// Outcome score for the regression target. Maps outcomeTier label → 0-100.
// Spread is intentionally wide (Legend=100, Bust=20) to give the regression
// signal to fit against. Coefficient interpretation: a +1σ change in feature
// f is associated with a coefficient-units change in expected outcome score.
const OUTCOME_SCORE = {
  Legend: 100, Star: 80, Hit: 60, Swing: 40, Bust: 20,
};

// ---- Inline copies of the normalize/featureMap functions ------------------
// We could import the ESM modules via dynamic import, but for a build-time
// CJS script staying in one file is simpler. Keep these in sync with
// src/lib/scoring/normalize.js and src/lib/scoring/featureMap.js.

function eraBucketFromYear(year) {
  const y = Number(year);
  if (!Number.isFinite(y)) return null;
  if (y <= 2009) return "PRE_SPACING";
  if (y <= 2014) return "TRANSITIONAL";
  if (y <= 2019) return "SPACING";
  return "MODERN";
}

function positionFamily(p) {
  const fam = p.positionFamily || p.archetypeFamily;
  if (fam) return String(fam).toLowerCase();
  const pos = String(p.position || "").toUpperCase();
  if (/PG|SG/.test(pos) && !/PF|SF/.test(pos)) return "guard";
  if (/SF|PF/.test(pos)) return "wing";
  if (/^C$|\bC\b/.test(pos)) return "big";
  return "wing";
}

function heightToInches(s) {
  if (s == null) return null;
  const str = String(s).trim();
  if (/^\d{2,3}$/.test(str)) {
    const n = Number(str);
    return n >= 60 && n <= 90 ? n : null;
  }
  const m = str.match(/^(\d)[\-'](\d{1,2})/);
  if (!m) return null;
  return Number(m[1]) * 12 + Number(m[2]);
}

function toPctScale(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    const m = v.match(/(-?\d+\.?\d*)/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n) < 2 ? n * 100 : n;
}

function toNum(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function meanStd(values) {
  const xs = values.filter((v) => v != null && Number.isFinite(v));
  if (xs.length === 0) return { mean: null, std: null, n: 0 };
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  if (xs.length === 1) return { mean, std: 0, n: 1 };
  const v = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1);
  return { mean, std: Math.sqrt(v), n: xs.length };
}

function quantile(sortedArr, q) {
  if (!sortedArr || sortedArr.length === 0) return null;
  if (q <= 0) return sortedArr[0];
  if (q >= 1) return sortedArr[sortedArr.length - 1];
  const idx = q * (sortedArr.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sortedArr[lo];
  return sortedArr[lo] * (1 - (idx - lo)) + sortedArr[hi] * (idx - lo);
}

const FEATURE_KEYS = [
  "tsPct", "efgPct", "usgPct", "astPct", "tovPct",
  "stlPct", "blkPct", "orbPct", "drbPct",
  "bpm", "obpm", "dbpm", "per", "threePAr",
  "age", "heightIn",
];

function featuresFromHistorical(p, advBlock) {
  const cbb = advBlock?.cbbAdv || {};
  return {
    tsPct:    toPctScale(cbb.tsPct ?? p.trueShooting),
    efgPct:   toPctScale(cbb.efgPct),
    usgPct:   toNum(cbb.usgPct),
    astPct:   toNum(cbb.astPct),
    tovPct:   toNum(cbb.tovPct),
    stlPct:   toNum(cbb.stlPct),
    blkPct:   toNum(cbb.blkPct),
    orbPct:   toNum(cbb.orbPct),
    drbPct:   toNum(cbb.drbPct),
    bpm:      toNum(cbb.bpm ?? p.bpm),
    obpm:     toNum(cbb.obpm),
    dbpm:     toNum(cbb.dbpm),
    per:      toNum(cbb.per),
    threePAr: toNum(cbb.threePAr),
    age:      toNum(p.age),
    heightIn: heightToInches(p.height),
  };
}

// ---- MAIN -----------------------------------------------------------------

function main() {
  const historicals = JSON.parse(fs.readFileSync(HIST_PATH, "utf8"));
  const adv         = JSON.parse(fs.readFileSync(HASS_PATH, "utf8"));

  console.log("=== CALIBRATION · Phase 1 Foundation ===");
  console.log("");

  // Step 1: enrich each historical with derived era + posFam + feature vector
  const enriched = [];
  let withCbb = 0, withMinimal = 0;
  for (const p of historicals) {
    const advBlock = adv[p.id];
    if (!advBlock?.cbbAdv) continue;
    withCbb++;
    const features = featuresFromHistorical(p, advBlock);
    const era = eraBucketFromYear(p.draftYear);
    const posFam = positionFamily(p);
    if (!era || !posFam) continue;
    enriched.push({
      id: p.id,
      name: p.name,
      draftYear: p.draftYear,
      outcomeTier: p.outcomeTier,
      archetype: p.archetype,
      era, posFam, features,
    });
    // Minimal-feature gate (matches hasMinimumFeatures())
    const required = ["tsPct", "usgPct", "bpm", "obpm", "dbpm", "age", "heightIn"];
    const ok = required.every((k) => features[k] != null && Number.isFinite(features[k]));
    if (ok) withMinimal++;
  }
  console.log(`Loaded ${historicals.length} historicals; ${withCbb} have cbbAdv;`);
  console.log(`  ${enriched.length} enriched with era + posFam;`);
  console.log(`  ${withMinimal} pass minimum-feature gate (TS%, USG%, BPM, OBPM, DBPM, age, height).`);
  console.log("");

  // Step 2: cell-level partition (era × posFam)
  const cells = {}; // key = `${era}|${posFam}`
  for (const e of enriched) {
    const key = `${e.era}|${e.posFam}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(e);
  }
  console.log("Cell sizes (era × posFam):");
  const eras   = ["PRE_SPACING", "TRANSITIONAL", "SPACING", "MODERN"];
  const posFams = ["guard", "wing", "big"];
  for (const era of eras) {
    for (const posFam of posFams) {
      const k = `${era}|${posFam}`;
      const n = (cells[k] || []).length;
      console.log(`  ${era.padEnd(14)} ${posFam.padEnd(6)} ${String(n).padStart(4)}`);
    }
  }
  console.log("");

  // Step 3: per-cell, per-feature normalizer (μ, σ)
  // We compute on the FULL pool (not minimum-feature-gated) so each feature
  // gets the maximum sample size available. Per-feature n is recorded so the
  // runtime can apply confidence weighting to features fit on small samples.
  const cellNormalizers = {};
  for (const cellKey of Object.keys(cells)) {
    const rows = cells[cellKey];
    const norm = {};
    for (const k of FEATURE_KEYS) {
      const values = rows.map((r) => r.features[k]);
      const { mean, std, n } = meanStd(values);
      norm[k] = { mean: r2(mean), std: r2(std), n };
    }
    cellNormalizers[cellKey] = norm;
  }

  // Step 4: pool-level normalizers per posFam (era-collapsed) — used as
  // fallback when a cell has too small a sample (n < 20).
  const poolNormalizers = {};
  for (const posFam of posFams) {
    const rows = enriched.filter((e) => e.posFam === posFam);
    const norm = {};
    for (const k of FEATURE_KEYS) {
      const values = rows.map((r) => r.features[k]);
      const { mean, std, n } = meanStd(values);
      norm[k] = { mean: r2(mean), std: r2(std), n };
    }
    poolNormalizers[posFam] = norm;
  }

  // Step 5: cohort percentile thresholds per posFam — z-score boundaries for
  // top 5% / 15% / 40% / 75%. These are the "absolute floor" gate for letter
  // grades (paired with the cohort rank gate at runtime).
  const cohortThresholds = {};
  for (const posFam of posFams) {
    const rows = enriched.filter((e) => e.posFam === posFam);
    const perFeature = {};
    for (const k of FEATURE_KEYS) {
      const values = rows.map((r) => r.features[k]).filter((v) => v != null && Number.isFinite(v));
      values.sort((a, b) => a - b);
      perFeature[k] = {
        p25: r2(quantile(values, 0.25)),
        p50: r2(quantile(values, 0.50)),
        p60: r2(quantile(values, 0.60)),  // C/D boundary
        p85: r2(quantile(values, 0.85)),  // A/B boundary
        p95: r2(quantile(values, 0.95)),  // A+/A boundary
        n: values.length,
      };
    }
    cohortThresholds[posFam] = perFeature;
  }

  // Step 6: outcome-tier distribution per (era × posFam) — the historical
  // base rate the comp engine and overall-grade k-NN calibrate against.
  const outcomeBaseRates = {};
  for (const cellKey of Object.keys(cells)) {
    const rows = cells[cellKey];
    const counts = { Legend: 0, Star: 0, Hit: 0, Swing: 0, Bust: 0 };
    let total = 0;
    for (const r of rows) {
      if (counts.hasOwnProperty(r.outcomeTier)) {
        counts[r.outcomeTier]++;
        total++;
      }
    }
    if (total === 0) continue;
    outcomeBaseRates[cellKey] = {
      n: total,
      p_legend: r3(counts.Legend / total),
      p_star:   r3(counts.Star / total),
      p_hit:    r3(counts.Hit / total),
      p_swing:  r3(counts.Swing / total),
      p_bust:   r3(counts.Bust / total),
    };
  }

  // -------------------------------------------------------------------------
  // Step 7: per-trait L2 ridge regressions (8 traits × 3 posFam = 24 fits)
  // -------------------------------------------------------------------------
  console.log("Fitting per-trait ridge regressions (8 traits × 3 posFam)...");
  const traitRegressions = {};
  for (const [trait, contributors] of Object.entries(TRAIT_CONTRIBUTORS)) {
    traitRegressions[trait] = {};
    for (const posFam of posFams) {
      const rows = enriched.filter(
        (e) =>
          e.posFam === posFam &&
          OUTCOME_SCORE[e.outcomeTier] != null &&
          contributors.every((k) => e.features[k] != null && Number.isFinite(e.features[k]))
      );
      if (rows.length < 30) {
        traitRegressions[trait][posFam] = { error: "insufficient_data", n: rows.length };
        continue;
      }
      const X = rows.map((r) => contributors.map((k) => r.features[k]));
      const y = rows.map((r) => OUTCOME_SCORE[r.outcomeTier]);
      try {
        const fit = ridgeFit(X, y, 1.0);
        traitRegressions[trait][posFam] = {
          contributors,
          weights: fit.weights.map((w, i) => ({
            feature: contributors[i],
            coef: r3(w),
            mean: r2(fit.stats[i].mean),
            std:  r2(fit.stats[i].std),
          })),
          intercept: r2(fit.intercept),
          n: fit.n,
          r2: r3(fit.r2),
        };
      } catch (err) {
        traitRegressions[trait][posFam] = { error: err.message, n: rows.length };
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 8: global logistic regression for comp-distance feature weights
  // -------------------------------------------------------------------------
  // Target: P(outcomeTier ∈ {Legend, Star, Hit}) | 16-feature vector. The
  // resulting coefficients are squared+normalized into per-feature distance
  // weights for the comp engine — features that don't separate Hit-or-better
  // from Swing-or-worse get small weights; features that do get large ones.
  console.log("Fitting global logistic regression for comp-distance weights...");
  const logisticRows = enriched.filter((e) => {
    if (!OUTCOME_SCORE[e.outcomeTier]) return false;
    return FEATURE_KEYS.every((k) => e.features[k] != null && Number.isFinite(e.features[k]));
  });
  let compDistanceWeights = null;
  if (logisticRows.length >= 100) {
    const X = logisticRows.map((r) => FEATURE_KEYS.map((k) => r.features[k]));
    const y = logisticRows.map((r) => (["Legend", "Star", "Hit"].includes(r.outcomeTier) ? 1 : 0));
    const fit = logisticFit(X, y, { lambda: 1.0, lr: 0.05, iters: 1500 });
    // Convert |coef| → distance weights, normalized so mean weight = 1.
    const absCoefs = fit.weights.map(Math.abs);
    const meanAbs = absCoefs.reduce((a, b) => a + b, 0) / absCoefs.length;
    const distWeights = absCoefs.map((c) => Math.max(0.1, c / meanAbs));
    compDistanceWeights = {
      featureKeys: FEATURE_KEYS,
      logisticCoefficients: fit.weights.map((w, i) => ({
        feature: FEATURE_KEYS[i],
        coef: r3(w),
        absCoef: r3(Math.abs(w)),
        distanceWeight: r3(distWeights[i]),
        mean: r2(fit.stats[i].mean),
        std:  r2(fit.stats[i].std),
      })),
      intercept: r3(fit.intercept),
      n: fit.n,
      accuracy: r3(fit.accuracy),
      recallPositive: r3(fit.recallPositive),
    };
  } else {
    compDistanceWeights = { error: "insufficient_full_feature_rows", n: logisticRows.length };
  }

  // -------------------------------------------------------------------------
  // Step 9: assemble + write
  // -------------------------------------------------------------------------
  const calibration = {
    _meta: {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      generatedBy: "scripts/scoring/calibrate.js",
      poolSize: enriched.length,
      poolWithMinimumFeatures: withMinimal,
      poolWithAllFeatures: logisticRows.length,
      featureKeys: FEATURE_KEYS,
      eraBuckets: eras,
      positionFamilies: posFams,
      traitContributors: TRAIT_CONTRIBUTORS,
      outcomeScoreMap: OUTCOME_SCORE,
      notes: [
        "Era buckets are derived from draftYear, NOT from historicalProspects.json[].eraBucket (which is too coarse).",
        "Cell normalizers use per-feature n; runtime should fall back to poolNormalizers when cell n < 20.",
        "Trait regressions: outcome score is regressed on the trait's contributor features (ridge, λ=1.0). Coefficients tell us how to weight each contributor inside the trait composite.",
        "Comp-distance weights come from a global logistic regression on outcomeTier ∈ {Hit-or-better}. |coef| normalized so mean=1, floored at 0.1.",
      ],
    },
    cellNormalizers,
    poolNormalizers,
    cohortThresholds,
    outcomeBaseRates,
    traitRegressions,
    compDistanceWeights,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(calibration, null, 2) + "\n");

  // ---- Diagnostics --------------------------------------------------------
  console.log("=== Diagnostics ===");
  console.log("");
  console.log("Sample cell normalizer (MODERN × wing, BPM):");
  const mw = cellNormalizers["MODERN|wing"]?.bpm;
  console.log(`  μ=${mw?.mean}  σ=${mw?.std}  n=${mw?.n}`);

  console.log("");
  console.log("Sample cohort threshold (wing, TS% — what raw % is the 95th pct in cohort?):");
  const wt = cohortThresholds.wing?.tsPct;
  console.log(`  p25=${wt?.p25}  p50=${wt?.p50}  p85=${wt?.p85}  p95=${wt?.p95}  n=${wt?.n}`);

  console.log("");
  console.log("Outcome base rates by cell:");
  for (const era of eras) {
    for (const posFam of posFams) {
      const k = `${era}|${posFam}`;
      const rates = outcomeBaseRates[k];
      if (!rates) continue;
      const starPlus = ((rates.p_legend + rates.p_star) * 100).toFixed(1);
      const hitPlus  = ((rates.p_legend + rates.p_star + rates.p_hit) * 100).toFixed(1);
      console.log(`  ${era.padEnd(14)} ${posFam.padEnd(6)} n=${String(rates.n).padStart(3)}  Star+: ${starPlus}%  Hit+: ${hitPlus}%`);
    }
  }
  console.log("");
  console.log("Per-trait regression fits (R² across posFam):");
  for (const trait of Object.keys(traitRegressions)) {
    const fits = traitRegressions[trait];
    const summary = posFams.map((pf) => {
      const f = fits[pf];
      if (f?.error) return `${pf}=${f.error}(n=${f.n})`;
      return `${pf} R²=${f.r2} n=${f.n}`;
    }).join("  ");
    console.log(`  ${trait.padEnd(22)} ${summary}`);
  }

  console.log("");
  console.log("Sample trait regression — ShootingGravity, wing:");
  const sg = traitRegressions.ShootingGravity?.wing;
  if (sg && !sg.error) {
    console.log(`  intercept=${sg.intercept}  R²=${sg.r2}  n=${sg.n}`);
    for (const w of sg.weights) {
      console.log(`    ${w.feature.padEnd(10)} coef=${String(w.coef).padStart(7)}  μ=${w.mean}  σ=${w.std}`);
    }
  }

  console.log("");
  console.log("Global comp-distance weights (logistic on Hit-or-better):");
  if (compDistanceWeights?.logisticCoefficients) {
    console.log(`  n=${compDistanceWeights.n}  accuracy=${compDistanceWeights.accuracy}  positive recall=${compDistanceWeights.recallPositive}`);
    const sorted = compDistanceWeights.logisticCoefficients
      .slice()
      .sort((a, b) => b.absCoef - a.absCoef);
    for (const c of sorted) {
      console.log(`    ${c.feature.padEnd(10)} coef=${String(c.coef).padStart(7)}  distanceW=${c.distanceWeight}`);
    }
  } else if (compDistanceWeights?.error) {
    console.log(`  ERROR: ${compDistanceWeights.error} (n=${compDistanceWeights.n})`);
  }

  console.log("");
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Size: ${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB`);
}

function r2(n) { return n == null ? null : Math.round(n * 100) / 100; }
function r3(n) { return n == null ? null : Math.round(n * 1000) / 1000; }

if (require.main === module) main();
