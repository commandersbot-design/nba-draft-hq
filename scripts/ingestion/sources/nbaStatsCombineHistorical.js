const { loadSourceRows, sourceDirectory } = require('../shared/historicalSourceUtils');
const { createSourceMapper } = require('../shared/sourceRowMappers');

const normalizeRow = createSourceMapper({
  sourcePlayerId: ['source_player_id', 'player_id', 'id', 'playerId', 'combine_id'],
  playerName: ['player_name', 'playerName', 'name', 'player'],
  combineYear: ['combine_year', 'combineYear', 'year'],
  fields: {
    combineYear: { aliases: ['combine_year', 'combineYear', 'year'], type: 'number' },
    age: { aliases: ['age'], type: 'number' },
    position: { aliases: ['position', 'pos'], type: 'position' },
    height: { aliases: ['height', 'height_no_shoes', 'height_without_shoes', 'heightNoShoes'] },
    weight: { aliases: ['weight', 'weight_lbs', 'weightLb'], type: 'number' },
    wingspan: { aliases: ['wingspan', 'wingspan_inches', 'wingspanInches'] },
    standingReach: { aliases: ['standing_reach', 'standingReach', 'standing_reach_inches'] },
    maxVertical: { aliases: ['max_vertical', 'maxVertical', 'vertical', 'max_vert'], type: 'number' },
    laneAgility: { aliases: ['lane_agility', 'laneAgility'], type: 'number' },
    shuttleRun: { aliases: ['shuttle_run', 'shuttleRun', 'shuttle'], type: 'number' },
    sprint: { aliases: ['sprint', 'three_quarter_sprint', 'threeQuarterSprint'], type: 'number' },
  },
});

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
