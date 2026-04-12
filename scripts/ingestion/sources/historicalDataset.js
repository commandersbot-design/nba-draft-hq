const fs = require('fs');
const path = require('path');
const {
  DEFAULT_HISTORICAL_UPSTREAM_DIR,
  DEFAULT_HISTORICAL_SINGLE_FILE,
  DEFAULT_HISTORICAL_FALLBACK,
} = require('../config/sources');
const { buildSourceSyncMetadata, requireSourceConfig } = require('../config');
const { loadStructuredFiles } = require('../shared/fileDataset');

const HISTORICAL_SOURCE = requireSourceConfig('historicalDatasetImport');

function normalizeRow(row) {
  return {
    id: row.id || row.historical_id || row.historicalId,
    name: row.name || row.player_name || row.playerName,
    draftYear: row.draftYear || row.draft_year,
    position: row.position,
    school: row.school,
    height: row.height,
    age: row.age,
    archetype: row.archetype,
    roleOutcome: row.roleOutcome || row.role_outcome,
    outcomeTier: row.outcomeTier || row.outcome_tier,
    pointsPerGame: row.pointsPerGame || row.points_per_game,
    reboundsPerGame: row.reboundsPerGame || row.rebounds_per_game,
    assistsPerGame: row.assistsPerGame || row.assists_per_game,
    trueShooting: row.trueShooting || row.true_shooting,
    bpm: row.bpm,
    draftSlot: row.draftSlot || row.draft_slot,
    notes: row.notes,
  };
}

function loadBulkDataset(targetPath) {
  const { files, rows } = loadStructuredFiles(targetPath);

  const deduped = new Map();
  for (const row of rows.map(normalizeRow)) {
    if (!row.id) continue;
    deduped.set(String(row.id), row);
  }

  return {
    datasetPath: targetPath,
    files,
    payload: [...deduped.values()],
  };
}

async function loadDataset() {
  const configuredPath = process.env.HISTORICAL_DATASET_PATH;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return loadBulkDataset(configuredPath);
  }

  if (fs.existsSync(DEFAULT_HISTORICAL_UPSTREAM_DIR)) {
    return loadBulkDataset(DEFAULT_HISTORICAL_UPSTREAM_DIR);
  }

  if (fs.existsSync(DEFAULT_HISTORICAL_SINGLE_FILE)) {
    return loadBulkDataset(DEFAULT_HISTORICAL_SINGLE_FILE);
  }

  return loadBulkDataset(DEFAULT_HISTORICAL_FALLBACK);
}

async function fetchHistoricalDataset() {
  const { datasetPath, files, payload } = await loadDataset();

  return {
    source: HISTORICAL_SOURCE.label,
    season: 'historical',
    rows: payload,
    metadata: buildSourceSyncMetadata('historicalDatasetImport', {
      mode: process.env.HISTORICAL_DATASET_PATH
        ? 'configured-path'
        : fs.existsSync(DEFAULT_HISTORICAL_UPSTREAM_DIR)
          ? 'upstream-directory'
          : fs.existsSync(DEFAULT_HISTORICAL_SINGLE_FILE)
            ? 'upstream-single-file'
            : 'fixture-fallback',
      datasetPath,
      fileCount: files.length,
      files,
      note: 'Structured historical dataset import. Supports nested JSON containers plus bulk JSON, CSV, JSONL, and NDJSON ingestion from upstream directories.',
    }),
  };
}

module.exports = { fetchHistoricalDataset };
