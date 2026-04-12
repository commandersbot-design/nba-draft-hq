const { loadSourceRows, sourceDirectory, toNumber, toString } = require('../shared/historicalSourceUtils');

function normalizeRow(row) {
  return {
    sourcePlayerId: toString(row.source_player_id || row.player_id || row.id || row.playerId),
    playerName: toString(row.player_name || row.playerName || row.name),
    season: toString(row.season),
    schoolTeam: toString(row.school_team || row.schoolTeam || row.school || row.team),
    league: toString(row.league, 'NCAA'),
    classYear: toString(row.class_year || row.classYear),
    age: toNumber(row.age),
    position: toString(row.position),
    games: toNumber(row.games || row.gp),
    minutes: toNumber(row.minutes || row.mpg),
    points: toNumber(row.points || row.ppg),
    rebounds: toNumber(row.rebounds || row.rpg),
    assists: toNumber(row.assists || row.apg),
    steals: toNumber(row.steals || row.spg),
    blocks: toNumber(row.blocks || row.bpg),
    turnovers: toNumber(row.turnovers || row.tpg),
    fgPct: toNumber(row.fg_pct || row.fgPct),
    threePct: toNumber(row.three_pct || row.threePct),
    ftPct: toNumber(row.ft_pct || row.ftPct),
  };
}

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
