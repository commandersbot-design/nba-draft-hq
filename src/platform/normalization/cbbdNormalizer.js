const { normalizeName } = require('./entityResolver');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function seasonBounds(seasonKey) {
  const match = String(seasonKey || '').match(/(\d{4})-(\d{2})/);
  if (!match) {
    return { startYear: 0, endYear: 0, label: seasonKey };
  }

  const startYear = Number(match[1]);
  const endYear = Number(`${String(startYear).slice(0, 2)}${match[2]}`);
  return {
    startYear,
    endYear,
    label: `${startYear}-${endYear}`,
  };
}

function ensureLeague(db, { slug, name, level, country }) {
  const insert = db.prepare(`
    INSERT INTO leagues (slug, name, level, country)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      level = excluded.level,
      country = excluded.country,
      updated_at = CURRENT_TIMESTAMP
  `);
  insert.run(slug, name, level, country);
  return db.prepare('SELECT id FROM leagues WHERE slug = ?').get(slug).id;
}

function ensureSeason(db, { seasonKey, leagueId }) {
  const bounds = seasonBounds(seasonKey);
  const insert = db.prepare(`
    INSERT INTO seasons (season_key, label, start_year, end_year, league_id, is_historical)
    VALUES (?, ?, ?, ?, ?, 0)
    ON CONFLICT(season_key) DO UPDATE SET
      label = excluded.label,
      start_year = excluded.start_year,
      end_year = excluded.end_year,
      league_id = excluded.league_id,
      updated_at = CURRENT_TIMESTAMP
  `);
  insert.run(seasonKey, bounds.label, bounds.startYear, bounds.endYear, leagueId);
  return db.prepare('SELECT id FROM seasons WHERE season_key = ?').get(seasonKey).id;
}

function ensureTeam(db, { teamName, leagueId }) {
  const slug = slugify(teamName);
  const insert = db.prepare(`
    INSERT INTO teams (slug, name, school_name, league_id, is_active)
    VALUES (?, ?, ?, ?, 1)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      school_name = excluded.school_name,
      league_id = excluded.league_id,
      updated_at = CURRENT_TIMESTAMP
  `);
  insert.run(slug, teamName, teamName, leagueId);
  return db.prepare('SELECT id FROM teams WHERE slug = ?').get(slug).id;
}

function ensurePlayerAlias(db, { playerId, alias, source }) {
  if (!alias) return;
  const stmt = db.prepare(`
    INSERT INTO player_aliases (player_id, alias, alias_type, source, confidence, is_primary)
    VALUES (?, ?, 'source', ?, 0.95, 0)
    ON CONFLICT(player_id, alias, alias_type) DO UPDATE SET
      source = excluded.source,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(playerId, alias, source);
}

function upsertAdvancedStats(db, {
  playerId,
  seasonId,
  teamId,
  stats,
  sourceRecordId,
}) {
  const stmt = db.prepare(`
    INSERT INTO advanced_stats (
      player_id, season_id, team_id, bpm, ts_pct, efg_pct, usage_rate, assist_rate,
      turnover_rate, source_record_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tsPct = stats.tsPct ?? stats.ts_pct ?? null;
  const efgPct = stats.efgPct ?? stats.efg_pct ?? stats.fgPct ?? null;
  const usageRate = stats.usgPct ?? stats.usg_pct ?? null;
  const assistRate = stats.astPct ?? stats.ast_pct ?? null;
  const turnoverRate = stats.tovPct ?? stats.tov_pct ?? null;
  const bpm = stats.bpm ?? null;

  stmt.run(
    playerId,
    seasonId,
    teamId,
    bpm,
    tsPct,
    efgPct,
    usageRate,
    assistRate,
    turnoverRate,
    sourceRecordId || null,
  );
}

function ensureGame(db, { externalGameKey, seasonId, leagueId, gameDate, homeTeamId, awayTeamId, source }) {
  const insert = db.prepare(`
    INSERT INTO games (external_game_key, season_id, league_id, game_date, home_team_id, away_team_id, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, external_game_key) DO UPDATE SET
      season_id = excluded.season_id,
      league_id = excluded.league_id,
      game_date = excluded.game_date,
      home_team_id = excluded.home_team_id,
      away_team_id = excluded.away_team_id,
      updated_at = CURRENT_TIMESTAMP
  `);
  insert.run(externalGameKey, seasonId, leagueId, gameDate, homeTeamId, awayTeamId, source);
  return db.prepare('SELECT id FROM games WHERE source = ? AND external_game_key = ?').get(source, externalGameKey).id;
}

function upsertBoxScore(db, {
  gameId,
  playerId,
  teamId,
  seasonId,
  gameLog,
  sourceRecordId,
}) {
  const insert = db.prepare(`
    INSERT INTO box_scores (
      game_id, player_id, team_id, season_id, minutes, points, rebounds, assists,
      steals, blocks, turnovers, source_record_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(game_id, player_id) DO UPDATE SET
      team_id = excluded.team_id,
      season_id = excluded.season_id,
      minutes = excluded.minutes,
      points = excluded.points,
      rebounds = excluded.rebounds,
      assists = excluded.assists,
      steals = excluded.steals,
      blocks = excluded.blocks,
      turnovers = excluded.turnovers
  `);

  insert.run(
    gameId,
    playerId,
    teamId,
    seasonId,
    gameLog.minutes || null,
    gameLog.points || null,
    gameLog.rebounds || null,
    gameLog.assists || null,
    gameLog.steals || null,
    gameLog.blocks || null,
    gameLog.turnovers || null,
    sourceRecordId || null,
  );
}

module.exports = {
  ensureLeague,
  ensurePlayerAlias,
  ensureSeason,
  ensureTeam,
  ensureGame,
  seasonBounds,
  slugify,
  upsertAdvancedStats,
  upsertBoxScore,
};
