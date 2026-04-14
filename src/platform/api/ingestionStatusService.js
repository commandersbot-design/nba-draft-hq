function getLatestIngestionStatus(db, { sourceName = null, limit = 10 } = {}) {
  const numericLimit = Number.isFinite(Number(limit)) ? Number(limit) : 10;

  if (sourceName) {
    return db.prepare(`
      SELECT
        source_name,
        job_name,
        mode,
        status,
        started_at,
        finished_at,
        records_seen,
        records_written,
        records_rejected,
        error_message,
        metadata_json
      FROM ingestion_runs
      WHERE source_name = ?
      ORDER BY id DESC
      LIMIT ?
    `).all(sourceName, numericLimit);
  }

  return db.prepare(`
    SELECT
      source_name,
      job_name,
      mode,
      status,
      started_at,
      finished_at,
      records_seen,
      records_written,
      records_rejected,
      error_message,
      metadata_json
    FROM ingestion_runs
    ORDER BY id DESC
    LIMIT ?
  `).all(numericLimit);
}

module.exports = {
  getLatestIngestionStatus,
};
