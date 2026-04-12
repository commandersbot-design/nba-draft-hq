const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../lib/db');

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'historicalCoverage.json');

function exportHistoricalCoverage() {
  const db = openDatabase();

  try {
    const rawCounts = {
      seasonStats: db.prepare(`SELECT COUNT(*) AS count FROM cbb_player_seasons_raw`).get().count,
      advancedMetrics: db.prepare(`SELECT COUNT(*) AS count FROM cbb_advanced_metrics_raw`).get().count,
      draftOutcomes: db.prepare(`SELECT COUNT(*) AS count FROM nba_draft_history_raw`).get().count,
      combine: db.prepare(`SELECT COUNT(*) AS count FROM combine_measurements_raw`).get().count,
    };

    const normalizedCounts = {
      prospectsHistoricalRows: db.prepare(`SELECT COUNT(*) AS count FROM prospects_historical`).get().count,
      uniqueHistoricalPlayers: db.prepare(`SELECT COUNT(DISTINCT source_player_id) AS count FROM prospects_historical WHERE source_player_id IS NOT NULL`).get().count,
      seasonStats: db.prepare(`SELECT COUNT(*) AS count FROM prospect_season_stats`).get().count,
      advancedMetrics: db.prepare(`SELECT COUNT(*) AS count FROM prospect_advanced_metrics`).get().count,
      outcomes: db.prepare(`SELECT COUNT(*) AS count FROM prospect_nba_outcomes`).get().count,
      measurements: db.prepare(`SELECT COUNT(*) AS count FROM prospect_physical_measurements`).get().count,
    };

    const qualityByStatus = db.prepare(`
      SELECT promotion_status, COUNT(*) AS count
      FROM historical_ingestion_quality
      GROUP BY promotion_status
    `).all();

    const qualityBySource = db.prepare(`
      SELECT source, promotion_status, COUNT(*) AS count
      FROM historical_ingestion_quality
      GROUP BY source, promotion_status
      ORDER BY source, promotion_status
    `).all();

    const classWindow = db.prepare(`
      SELECT MIN(draft_year) AS minYear, MAX(draft_year) AS maxYear, COUNT(DISTINCT draft_year) AS yearCount
      FROM prospect_nba_outcomes
    `).get();

    const outcomeCoverage = db.prepare(`
      SELECT outcome_tier, COUNT(*) AS count
      FROM prospect_outcome_labels
      GROUP BY outcome_tier
      ORDER BY outcome_score DESC
    `).all();

    const sourceSync = db.prepare(`
      SELECT source, sync_type, status, records_fetched, records_written, finished_at
      FROM source_sync_log
      WHERE season = 'historical'
      ORDER BY finished_at DESC
      LIMIT 15
    `).all();

    const payload = {
      generatedAt: new Date().toISOString(),
      rawCounts,
      normalizedCounts,
      quality: {
        statuses: qualityByStatus.reduce((acc, row) => ({ ...acc, [row.promotion_status]: row.count }), {}),
        bySource: qualityBySource,
      },
      classWindow,
      outcomeCoverage,
      recentSync: sourceSync,
    };

    fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Exported historical coverage summary to ${OUTPUT_PATH}`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  exportHistoricalCoverage();
}

module.exports = { exportHistoricalCoverage };
