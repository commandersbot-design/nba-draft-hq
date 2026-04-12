const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../lib/db');

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'historicalDerived.json');

function parseJson(value, fallback = {}) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function toNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function pickPreferred(entries, preferredSources = []) {
  if (!entries.length) return null;
  for (const source of preferredSources) {
    const match = entries.find((entry) => entry.source === source);
    if (match) return match;
  }
  return entries[0];
}

function exportHistoricalDerived() {
  const db = openDatabase();

  try {
    const prospects = db.prepare(`
      SELECT
        source_player_id,
        player_name,
        draft_year,
        season,
        position,
        age,
        school_team,
        league
      FROM prospects_historical
      WHERE source_player_id IS NOT NULL
      ORDER BY player_name ASC, season DESC
    `).all();

    const percentiles = db.prepare(`
      SELECT
        source_player_id,
        season,
        metric_key,
        percentile_value,
        metric_value,
        percentile_scope,
        source
      FROM prospect_percentiles
      WHERE source_player_id IS NOT NULL
    `).all();

    const modelFeatures = db.prepare(`
      SELECT
        source_player_id,
        season,
        age_adjusted_json,
        rate_signals_json,
        efficiency_signals_json,
        impact_signals_json,
        source
      FROM prospect_model_features
      WHERE source_player_id IS NOT NULL
    `).all();

    const outcomeLabels = db.prepare(`
      SELECT
        source_player_id,
        draft_year,
        outcome_tier,
        outcome_score,
        label_reason_json,
        source
      FROM prospect_outcome_labels
      WHERE source_player_id IS NOT NULL
    `).all();

    const archetypeInputs = db.prepare(`
      SELECT
        source_player_id,
        season,
        archetype_family,
        role_indicators_json,
        tool_indicators_json,
        source
      FROM prospect_archetype_inputs
      WHERE source_player_id IS NOT NULL
    `).all();

    const comparisonInputs = db.prepare(`
      SELECT
        source_player_id,
        season,
        comparison_vector_json,
        cohort_keys_json,
        source
      FROM prospect_comparison_inputs
      WHERE source_player_id IS NOT NULL
    `).all();

    const grouped = new Map();

    for (const row of prospects) {
      if (!grouped.has(row.source_player_id)) {
        grouped.set(row.source_player_id, {
          id: row.source_player_id,
          playerName: row.player_name,
          draftYear: row.draft_year,
          season: row.season,
          position: row.position,
          age: toNumber(row.age),
          schoolTeam: row.school_team,
          league: row.league,
          percentileRows: [],
          modelRows: [],
          outcomeRows: [],
          archetypeRows: [],
          comparisonRows: [],
        });
      }
    }

    const attachRows = (rows, key) => {
      for (const row of rows) {
        const entry = grouped.get(row.source_player_id);
        if (!entry) continue;
        entry[key].push(row);
      }
    };

    attachRows(percentiles, 'percentileRows');
    attachRows(modelFeatures, 'modelRows');
    attachRows(outcomeLabels, 'outcomeRows');
    attachRows(archetypeInputs, 'archetypeRows');
    attachRows(comparisonInputs, 'comparisonRows');

    const exported = {};

    for (const [id, entry] of grouped.entries()) {
      const percentileMap = {};
      const percentileSummary = {};

      for (const row of entry.percentileRows) {
        percentileMap[row.metric_key] = toNumber(row.percentile_value);
        if (row.percentile_scope === 'overall') {
          if (row.metric_key.startsWith('points')) percentileSummary.points = toNumber(row.percentile_value);
          if (row.metric_key.startsWith('rebounds')) percentileSummary.rebounds = toNumber(row.percentile_value);
          if (row.metric_key.startsWith('assists')) percentileSummary.assists = toNumber(row.percentile_value);
          if (row.metric_key.startsWith('ts')) percentileSummary.trueShooting = toNumber(row.percentile_value);
          if (row.metric_key.startsWith('bpm')) percentileSummary.bpm = toNumber(row.percentile_value);
        }
      }

      const preferredModel = pickPreferred(entry.modelRows, ['Bart Torvik', 'CollegeBasketballData', 'Sports Reference']);
      const preferredOutcome = pickPreferred(entry.outcomeRows, ['Basketball Reference']);
      const preferredArchetype = pickPreferred(entry.archetypeRows, ['Bart Torvik', 'Sports Reference', 'CollegeBasketballData']);
      const preferredComparison = pickPreferred(entry.comparisonRows, ['Bart Torvik', 'CollegeBasketballData', 'Sports Reference']);
      const resolvedDraftYear = preferredOutcome?.draft_year
        ?? entry.draftYear
        ?? null;

      exported[id] = {
        id,
        playerName: entry.playerName,
        draftYear: resolvedDraftYear,
        season: entry.season,
        position: entry.position,
        age: entry.age,
        schoolTeam: entry.schoolTeam,
        league: entry.league,
        percentiles: {
          ...percentileSummary,
          ...percentileMap,
        },
        modelFeatures: preferredModel ? {
          ageAdjusted: parseJson(preferredModel.age_adjusted_json),
          rateSignals: parseJson(preferredModel.rate_signals_json),
          efficiencySignals: parseJson(preferredModel.efficiency_signals_json),
          impactSignals: parseJson(preferredModel.impact_signals_json),
          source: preferredModel.source,
        } : null,
        outcomeLabel: preferredOutcome ? {
          tier: preferredOutcome.outcome_tier,
          score: toNumber(preferredOutcome.outcome_score),
          reasons: parseJson(preferredOutcome.label_reason_json),
          source: preferredOutcome.source,
        } : null,
        archetypeInputs: preferredArchetype ? {
          family: preferredArchetype.archetype_family,
          roleIndicators: parseJson(preferredArchetype.role_indicators_json),
          toolIndicators: parseJson(preferredArchetype.tool_indicators_json),
          source: preferredArchetype.source,
        } : null,
        comparisonInputs: preferredComparison ? {
          vector: parseJson(preferredComparison.comparison_vector_json),
          cohortKeys: parseJson(preferredComparison.cohort_keys_json),
          source: preferredComparison.source,
        } : null,
      };
    }

    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(exported, null, 2)}\n`);
    console.log(`Exported derived historical data for ${Object.keys(exported).length} prospects to ${OUTPUT_PATH}`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  exportHistoricalDerived();
}

module.exports = { exportHistoricalDerived };
