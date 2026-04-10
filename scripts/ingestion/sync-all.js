const fs = require('fs');
const path = require('path');
const { openDatabase, nowIso, withTransaction } = require('../lib/db');
const { migrateIngestionSchema } = require('./migrate-ingestion');
const { seedProspects } = require('./seed-prospects');
const { fetchCollegeBasketballData } = require('./sources/collegeBasketballData');
const { fetchBartTorvikDataset } = require('./sources/bartTorvikDataset');

const PROSPECTS_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospects.json');

function parseSeasonArg() {
  const seasonArg = process.argv.find((arg) => arg.startsWith('--season='));
  return seasonArg ? seasonArg.split('=')[1] : '2025-26';
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildPlayerLookup(db) {
  const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
  const playerLookup = new Map();
  const selectPlayer = db.prepare('SELECT id FROM players WHERE first_name = ? AND last_name = ? AND draft_class = ? LIMIT 1');

  for (const prospect of prospects) {
    const parts = prospect.name.split(/\s+/);
    const firstName = parts.shift();
    const lastName = parts.join(' ');
    const row = selectPlayer.get(firstName, lastName, 2026);
    if (row) {
      playerLookup.set(normalizeName(prospect.name), row.id);
    }
  }

  return playerLookup;
}

function startSyncLog(db, source, syncType, season, metadata) {
  const insert = db.prepare(`
    INSERT INTO source_sync_log (source, sync_type, season, status, metadata_json)
    VALUES (?, ?, ?, 'running', ?)
  `);
  return insert.run(source, syncType, season, JSON.stringify(metadata || {})).lastInsertRowid;
}

function finishSyncLog(db, id, status, recordsFetched, recordsWritten, metadata, errorMessage = null) {
  const update = db.prepare(`
    UPDATE source_sync_log
    SET status = ?,
        finished_at = CURRENT_TIMESTAMP,
        records_fetched = ?,
        records_written = ?,
        error_message = ?,
        metadata_json = ?
    WHERE id = ?
  `);
  update.run(status, recordsFetched, recordsWritten, errorMessage, JSON.stringify(metadata || {}), id);
}

function upsertRawStats(db, rows) {
  const stmt = db.prepare(`
    INSERT INTO player_stats_raw (player_id, season, source, external_player_key, payload, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id, season, source, external_player_key)
    DO UPDATE SET payload = excluded.payload, last_updated = excluded.last_updated
  `);

  for (const row of rows) {
    stmt.run(row.playerId, row.season, row.source, row.externalPlayerKey, JSON.stringify(row.payload), nowIso());
  }
}

function upsertGameLogs(db, rows) {
  const stmt = db.prepare(`
    INSERT INTO player_game_logs_raw (player_id, season, source, external_game_key, game_date, opponent, payload, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id, source, external_game_key)
    DO UPDATE SET payload = excluded.payload, game_date = excluded.game_date, opponent = excluded.opponent, last_updated = excluded.last_updated
  `);

  for (const row of rows) {
    stmt.run(row.playerId, row.season, row.source, row.externalGameKey, row.gameDate, row.opponent, JSON.stringify(row.payload), nowIso());
  }
}

async function syncSource(db, fetcher, options) {
  const result = await fetcher(options);
  const logId = startSyncLog(db, result.source, 'ingest', result.season, result.metadata);

  try {
    withTransaction(db, () => {
      upsertRawStats(db, result.stats || []);
      upsertGameLogs(db, result.gameLogs || []);
    });

    finishSyncLog(
      db,
      logId,
      'success',
      (result.stats || []).length + (result.gameLogs || []).length,
      (result.stats || []).length + (result.gameLogs || []).length,
      result.metadata,
    );
  } catch (error) {
    finishSyncLog(
      db,
      logId,
      'error',
      (result.stats || []).length + (result.gameLogs || []).length,
      0,
      result.metadata,
      error.message,
    );
    throw error;
  }

  return result;
}

async function syncAll() {
  migrateIngestionSchema();
  seedProspects();

  const db = openDatabase();
  try {
    const season = parseSeasonArg();
    const playerLookup = buildPlayerLookup(db);

    const cbbd = await syncSource(db, fetchCollegeBasketballData, { season, playerLookup });
    const torvik = await syncSource(db, fetchBartTorvikDataset, { season, playerLookup });

    console.log(`Synced ${cbbd.stats.length} CollegeBasketballData stat rows and ${cbbd.gameLogs.length} game logs.`);
    console.log(`Synced ${torvik.stats.length} Bart Torvik advanced stat rows.`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  syncAll().catch((error) => {
    console.error('Ingestion sync failed:', error);
    process.exit(1);
  });
}

module.exports = { syncAll };
