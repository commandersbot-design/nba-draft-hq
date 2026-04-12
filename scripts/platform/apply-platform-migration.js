const fs = require('fs');
const { openDatabase, runStatements } = require('../lib/db');
const { PLATFORM_MIGRATION } = require('../../src/platform/db/platformSchema');

function applyPlatformMigration() {
  const db = openDatabase();

  try {
    const sql = fs.readFileSync(PLATFORM_MIGRATION, 'utf8');
    runStatements(db, sql);
    console.log(`Applied platform migration: ${PLATFORM_MIGRATION}`);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  applyPlatformMigration();
}

module.exports = { applyPlatformMigration };
