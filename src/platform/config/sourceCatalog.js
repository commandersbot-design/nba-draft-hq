const path = require('path');
const { createConnector } = require('../connectors/base/createConnector');
const { runCbbdFullRefresh } = require('../connectors/cbbd/run');
const { runNbaCombineFullRefresh } = require('../connectors/nba/run');

function upstreamPath(...parts) {
  return path.join(__dirname, '..', '..', '..', 'imports', 'upstream', ...parts);
}

const SOURCE_CATALOG = {
  cbbd: createConnector({
    id: 'cbbd',
    displayName: 'CollegeBasketballData',
    reliabilityTier: 'primary',
    complianceMode: 'official-api-with-key',
    rawTables: ['source_records', 'cbb_player_seasons_raw', 'cbb_game_logs_raw'],
    normalizedTables: ['players', 'seasons', 'teams', 'games', 'box_scores', 'advanced_stats'],
    supportedModes: ['full', 'incremental'],
    config: {
      endpointEnv: 'CBBD_STATS_ENDPOINT',
      apiKeyEnv: 'CBBD_API_KEY',
      snapshotDirectory: path.join('data', 'snapshots', 'cbbd'),
    },
    handlers: {
      async fullRefresh(context) {
        return runCbbdFullRefresh(context);
      },
      async incrementalRefresh(context) {
        return runCbbdFullRefresh({ ...context, mode: 'incremental' });
      },
    },
  }),
  nbaCombine: createConnector({
    id: 'nbaCombine',
    displayName: 'NBA.com Draft Combine',
    reliabilityTier: 'primary',
    complianceMode: 'official-web-endpoint-defensive',
    rawTables: ['source_records', 'combine_measurements_raw'],
    normalizedTables: ['measurements', 'draft_info'],
    supportedModes: ['full', 'incremental'],
    config: {
      endpointEnv: 'NBA_COMBINE_ENDPOINT',
      snapshotDirectory: path.join('data', 'snapshots', 'nba-combine'),
    },
    handlers: {
      async fullRefresh(context) {
        return runNbaCombineFullRefresh(context);
      },
      async incrementalRefresh(context) {
        return runNbaCombineFullRefresh({ ...context, mode: 'incremental' });
      },
    },
  }),
  torvikImport: createConnector({
    id: 'torvikImport',
    displayName: 'Bart Torvik Import',
    reliabilityTier: 'supplementary',
    complianceMode: 'structured-import-only',
    rawTables: ['source_records', 'cbb_advanced_metrics_raw'],
    normalizedTables: ['advanced_stats'],
    supportedModes: ['full'],
    config: {
      importDirectory: upstreamPath('bart-torvik'),
    },
    handlers: {
      async fullRefresh() {
        return {
          status: 'blocked',
          sourceName: 'Bart Torvik Import',
          recordsSeen: 0,
          recordsWritten: 0,
          recordsRejected: 0,
          message: 'Torvik remains an import-first supplementary source. Drop structured files into imports/upstream/bart-torvik.',
        };
      },
      async incrementalRefresh() {
        return this.fullRefresh();
      },
    },
  }),
  sportsReferenceImport: createConnector({
    id: 'sportsReferenceImport',
    displayName: 'Sports Reference Import',
    reliabilityTier: 'supplementary',
    complianceMode: 'controlled-import-only',
    rawTables: ['source_records', 'cbb_player_seasons_raw'],
    normalizedTables: ['players', 'seasons', 'teams'],
    supportedModes: ['full'],
    config: {
      importDirectory: upstreamPath('sports-reference'),
    },
    handlers: {
      async fullRefresh() {
        return {
          status: 'blocked',
          sourceName: 'Sports Reference Import',
          recordsSeen: 0,
          recordsWritten: 0,
          recordsRejected: 0,
          message: 'Sports Reference is intentionally configured as a controlled import path, not a primary live fetch dependency.',
        };
      },
      async incrementalRefresh() {
        return this.fullRefresh();
      },
    },
  }),
  basketballReferenceImport: createConnector({
    id: 'basketballReferenceImport',
    displayName: 'Basketball Reference Import',
    reliabilityTier: 'supplementary',
    complianceMode: 'controlled-import-only',
    rawTables: ['source_records', 'nba_draft_history_raw', 'nba_player_outcomes_raw'],
    normalizedTables: ['draft_info', 'historical_outcomes'],
    supportedModes: ['full'],
    config: {
      importDirectory: upstreamPath('basketball-reference'),
    },
    handlers: {
      async fullRefresh() {
        return {
          status: 'blocked',
          sourceName: 'Basketball Reference Import',
          recordsSeen: 0,
          recordsWritten: 0,
          recordsRejected: 0,
          message: 'Basketball Reference is intentionally supplementary and import-controlled.',
        };
      },
      async incrementalRefresh() {
        return this.fullRefresh();
      },
    },
  }),
};

const CSV_IMPORT_SOURCES = {
  synergy: { displayName: 'Synergy Export', complianceMode: 'manual-csv', importType: 'playtype_stats' },
  ctg: { displayName: 'Cleaning the Glass Export', complianceMode: 'manual-csv', importType: 'lineup_context' },
  bball_index: { displayName: 'BBall Index Export', complianceMode: 'manual-csv', importType: 'tracking_stats' },
  stathead: { displayName: 'Stathead Export', complianceMode: 'manual-csv', importType: 'advanced_stats' },
  torvik: { displayName: 'Torvik Export', complianceMode: 'manual-csv', importType: 'advanced_stats' },
  combine: { displayName: 'Combine / Pro Day Export', complianceMode: 'manual-csv', importType: 'measurements' },
  scouting: { displayName: 'Hand Curated Scouting Export', complianceMode: 'manual-csv', importType: 'scouting_reports' },
};

const FUTURE_STUB_SOURCES = {
  synergyApi: { displayName: 'Synergy API', complianceMode: 'paid-vendor-stub' },
  secondSpectrum: { displayName: 'Second Spectrum', complianceMode: 'paid-vendor-stub' },
  bballIndexApi: { displayName: 'BBall Index API', complianceMode: 'paid-vendor-stub' },
};

module.exports = {
  SOURCE_CATALOG,
  CSV_IMPORT_SOURCES,
  FUTURE_STUB_SOURCES,
};
