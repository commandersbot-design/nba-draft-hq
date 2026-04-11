const fs = require('fs');
const path = require('path');

const DEFAULT_DATASET_PATH = path.join(__dirname, '..', '..', '..', 'imports', 'upstream', 'historical-prospects-upstream.json');
const FALLBACK_DATASET_PATH = path.join(__dirname, '..', '..', '..', 'imports', 'fixtures', 'historical-prospects-seed.json');

async function loadDataset() {
  const configuredPath = process.env.HISTORICAL_DATASET_PATH || DEFAULT_DATASET_PATH;
  const datasetPath = fs.existsSync(configuredPath) ? configuredPath : FALLBACK_DATASET_PATH;

  return {
    datasetPath,
    payload: JSON.parse(fs.readFileSync(datasetPath, 'utf8')),
  };
}

async function fetchHistoricalDataset() {
  const { datasetPath, payload } = await loadDataset();

  return {
    source: 'HistoricalDatasetImport',
    season: 'historical',
    rows: payload,
    metadata: {
      mode: process.env.HISTORICAL_DATASET_PATH ? 'dataset' : fs.existsSync(DEFAULT_DATASET_PATH) ? 'upstream-default' : 'fixture-fallback',
      datasetPath,
      note: 'Structured historical dataset import. Upstream file can be swapped via HISTORICAL_DATASET_PATH.',
    },
  };
}

module.exports = { fetchHistoricalDataset };
