const fs = require('fs');
const path = require('path');
const { openDatabase, nowIso, withTransaction } = require('../../../scripts/lib/db');

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function insertIngestionRun(db, { runKey, sourceName, jobName, mode, status = 'running', metadata = {} }) {
  const stmt = db.prepare(`
    INSERT INTO ingestion_runs (
      run_key, source_name, job_name, mode, status, metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(runKey, sourceName, jobName, mode, status, JSON.stringify(metadata));
  return result.lastInsertRowid;
}

function finishIngestionRun(db, id, { status, recordsSeen = 0, recordsWritten = 0, recordsRejected = 0, errorMessage = null, metadata = {} }) {
  const stmt = db.prepare(`
    UPDATE ingestion_runs
    SET status = ?,
        finished_at = CURRENT_TIMESTAMP,
        records_seen = ?,
        records_written = ?,
        records_rejected = ?,
        error_message = ?,
        metadata_json = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(status, recordsSeen, recordsWritten, recordsRejected, errorMessage, JSON.stringify(metadata), id);
}

function storeSourceRecord(db, record) {
  const stmt = db.prepare(`
    INSERT INTO source_records (
      source_name, reliability_tier, entity_type, external_id, snapshot_path, payload_json,
      compliance_mode, source_last_updated, ingestion_run_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    record.sourceName,
    record.reliabilityTier,
    record.entityType,
    record.externalId,
    record.snapshotPath || null,
    JSON.stringify(record.payload || {}),
    record.complianceMode,
    record.sourceLastUpdated || nowIso(),
    record.ingestionRunId || null,
  );

  return result.lastInsertRowid;
}

function writeSnapshot(snapshotDirectory, name, payload) {
  ensureDirectory(snapshotDirectory);
  const safeName = String(name).replace(/[<>:"/\\|?*]+/g, '-');
  const fileName = `${safeName}.json`;
  const fullPath = path.join(snapshotDirectory, fileName);
  fs.writeFileSync(fullPath, JSON.stringify(payload, null, 2));
  return fullPath;
}

function withPlatformRun(context, callback) {
  const db = openDatabase();
  const runKey = `${context.sourceName}:${context.jobName}:${Date.now()}`;
  const runId = insertIngestionRun(db, {
    runKey,
    sourceName: context.sourceName,
    jobName: context.jobName,
    mode: context.mode,
    metadata: context.metadata || {},
  });

  try {
    const result = callback({ db, runId, runKey });
    if (result && typeof result.then === 'function') {
      return result
        .then((value) => {
          finishIngestionRun(db, runId, {
            status: value.status === 'blocked' ? 'partial' : value.status || 'success',
            recordsSeen: value.recordsSeen,
            recordsWritten: value.recordsWritten,
            recordsRejected: value.recordsRejected,
            metadata: value.metadata || {},
          });
          db.close();
          return value;
        })
        .catch((error) => {
          finishIngestionRun(db, runId, {
            status: 'error',
            errorMessage: error.message,
            metadata: { error: error.message },
          });
          db.close();
          throw error;
        });
    }

    finishIngestionRun(db, runId, {
      status: result.status === 'blocked' ? 'partial' : result.status || 'success',
      recordsSeen: result.recordsSeen,
      recordsWritten: result.recordsWritten,
      recordsRejected: result.recordsRejected,
      metadata: result.metadata || {},
    });
    db.close();
    return result;
  } catch (error) {
    finishIngestionRun(db, runId, {
      status: 'error',
      errorMessage: error.message,
      metadata: { error: error.message },
    });
    db.close();
    throw error;
  }
}

module.exports = {
  ensureDirectory,
  finishIngestionRun,
  insertIngestionRun,
  storeSourceRecord,
  withPlatformRun,
  withTransaction,
  writeSnapshot,
};
