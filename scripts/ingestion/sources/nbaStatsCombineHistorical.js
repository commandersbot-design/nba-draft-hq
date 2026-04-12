const { loadSourceRows, sourceDirectory, toNumber, toString } = require('../shared/historicalSourceUtils');

function normalizeRow(row) {
  return {
    sourcePlayerId: toString(row.source_player_id || row.player_id || row.id || row.playerId),
    playerName: toString(row.player_name || row.playerName || row.name),
    combineYear: toNumber(row.combine_year || row.combineYear || row.year),
    age: toNumber(row.age),
    position: toString(row.position),
    height: toString(row.height),
    weight: toNumber(row.weight),
    wingspan: toString(row.wingspan),
    standingReach: toString(row.standing_reach || row.standingReach),
    maxVertical: toNumber(row.max_vertical || row.maxVertical || row.vertical),
    laneAgility: toNumber(row.lane_agility || row.laneAgility),
    shuttleRun: toNumber(row.shuttle_run || row.shuttleRun),
    sprint: toNumber(row.sprint),
  };
}

async function fetchNbaStatsCombineHistorical() {
  const loaded = loadSourceRows('nbaStats', {
    envKey: 'NBA_STATS_COMBINE_DATASET_PATH',
    defaultPath: sourceDirectory('nba-combine'),
    note: 'Combine and physical testing import for measurements and translation context.',
  });

  return {
    source: loaded.config.label,
    season: 'historical',
    rows: loaded.rows.map(normalizeRow).filter((row) => row.sourcePlayerId && row.playerName && row.combineYear),
    metadata: loaded.metadata,
  };
}

module.exports = { fetchNbaStatsCombineHistorical };
