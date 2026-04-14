const { ensurePlayerAlias } = require('./cbbdNormalizer');

function feetInchesToNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;

  const normalized = String(value).trim();
  const dashMatch = normalized.match(/^(\d+)\s*[-']\s*(\d+(?:\.\d+)?)$/);
  if (dashMatch) {
    return (Number(dashMatch[1]) * 12) + Number(dashMatch[2]);
  }

  const feetInchesMatch = normalized.match(/^(\d+)\s*'\s*(\d+(?:\.\d+)?)"?$/);
  if (feetInchesMatch) {
    return (Number(feetInchesMatch[1]) * 12) + Number(feetInchesMatch[2]);
  }

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function numericOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function combineSeasonKey(combineYear) {
  const year = numericOrNull(combineYear);
  if (!year) return null;
  return `${year}-${String(year + 1).slice(-2)}`;
}

function upsertMeasurement(db, {
  playerId,
  seasonId,
  measurement,
  sourceRecordId,
}) {
  const existing = db.prepare(`
    SELECT id
    FROM measurements
    WHERE player_id = ? AND season_id = ? AND measurement_context = 'draft-combine'
    ORDER BY id DESC
    LIMIT 1
  `).get(playerId, seasonId);

  const values = [
    feetInchesToNumber(measurement.height),
    numericOrNull(measurement.weight),
    feetInchesToNumber(measurement.wingspan),
    feetInchesToNumber(measurement.standingReach),
    numericOrNull(measurement.maxVertical),
    numericOrNull(measurement.laneAgility),
    numericOrNull(measurement.shuttleRun),
    numericOrNull(measurement.sprint),
    sourceRecordId || null,
  ];

  if (existing) {
    db.prepare(`
      UPDATE measurements
      SET height_inches = ?,
          weight_lbs = ?,
          wingspan_inches = ?,
          standing_reach_inches = ?,
          max_vertical = ?,
          lane_agility = ?,
          shuttle_run = ?,
          three_quarter_sprint = ?,
          source_record_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...values, existing.id);
    return existing.id;
  }

  const result = db.prepare(`
    INSERT INTO measurements (
      player_id,
      season_id,
      measurement_context,
      height_inches,
      weight_lbs,
      wingspan_inches,
      standing_reach_inches,
      max_vertical,
      lane_agility,
      shuttle_run,
      three_quarter_sprint,
      source_record_id
    ) VALUES (?, ?, 'draft-combine', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    playerId,
    seasonId,
    ...values,
  );

  return result.lastInsertRowid;
}

function upsertDraftInfo(db, {
  playerId,
  measurement,
  sourceRecordId,
}) {
  const stmt = db.prepare(`
    INSERT INTO draft_info (
      player_id,
      draft_year,
      age_on_draft_night,
      combine_invite,
      source_record_id
    ) VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      draft_year = COALESCE(excluded.draft_year, draft_info.draft_year),
      age_on_draft_night = COALESCE(excluded.age_on_draft_night, draft_info.age_on_draft_night),
      combine_invite = 1,
      source_record_id = COALESCE(excluded.source_record_id, draft_info.source_record_id),
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    playerId,
    numericOrNull(measurement.combineYear),
    numericOrNull(measurement.age),
    sourceRecordId || null,
  );
}

function upsertHistoricalProspect(db, {
  playerId,
  measurement,
  sourceName,
}) {
  const stmt = db.prepare(`
    INSERT INTO prospects_historical (
      player_id,
      source_player_id,
      player_name,
      season,
      draft_year,
      combine_year,
      age,
      position,
      source,
      source_last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(source, source_player_id, season, draft_year, combine_year) DO UPDATE SET
      player_id = COALESCE(excluded.player_id, prospects_historical.player_id),
      player_name = excluded.player_name,
      age = COALESCE(excluded.age, prospects_historical.age),
      position = COALESCE(excluded.position, prospects_historical.position),
      source_last_updated = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    playerId || null,
    measurement.sourcePlayerId,
    measurement.playerName,
    combineSeasonKey(measurement.combineYear),
    numericOrNull(measurement.combineYear),
    numericOrNull(measurement.combineYear),
    numericOrNull(measurement.age),
    measurement.position || null,
    sourceName,
  );

  return db.prepare(`
    SELECT id
    FROM prospects_historical
    WHERE source = ? AND source_player_id = ? AND combine_year = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(sourceName, measurement.sourcePlayerId, numericOrNull(measurement.combineYear)).id;
}

function upsertHistoricalMeasurement(db, {
  playerId,
  prospectHistoricalId,
  measurement,
  sourceName,
}) {
  const stmt = db.prepare(`
    INSERT INTO prospect_physical_measurements (
      player_id,
      prospect_historical_id,
      source_player_id,
      player_name,
      combine_year,
      age,
      position,
      height,
      weight,
      wingspan,
      standing_reach,
      max_vertical,
      lane_agility,
      shuttle_run,
      sprint,
      source,
      source_last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(source, source_player_id, combine_year) DO UPDATE SET
      player_id = COALESCE(excluded.player_id, prospect_physical_measurements.player_id),
      prospect_historical_id = COALESCE(excluded.prospect_historical_id, prospect_physical_measurements.prospect_historical_id),
      player_name = excluded.player_name,
      age = COALESCE(excluded.age, prospect_physical_measurements.age),
      position = COALESCE(excluded.position, prospect_physical_measurements.position),
      height = COALESCE(excluded.height, prospect_physical_measurements.height),
      weight = COALESCE(excluded.weight, prospect_physical_measurements.weight),
      wingspan = COALESCE(excluded.wingspan, prospect_physical_measurements.wingspan),
      standing_reach = COALESCE(excluded.standing_reach, prospect_physical_measurements.standing_reach),
      max_vertical = COALESCE(excluded.max_vertical, prospect_physical_measurements.max_vertical),
      lane_agility = COALESCE(excluded.lane_agility, prospect_physical_measurements.lane_agility),
      shuttle_run = COALESCE(excluded.shuttle_run, prospect_physical_measurements.shuttle_run),
      sprint = COALESCE(excluded.sprint, prospect_physical_measurements.sprint),
      source_last_updated = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    playerId || null,
    prospectHistoricalId || null,
    measurement.sourcePlayerId,
    measurement.playerName,
    numericOrNull(measurement.combineYear),
    numericOrNull(measurement.age),
    measurement.position || null,
    measurement.height || null,
    numericOrNull(measurement.weight),
    measurement.wingspan || null,
    measurement.standingReach || null,
    numericOrNull(measurement.maxVertical),
    numericOrNull(measurement.laneAgility),
    numericOrNull(measurement.shuttleRun),
    numericOrNull(measurement.sprint),
    sourceName,
  );
}

function normalizeNbaCombineRow(db, {
  playerId,
  seasonId,
  measurement,
  sourceName,
  sourceRecordId,
}) {
  const prospectHistoricalId = upsertHistoricalProspect(db, {
    playerId,
    measurement,
    sourceName,
  });

  upsertHistoricalMeasurement(db, {
    playerId,
    prospectHistoricalId,
    measurement,
    sourceName,
  });

  if (!playerId) {
    return {
      historicalRecord: true,
      playerLinkedRecord: false,
    };
  }

  ensurePlayerAlias(db, {
    playerId,
    alias: measurement.sourcePlayerId || measurement.playerName,
    source: sourceName,
  });

  upsertMeasurement(db, {
    playerId,
    seasonId,
    measurement,
    sourceRecordId,
  });

  upsertDraftInfo(db, {
    playerId,
    measurement,
    sourceRecordId,
  });

  return {
    historicalRecord: true,
    playerLinkedRecord: true,
  };
}

module.exports = {
  combineSeasonKey,
  feetInchesToNumber,
  normalizeNbaCombineRow,
  numericOrNull,
  upsertDraftInfo,
  upsertMeasurement,
};
