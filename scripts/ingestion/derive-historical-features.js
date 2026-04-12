const { openDatabase, nowIso, withTransaction } = require('../lib/db');

function percentileRank(values, target) {
  if (!values.length || !Number.isFinite(target)) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const below = sorted.filter((value) => value <= target).length;
  return Math.round((below / sorted.length) * 100);
}

function ratePer40(value, minutes) {
  if (!Number.isFinite(value) || !Number.isFinite(minutes) || minutes <= 0) return null;
  return Number(((value / minutes) * 40).toFixed(2));
}

function ageAdjustedScore(age, value) {
  if (!Number.isFinite(value)) return null;
  if (!Number.isFinite(age)) return value;
  const adjustment = age <= 19 ? 1.08 : age <= 20 ? 1.04 : age >= 23 ? 0.94 : 1;
  return Number((value * adjustment).toFixed(3));
}

function positionGroup(position = '') {
  const label = String(position).toUpperCase();
  if (label.includes('PG') || label === 'G') return 'guard';
  if (label.includes('SG') || label.includes('SF') || label === 'W' || label === 'F') return 'wing';
  return 'big';
}

function outcomeTierFromNbaRow(row) {
  const games = Number(row.nba_games || 0);
  const minutes = Number(row.nba_minutes || 0);
  const bpm = Number(row.nba_bpm || 0);

  if (minutes >= 12000 || bpm >= 4) return { tier: 'Tier 1 outcome', score: 5 };
  if (minutes >= 7000 || bpm >= 2) return { tier: 'Tier 2 outcome', score: 4 };
  if (minutes >= 3500 || games >= 180) return { tier: 'Tier 3 outcome', score: 3 };
  if (minutes >= 800 || games >= 60) return { tier: 'Tier 4 outcome', score: 2 };
  return { tier: 'Tier 5 outcome', score: 1 };
}

function archetypeFamily(row) {
  const assistPct = Number(row.ast_pct || 0);
  const usage = Number(row.usg_pct || 0);
  const ts = Number(row.ts_pct || 0);
  const blk = Number(row.blk_pct || 0);
  const stl = Number(row.stl_pct || 0);
  const group = positionGroup(row.position);

  if (group === 'guard' && assistPct >= 22) return 'Lead Guard';
  if (group === 'guard' && ts >= 0.57) return 'Scoring Guard';
  if (group === 'wing' && stl >= 2) return 'Two-Way Wing';
  if (group === 'wing' && usage >= 24) return 'Creation Wing';
  if (group === 'big' && blk >= 4) return 'Rim Anchor';
  if (group === 'big' && assistPct >= 15) return 'Hub Big';
  return group === 'guard' ? 'Combo Guard' : group === 'wing' ? 'Connector Wing' : 'Play Finisher Big';
}

function buildStrengthSignals(row, percentileMap) {
  const strengths = [];
  const weaknesses = [];

  if ((percentileMap.points_overall || 0) >= 75) strengths.push('Scoring load');
  if ((percentileMap.assists_position || 0) >= 70) strengths.push('Passing creation');
  if ((percentileMap.ts_overall || 0) >= 75) strengths.push('Scoring efficiency');
  if ((percentileMap.bpm_overall || 0) >= 75) strengths.push('Impact profile');
  if ((percentileMap.stocks_position || 0) >= 70) strengths.push('Defensive events');

  if ((percentileMap.ts_overall || 100) <= 35) weaknesses.push('Efficiency concern');
  if ((percentileMap.tov_position || 100) >= 70) weaknesses.push('Turnover drag');
  if ((percentileMap.assists_position || 100) <= 35 && positionGroup(row.position) === 'guard') weaknesses.push('Creation load question');
  if ((percentileMap.stocks_position || 100) <= 30 && positionGroup(row.position) !== 'guard') weaknesses.push('Defensive playmaking concern');

  return { strengths, weaknesses };
}

function deriveHistoricalFeatures() {
  const db = openDatabase();
  const startedAt = nowIso();

  try {
    const seasonRows = db.prepare(`
      WITH deduped_prospects AS (
        SELECT *
        FROM (
          SELECT
            ph.*,
            ROW_NUMBER() OVER (
              PARTITION BY ph.source, ph.source_player_id, ph.season
              ORDER BY
                CASE WHEN ph.age IS NOT NULL THEN 0 ELSE 1 END,
                CASE WHEN ph.position IS NOT NULL THEN 0 ELSE 1 END,
                ph.id DESC
            ) AS row_priority
          FROM prospects_historical ph
          WHERE ph.season IS NOT NULL
        )
        WHERE row_priority = 1
      )
      SELECT
        ph.id AS prospect_historical_id,
        ph.player_id,
        ph.source_player_id,
        ph.player_name,
        ph.season,
        ph.school_team,
        ph.league,
        ph.class_year,
        ph.age,
        ph.position,
        ph.source,
        ph.source_last_updated,
        ss.points,
        ss.rebounds,
        ss.assists,
        ss.steals,
        ss.blocks,
        ss.turnovers,
        ss.minutes,
        am.ts_pct,
        am.efg_pct,
        am.usg_pct,
        am.ast_pct,
        am.tov_pct,
        am.stl_pct,
        am.blk_pct,
        am.bpm,
        am.obpm,
        am.dbpm
      FROM deduped_prospects ph
      LEFT JOIN prospect_season_stats ss
        ON ss.source = ph.source
       AND ss.source_player_id = ph.source_player_id
       AND ss.season = ph.season
      LEFT JOIN prospect_advanced_metrics am
        ON am.source = ph.source
       AND am.source_player_id = ph.source_player_id
       AND am.season = ph.season
    `).all();

    const outcomeRows = db.prepare(`
      SELECT
        prospect_historical_id,
        player_id,
        source_player_id,
        player_name,
        draft_year,
        draft_slot,
        nba_team,
        nba_games,
        nba_minutes,
        nba_points,
        nba_rebounds,
        nba_assists,
        nba_bpm,
        source,
        source_last_updated
      FROM prospect_nba_outcomes
    `).all();

    const bySeason = new Map();
    const bySeasonPosition = new Map();
    for (const row of seasonRows) {
      const seasonKey = row.season || 'unknown';
      const seasonPositionKey = `${seasonKey}::${positionGroup(row.position)}`;
      if (!bySeason.has(seasonKey)) bySeason.set(seasonKey, []);
      if (!bySeasonPosition.has(seasonPositionKey)) bySeasonPosition.set(seasonPositionKey, []);
      bySeason.get(seasonKey).push(row);
      bySeasonPosition.get(seasonPositionKey).push(row);
    }

    const clearTables = [
      'prospect_percentiles',
      'prospect_model_features',
      'prospect_outcome_labels',
      'prospect_archetype_inputs',
      'prospect_comparison_inputs',
    ];

    const percentileInsert = db.prepare(`
      INSERT INTO prospect_percentiles (
        player_id, prospect_historical_id, source_player_id, season, position_group,
        percentile_scope, metric_key, metric_value, percentile_value,
        source, source_last_updated, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const modelInsert = db.prepare(`
      INSERT INTO prospect_model_features (
        player_id, prospect_historical_id, source_player_id, season,
        age_adjusted_json, rate_signals_json, efficiency_signals_json, impact_signals_json,
        source, source_last_updated, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const outcomeInsert = db.prepare(`
      INSERT INTO prospect_outcome_labels (
        player_id, prospect_historical_id, source_player_id, draft_year,
        outcome_tier, outcome_score, label_reason_json,
        source, source_last_updated, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const archetypeInsert = db.prepare(`
      INSERT INTO prospect_archetype_inputs (
        player_id, prospect_historical_id, source_player_id, season,
        archetype_family, role_indicators_json, tool_indicators_json,
        source, source_last_updated, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const comparisonInsert = db.prepare(`
      INSERT INTO prospect_comparison_inputs (
        player_id, prospect_historical_id, source_player_id, season,
        comparison_vector_json, cohort_keys_json,
        source, source_last_updated, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let written = 0;

    withTransaction(db, () => {
      for (const table of clearTables) {
        db.exec(`DELETE FROM ${table}`);
      }

      for (const row of seasonRows) {
        const seasonKey = row.season || 'unknown';
        const group = positionGroup(row.position);
        const seasonCohort = bySeason.get(seasonKey) || [];
        const positionCohort = bySeasonPosition.get(`${seasonKey}::${group}`) || [];

        const metrics = {
          points: Number(row.points),
          rebounds: Number(row.rebounds),
          assists: Number(row.assists),
          ts: Number(row.ts_pct),
          efg: Number(row.efg_pct),
          usage: Number(row.usg_pct),
          bpm: Number(row.bpm),
          stocks: Number(row.stl_pct || 0) + Number(row.blk_pct || 0),
          tov: Number(row.tov_pct),
        };

        const percentileMap = {
          points_overall: percentileRank(seasonCohort.map((entry) => Number(entry.points)).filter(Number.isFinite), metrics.points),
          rebounds_overall: percentileRank(seasonCohort.map((entry) => Number(entry.rebounds)).filter(Number.isFinite), metrics.rebounds),
          assists_overall: percentileRank(seasonCohort.map((entry) => Number(entry.assists)).filter(Number.isFinite), metrics.assists),
          ts_overall: percentileRank(seasonCohort.map((entry) => Number(entry.ts_pct)).filter(Number.isFinite), metrics.ts),
          efg_overall: percentileRank(seasonCohort.map((entry) => Number(entry.efg_pct)).filter(Number.isFinite), metrics.efg),
          usage_overall: percentileRank(seasonCohort.map((entry) => Number(entry.usg_pct)).filter(Number.isFinite), metrics.usage),
          bpm_overall: percentileRank(seasonCohort.map((entry) => Number(entry.bpm)).filter(Number.isFinite), metrics.bpm),
          points_position: percentileRank(positionCohort.map((entry) => Number(entry.points)).filter(Number.isFinite), metrics.points),
          assists_position: percentileRank(positionCohort.map((entry) => Number(entry.assists)).filter(Number.isFinite), metrics.assists),
          stocks_position: percentileRank(
            positionCohort.map((entry) => Number(entry.stl_pct || 0) + Number(entry.blk_pct || 0)).filter(Number.isFinite),
            metrics.stocks,
          ),
          tov_position: percentileRank(positionCohort.map((entry) => Number(entry.tov_pct)).filter(Number.isFinite), metrics.tov),
        };

        for (const [metricKey, percentileValue] of Object.entries(percentileMap)) {
          const metricValue = metricKey.startsWith('points') ? metrics.points
            : metricKey.startsWith('rebounds') ? metrics.rebounds
            : metricKey.startsWith('assists') ? metrics.assists
            : metricKey.startsWith('ts') ? metrics.ts
            : metricKey.startsWith('efg') ? metrics.efg
            : metricKey.startsWith('usage') ? metrics.usage
            : metricKey.startsWith('bpm') ? metrics.bpm
            : metricKey.startsWith('stocks') ? metrics.stocks
            : metrics.tov;

          percentileInsert.run(
            row.player_id,
            row.prospect_historical_id,
            row.source_player_id,
            row.season,
            group,
            metricKey.endsWith('_position') ? 'position' : 'overall',
            metricKey,
            Number.isFinite(metricValue) ? metricValue : null,
            percentileValue,
            row.source,
            row.source_last_updated,
            nowIso(),
          );
          written += 1;
        }

        const strengthSignals = buildStrengthSignals(row, percentileMap);
        const ageAdjusted = {
          points_per_40_age_adjusted: ageAdjustedScore(row.age, ratePer40(metrics.points, Number(row.minutes))),
          assists_per_40_age_adjusted: ageAdjustedScore(row.age, ratePer40(metrics.assists, Number(row.minutes))),
          bpm_age_adjusted: ageAdjustedScore(row.age, metrics.bpm),
        };
        const rateSignals = {
          points_per_40: ratePer40(metrics.points, Number(row.minutes)),
          rebounds_per_40: ratePer40(metrics.rebounds, Number(row.minutes)),
          assists_per_40: ratePer40(metrics.assists, Number(row.minutes)),
        };
        const efficiencySignals = {
          true_shooting_pct: metrics.ts,
          effective_fg_pct: metrics.efg,
          turnover_pct: metrics.tov,
          usage_pct: metrics.usage,
        };
        const impactSignals = {
          bpm: metrics.bpm,
          obpm: Number(row.obpm),
          dbpm: Number(row.dbpm),
          stocks_pct: metrics.stocks,
        };

        modelInsert.run(
          row.player_id,
          row.prospect_historical_id,
          row.source_player_id,
          row.season,
          JSON.stringify(ageAdjusted),
          JSON.stringify(rateSignals),
          JSON.stringify(efficiencySignals),
          JSON.stringify(impactSignals),
          row.source,
          row.source_last_updated,
          nowIso(),
        );
        written += 1;

        archetypeInsert.run(
          row.player_id,
          row.prospect_historical_id,
          row.source_player_id,
          row.season,
          archetypeFamily(row),
          JSON.stringify({
            strengths: strengthSignals.strengths,
            weaknesses: strengthSignals.weaknesses,
            position_group: group,
          }),
          JSON.stringify({
            age: row.age,
            size_signal: group === 'big' ? 'frontcourt' : group === 'wing' ? 'wing' : 'guard',
            impact_signal: metrics.bpm,
          }),
          row.source,
          row.source_last_updated,
          nowIso(),
        );
        written += 1;

        comparisonInsert.run(
          row.player_id,
          row.prospect_historical_id,
          row.source_player_id,
          row.season,
          JSON.stringify({
            age: row.age,
            points_per_40: rateSignals.points_per_40,
            assists_per_40: rateSignals.assists_per_40,
            rebounds_per_40: rateSignals.rebounds_per_40,
            ts_pct: metrics.ts,
            bpm: metrics.bpm,
            usage_pct: metrics.usage,
            stocks_pct: metrics.stocks,
          }),
          JSON.stringify({
            season: row.season,
            position_group: group,
            archetype_family: archetypeFamily(row),
          }),
          row.source,
          row.source_last_updated,
          nowIso(),
        );
        written += 1;
      }

      for (const row of outcomeRows) {
        const outcome = outcomeTierFromNbaRow(row);
        outcomeInsert.run(
          row.player_id,
          row.prospect_historical_id,
          row.source_player_id,
          row.draft_year,
          outcome.tier,
          outcome.score,
          JSON.stringify({
            draft_slot: row.draft_slot,
            nba_games: row.nba_games,
            nba_minutes: row.nba_minutes,
            nba_bpm: row.nba_bpm,
          }),
          row.source,
          row.source_last_updated,
          nowIso(),
        );
        written += 1;
      }
    });

    db.prepare(`
      INSERT INTO source_sync_log (
        source, sync_type, season, status, started_at, finished_at,
        records_fetched, records_written, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'HistoricalDerivedFeatures',
      'historical-derived',
      'historical',
      'success',
      startedAt,
      nowIso(),
      seasonRows.length + outcomeRows.length,
      written,
      JSON.stringify({
        derivedTables: [
          'prospect_percentiles',
          'prospect_model_features',
          'prospect_outcome_labels',
          'prospect_archetype_inputs',
          'prospect_comparison_inputs',
        ],
      }),
    );

    console.log(`Derived ${written} historical feature rows from ${seasonRows.length} normalized season rows and ${outcomeRows.length} outcome rows.`);
  } catch (error) {
    db.prepare(`
      INSERT INTO source_sync_log (
        source, sync_type, season, status, started_at, finished_at,
        records_fetched, records_written, error_message, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'HistoricalDerivedFeatures',
      'historical-derived',
      'historical',
      'error',
      startedAt,
      nowIso(),
      0,
      0,
      error.message,
      JSON.stringify({ error: error.message }),
    );
    throw error;
  } finally {
    db.close();
  }
}

if (require.main === module) {
  deriveHistoricalFeatures();
}

module.exports = { deriveHistoricalFeatures };
