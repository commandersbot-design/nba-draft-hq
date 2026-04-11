const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../lib/db');

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'historicalProspects.json');

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : value == null ? fallback : String(value).trim();
}

function normalizeEntry(entry) {
  return {
    id: toString(entry.id),
    name: toString(entry.name),
    draftYear: toNumber(entry.draftYear),
    position: toString(entry.position),
    school: toString(entry.school),
    height: toString(entry.height),
    age: toNumber(entry.age),
    archetype: toString(entry.archetype),
    roleOutcome: toString(entry.roleOutcome),
    outcomeTier: toString(entry.outcomeTier),
    pointsPerGame: toNumber(entry.pointsPerGame),
    reboundsPerGame: toNumber(entry.reboundsPerGame),
    assistsPerGame: toNumber(entry.assistsPerGame),
    trueShooting: toString(entry.trueShooting),
    bpm: toNumber(entry.bpm),
    draftSlot: toNumber(entry.draftSlot),
    notes: toString(entry.notes),
  };
}

function exportHistoricalProspects() {
  const db = openDatabase();
  const rows = db.prepare(`
    SELECT
      historical_id AS id,
      player_name AS name,
      draft_year AS draftYear,
      position,
      school,
      height,
      age,
      archetype,
      role_outcome AS roleOutcome,
      outcome_tier AS outcomeTier,
      points_per_game AS pointsPerGame,
      rebounds_per_game AS reboundsPerGame,
      assists_per_game AS assistsPerGame,
      true_shooting AS trueShooting,
      bpm,
      draft_slot AS draftSlot,
      notes
    FROM historical_prospects_raw
    ORDER BY draft_year DESC, draft_slot ASC, player_name ASC
  `).all();

  const normalized = rows
    .map(normalizeEntry)
    .filter((entry) => entry.id && entry.name && entry.draftYear && entry.position)
    .sort((left, right) => {
      if (right.draftYear !== left.draftYear) return right.draftYear - left.draftYear;
      if (left.draftSlot !== right.draftSlot) return left.draftSlot - right.draftSlot;
      return left.name.localeCompare(right.name);
    });

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(normalized, null, 2)}\n`);
  db.close();
  console.log(`Exported ${normalized.length} historical prospects to ${OUTPUT_PATH}`);
}

if (require.main === module) {
  exportHistoricalProspects();
}

module.exports = { exportHistoricalProspects };
