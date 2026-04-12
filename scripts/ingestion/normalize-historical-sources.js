const { openDatabase, nowIso, withTransaction } = require('../lib/db');

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return fallback;
  }
}

function insertOrUpdateProspectHistorical(db, payload) {
  const statement = db.prepare(`
    INSERT INTO prospects_historical (
      player_id, source_player_id, player_name, season, school_team, league, class_year, age, position,
      draft_year, draft_slot, nba_team, combine_year, source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @source_player_id, @player_name, @season, @school_team, @league, @class_year, @age, @position,
      @draft_year, @draft_slot, @nba_team, @combine_year, @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season, draft_year, combine_year) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      class_year = excluded.class_year,
      age = excluded.age,
      position = excluded.position,
      draft_slot = excluded.draft_slot,
      nba_team = excluded.nba_team,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
    RETURNING id
  `);

  return statement.get(payload).id;
}

function normalizeSeasonStats(db) {
  const rows = db.prepare(`
    SELECT source_player_id, player_name, season, school_team, league, class_year, age, position, source, payload, source_last_updated
    FROM cbb_player_seasons_raw
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_season_stats (
      player_id, prospect_historical_id, source_player_id, player_name, season, school_team, league, class_year, age, position,
      games, minutes, points, rebounds, assists, steals, blocks, turnovers, fg_pct, three_pct, ft_pct,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @season, @school_team, @league, @class_year, @age, @position,
      @games, @minutes, @points, @rebounds, @assists, @steals, @blocks, @turnovers, @fg_pct, @three_pct, @ft_pct,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      class_year = excluded.class_year,
      age = excluded.age,
      position = excluded.position,
      games = excluded.games,
      minutes = excluded.minutes,
      points = excluded.points,
      rebounds = excluded.rebounds,
      assists = excluded.assists,
      steals = excluded.steals,
      blocks = excluded.blocks,
      turnovers = excluded.turnovers,
      fg_pct = excluded.fg_pct,
      three_pct = excluded.three_pct,
      ft_pct = excluded.ft_pct,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  for (const row of rows) {
    const payload = parseJson(row.payload);
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      class_year: row.class_year,
      age: row.age,
      position: row.position,
      draft_year: null,
      draft_slot: null,
      nba_team: null,
      combine_year: null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      class_year: row.class_year,
      age: row.age,
      position: row.position,
      games: payload.games ?? null,
      minutes: payload.minutes ?? null,
      points: payload.points ?? null,
      rebounds: payload.rebounds ?? null,
      assists: payload.assists ?? null,
      steals: payload.steals ?? null,
      blocks: payload.blocks ?? null,
      turnovers: payload.turnovers ?? null,
      fg_pct: payload.fgPct ?? null,
      three_pct: payload.threePct ?? null,
      ft_pct: payload.ftPct ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
  }

  return rows.length;
}

function normalizeAdvancedMetrics(db) {
  const rows = db.prepare(`
    SELECT source_player_id, player_name, season, school_team, league, position, source, payload, source_last_updated
    FROM cbb_advanced_metrics_raw
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_advanced_metrics (
      player_id, prospect_historical_id, source_player_id, player_name, season, school_team, league, age, position,
      ts_pct, efg_pct, usg_pct, ast_pct, tov_pct, stl_pct, blk_pct, bpm, obpm, dbpm,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @season, @school_team, @league, @age, @position,
      @ts_pct, @efg_pct, @usg_pct, @ast_pct, @tov_pct, @stl_pct, @blk_pct, @bpm, @obpm, @dbpm,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      age = excluded.age,
      position = excluded.position,
      ts_pct = excluded.ts_pct,
      efg_pct = excluded.efg_pct,
      usg_pct = excluded.usg_pct,
      ast_pct = excluded.ast_pct,
      tov_pct = excluded.tov_pct,
      stl_pct = excluded.stl_pct,
      blk_pct = excluded.blk_pct,
      bpm = excluded.bpm,
      obpm = excluded.obpm,
      dbpm = excluded.dbpm,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  for (const row of rows) {
    const payload = parseJson(row.payload);
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      class_year: null,
      age: payload.age ?? null,
      position: row.position,
      draft_year: null,
      draft_slot: null,
      nba_team: null,
      combine_year: null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      age: payload.age ?? null,
      position: row.position,
      ts_pct: payload.tsPct ?? null,
      efg_pct: payload.efgPct ?? null,
      usg_pct: payload.usgPct ?? null,
      ast_pct: payload.astPct ?? null,
      tov_pct: payload.tovPct ?? null,
      stl_pct: payload.stlPct ?? null,
      blk_pct: payload.blkPct ?? null,
      bpm: payload.bpm ?? null,
      obpm: payload.obpm ?? null,
      dbpm: payload.dbpm ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
  }

  return rows.length;
}

function normalizeCombineMeasurements(db) {
  const rows = db.prepare(`
    SELECT source_player_id, player_name, combine_year, position, source, payload, source_last_updated
    FROM combine_measurements_raw
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_physical_measurements (
      player_id, prospect_historical_id, source_player_id, player_name, combine_year, age, position,
      height, weight, wingspan, standing_reach, max_vertical, lane_agility, shuttle_run, sprint,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @combine_year, @age, @position,
      @height, @weight, @wingspan, @standing_reach, @max_vertical, @lane_agility, @shuttle_run, @sprint,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, combine_year) DO UPDATE SET
      player_name = excluded.player_name,
      age = excluded.age,
      position = excluded.position,
      height = excluded.height,
      weight = excluded.weight,
      wingspan = excluded.wingspan,
      standing_reach = excluded.standing_reach,
      max_vertical = excluded.max_vertical,
      lane_agility = excluded.lane_agility,
      shuttle_run = excluded.shuttle_run,
      sprint = excluded.sprint,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  for (const row of rows) {
    const payload = parseJson(row.payload);
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: null,
      school_team: null,
      league: null,
      class_year: null,
      age: payload.age ?? null,
      position: row.position,
      draft_year: null,
      draft_slot: null,
      nba_team: null,
      combine_year: row.combine_year,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      combine_year: row.combine_year,
      age: payload.age ?? null,
      position: row.position,
      height: payload.height ?? null,
      weight: payload.weight ?? null,
      wingspan: payload.wingspan ?? null,
      standing_reach: payload.standingReach ?? null,
      max_vertical: payload.maxVertical ?? null,
      lane_agility: payload.laneAgility ?? null,
      shuttle_run: payload.shuttleRun ?? null,
      sprint: payload.sprint ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
  }

  return rows.length;
}

function normalizeNbaOutcomes(db) {
  const rows = db.prepare(`
    SELECT
      d.source_player_id, d.player_name, d.draft_year, d.draft_slot, d.nba_team, d.source, d.source_last_updated,
      d.payload AS draft_payload, o.payload AS outcome_payload
    FROM nba_draft_history_raw d
    LEFT JOIN nba_player_outcomes_raw o
      ON o.source = d.source
      AND o.source_player_id = d.source_player_id
      AND o.draft_year = d.draft_year
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_nba_outcomes (
      player_id, prospect_historical_id, source_player_id, player_name, draft_year, draft_slot, nba_team,
      nba_games, nba_minutes, nba_points, nba_rebounds, nba_assists, nba_bpm,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @draft_year, @draft_slot, @nba_team,
      @nba_games, @nba_minutes, @nba_points, @nba_rebounds, @nba_assists, @nba_bpm,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, draft_year) DO UPDATE SET
      player_name = excluded.player_name,
      draft_slot = excluded.draft_slot,
      nba_team = excluded.nba_team,
      nba_games = excluded.nba_games,
      nba_minutes = excluded.nba_minutes,
      nba_points = excluded.nba_points,
      nba_rebounds = excluded.nba_rebounds,
      nba_assists = excluded.nba_assists,
      nba_bpm = excluded.nba_bpm,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  for (const row of rows) {
    const payload = parseJson(row.outcome_payload || row.draft_payload);
    const draftPayload = parseJson(row.draft_payload);
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: null,
      school_team: draftPayload.schoolTeam ?? null,
      league: null,
      class_year: null,
      age: null,
      position: draftPayload.position ?? null,
      draft_year: row.draft_year,
      draft_slot: row.draft_slot,
      nba_team: row.nba_team,
      combine_year: null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      draft_year: row.draft_year,
      draft_slot: row.draft_slot,
      nba_team: row.nba_team,
      nba_games: payload.nbaGames ?? null,
      nba_minutes: payload.nbaMinutes ?? null,
      nba_points: payload.nbaPoints ?? null,
      nba_rebounds: payload.nbaRebounds ?? null,
      nba_assists: payload.nbaAssists ?? null,
      nba_bpm: payload.nbaBpm ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
  }

  return rows.length;
}

function normalizeHistoricalSources() {
  const db = openDatabase();
  const startedAt = nowIso();

  try {
    let records = 0;
    withTransaction(db, () => {
      records += normalizeSeasonStats(db);
      records += normalizeAdvancedMetrics(db);
      records += normalizeCombineMeasurements(db);
      records += normalizeNbaOutcomes(db);
    });

    db.prepare(`
      INSERT INTO source_sync_log (
        source, sync_type, season, status, started_at, finished_at,
        records_fetched, records_written, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'HistoricalNormalization',
      'historical-normalize',
      'historical',
      'success',
      startedAt,
      nowIso(),
      records,
      records,
      JSON.stringify({
        normalizedTables: [
          'prospects_historical',
          'prospect_season_stats',
          'prospect_advanced_metrics',
          'prospect_physical_measurements',
          'prospect_nba_outcomes',
        ],
      }),
    );

    console.log(`Normalized ${records} historical source rows into Prospera tables.`);
  } catch (error) {
    db.prepare(`
      INSERT INTO source_sync_log (
        source, sync_type, season, status, started_at, finished_at,
        records_fetched, records_written, error_message, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'HistoricalNormalization',
      'historical-normalize',
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
  normalizeHistoricalSources();
}

module.exports = { normalizeHistoricalSources };
