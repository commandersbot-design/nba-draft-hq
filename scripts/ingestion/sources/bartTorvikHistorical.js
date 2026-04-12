const { loadSourceRows, sourceDirectory } = require('../shared/historicalSourceUtils');
const { createSourceMapper } = require('../shared/sourceRowMappers');

const normalizeRow = createSourceMapper({
  sourcePlayerId: ['source_player_id', 'player_id', 'id', 'playerId', 'bart_torvik_id'],
  playerName: ['player_name', 'playerName', 'name', 'player'],
  season: ['season', 'season_year', 'year'],
  fields: {
    season: { aliases: ['season', 'season_year', 'year'], type: 'season' },
    schoolTeam: { aliases: ['school_team', 'schoolTeam', 'school', 'team', 'team_name'] },
    league: { aliases: ['league'], fallback: 'NCAA' },
    age: { aliases: ['age'], type: 'number' },
    position: { aliases: ['position', 'pos'], type: 'position' },
    tsPct: { aliases: ['ts_pct', 'tsPct', 'ts', 'ts%'], type: 'number' },
    efgPct: { aliases: ['efg_pct', 'efgPct', 'efg', 'efg%'], type: 'number' },
    usgPct: { aliases: ['usg_pct', 'usgPct', 'usage', 'usage_rate'], type: 'number' },
    astPct: { aliases: ['ast_pct', 'astPct', 'assist_rate', 'ast_rate'], type: 'number' },
    tovPct: { aliases: ['tov_pct', 'tovPct', 'turnover_rate', 'tov_rate'], type: 'number' },
    stlPct: { aliases: ['stl_pct', 'stlPct', 'steal_rate', 'stl_rate'], type: 'number' },
    blkPct: { aliases: ['blk_pct', 'blkPct', 'block_rate', 'blk_rate'], type: 'number' },
    bpm: { aliases: ['bpm'], type: 'number' },
    obpm: { aliases: ['obpm'], type: 'number' },
    dbpm: { aliases: ['dbpm'], type: 'number' },
  },
});

async function fetchBartTorvikHistorical() {
  const loaded = loadSourceRows('bartTorvik', {
    envKey: 'BART_TORVIK_HISTORICAL_DATASET_PATH',
    defaultPath: sourceDirectory('bart-torvik'),
    note: 'Advanced metric import for BPM, efficiency, usage, and role-impact context.',
  });

  return {
    source: loaded.config.label,
    season: 'historical',
    rows: loaded.rows.map(normalizeRow).filter((row) => row.sourcePlayerId && row.season && row.playerName),
    metadata: loaded.metadata,
  };
}

module.exports = { fetchBartTorvikHistorical };
