const { openDatabase, nowIso, withTransaction } = require('../lib/db');

function parseArgs() {
  const seasonArg = process.argv.find((arg) => arg.startsWith('--season='));
  return { season: seasonArg ? seasonArg.split('=')[1] : '2025-26' };
}

function percentileRank(values, target) {
  if (!values.length) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter((value) => value <= target).length;
  return Math.round((below / sorted.length) * 100);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getPositionGroup(position) {
  if (['PG', 'G'].includes(position)) return 'guard';
  if (['SG', 'SF', 'W', 'F'].includes(position)) return 'wing';
  return 'big';
}

function computeStatStrengths(row) {
  const strengths = [];
  const weaknesses = [];

  const percentiles = row.percentiles;
  if ((percentiles.pointsPerGame || 0) >= 75) strengths.push('High-volume scorer for role');
  if ((percentiles.assistsPerGame || 0) >= 75) strengths.push('Strong playmaking rate');
  if ((percentiles.trueShooting || 0) >= 75) strengths.push('Efficient scoring profile');
  if ((percentiles.bpm || 0) >= 75) strengths.push('Impact metrics are strong');
  if ((percentiles.reboundRate || 0) >= 75) strengths.push('Wins extra possessions on the glass');
  if ((percentiles.stealsPerGame || 0) >= 75 || (percentiles.blocksPerGame || 0) >= 75) strengths.push('Generates defensive events');

  if ((percentiles.trueShooting || 0) <= 35) weaknesses.push('Efficiency still lags role expectation');
  if ((percentiles.turnoversPerGame || 50) >= 70) weaknesses.push('Turnover load still needs trimming');
  if ((percentiles.threePct || 0) <= 35) weaknesses.push('Three-point pressure remains inconsistent');
  if ((percentiles.assistsPerGame || 50) <= 30 && row.positionGroup === 'guard') weaknesses.push('Playmaking volume is light for guard archetype');
  if ((percentiles.reboundRate || 50) <= 30 && row.positionGroup === 'big') weaknesses.push('Rebound rate trails frontcourt expectation');

  return { strengths, weaknesses };
}

function computeArchetypeIndicators(row) {
  const indicators = [];

  if ((row.percentiles.pointsPerGame || 0) >= 75 && (row.percentiles.trueShooting || 0) >= 70) indicators.push('Scoring efficiency');
  if ((row.percentiles.assistsPerGame || 0) >= 75 && row.positionGroup === 'guard') indicators.push('Primary creation');
  if ((row.percentiles.threePct || 0) >= 70) indicators.push('Floor-spacing shotmaking');
  if ((row.percentiles.reboundRate || 0) >= 75 && row.positionGroup !== 'guard') indicators.push('Possession-winning size');
  if ((row.percentiles.stealsPerGame || 0) >= 70 || (row.percentiles.blocksPerGame || 0) >= 70) indicators.push('Defensive event creation');
  if ((row.percentiles.bpm || 0) >= 75) indicators.push('High-impact production');

  return indicators;
}

function buildStatCards(row) {
  return [
    { label: 'PPG', value: row.pointsPerGame?.toFixed(1) || '--', percentile: row.percentiles.pointsPerGame },
    { label: 'RPG', value: row.reboundsPerGame?.toFixed(1) || '--', percentile: row.percentiles.reboundsPerGame },
    { label: 'APG', value: row.assistsPerGame?.toFixed(1) || '--', percentile: row.percentiles.assistsPerGame },
    { label: 'TS%', value: row.tsPct ? `${(row.tsPct * 100).toFixed(1)}%` : '--', percentile: row.percentiles.trueShooting },
    { label: 'BPM', value: row.bpm?.toFixed(1) || '--', percentile: row.percentiles.bpm },
    { label: 'USG%', value: row.usgPct ? `${(row.usgPct * 100).toFixed(1)}%` : '--', percentile: row.percentiles.usage },
  ];
}

function normalizeRows(db, season) {
  const players = db.prepare(`
    SELECT id, first_name, last_name, position
    FROM players
    WHERE draft_class = 2026
    ORDER BY id
  `).all();

  const rawStatsStmt = db.prepare(`
    SELECT source, payload
    FROM player_stats_raw
    WHERE player_id = ? AND season = ?
  `);

  const normalized = [];

  for (const player of players) {
    const rawRows = rawStatsStmt.all(player.id, season);
    const cbbd = rawRows.find((row) => row.source === 'CollegeBasketballData');
    const torvik = rawRows.find((row) => row.source === 'BartTorvikDataset');
    if (!cbbd && !torvik) continue;

    const basic = cbbd ? JSON.parse(cbbd.payload) : {};
    const advanced = torvik ? JSON.parse(torvik.payload) : {};

    normalized.push({
      playerId: player.id,
      season,
      source: 'ProsperaAggregate',
      positionGroup: getPositionGroup(player.position),
      games: basic.games ?? null,
      minutesPerGame: basic.minutesPerGame ?? null,
      pointsPerGame: basic.pointsPerGame ?? null,
      reboundsPerGame: basic.reboundsPerGame ?? null,
      assistsPerGame: basic.assistsPerGame ?? null,
      stealsPerGame: basic.stealsPerGame ?? null,
      blocksPerGame: basic.blocksPerGame ?? null,
      turnoversPerGame: basic.turnoversPerGame ?? null,
      fgPct: basic.fgPct ?? null,
      threePct: basic.threePct ?? null,
      ftPct: basic.ftPct ?? null,
      tsPct: advanced.tsPct ?? null,
      efgPct: advanced.efgPct ?? null,
      usgPct: advanced.usgPct ?? null,
      astPct: advanced.astPct ?? null,
      tovPct: advanced.tovPct ?? null,
      ortg: advanced.ortg ?? null,
      drtg: advanced.drtg ?? null,
      bpm: advanced.bpm ?? null,
      reboundRate: advanced.reboundRate ?? null,
    });
  }

  const groups = ['guard', 'wing', 'big'];
  for (const group of groups) {
    const cohort = normalized.filter((row) => row.positionGroup === group);
    const metricMap = {
      pointsPerGame: cohort.map((row) => row.pointsPerGame).filter(Number.isFinite),
      reboundsPerGame: cohort.map((row) => row.reboundsPerGame).filter(Number.isFinite),
      assistsPerGame: cohort.map((row) => row.assistsPerGame).filter(Number.isFinite),
      stealsPerGame: cohort.map((row) => row.stealsPerGame).filter(Number.isFinite),
      blocksPerGame: cohort.map((row) => row.blocksPerGame).filter(Number.isFinite),
      turnoversPerGame: cohort.map((row) => row.turnoversPerGame).filter(Number.isFinite),
      trueShooting: cohort.map((row) => row.tsPct).filter(Number.isFinite),
      threePct: cohort.map((row) => row.threePct).filter(Number.isFinite),
      bpm: cohort.map((row) => row.bpm).filter(Number.isFinite),
      reboundRate: cohort.map((row) => row.reboundRate).filter(Number.isFinite),
      usage: cohort.map((row) => row.usgPct).filter(Number.isFinite),
    };

    for (const row of cohort) {
      row.percentiles = {
        pointsPerGame: percentileRank(metricMap.pointsPerGame, row.pointsPerGame ?? 0),
        reboundsPerGame: percentileRank(metricMap.reboundsPerGame, row.reboundsPerGame ?? 0),
        assistsPerGame: percentileRank(metricMap.assistsPerGame, row.assistsPerGame ?? 0),
        stealsPerGame: percentileRank(metricMap.stealsPerGame, row.stealsPerGame ?? 0),
        blocksPerGame: percentileRank(metricMap.blocksPerGame, row.blocksPerGame ?? 0),
        turnoversPerGame: percentileRank(metricMap.turnoversPerGame, row.turnoversPerGame ?? 0),
        trueShooting: percentileRank(metricMap.trueShooting, row.tsPct ?? 0),
        threePct: percentileRank(metricMap.threePct, row.threePct ?? 0),
        bpm: percentileRank(metricMap.bpm, row.bpm ?? 0),
        reboundRate: percentileRank(metricMap.reboundRate, row.reboundRate ?? 0),
        usage: percentileRank(metricMap.usage, row.usgPct ?? 0),
      };

      const signals = computeStatStrengths(row);
      row.strengths = signals.strengths;
      row.weaknesses = signals.weaknesses;
      row.archetypeIndicators = computeArchetypeIndicators(row);
      row.statCards = buildStatCards(row);
      row.comparisonInputs = {
        finalScore: Number((((row.bpm ?? 0) * 3) + ((row.tsPct ?? 0) * 100 * 0.35) + ((row.usgPct ?? 0) * 100 * 0.15)).toFixed(1)),
        offensiveSummary: `${row.pointsPerGame?.toFixed(1) || '--'} PPG on ${row.tsPct ? `${(row.tsPct * 100).toFixed(1)} TS%` : '--'}`,
        defensiveSummary: `${row.stealsPerGame?.toFixed(1) || '--'} STL / ${row.blocksPerGame?.toFixed(1) || '--'} BLK / ${row.drtg?.toFixed(1) || '--'} DRTG`,
      };
    }
  }

  return normalized;
}

function writeNormalizedRows(db, rows) {
  const stmt = db.prepare(`
    INSERT INTO player_stats_normalized (
      player_id, season, source, last_updated, position_group, games, minutes_per_game,
      points_per_game, rebounds_per_game, assists_per_game, steals_per_game, blocks_per_game,
      turnovers_per_game, fg_pct, three_pct, ft_pct, ts_pct, efg_pct, usg_pct, ast_pct,
      tov_pct, ortg, drtg, bpm, rebound_rate, percentile_json, strengths_json,
      weaknesses_json, archetype_indicators_json, comparison_inputs_json, stat_cards_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(player_id, season, source)
    DO UPDATE SET
      last_updated = excluded.last_updated,
      position_group = excluded.position_group,
      games = excluded.games,
      minutes_per_game = excluded.minutes_per_game,
      points_per_game = excluded.points_per_game,
      rebounds_per_game = excluded.rebounds_per_game,
      assists_per_game = excluded.assists_per_game,
      steals_per_game = excluded.steals_per_game,
      blocks_per_game = excluded.blocks_per_game,
      turnovers_per_game = excluded.turnovers_per_game,
      fg_pct = excluded.fg_pct,
      three_pct = excluded.three_pct,
      ft_pct = excluded.ft_pct,
      ts_pct = excluded.ts_pct,
      efg_pct = excluded.efg_pct,
      usg_pct = excluded.usg_pct,
      ast_pct = excluded.ast_pct,
      tov_pct = excluded.tov_pct,
      ortg = excluded.ortg,
      drtg = excluded.drtg,
      bpm = excluded.bpm,
      rebound_rate = excluded.rebound_rate,
      percentile_json = excluded.percentile_json,
      strengths_json = excluded.strengths_json,
      weaknesses_json = excluded.weaknesses_json,
      archetype_indicators_json = excluded.archetype_indicators_json,
      comparison_inputs_json = excluded.comparison_inputs_json,
      stat_cards_json = excluded.stat_cards_json,
      updated_at = CURRENT_TIMESTAMP
  `);

  withTransaction(db, () => {
    for (const row of rows) {
      stmt.run(
        row.playerId,
        row.season,
        row.source,
        nowIso(),
        row.positionGroup,
        row.games,
        row.minutesPerGame,
        row.pointsPerGame,
        row.reboundsPerGame,
        row.assistsPerGame,
        row.stealsPerGame,
        row.blocksPerGame,
        row.turnoversPerGame,
        row.fgPct,
        row.threePct,
        row.ftPct,
        row.tsPct,
        row.efgPct,
        row.usgPct,
        row.astPct,
        row.tovPct,
        row.ortg,
        row.drtg,
        row.bpm,
        row.reboundRate,
        JSON.stringify(row.percentiles),
        JSON.stringify(row.strengths),
        JSON.stringify(row.weaknesses),
        JSON.stringify(row.archetypeIndicators),
        JSON.stringify(row.comparisonInputs),
        JSON.stringify(row.statCards),
      );
    }
  });
}

function transformNormalizedStats() {
  const { season } = parseArgs();
  const db = openDatabase();

  try {
    const rows = normalizeRows(db, season);
    writeNormalizedRows(db, rows);
    console.log(`Normalized ${rows.length} player stat rows for ${season}.`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  transformNormalizedStats();
}

module.exports = { transformNormalizedStats };
