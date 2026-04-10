const fs = require('fs');
const path = require('path');

const DEFAULT_FIXTURE_PATH = path.join(__dirname, '..', '..', '..', 'imports', 'fixtures', 'barttorvik-2025.json');

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function loadDataset() {
  const datasetPath = process.env.BART_TORVIK_DATASET_PATH || DEFAULT_FIXTURE_PATH;
  return {
    datasetPath,
    payload: JSON.parse(fs.readFileSync(datasetPath, 'utf8')),
  };
}

async function fetchBartTorvikDataset({ season, playerLookup }) {
  const { datasetPath, payload } = await loadDataset();
  const stats = [];

  for (const entry of payload.players || []) {
    const playerId = playerLookup.get(normalizeName(entry.playerName));
    if (!playerId) continue;

    stats.push({
      playerId,
      season,
      source: 'BartTorvikDataset',
      externalPlayerKey: entry.externalPlayerKey || entry.playerName,
      payload: entry.advanced,
    });
  }

  return {
    source: 'BartTorvikDataset',
    season,
    stats,
    gameLogs: [],
    metadata: {
      mode: process.env.BART_TORVIK_DATASET_PATH ? 'dataset' : 'fixture',
      datasetPath,
      note: 'Structured dataset import only. No scraping is performed.',
    },
  };
}

module.exports = { fetchBartTorvikDataset };
