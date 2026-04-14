function getFailedRecords(db, { sourceName = 'NBA.com Draft Combine', limit = 25 } = {}) {
  const numericLimit = Number.isFinite(Number(limit)) ? Number(limit) : 25;

  const unresolvedMeasurements = db.prepare(`
    SELECT
      'prospect_physical_measurements' AS record_type,
      ppm.source AS source_name,
      ppm.source_player_id AS external_id,
      ppm.player_name,
      ppm.combine_year,
      ppm.position,
      ppm.height,
      ppm.weight,
      ppm.wingspan,
      'unmatched-player' AS failure_reason
    FROM prospect_physical_measurements ppm
    WHERE ppm.player_id IS NULL
      AND ppm.source = ?
    GROUP BY ppm.source, ppm.source_player_id, ppm.combine_year
    ORDER BY ppm.combine_year DESC, ppm.player_name ASC
    LIMIT ?
  `).all(sourceName, numericLimit);

  return unresolvedMeasurements;
}

module.exports = {
  getFailedRecords,
};
