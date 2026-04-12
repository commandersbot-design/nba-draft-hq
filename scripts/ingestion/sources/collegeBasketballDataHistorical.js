const { loadSourceRows, sourceDirectory } = require('../shared/historicalSourceUtils');
const { createSourceMapper } = require('../shared/sourceRowMappers');

const normalizeRow = createSourceMapper({
  sourcePlayerId: ['source_player_id', 'player_id', 'id', 'playerId', 'athlete_id'],
  playerName: ['player_name', 'playerName', 'name', 'player'],
  season: ['season', 'season_year', 'year'],
  fields: {
    season: { aliases: ['season', 'season_year', 'year'], type: 'season' },
    schoolTeam: { aliases: ['school_team', 'schoolTeam', 'team', 'school', 'team_name'] },
    league: { aliases: ['league'], fallback: 'NCAA' },
    classYear: { aliases: ['class_year', 'classYear', 'class', 'yr'] },
    age: { aliases: ['age'], type: 'number' },
    position: { aliases: ['position', 'pos'], type: 'position' },
    games: { aliases: ['games', 'gp', 'g'], type: 'number' },
    minutes: { aliases: ['minutes', 'minutes_per_game', 'mpg', 'min'], type: 'number' },
    points: { aliases: ['points', 'points_per_game', 'ppg', 'pts'], type: 'number' },
    rebounds: { aliases: ['rebounds', 'rebounds_per_game', 'rpg', 'trb'], type: 'number' },
    assists: { aliases: ['assists', 'assists_per_game', 'apg', 'ast'], type: 'number' },
    steals: { aliases: ['steals', 'steals_per_game', 'spg', 'stl'], type: 'number' },
    blocks: { aliases: ['blocks', 'blocks_per_game', 'bpg', 'blk'], type: 'number' },
    turnovers: { aliases: ['turnovers', 'turnovers_per_game', 'tpg', 'tov'], type: 'number' },
    fgPct: { aliases: ['fg_pct', 'fgPct', 'fg%'], type: 'number' },
    threePct: { aliases: ['three_pct', 'threePct', '3p%', '3pt_pct'], type: 'number' },
    ftPct: { aliases: ['ft_pct', 'ftPct', 'ft%'], type: 'number' },
  },
});

async function fetchCollegeBasketballDataHistorical() {
  const loaded = loadSourceRows('collegeBasketballData', {
    envKey: 'CBBD_HISTORICAL_DATASET_PATH',
    defaultPath: sourceDirectory('collegebasketballdata'),
    note: 'Structured historical season and box-score import for repeatable college data.',
  });

  return {
    source: loaded.config.label,
    season: 'historical',
    rows: loaded.rows.map(normalizeRow).filter((row) => row.sourcePlayerId && row.season && row.playerName),
    metadata: loaded.metadata,
  };
}

module.exports = { fetchCollegeBasketballDataHistorical };
