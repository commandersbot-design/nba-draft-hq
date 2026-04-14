const { openDatabase } = require('../lib/db');
const { getPlayerSourceProvenance } = require('../../src/platform/api/provenanceService');

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
  const playerId = Number(args.playerId);

  if (!playerId) {
    throw new Error('inspect:provenance requires --playerId=<id>');
  }

  const db = openDatabase();
  const data = getPlayerSourceProvenance(db, playerId);
  console.log(JSON.stringify(data, null, 2));
  db.close();
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
};
