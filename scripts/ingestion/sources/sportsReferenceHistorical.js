const { loadSourceRows, sourceDirectory } = require('../shared/historicalSourceUtils');
const { createSourceMapper } = require('../shared/sourceRowMappers');

const normalizeRow = createSourceMapper({
  sourcePlayerId: ['source_player_id', 'player_id', 'id', 'playerId', 'sports_reference_id'],
  playerName: ['player_name', 'playerName', 'name', 'player'],
  season: ['season', 'season_year', 'year'],
  fields: {
    season: { aliases: ['season', 'season_year', 'year'], type: 'season' },
    schoolTeam: { aliases: ['school_team', 'schoolTeam', 'school', 'team', 'team_name'] },
    league: { aliases: ['league'], fallback: 'NCAA' },
    classYear: { aliases: ['class_year', 'classYear', 'class', 'yr'] },
    age: { aliases: ['age'], type: 'number' },
    position: { aliases: ['position', 'pos'], type: 'position' },
    games: { aliases: ['games', 'gp', 'g'], type: 'number' },
    minutes: { aliases: ['minutes', 'mpg', 'min'], type: 'number' },
    points: { aliases: ['points', 'ppg', 'pts'], type: 'number' },
    rebounds: { aliases: ['rebounds', 'rpg', 'trb'], type: 'number' },
    assists: { aliases: ['assists', 'apg', 'ast'], type: 'number' },
    steals: { aliases: ['steals', 'spg', 'stl'], type: 'number' },
    blocks: { aliases: ['blocks', 'bpg', 'blk'], type: 'number' },
    turnovers: { aliases: ['turnovers', 'tpg', 'tov'], type: 'number' },
    fgPct: { aliases: ['fg_pct', 'fgPct', 'fg%'], type: 'number' },
    threePct: { aliases: ['three_pct', 'threePct', '3p%', '3pt_pct'], type: 'number' },
    ftPct: { aliases: ['ft_pct', 'ftPct', 'ft%'], type: 'number' },
  },
});

async function fetchSportsReferenceHistorical() {
  const loaded = loadSourceRows('sportsReference', {
    envKey: 'SPORTS_REFERENCE_HISTORICAL_DATASET_PATH',
    defaultPath: sourceDirectory('sports-reference'),
    note: 'Historical college season import intended for long-range college history and career context.',
  });

  return {
    source: loaded.config.label,
    season: 'historical',
    rows: loaded.rows.map(normalizeRow).filter((row) => row.sourcePlayerId && row.season && row.playerName),
    metadata: loaded.metadata,
  };
}

module.exports = { fetchSportsReferenceHistorical };
