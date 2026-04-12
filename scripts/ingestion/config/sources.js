const path = require('path');

const DEFAULT_HISTORICAL_UPSTREAM_DIR = path.join(__dirname, '..', '..', '..', 'imports', 'upstream', 'historical');
const DEFAULT_HISTORICAL_SINGLE_FILE = path.join(__dirname, '..', '..', '..', 'imports', 'upstream', 'historical-prospects-upstream.json');
const DEFAULT_HISTORICAL_FALLBACK = path.join(__dirname, '..', '..', '..', 'imports', 'fixtures', 'historical-prospects-seed.json');
const DEFAULT_SOURCE_UPSTREAM_ROOT = path.join(__dirname, '..', '..', '..', 'imports', 'upstream');

const SOURCE_CONFIG = {
  collegeBasketballData: {
    id: 'collegeBasketballData',
    label: 'CollegeBasketballData',
    enabled: true,
    category: 'college-structured',
    provenance: 'external-api',
    env: {
      endpoint: 'CBBD_STATS_ENDPOINT',
      apiKey: 'CBBD_API_KEY',
    },
    paths: {
      upstreamDirectory: path.join(DEFAULT_SOURCE_UPSTREAM_ROOT, 'collegebasketballdata'),
    },
    rawTables: ['cbb_player_seasons_raw', 'cbb_game_logs_raw'],
    normalizedTables: ['prospects_historical', 'prospect_season_stats', 'prospect_game_logs'],
    derivedTables: ['prospect_percentiles', 'prospect_model_features', 'prospect_comparison_inputs'],
    syncTypes: ['season-stats', 'game-logs'],
  },
  sportsReference: {
    id: 'sportsReference',
    label: 'Sports Reference',
    enabled: true,
    category: 'college-history',
    provenance: 'dataset-or-adapter',
    paths: {
      upstreamDirectory: path.join(DEFAULT_SOURCE_UPSTREAM_ROOT, 'sports-reference'),
    },
    rawTables: ['cbb_player_seasons_raw'],
    normalizedTables: ['prospects_historical', 'prospect_season_stats'],
    derivedTables: ['prospect_percentiles', 'prospect_model_features', 'prospect_outcome_labels'],
    syncTypes: ['historical-college-seasons'],
  },
  bartTorvik: {
    id: 'bartTorvik',
    label: 'Bart Torvik',
    enabled: true,
    category: 'advanced-metrics',
    provenance: 'dataset',
    paths: {
      upstreamDirectory: path.join(DEFAULT_SOURCE_UPSTREAM_ROOT, 'bart-torvik'),
    },
    rawTables: ['cbb_advanced_metrics_raw'],
    normalizedTables: ['prospects_historical', 'prospect_advanced_metrics'],
    derivedTables: ['prospect_percentiles', 'prospect_model_features', 'prospect_archetype_inputs', 'prospect_comparison_inputs'],
    syncTypes: ['advanced-metrics'],
  },
  basketballReference: {
    id: 'basketballReference',
    label: 'Basketball Reference',
    enabled: true,
    category: 'nba-outcomes',
    provenance: 'dataset-or-adapter',
    paths: {
      upstreamDirectory: path.join(DEFAULT_SOURCE_UPSTREAM_ROOT, 'basketball-reference'),
    },
    rawTables: ['nba_draft_history_raw', 'nba_player_outcomes_raw'],
    normalizedTables: ['prospects_historical', 'prospect_nba_outcomes'],
    derivedTables: ['prospect_outcome_labels', 'prospect_comparison_inputs'],
    syncTypes: ['draft-history', 'nba-outcomes'],
  },
  nbaStats: {
    id: 'nbaStats',
    label: 'NBA.com Stats',
    enabled: true,
    category: 'measurements',
    provenance: 'external-api-or-dataset',
    paths: {
      upstreamDirectory: path.join(DEFAULT_SOURCE_UPSTREAM_ROOT, 'nba-combine'),
    },
    rawTables: ['combine_measurements_raw'],
    normalizedTables: ['prospects_historical', 'prospect_physical_measurements'],
    derivedTables: ['prospect_model_features', 'prospect_archetype_inputs', 'prospect_comparison_inputs'],
    syncTypes: ['combine-measurements'],
  },
  historicalDatasetImport: {
    id: 'historicalDatasetImport',
    label: 'Historical Dataset Import',
    enabled: true,
    category: 'historical-bootstrap',
    provenance: 'upstream-file',
    rawTables: ['historical_prospects_raw'],
    normalizedTables: ['historical_prospects_normalized'],
    derivedTables: [],
    syncTypes: ['historical-sync'],
    paths: {
      upstreamDirectory: DEFAULT_HISTORICAL_UPSTREAM_DIR,
      upstreamSingleFile: DEFAULT_HISTORICAL_SINGLE_FILE,
      fallbackFile: DEFAULT_HISTORICAL_FALLBACK,
    },
    env: {
      datasetPath: 'HISTORICAL_DATASET_PATH',
    },
  },
};

module.exports = {
  SOURCE_CONFIG,
  DEFAULT_HISTORICAL_UPSTREAM_DIR,
  DEFAULT_HISTORICAL_SINGLE_FILE,
  DEFAULT_HISTORICAL_FALLBACK,
  DEFAULT_SOURCE_UPSTREAM_ROOT,
};
