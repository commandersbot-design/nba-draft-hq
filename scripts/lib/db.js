const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', '..', 'database', 'draft_hq.db');

function openDatabase() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  return db;
}

function nowIso() {
  return new Date().toISOString();
}

function runStatements(db, sql) {
  db.exec(sql);
}

function withTransaction(db, callback) {
  db.exec('BEGIN');

  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = {
  DB_PATH,
  openDatabase,
  nowIso,
  runStatements,
  withTransaction,
};
