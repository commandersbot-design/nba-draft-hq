const fs = require('fs');
const { openDatabase, runStatements } = require('../lib/db');
const { PLATFORM_SEEDS } = require('../../src/platform/db/platformSchema');

function seedPlatformVocabularies() {
  const db = openDatabase();

  try {
    const sql = fs.readFileSync(PLATFORM_SEEDS, 'utf8');
    runStatements(db, sql);
    console.log(`Seeded platform vocabularies: ${PLATFORM_SEEDS}`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  seedPlatformVocabularies();
}

module.exports = { seedPlatformVocabularies };
