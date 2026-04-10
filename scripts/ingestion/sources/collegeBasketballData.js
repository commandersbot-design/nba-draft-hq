const fs = require('fs');
const path = require('path');

const FIXTURE_PATH = path.join(__dirname, '..', '..', '..', 'imports', 'fixtures', 'collegebasketballdata-2025.json');

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function loadFixture() {
  return JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
}

async function fetchLiveDataset(season) {
  const statsEndpoint = process.env.CBBD_STATS_ENDPOINT;
  if (!statsEndpoint) return null;

  const headers = { Accept: 'application/json' };
  if (process.env.CBBD_API_KEY) {
    headers.Authorization = `Bearer ${process.env.CBBD_API_KEY}`;
  }

  const response = await fetch(`${statsEndpoint}?season=${encodeURIComponent(season)}`, { headers });
  if (!response.ok) {
    throw new Error(`CollegeBasketballData sync failed: ${response.status}`);
  }

  return response.json();
}

async function getCollegeBasketballDataPayload(season) {
  return (await fetchLiveDataset(season)) || loadFixture();
}

async function fetchCollegeBasketballData({ season, playerLookup }) {
  const payload = await getCollegeBasketballDataPayload(season);
  const players = [];
  const gameLogs = [];

  for (const entry of payload.players || []) {
    const playerId = playerLookup.get(normalizeName(entry.playerName));
    if (!playerId) continue;

    players.push({
      playerId,
      season,
      source: 'CollegeBasketballData',
      externalPlayerKey: entry.externalPlayerKey || entry.playerName,
      payload: entry.stats,
    });

    for (const gameLog of entry.gameLogs || []) {
      gameLogs.push({
        playerId,
        season,
        source: 'CollegeBasketballData',
        externalGameKey: gameLog.gameId,
        gameDate: gameLog.gameDate,
        opponent: gameLog.opponent,
        payload: gameLog,
      });
    }
  }

  return {
    source: 'CollegeBasketballData',
    season,
    stats: players,
    gameLogs,
    metadata: {
      mode: process.env.CBBD_STATS_ENDPOINT ? 'live' : 'fixture',
      fixturePath: process.env.CBBD_STATS_ENDPOINT ? null : FIXTURE_PATH,
    },
  };
}

module.exports = { fetchCollegeBasketballData };
