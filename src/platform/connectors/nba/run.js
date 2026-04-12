const { withPlatformRun } = require('../../db/runStore');

const SOURCE = {
  displayName: 'NBA.com Draft Combine',
};

async function runNbaCombineFullRefresh(context = {}) {
  return withPlatformRun({
    sourceName: SOURCE.displayName,
    jobName: 'nba-combine-full-refresh',
    mode: 'full',
    metadata: context,
  }, async () => ({
    status: 'blocked',
    sourceName: SOURCE.displayName,
    recordsSeen: 0,
    recordsWritten: 0,
    recordsRejected: 0,
    message: 'NBA combine live connector is scaffolded, but endpoint-specific fetch logic and response mapping are not implemented yet.',
    metadata: {
      mode: 'blocked',
    },
  }));
}

module.exports = {
  runNbaCombineFullRefresh,
};
