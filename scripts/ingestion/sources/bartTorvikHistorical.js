const { loadSourceRows, sourceDirectory, toNumber, toString } = require('../shared/historicalSourceUtils');

function normalizeRow(row) {
  return {
    sourcePlayerId: toString(row.source_player_id || row.player_id || row.id || row.playerId),
    playerName: toString(row.player_name || row.playerName || row.name),
    season: toString(row.season),
    schoolTeam: toString(row.school_team || row.schoolTeam || row.school || row.team),
    league: toString(row.league, 'NCAA'),
    age: toNumber(row.age),
    position: toString(row.position),
    tsPct: toNumber(row.ts_pct || row.tsPct),
    efgPct: toNumber(row.efg_pct || row.efgPct),
    usgPct: toNumber(row.usg_pct || row.usgPct || row.usage),
    astPct: toNumber(row.ast_pct || row.astPct || row.assist_rate),
    tovPct: toNumber(row.tov_pct || row.tovPct || row.turnover_rate),
    stlPct: toNumber(row.stl_pct || row.stlPct || row.steal_rate),
    blkPct: toNumber(row.blk_pct || row.blkPct || row.block_rate),
    bpm: toNumber(row.bpm),
    obpm: toNumber(row.obpm),
    dbpm: toNumber(row.dbpm),
  };
}

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
