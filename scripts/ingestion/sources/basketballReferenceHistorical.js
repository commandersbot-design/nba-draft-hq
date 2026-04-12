const { loadSourceRows, sourceDirectory, toNumber, toString } = require('../shared/historicalSourceUtils');

function normalizeRow(row) {
  return {
    sourcePlayerId: toString(row.source_player_id || row.player_id || row.id || row.playerId),
    playerName: toString(row.player_name || row.playerName || row.name),
    draftYear: toNumber(row.draft_year || row.draftYear),
    draftSlot: toNumber(row.draft_slot || row.draftSlot),
    nbaTeam: toString(row.nba_team || row.nbaTeam || row.team),
    position: toString(row.position),
    schoolTeam: toString(row.school_team || row.schoolTeam || row.school),
    nbaGames: toNumber(row.nba_games || row.games_played),
    nbaMinutes: toNumber(row.nba_minutes || row.minutes),
    nbaPoints: toNumber(row.nba_points || row.points),
    nbaRebounds: toNumber(row.nba_rebounds || row.rebounds),
    nbaAssists: toNumber(row.nba_assists || row.assists),
    nbaBpm: toNumber(row.nba_bpm || row.bpm),
  };
}

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
