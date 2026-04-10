const fs = require('fs');
const path = require('path');
const { openDatabase, withTransaction } = require('../lib/db');

const PROSPECTS_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'prospects.json');

function splitName(fullName) {
  const parts = String(fullName).trim().split(/\s+/);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ') || '',
  };
}

function toHeightInches(height) {
  const [feet, inches] = String(height || '').split('-').map(Number);
  if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null;
  return feet * 12 + inches;
}

function toWingspanInches(value) {
  if (!value) return null;
  const [feet, inches] = String(value).split('-').map(Number);
  if (!Number.isFinite(feet) || !Number.isFinite(inches)) return null;
  return feet * 12 + inches;
}

function normalizePrimaryPosition(position) {
  return String(position || '').split('/')[0] || null;
}

function normalizeSecondaryPosition(position) {
  return String(position || '').split('/')[1] || null;
}

function seedProspects() {
  const db = openDatabase();
  const prospects = JSON.parse(fs.readFileSync(PROSPECTS_PATH, 'utf8'));
  const upsertPlayer = db.prepare(`
    INSERT INTO players (
      first_name,
      last_name,
      position,
      secondary_position,
      height_inches,
      weight_lbs,
      wingspan_inches,
      college,
      country,
      draft_class
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updatePlayer = db.prepare(`
    UPDATE players
    SET position = ?,
        secondary_position = ?,
        height_inches = ?,
        weight_lbs = ?,
        wingspan_inches = ?,
        college = ?,
        country = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const selectPlayer = db.prepare(`
    SELECT id
    FROM players
    WHERE first_name = ? AND last_name = ? AND draft_class = ?
    LIMIT 1
  `);

  let inserted = 0;
  let updated = 0;

  withTransaction(db, () => {
    for (const prospect of prospects) {
      const { firstName, lastName } = splitName(prospect.name);
      const existing = selectPlayer.get(firstName, lastName, 2026);
      const primaryPosition = normalizePrimaryPosition(prospect.position);
      const secondaryPosition = normalizeSecondaryPosition(prospect.position);
      const values = [
        primaryPosition,
        secondaryPosition,
        toHeightInches(prospect.height),
        prospect.weight ? Number(prospect.weight) : null,
        toWingspanInches(prospect.wingspan || prospect.measurements?.wingspan),
        prospect.school,
        prospect.country && prospect.country !== 'Unknown' ? prospect.country : 'USA',
      ];

      if (existing) {
        updatePlayer.run(...values, existing.id);
        updated += 1;
      } else {
        upsertPlayer.run(
          firstName,
          lastName,
          primaryPosition,
          secondaryPosition,
          toHeightInches(prospect.height),
          prospect.weight ? Number(prospect.weight) : null,
          toWingspanInches(prospect.wingspan || prospect.measurements?.wingspan),
          prospect.school,
          prospect.country && prospect.country !== 'Unknown' ? prospect.country : 'USA',
          2026,
        );
        inserted += 1;
      }
    }
  });

  db.close();
  console.log(`Prospect seed complete. Inserted ${inserted}, updated ${updated}.`);
}

if (require.main === module) {
  seedProspects();
}

module.exports = { seedProspects };
