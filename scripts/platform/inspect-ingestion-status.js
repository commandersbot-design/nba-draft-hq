const { openDatabase } = require('../lib/db');
const { getLatestIngestionStatus } = require('../../src/platform/api/ingestionStatusService');

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
  const data = getLatestIngestionStatus(db, {
    sourceName: args.source || null,
    limit: args.limit || 10,
  });
  console.log(JSON.stringify(data, null, 2));
  db.close();
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
};
