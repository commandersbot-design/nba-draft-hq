const fs = require('fs');
const path = require('path');
const { openDatabase, runStatements } = require('../lib/db');

const MIGRATION_PATH = path.join(__dirname, '..', '..', 'database', 'migrations', '2026-04-10-ingestion.sql');

function migrateIngestionSchema() {
  const db = openDatabase();
  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf8');

  try {
    runStatements(db, migrationSql);
    console.log('Applied ingestion migration:', path.basename(MIGRATION_PATH));
  } finally {
    db.close();
  }
}

if (require.main === module) {
  migrateIngestionSchema();
}

module.exports = { migrateIngestionSchema };
