const { openDatabase, nowIso, withTransaction } = require('../lib/db');
const { fetchHistoricalDataset } = require('./sources/historicalDataset');

function toNumber(value, fallback = null) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim();
}

async function syncHistoricalProspects() {
  const db = openDatabase();
  const startedAt = nowIso();
  const syncLog = db.prepare(`
    INSERT INTO source_sync_log (
      source,
      sync_type,
      season,
      status,
      started_at,
      finished_at,
      records_fetched,
      records_written,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const dataset = await fetchHistoricalDataset();
    const upsert = db.prepare(`
      INSERT INTO historical_prospects_raw (
        historical_id,
        draft_year,
        draft_slot,
        player_name,
        position,
        school,
        height,
        age,
        archetype,
        role_outcome,
        outcome_tier,
        points_per_game,
        rebounds_per_game,
        assists_per_game,
        true_shooting,
        bpm,
        notes,
        source,
        payload,
        last_updated,
        updated_at
      ) VALUES (
        @historical_id,
        @draft_year,
        @draft_slot,
        @player_name,
        @position,
        @school,
        @height,
        @age,
        @archetype,
        @role_outcome,
        @outcome_tier,
        @points_per_game,
        @rebounds_per_game,
        @assists_per_game,
        @true_shooting,
        @bpm,
        @notes,
        @source,
        @payload,
        @last_updated,
        @updated_at
      )
      ON CONFLICT(historical_id) DO UPDATE SET
        draft_year = excluded.draft_year,
        draft_slot = excluded.draft_slot,
        player_name = excluded.player_name,
        position = excluded.position,
        school = excluded.school,
        height = excluded.height,
        age = excluded.age,
        archetype = excluded.archetype,
        role_outcome = excluded.role_outcome,
        outcome_tier = excluded.outcome_tier,
        points_per_game = excluded.points_per_game,
        rebounds_per_game = excluded.rebounds_per_game,
        assists_per_game = excluded.assists_per_game,
        true_shooting = excluded.true_shooting,
        bpm = excluded.bpm,
        notes = excluded.notes,
        source = excluded.source,
        payload = excluded.payload,
        last_updated = excluded.last_updated,
        updated_at = excluded.updated_at
    `);

    withTransaction(db, () => {
      for (const row of dataset.rows) {
        const timestamp = nowIso();
        upsert.run({
          historical_id: toString(row.id),
          draft_year: toNumber(row.draftYear, 0),
          draft_slot: toNumber(row.draftSlot, 999),
          player_name: toString(row.name),
          position: toString(row.position),
          school: toString(row.school),
          height: toString(row.height),
          age: toNumber(row.age, null),
          archetype: toString(row.archetype),
          role_outcome: toString(row.roleOutcome),
          outcome_tier: toString(row.outcomeTier),
          points_per_game: toNumber(row.pointsPerGame, null),
          rebounds_per_game: toNumber(row.reboundsPerGame, null),
          assists_per_game: toNumber(row.assistsPerGame, null),
          true_shooting: toString(row.trueShooting),
          bpm: toNumber(row.bpm, null),
          notes: toString(row.notes),
          source: dataset.source,
          payload: JSON.stringify(row),
          last_updated: timestamp,
          updated_at: timestamp,
        });
      }
    });

    syncLog.run(
      dataset.source,
      'historical-sync',
      dataset.season,
      'success',
      startedAt,
      nowIso(),
      dataset.rows.length,
      dataset.rows.length,
      JSON.stringify(dataset.metadata),
    );

    console.log(`Synced ${dataset.rows.length} historical records into SQLite from ${dataset.metadata.datasetPath}.`);
  } catch (error) {
    syncLog.run(
      'HistoricalDatasetImport',
      'historical-sync',
      'historical',
      'error',
      startedAt,
      nowIso(),
      0,
      0,
      JSON.stringify({ error: error.message }),
    );
    throw error;
  } finally {
    db.close();
  }
}

if (require.main === module) {
  syncHistoricalProspects();
}

module.exports = { syncHistoricalProspects };
