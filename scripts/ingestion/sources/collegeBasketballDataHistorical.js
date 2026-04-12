const { loadSourceRows, sourceDirectory, toNumber, toString } = require('../shared/historicalSourceUtils');

function normalizeRow(row) {
  return {
    sourcePlayerId: toString(row.source_player_id || row.player_id || row.id || row.playerId),
    playerName: toString(row.player_name || row.playerName || row.name),
    season: toString(row.season),
    schoolTeam: toString(row.school_team || row.schoolTeam || row.team || row.school),
    league: toString(row.league, 'NCAA'),
    classYear: toString(row.class_year || row.classYear),
    age: toNumber(row.age),
    position: toString(row.position),
    games: toNumber(row.games || row.gp),
    minutes: toNumber(row.minutes || row.minutes_per_game || row.mpg),
    points: toNumber(row.points || row.points_per_game || row.ppg),
    rebounds: toNumber(row.rebounds || row.rebounds_per_game || row.rpg),
    assists: toNumber(row.assists || row.assists_per_game || row.apg),
    steals: toNumber(row.steals || row.steals_per_game || row.spg),
    blocks: toNumber(row.blocks || row.blocks_per_game || row.bpg),
    turnovers: toNumber(row.turnovers || row.turnovers_per_game || row.tpg),
    fgPct: toNumber(row.fg_pct || row.fgPct),
    threePct: toNumber(row.three_pct || row.threePct),
    ftPct: toNumber(row.ft_pct || row.ftPct),
  };
}

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
