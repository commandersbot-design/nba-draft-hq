const { openDatabase, nowIso, withTransaction } = require('../lib/db');

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function parseTs(value) {
  const parsed = Number.parseFloat(String(value || '').replace('%', ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function positionFamily(position = '') {
  if (position.includes('PG')) return 'guard';
  if (position.includes('SF') || position.includes('SG')) return 'wing';
  return 'big';
}

function archetypeFamily(archetype = '') {
  const label = archetype.toLowerCase();
  if (label.includes('wing')) return 'Wing';
  if (label.includes('big') || label.includes('paint') || label.includes('coverage')) return 'Big';
  if (label.includes('guard') || label.includes('pilot') || label.includes('creator') || label.includes('mechanic')) return 'Guard';
  return 'Hybrid';
}

function draftSlotBand(slot) {
  if (slot <= 3) return 'Top 3';
  if (slot <= 8) return 'Top 8';
  if (slot <= 14) return 'Lottery';
  if (slot <= 30) return 'First Round';
  return 'Later Round';
}

function eraBucket(year) {
  if (year >= 2024) return 'Current';
  if (year >= 2022) return 'Recent';
  return 'Earlier';
}

function outcomeScore(outcomeTier) {
  switch (outcomeTier) {
    case 'Outlier':
      return 4;
    case 'Hit':
      return 3;
    case 'Swing':
      return 2;
    default:
      return 1;
  }
}

function percentile(values, target) {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const count = ordered.filter((value) => value <= target).length;
  return Math.round((count / ordered.length) * 100);
}

function transformHistoricalProspects() {
  const db = openDatabase();
  const rows = db.prepare(`
    SELECT
      historical_id,
      draft_year,
      draft_slot,
      player_name,
      position,
      school,
      archetype,
      role_outcome,
      outcome_tier,
      points_per_game,
      rebounds_per_game,
      assists_per_game,
      true_shooting,
      bpm,
      notes,
      source,
      last_updated
    FROM historical_prospects_raw
  `).all();

  const groupedByFamily = rows.reduce((accumulator, row) => {
    const family = positionFamily(row.position);
    accumulator[family] = accumulator[family] || [];
    accumulator[family].push(row);
    return accumulator;
  }, {});

  const upsert = db.prepare(`
    INSERT INTO historical_prospects_normalized (
      historical_id,
      draft_year,
      era_bucket,
      draft_slot,
      draft_slot_band,
      player_name,
      position,
      position_family,
      school,
      archetype,
      archetype_family,
      role_outcome,
      outcome_tier,
      outcome_score,
      points_per_game,
      rebounds_per_game,
      assists_per_game,
      true_shooting_pct,
      bpm,
      percentile_json,
      comparison_inputs_json,
      notes,
      source,
      last_updated,
      updated_at
    ) VALUES (
      @historical_id,
      @draft_year,
      @era_bucket,
      @draft_slot,
      @draft_slot_band,
      @player_name,
      @position,
      @position_family,
      @school,
      @archetype,
      @archetype_family,
      @role_outcome,
      @outcome_tier,
      @outcome_score,
      @points_per_game,
      @rebounds_per_game,
      @assists_per_game,
      @true_shooting_pct,
      @bpm,
      @percentile_json,
      @comparison_inputs_json,
      @notes,
      @source,
      @last_updated,
      @updated_at
    )
    ON CONFLICT(historical_id) DO UPDATE SET
      draft_year = excluded.draft_year,
      era_bucket = excluded.era_bucket,
      draft_slot = excluded.draft_slot,
      draft_slot_band = excluded.draft_slot_band,
      player_name = excluded.player_name,
      position = excluded.position,
      position_family = excluded.position_family,
      school = excluded.school,
      archetype = excluded.archetype,
      archetype_family = excluded.archetype_family,
      role_outcome = excluded.role_outcome,
      outcome_tier = excluded.outcome_tier,
      outcome_score = excluded.outcome_score,
      points_per_game = excluded.points_per_game,
      rebounds_per_game = excluded.rebounds_per_game,
      assists_per_game = excluded.assists_per_game,
      true_shooting_pct = excluded.true_shooting_pct,
      bpm = excluded.bpm,
      percentile_json = excluded.percentile_json,
      comparison_inputs_json = excluded.comparison_inputs_json,
      notes = excluded.notes,
      source = excluded.source,
      last_updated = excluded.last_updated,
      updated_at = excluded.updated_at
  `);

  withTransaction(db, () => {
    for (const row of rows) {
      const family = positionFamily(row.position);
      const cohort = groupedByFamily[family] || [];
      const points = toNumber(row.points_per_game, 0);
      const rebounds = toNumber(row.rebounds_per_game, 0);
      const assists = toNumber(row.assists_per_game, 0);
      const ts = parseTs(row.true_shooting);
      const bpm = toNumber(row.bpm, 0);
      const percentiles = {
        points: percentile(cohort.map((entry) => toNumber(entry.points_per_game, 0)), points),
        rebounds: percentile(cohort.map((entry) => toNumber(entry.rebounds_per_game, 0)), rebounds),
        assists: percentile(cohort.map((entry) => toNumber(entry.assists_per_game, 0)), assists),
        trueShooting: percentile(cohort.map((entry) => parseTs(entry.true_shooting)), ts),
        bpm: percentile(cohort.map((entry) => toNumber(entry.bpm, 0)), bpm),
      };

      upsert.run({
        historical_id: row.historical_id,
        draft_year: row.draft_year,
        era_bucket: eraBucket(row.draft_year),
        draft_slot: row.draft_slot,
        draft_slot_band: draftSlotBand(row.draft_slot),
        player_name: row.player_name,
        position: row.position,
        position_family: family,
        school: row.school,
        archetype: row.archetype,
        archetype_family: archetypeFamily(row.archetype),
        role_outcome: row.role_outcome,
        outcome_tier: row.outcome_tier,
        outcome_score: outcomeScore(row.outcome_tier),
        points_per_game: points,
        rebounds_per_game: rebounds,
        assists_per_game: assists,
        true_shooting_pct: ts,
        bpm,
        percentile_json: JSON.stringify(percentiles),
        comparison_inputs_json: JSON.stringify({
          draftSlotBand: draftSlotBand(row.draft_slot),
          eraBucket: eraBucket(row.draft_year),
          positionFamily: family,
        }),
        notes: row.notes,
        source: row.source,
        last_updated: row.last_updated,
        updated_at: nowIso(),
      });
    }
  });

  db.close();
  console.log(`Normalized ${rows.length} historical records.`);
}

if (require.main === module) {
  transformHistoricalProspects();
}

module.exports = { transformHistoricalProspects };
