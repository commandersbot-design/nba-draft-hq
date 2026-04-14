const fs = require('fs');
const path = require('path');
const { openDatabase } = require('../lib/db');

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'currentMeasurements.json');

function main() {
  const db = openDatabase();

  const rows = db.prepare(`
    SELECT
      p.id AS player_id,
      p.first_name,
      p.last_name,
      p.college,
      p.draft_class,
      m.height_inches,
      m.weight_lbs,
      m.wingspan_inches,
      m.standing_reach_inches,
      m.max_vertical,
      m.lane_agility,
      m.shuttle_run,
      m.three_quarter_sprint,
      sr.source_name,
      sr.snapshot_path,
      sr.source_last_updated,
      d.draft_year,
      d.age_on_draft_night,
      d.combine_invite
    FROM measurements m
    JOIN players p ON p.id = m.player_id
    LEFT JOIN source_records sr ON sr.id = m.source_record_id
    LEFT JOIN draft_info d ON d.player_id = p.id
    WHERE m.measurement_context = 'draft-combine'
    ORDER BY p.id ASC, m.updated_at DESC, m.id DESC
  `).all();

  const byPlayer = {};
  for (const row of rows) {
    if (byPlayer[row.player_id]) continue;
    byPlayer[row.player_id] = {
      playerId: row.player_id,
      name: `${row.first_name} ${row.last_name}`,
      college: row.college,
      draftClass: row.draft_class,
      measurements: {
        heightInches: row.height_inches,
        weightLbs: row.weight_lbs,
        wingspanInches: row.wingspan_inches,
        standingReachInches: row.standing_reach_inches,
        maxVertical: row.max_vertical,
        laneAgility: row.lane_agility,
        shuttleRun: row.shuttle_run,
        threeQuarterSprint: row.three_quarter_sprint,
      },
      source: {
        name: row.source_name || 'Combine / Pro Day Export',
        snapshotPath: row.snapshot_path || null,
        lastUpdated: row.source_last_updated || null,
      },
      draftInfo: {
        draftYear: row.draft_year,
        ageOnDraftNight: row.age_on_draft_night,
        combineInvite: Boolean(row.combine_invite),
      },
      coverage: {
        measurementStatus: 'verified-current',
        wingspanStatus: row.wingspan_inches ? 'verified' : 'missing',
      },
    };
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(byPlayer, null, 2));
  db.close();
  console.log(`Exported current measurements for ${Object.keys(byPlayer).length} players`);
}

if (require.main === module) {
  main();
}

module.exports = {
  main,
};
