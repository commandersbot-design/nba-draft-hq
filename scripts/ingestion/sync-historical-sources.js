const { openDatabase, nowIso, withTransaction } = require('../lib/db');
const { fetchCollegeBasketballDataHistorical } = require('./sources/collegeBasketballDataHistorical');
const { fetchSportsReferenceHistorical } = require('./sources/sportsReferenceHistorical');
const { fetchBartTorvikHistorical } = require('./sources/bartTorvikHistorical');
const { fetchBasketballReferenceHistorical } = require('./sources/basketballReferenceHistorical');
const { fetchNbaStatsCombineHistorical } = require('./sources/nbaStatsCombineHistorical');

function syncLogStatement(db) {
  return db.prepare(`
    INSERT INTO source_sync_log (
      source,
      sync_type,
      season,
      status,
      started_at,
      finished_at,
      records_fetched,
      records_written,
      error_message,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
}

function logSuccess(statement, dataset, startedAt, recordsWritten) {
  statement.run(
    dataset.source,
    dataset.metadata.syncTypes?.join(',') || 'historical-sync',
    dataset.season,
    'success',
    startedAt,
    nowIso(),
    dataset.rows.length,
    recordsWritten,
    null,
    JSON.stringify(dataset.metadata),
  );
}

function logError(statement, source, startedAt, error) {
  statement.run(
    source,
    'historical-sync',
    'historical',
    'error',
    startedAt,
    nowIso(),
    0,
    0,
    error.message,
    JSON.stringify({ error: error.message }),
  );
}

function syncSeasonRows(db, dataset) {
  const upsert = db.prepare(`
    INSERT INTO cbb_player_seasons_raw (
      source_player_id, player_name, season, school_team, league, class_year, age, position,
      source, payload, source_last_updated, updated_at
    ) VALUES (
      @source_player_id, @player_name, @season, @school_team, @league, @class_year, @age, @position,
      @source, @payload, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      class_year = excluded.class_year,
      age = excluded.age,
      position = excluded.position,
      payload = excluded.payload,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  withTransaction(db, () => {
    for (const row of dataset.rows) {
      const timestamp = nowIso();
      upsert.run({
        source_player_id: row.sourcePlayerId,
        player_name: row.playerName,
        season: row.season,
        school_team: row.schoolTeam,
        league: row.league,
        class_year: row.classYear,
        age: row.age,
        position: row.position,
        source: dataset.source,
        payload: JSON.stringify(row),
        source_last_updated: timestamp,
        updated_at: timestamp,
      });
    }
  });

  return dataset.rows.length;
}

function syncAdvancedRows(db, dataset) {
  const upsert = db.prepare(`
    INSERT INTO cbb_advanced_metrics_raw (
      source_player_id, player_name, season, school_team, league, position,
      source, payload, source_last_updated, updated_at
    ) VALUES (
      @source_player_id, @player_name, @season, @school_team, @league, @position,
      @source, @payload, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      position = excluded.position,
      payload = excluded.payload,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  withTransaction(db, () => {
    for (const row of dataset.rows) {
      const timestamp = nowIso();
      upsert.run({
        source_player_id: row.sourcePlayerId,
        player_name: row.playerName,
        season: row.season,
        school_team: row.schoolTeam,
        league: row.league,
        position: row.position,
        source: dataset.source,
        payload: JSON.stringify(row),
        source_last_updated: timestamp,
        updated_at: timestamp,
      });
    }
  });

  return dataset.rows.length;
}

function syncDraftOutcomeRows(db, dataset) {
  const draftUpsert = db.prepare(`
    INSERT INTO nba_draft_history_raw (
      source_player_id, player_name, draft_year, draft_slot, nba_team, position, school_team,
      source, payload, source_last_updated, updated_at
    ) VALUES (
      @source_player_id, @player_name, @draft_year, @draft_slot, @nba_team, @position, @school_team,
      @source, @payload, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, draft_year) DO UPDATE SET
      player_name = excluded.player_name,
      draft_slot = excluded.draft_slot,
      nba_team = excluded.nba_team,
      position = excluded.position,
      school_team = excluded.school_team,
      payload = excluded.payload,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  const outcomeUpsert = db.prepare(`
    INSERT INTO nba_player_outcomes_raw (
      source_player_id, player_name, draft_year, nba_team, source, payload, source_last_updated, updated_at
    ) VALUES (
      @source_player_id, @player_name, @draft_year, @nba_team, @source, @payload, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, draft_year) DO UPDATE SET
      player_name = excluded.player_name,
      nba_team = excluded.nba_team,
      payload = excluded.payload,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  withTransaction(db, () => {
    for (const row of dataset.rows) {
      const timestamp = nowIso();
      const payload = JSON.stringify(row);
      draftUpsert.run({
        source_player_id: row.sourcePlayerId,
        player_name: row.playerName,
        draft_year: row.draftYear,
        draft_slot: row.draftSlot,
        nba_team: row.nbaTeam,
        position: row.position,
        school_team: row.schoolTeam,
        source: dataset.source,
        payload,
        source_last_updated: timestamp,
        updated_at: timestamp,
      });
      outcomeUpsert.run({
        source_player_id: row.sourcePlayerId,
        player_name: row.playerName,
        draft_year: row.draftYear,
        nba_team: row.nbaTeam,
        source: dataset.source,
        payload,
        source_last_updated: timestamp,
        updated_at: timestamp,
      });
    }
  });

  return dataset.rows.length * 2;
}

function syncCombineRows(db, dataset) {
  const upsert = db.prepare(`
    INSERT INTO combine_measurements_raw (
      source_player_id, player_name, combine_year, position, source, payload, source_last_updated, updated_at
    ) VALUES (
      @source_player_id, @player_name, @combine_year, @position, @source, @payload, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, combine_year) DO UPDATE SET
      player_name = excluded.player_name,
      position = excluded.position,
      payload = excluded.payload,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  withTransaction(db, () => {
    for (const row of dataset.rows) {
      const timestamp = nowIso();
      upsert.run({
        source_player_id: row.sourcePlayerId,
        player_name: row.playerName,
        combine_year: row.combineYear,
        position: row.position,
        source: dataset.source,
        payload: JSON.stringify(row),
        source_last_updated: timestamp,
        updated_at: timestamp,
      });
    }
  });

  return dataset.rows.length;
}

async function syncHistoricalSources() {
  const db = openDatabase();
  const log = syncLogStatement(db);
  const jobs = [
    { source: 'CollegeBasketballData', fetch: fetchCollegeBasketballDataHistorical, write: syncSeasonRows },
    { source: 'Sports Reference', fetch: fetchSportsReferenceHistorical, write: syncSeasonRows },
    { source: 'Bart Torvik', fetch: fetchBartTorvikHistorical, write: syncAdvancedRows },
    { source: 'Basketball Reference', fetch: fetchBasketballReferenceHistorical, write: syncDraftOutcomeRows },
    { source: 'NBA.com Stats', fetch: fetchNbaStatsCombineHistorical, write: syncCombineRows },
  ];

  try {
    for (const job of jobs) {
      const startedAt = nowIso();
      try {
        const dataset = await job.fetch();
        const recordsWritten = job.write(db, dataset);
        logSuccess(log, dataset, startedAt, recordsWritten);
        console.log(`Synced ${dataset.rows.length} rows from ${dataset.source}.`);
      } catch (error) {
        logError(log, job.source, startedAt, error);
        throw error;
      }
    }
  } finally {
    db.close();
  }
}

if (require.main === module) {
  syncHistoricalSources();
}

module.exports = { syncHistoricalSources };
