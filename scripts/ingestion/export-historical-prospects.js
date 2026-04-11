const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '..', '..', 'imports', 'fixtures', 'historical-prospects-seed.json');
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
  const raw = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const normalized = raw
    .map(normalizeEntry)
    .filter((entry) => entry.id && entry.name && entry.draftYear && entry.position)
    .sort((left, right) => {
      if (right.draftYear !== left.draftYear) return right.draftYear - left.draftYear;
      if (left.draftSlot !== right.draftSlot) return left.draftSlot - right.draftSlot;
      return left.name.localeCompare(right.name);
    });

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(normalized, null, 2)}\n`);
  console.log(`Exported ${normalized.length} historical prospects to ${OUTPUT_PATH}`);
}

if (require.main === module) {
  exportHistoricalProspects();
}

module.exports = { exportHistoricalProspects };
