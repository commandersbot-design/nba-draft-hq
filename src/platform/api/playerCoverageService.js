function getPlayerMeasurementCoverage(db, playerId) {
  const player = db.prepare(`
    SELECT id, first_name, last_name, college, draft_class
    FROM players
    WHERE id = ?
  `).get(playerId);

  if (!player) {
    return null;
  }

  const measurement = db.prepare(`
    SELECT
      m.id,
      m.measurement_context,
      m.height_inches,
      m.weight_lbs,
      m.wingspan_inches,
      m.standing_reach_inches,
      m.max_vertical,
      m.lane_agility,
      m.shuttle_run,
      m.three_quarter_sprint,
      sr.source_name,
      sr.snapshot_path,
      sr.source_last_updated
    FROM measurements m
    LEFT JOIN source_records sr ON sr.id = m.source_record_id
    WHERE m.player_id = ?
    ORDER BY m.updated_at DESC, m.id DESC
    LIMIT 1
  `).get(playerId);

  const aliases = db.prepare(`
    SELECT alias, alias_type, source, confidence
    FROM player_aliases
    WHERE player_id = ?
    ORDER BY is_primary DESC, confidence DESC, id ASC
  `).all(playerId);

  const historicalCoverage = db.prepare(`
    SELECT COUNT(*) AS count
    FROM prospect_physical_measurements
    WHERE player_id = ?
  `).get(playerId);

  const rawCoverage = db.prepare(`
    SELECT COUNT(*) AS count
    FROM combine_measurements_raw
    WHERE LOWER(player_name) = LOWER(?)
  `).get(`${player.first_name} ${player.last_name}`);

  return {
    player: {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      college: player.college,
      draftClass: player.draft_class,
    },
    measurement: measurement || null,
    aliases,
    coverage: {
      hasPlayerLinkedMeasurement: Boolean(measurement),
      historicalMeasurementCount: historicalCoverage.count,
      rawNameMatchCount: rawCoverage.count,
    },
  };
}

function getMeasurementCoverageSummary(db) {
  const playersWithMeasurements = db.prepare(`
    SELECT COUNT(DISTINCT player_id) AS count
    FROM measurements
    WHERE measurement_context = 'draft-combine'
  `).get().count;

  const playersTotal = db.prepare(`
    SELECT COUNT(*) AS count
    FROM players
  `).get().count;

  const rawRows = db.prepare(`
    SELECT COUNT(*) AS count
    FROM combine_measurements_raw
  `).get().count;

  const historicalRows = db.prepare(`
    SELECT COUNT(*) AS count
    FROM prospect_physical_measurements
    WHERE source = 'NBA.com Draft Combine'
  `).get().count;

  const runSummary = db.prepare(`
    SELECT
      source_name,
      status,
      records_seen,
      records_written,
      records_rejected,
      finished_at,
      metadata_json
    FROM ingestion_runs
    WHERE source_name = 'NBA.com Draft Combine'
    ORDER BY id DESC
    LIMIT 1
  `).get();

  return {
    playersTotal,
    playersWithMeasurements,
    rawRows,
    historicalRows,
    latestRun: runSummary || null,
  };
}

function getOverrideValidation(db, { sourceName, externalId }) {
  if (!sourceName || !externalId) {
    return null;
  }

  const override = db.prepare(`
    SELECT source_name, external_id, player_id, confidence_override, notes, updated_at
    FROM entity_resolution_overrides
    WHERE source_name = ? AND external_id = ?
  `).get(sourceName, externalId);

  const historicalMeasurement = db.prepare(`
    SELECT
      ppm.player_id,
      ppm.player_name,
      ppm.combine_year,
      ppm.position,
      ppm.height,
      ppm.weight,
      ppm.wingspan
    FROM prospect_physical_measurements ppm
    WHERE ppm.source = ? AND ppm.source_player_id = ?
    ORDER BY ppm.updated_at DESC, ppm.id DESC
    LIMIT 1
  `).get(sourceName, externalId);

  const sourceRecord = db.prepare(`
    SELECT id, source_name, entity_type, source_last_updated, snapshot_path
    FROM source_records
    WHERE source_name = ? AND external_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(sourceName, externalId);

  let player = null;
  let measurement = null;
  let draftInfo = null;

  const resolvedPlayerId = historicalMeasurement?.player_id || override?.player_id || null;
  if (resolvedPlayerId) {
    player = db.prepare(`
      SELECT id, first_name, last_name, college, draft_class
      FROM players
      WHERE id = ?
    `).get(resolvedPlayerId);

    measurement = db.prepare(`
      SELECT
        id,
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
      FROM measurements
      WHERE player_id = ?
      ORDER BY updated_at DESC, id DESC
      LIMIT 1
    `).get(resolvedPlayerId);

    draftInfo = db.prepare(`
      SELECT
        draft_year,
        age_on_draft_night,
        combine_invite,
        source_record_id
      FROM draft_info
      WHERE player_id = ?
      LIMIT 1
    `).get(resolvedPlayerId);
  }

  return {
    sourceName,
    externalId,
    override: override || null,
    historicalMeasurement: historicalMeasurement || null,
    player: player
      ? {
          id: player.id,
          name: `${player.first_name} ${player.last_name}`,
          college: player.college,
          draftClass: player.draft_class,
        }
      : null,
    measurementLinked: Boolean(measurement),
    draftInfoLinked: Boolean(draftInfo),
    measurement: measurement || null,
    draftInfo: draftInfo || null,
    sourceRecord: sourceRecord || null,
  };
}

module.exports = {
  getMeasurementCoverageSummary,
  getPlayerMeasurementCoverage,
  getOverrideValidation,
};
