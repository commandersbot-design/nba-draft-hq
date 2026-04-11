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
    eraBucket: toString(entry.eraBucket),
    draftSlotBand: toString(entry.draftSlotBand),
    positionFamily: toString(entry.positionFamily),
    archetypeFamily: toString(entry.archetypeFamily),
    percentiles: entry.percentiles || {},
    comparisonInputs: entry.comparisonInputs || {},
  };
}

function exportHistoricalProspects() {
  const db = openDatabase();
  const rows = db.prepare(`
    SELECT
      n.historical_id AS id,
      n.player_name AS name,
      n.draft_year AS draftYear,
      n.position,
      n.school,
      r.height,
      r.age,
      n.archetype,
      n.role_outcome AS roleOutcome,
      n.outcome_tier AS outcomeTier,
      n.points_per_game AS pointsPerGame,
      n.rebounds_per_game AS reboundsPerGame,
      n.assists_per_game AS assistsPerGame,
      printf('%.1f%%', n.true_shooting_pct) AS trueShooting,
      n.bpm,
      n.draft_slot AS draftSlot,
      n.notes,
      n.era_bucket AS eraBucket,
      n.draft_slot_band AS draftSlotBand,
      n.position_family AS positionFamily,
      n.archetype_family AS archetypeFamily,
      n.percentile_json AS percentileJson,
      n.comparison_inputs_json AS comparisonInputsJson
    FROM historical_prospects_normalized n
    JOIN historical_prospects_raw r ON r.historical_id = n.historical_id
    ORDER BY n.draft_year DESC, n.draft_slot ASC, n.player_name ASC
  `).all();

  const normalized = rows
    .map((row) => normalizeEntry({
      ...row,
      percentiles: JSON.parse(row.percentileJson || '{}'),
      comparisonInputs: JSON.parse(row.comparisonInputsJson || '{}'),
    }))
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
