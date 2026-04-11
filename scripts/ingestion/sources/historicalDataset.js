const fs = require('fs');
const path = require('path');

const DEFAULT_UPSTREAM_DIR = path.join(__dirname, '..', '..', '..', 'imports', 'upstream', 'historical');
const DEFAULT_DATASET_PATH = path.join(__dirname, '..', '..', '..', 'imports', 'upstream', 'historical-prospects-upstream.json');
const FALLBACK_DATASET_PATH = path.join(__dirname, '..', '..', '..', 'imports', 'fixtures', 'historical-prospects-seed.json');

function walkFiles(targetPath) {
  const stat = fs.statSync(targetPath);
  if (stat.isFile()) return [targetPath];

  const output = [];
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(entryPath));
      continue;
    }
    output.push(entryPath);
  }
  return output;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map((value) => value.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

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

function loadJsonFile(filePath) {
  const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(payload) ? payload : [];
}

function loadCsvFile(filePath) {
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function loadBulkDataset(targetPath) {
  const files = walkFiles(targetPath)
    .filter((filePath) => /\.(json|csv)$/i.test(filePath))
    .sort((left, right) => left.localeCompare(right));

  const rows = [];
  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const payload = extension === '.csv' ? loadCsvFile(filePath) : loadJsonFile(filePath);
    rows.push(...payload.map(normalizeRow));
  }

  const deduped = new Map();
  for (const row of rows) {
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
    const stat = fs.statSync(configuredPath);
    if (stat.isDirectory()) {
      return loadBulkDataset(configuredPath);
    }
    return {
      datasetPath: configuredPath,
      files: [configuredPath],
      payload: loadJsonFile(configuredPath).map(normalizeRow),
    };
  }

  if (fs.existsSync(DEFAULT_UPSTREAM_DIR)) {
    return loadBulkDataset(DEFAULT_UPSTREAM_DIR);
  }

  if (fs.existsSync(DEFAULT_DATASET_PATH)) {
    return {
      datasetPath: DEFAULT_DATASET_PATH,
      files: [DEFAULT_DATASET_PATH],
      payload: loadJsonFile(DEFAULT_DATASET_PATH).map(normalizeRow),
    };
  }

  return {
    datasetPath: FALLBACK_DATASET_PATH,
    files: [FALLBACK_DATASET_PATH],
    payload: loadJsonFile(FALLBACK_DATASET_PATH).map(normalizeRow),
  };
}

async function fetchHistoricalDataset() {
  const { datasetPath, files, payload } = await loadDataset();

  return {
    source: 'HistoricalDatasetImport',
    season: 'historical',
    rows: payload,
    metadata: {
      mode: process.env.HISTORICAL_DATASET_PATH
        ? 'configured-path'
        : fs.existsSync(DEFAULT_UPSTREAM_DIR)
          ? 'upstream-directory'
          : fs.existsSync(DEFAULT_DATASET_PATH)
            ? 'upstream-single-file'
            : 'fixture-fallback',
      datasetPath,
      fileCount: files.length,
      files,
      note: 'Structured historical dataset import. Supports bulk JSON/CSV file ingestion from an upstream directory.',
    },
  };
}

module.exports = { fetchHistoricalDataset };
