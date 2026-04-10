const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../lib/db');

const PROSPECTS_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospects.json');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'profileStats.json');

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseSeasonArg() {
  const seasonArg = process.argv.find((arg) => arg.startsWith('--season='));
  return seasonArg ? seasonArg.split('=')[1] : '2025-26';
}

function exportProfileStats() {
  const season = parseSeasonArg();
  const db = openDatabase();
  const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
  const prospectsByName = new Map(prospects.map((prospect) => [normalizeName(prospect.name), prospect]));

  const rows = db.prepare(`
    SELECT
      p.first_name,
      p.last_name,
      p.position,
      n.*
    FROM player_stats_normalized n
    JOIN players p ON p.id = n.player_id
    WHERE n.season = ?
  `).all(season);

  const output = {};

  for (const row of rows) {
    const fullName = `${row.first_name} ${row.last_name}`;
    const prospect = prospectsByName.get(normalizeName(fullName));
    if (!prospect) continue;

    output[prospect.id] = {
      season,
      source: row.source,
      positionGroup: row.position_group,
      statCards: JSON.parse(row.stat_cards_json || '[]'),
      percentiles: JSON.parse(row.percentile_json || '{}'),
      statStrengths: JSON.parse(row.strengths_json || '[]'),
      statWeaknesses: JSON.parse(row.weaknesses_json || '[]'),
      archetypeIndicators: JSON.parse(row.archetype_indicators_json || '[]'),
      comparisonInputs: JSON.parse(row.comparison_inputs_json || '{}'),
      stats: {
        season: {
          games: row.games,
          minutes: row.minutes_per_game,
          points: row.points_per_game,
          rebounds: row.rebounds_per_game,
          assists: row.assists_per_game,
          steals: row.steals_per_game,
          blocks: row.blocks_per_game,
          turnovers: row.turnovers_per_game,
        },
        advanced: {
          fgPct: row.fg_pct,
          threePct: row.three_pct,
          ftPct: row.ft_pct,
          trueShooting: row.ts_pct ? `${(row.ts_pct * 100).toFixed(1)}%` : null,
          efgPct: row.efg_pct ? `${(row.efg_pct * 100).toFixed(1)}%` : null,
          usage: row.usg_pct ? `${(row.usg_pct * 100).toFixed(1)}%` : null,
          assistRate: row.ast_pct ? `${row.ast_pct.toFixed(1)}%` : null,
          turnoverRate: row.tov_pct ? `${row.tov_pct.toFixed(1)}%` : null,
          ortg: row.ortg,
          drtg: row.drtg,
          bpm: row.bpm,
          reboundRate: row.rebound_rate ? `${row.rebound_rate.toFixed(1)}%` : null,
        },
        gameLogAvailable: true,
        shotProfileAvailable: false,
      },
      updatedAt: row.last_updated,
    };
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  db.close();
  console.log(`Exported profile stats for ${Object.keys(output).length} prospects to ${OUTPUT_PATH}`);
}

if (require.main === module) {
  exportProfileStats();
}

module.exports = { exportProfileStats };
