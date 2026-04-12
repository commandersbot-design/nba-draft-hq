const { loadSourceRows, sourceDirectory } = require('../shared/historicalSourceUtils');
const { createSourceMapper } = require('../shared/sourceRowMappers');

const normalizeRow = createSourceMapper({
  sourcePlayerId: ['source_player_id', 'player_id', 'id', 'playerId', 'basketball_reference_id'],
  playerName: ['player_name', 'playerName', 'name', 'player'],
  draftYear: ['draft_year', 'draftYear', 'year'],
  fields: {
    draftYear: { aliases: ['draft_year', 'draftYear', 'year'], type: 'draftYear' },
    draftSlot: { aliases: ['draft_slot', 'draftSlot', 'pick', 'draft_pick'], type: 'number' },
    nbaTeam: { aliases: ['nba_team', 'nbaTeam', 'team', 'franchise'] },
    position: { aliases: ['position', 'pos'], type: 'position' },
    schoolTeam: { aliases: ['school_team', 'schoolTeam', 'school', 'college'] },
    nbaGames: { aliases: ['nba_games', 'games_played', 'games', 'g'], type: 'number' },
    nbaMinutes: { aliases: ['nba_minutes', 'minutes', 'mp'], type: 'number' },
    nbaPoints: { aliases: ['nba_points', 'points', 'pts'], type: 'number' },
    nbaRebounds: { aliases: ['nba_rebounds', 'rebounds', 'trb'], type: 'number' },
    nbaAssists: { aliases: ['nba_assists', 'assists', 'ast'], type: 'number' },
    nbaBpm: { aliases: ['nba_bpm', 'bpm'], type: 'number' },
  },
});

async function fetchBasketballReferenceHistorical() {
  const loaded = loadSourceRows('basketballReference', {
    envKey: 'BASKETBALL_REFERENCE_HISTORICAL_DATASET_PATH',
    defaultPath: sourceDirectory('basketball-reference'),
    note: 'Draft history and NBA outcome import for downstream outcome labeling.',
  });

  return {
    source: loaded.config.label,
    season: 'historical',
    rows: loaded.rows.map(normalizeRow).filter((row) => row.sourcePlayerId && row.playerName),
    metadata: loaded.metadata,
  };
}

module.exports = { fetchBasketballReferenceHistorical };
