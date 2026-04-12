const { openDatabase } = require('../lib/db');
const {
  getMeasurementCoverageSummary,
  getPlayerMeasurementCoverage,
} = require('../../src/platform/api/playerCoverageService');

function parseArgs(argv) {
  const result = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [key, value] = arg.slice(2).split('=');
    result[key] = value ?? true;
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = openDatabase();

  if (args.playerId) {
    const coverage = getPlayerMeasurementCoverage(db, Number(args.playerId));
    console.log(JSON.stringify(coverage, null, 2));
    db.close();
    return;
  }

  const summary = getMeasurementCoverageSummary(db);
  console.log(JSON.stringify(summary, null, 2));
  db.close();
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
};
