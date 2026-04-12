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

module.exports = {
  getMeasurementCoverageSummary,
  getPlayerMeasurementCoverage,
};
