const { openDatabase, nowIso, withTransaction } = require('../lib/db');

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return fallback;
  }
}

function roundScore(value) {
  return Number((value || 0).toFixed(3));
}

function filled(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function completeness(values) {
  if (!values.length) return 0;
  const present = values.filter(filled).length;
  return roundScore(present / values.length);
}

function buildRecordKey(recordType, row) {
  return [
    recordType,
    row.source,
    row.source_player_id || 'unknown-player',
    row.season || 'no-season',
    row.draft_year || 'no-draft-year',
    row.combine_year || 'no-combine-year',
  ].join('::');
}

function assessQuality(recordType, row, payload = {}) {
  const sharedConfidence = (
    (filled(row.source_player_id) ? 0.45 : 0) +
    (filled(row.player_name) ? 0.35 : 0) +
    ((filled(row.season) || filled(row.draft_year) || filled(row.combine_year)) ? 0.2 : 0)
  );

  let completenessFields = [];
  if (recordType === 'season-stats') {
    completenessFields = [
      row.school_team,
      row.league,
      row.class_year,
      row.age,
      row.position,
      payload.games,
      payload.minutes,
      payload.points,
      payload.rebounds,
      payload.assists,
      payload.fgPct,
      payload.threePct,
      payload.ftPct,
    ];
  } else if (recordType === 'advanced-metrics') {
    completenessFields = [
      row.school_team,
      row.league,
      row.position,
      payload.age,
      payload.tsPct,
      payload.efgPct,
      payload.usgPct,
      payload.astPct,
      payload.tovPct,
      payload.stlPct,
      payload.blkPct,
      payload.bpm,
      payload.obpm,
      payload.dbpm,
    ];
  } else if (recordType === 'combine-measurements') {
    completenessFields = [
      row.position,
      payload.age,
      payload.height,
      payload.weight,
      payload.wingspan,
      payload.standingReach,
      payload.maxVertical,
      payload.laneAgility,
      payload.shuttleRun,
      payload.sprint,
    ];
  } else if (recordType === 'nba-outcomes') {
    completenessFields = [
      row.draft_year,
      row.draft_slot,
      row.nba_team,
      payload.nbaGames,
      payload.nbaMinutes,
      payload.nbaPoints,
      payload.nbaRebounds,
      payload.nbaAssists,
      payload.nbaBpm,
      payload.position,
      payload.schoolTeam,
    ];
  }

  const completenessScore = completeness(completenessFields);
  const matchConfidence = roundScore(sharedConfidence);
  let promotionStatus = 'promoted';
  let promotionReason = 'record passed identity and completeness thresholds';

  if (matchConfidence < 0.8) {
    promotionStatus = 'rejected';
    promotionReason = 'missing stable identity fields';
  } else if (completenessScore < 0.35) {
    promotionStatus = 'rejected';
    promotionReason = 'missing too many required fields';
  } else if (completenessScore < 0.55) {
    promotionStatus = 'review';
    promotionReason = 'partial record promoted only after review threshold';
  }

  return {
    matchConfidence,
    completenessScore,
    promotionStatus,
    promotionReason,
    metadata: {
      recordType,
      source: row.source,
      season: row.season || null,
      draftYear: row.draft_year || null,
      combineYear: row.combine_year || null,
    },
  };
}

function upsertQualityGate(db, recordType, row, payload) {
  const quality = assessQuality(recordType, row, payload);
  const statement = db.prepare(`
    INSERT INTO historical_ingestion_quality (
      record_key, record_type, source, source_player_id, player_name, season, draft_year, combine_year,
      match_confidence, completeness_score, promotion_status, promotion_reason, metadata_json, updated_at
    ) VALUES (
      @record_key, @record_type, @source, @source_player_id, @player_name, @season, @draft_year, @combine_year,
      @match_confidence, @completeness_score, @promotion_status, @promotion_reason, @metadata_json, @updated_at
    )
    ON CONFLICT(record_key) DO UPDATE SET
      player_name = excluded.player_name,
      match_confidence = excluded.match_confidence,
      completeness_score = excluded.completeness_score,
      promotion_status = excluded.promotion_status,
      promotion_reason = excluded.promotion_reason,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at
  `);

  statement.run({
    record_key: buildRecordKey(recordType, row),
    record_type: recordType,
    source: row.source,
    source_player_id: row.source_player_id,
    player_name: row.player_name,
    season: row.season || null,
    draft_year: row.draft_year || null,
    combine_year: row.combine_year || null,
    match_confidence: quality.matchConfidence,
    completeness_score: quality.completenessScore,
    promotion_status: quality.promotionStatus,
    promotion_reason: quality.promotionReason,
    metadata_json: JSON.stringify(quality.metadata),
    updated_at: nowIso(),
  });

  return quality;
}

function insertOrUpdateProspectHistorical(db, payload) {
  const statement = db.prepare(`
    INSERT INTO prospects_historical (
      player_id, source_player_id, player_name, season, school_team, league, class_year, age, position,
      draft_year, draft_slot, nba_team, combine_year, source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @source_player_id, @player_name, @season, @school_team, @league, @class_year, @age, @position,
      @draft_year, @draft_slot, @nba_team, @combine_year, @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season, draft_year, combine_year) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      class_year = excluded.class_year,
      age = excluded.age,
      position = excluded.position,
      draft_slot = excluded.draft_slot,
      nba_team = excluded.nba_team,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
    RETURNING id
  `);

  return statement.get(payload).id;
}

function normalizeSeasonStats(db) {
  const rows = db.prepare(`
    SELECT source_player_id, player_name, season, school_team, league, class_year, age, position, source, payload, source_last_updated
    FROM cbb_player_seasons_raw
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_season_stats (
      player_id, prospect_historical_id, source_player_id, player_name, season, school_team, league, class_year, age, position,
      games, minutes, points, rebounds, assists, steals, blocks, turnovers, fg_pct, three_pct, ft_pct,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @season, @school_team, @league, @class_year, @age, @position,
      @games, @minutes, @points, @rebounds, @assists, @steals, @blocks, @turnovers, @fg_pct, @three_pct, @ft_pct,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      class_year = excluded.class_year,
      age = excluded.age,
      position = excluded.position,
      games = excluded.games,
      minutes = excluded.minutes,
      points = excluded.points,
      rebounds = excluded.rebounds,
      assists = excluded.assists,
      steals = excluded.steals,
      blocks = excluded.blocks,
      turnovers = excluded.turnovers,
      fg_pct = excluded.fg_pct,
      three_pct = excluded.three_pct,
      ft_pct = excluded.ft_pct,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  let promoted = 0;

  for (const row of rows) {
    const payload = parseJson(row.payload);
    const quality = upsertQualityGate(db, 'season-stats', row, payload);
    if (quality.promotionStatus !== 'promoted') continue;
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      class_year: row.class_year,
      age: row.age,
      position: row.position,
      draft_year: null,
      draft_slot: null,
      nba_team: null,
      combine_year: null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      class_year: row.class_year,
      age: row.age,
      position: row.position,
      games: payload.games ?? null,
      minutes: payload.minutes ?? null,
      points: payload.points ?? null,
      rebounds: payload.rebounds ?? null,
      assists: payload.assists ?? null,
      steals: payload.steals ?? null,
      blocks: payload.blocks ?? null,
      turnovers: payload.turnovers ?? null,
      fg_pct: payload.fgPct ?? null,
      three_pct: payload.threePct ?? null,
      ft_pct: payload.ftPct ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
    promoted += 1;
  }

  return { scanned: rows.length, promoted };
}

function normalizeAdvancedMetrics(db) {
  const rows = db.prepare(`
    SELECT source_player_id, player_name, season, school_team, league, position, source, payload, source_last_updated
    FROM cbb_advanced_metrics_raw
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_advanced_metrics (
      player_id, prospect_historical_id, source_player_id, player_name, season, school_team, league, age, position,
      ts_pct, efg_pct, usg_pct, ast_pct, tov_pct, stl_pct, blk_pct, bpm, obpm, dbpm,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @season, @school_team, @league, @age, @position,
      @ts_pct, @efg_pct, @usg_pct, @ast_pct, @tov_pct, @stl_pct, @blk_pct, @bpm, @obpm, @dbpm,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, season) DO UPDATE SET
      player_name = excluded.player_name,
      school_team = excluded.school_team,
      league = excluded.league,
      age = excluded.age,
      position = excluded.position,
      ts_pct = excluded.ts_pct,
      efg_pct = excluded.efg_pct,
      usg_pct = excluded.usg_pct,
      ast_pct = excluded.ast_pct,
      tov_pct = excluded.tov_pct,
      stl_pct = excluded.stl_pct,
      blk_pct = excluded.blk_pct,
      bpm = excluded.bpm,
      obpm = excluded.obpm,
      dbpm = excluded.dbpm,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  let promoted = 0;

  for (const row of rows) {
    const payload = parseJson(row.payload);
    const quality = upsertQualityGate(db, 'advanced-metrics', row, payload);
    if (quality.promotionStatus !== 'promoted') continue;
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      class_year: null,
      age: payload.age ?? null,
      position: row.position,
      draft_year: null,
      draft_slot: null,
      nba_team: null,
      combine_year: null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: row.season,
      school_team: row.school_team,
      league: row.league,
      age: payload.age ?? null,
      position: row.position,
      ts_pct: payload.tsPct ?? null,
      efg_pct: payload.efgPct ?? null,
      usg_pct: payload.usgPct ?? null,
      ast_pct: payload.astPct ?? null,
      tov_pct: payload.tovPct ?? null,
      stl_pct: payload.stlPct ?? null,
      blk_pct: payload.blkPct ?? null,
      bpm: payload.bpm ?? null,
      obpm: payload.obpm ?? null,
      dbpm: payload.dbpm ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
    promoted += 1;
  }

  return { scanned: rows.length, promoted };
}

function normalizeCombineMeasurements(db) {
  const rows = db.prepare(`
    SELECT source_player_id, player_name, combine_year, position, source, payload, source_last_updated
    FROM combine_measurements_raw
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_physical_measurements (
      player_id, prospect_historical_id, source_player_id, player_name, combine_year, age, position,
      height, weight, wingspan, standing_reach, max_vertical, lane_agility, shuttle_run, sprint,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @combine_year, @age, @position,
      @height, @weight, @wingspan, @standing_reach, @max_vertical, @lane_agility, @shuttle_run, @sprint,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, combine_year) DO UPDATE SET
      player_name = excluded.player_name,
      age = excluded.age,
      position = excluded.position,
      height = excluded.height,
      weight = excluded.weight,
      wingspan = excluded.wingspan,
      standing_reach = excluded.standing_reach,
      max_vertical = excluded.max_vertical,
      lane_agility = excluded.lane_agility,
      shuttle_run = excluded.shuttle_run,
      sprint = excluded.sprint,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  let promoted = 0;

  for (const row of rows) {
    const payload = parseJson(row.payload);
    const quality = upsertQualityGate(db, 'combine-measurements', row, payload);
    if (quality.promotionStatus !== 'promoted') continue;
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: null,
      school_team: null,
      league: null,
      class_year: null,
      age: payload.age ?? null,
      position: row.position,
      draft_year: null,
      draft_slot: null,
      nba_team: null,
      combine_year: row.combine_year,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      combine_year: row.combine_year,
      age: payload.age ?? null,
      position: row.position,
      height: payload.height ?? null,
      weight: payload.weight ?? null,
      wingspan: payload.wingspan ?? null,
      standing_reach: payload.standingReach ?? null,
      max_vertical: payload.maxVertical ?? null,
      lane_agility: payload.laneAgility ?? null,
      shuttle_run: payload.shuttleRun ?? null,
      sprint: payload.sprint ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
    promoted += 1;
  }

  return { scanned: rows.length, promoted };
}

function normalizeNbaOutcomes(db) {
  const rows = db.prepare(`
    SELECT
      d.source_player_id, d.player_name, d.draft_year, d.draft_slot, d.nba_team, d.source, d.source_last_updated,
      d.payload AS draft_payload, o.payload AS outcome_payload
    FROM nba_draft_history_raw d
    LEFT JOIN nba_player_outcomes_raw o
      ON o.source = d.source
      AND o.source_player_id = d.source_player_id
      AND o.draft_year = d.draft_year
  `).all();

  const upsert = db.prepare(`
    INSERT INTO prospect_nba_outcomes (
      player_id, prospect_historical_id, source_player_id, player_name, draft_year, draft_slot, nba_team,
      nba_games, nba_minutes, nba_points, nba_rebounds, nba_assists, nba_bpm,
      source, source_last_updated, updated_at
    ) VALUES (
      @player_id, @prospect_historical_id, @source_player_id, @player_name, @draft_year, @draft_slot, @nba_team,
      @nba_games, @nba_minutes, @nba_points, @nba_rebounds, @nba_assists, @nba_bpm,
      @source, @source_last_updated, @updated_at
    )
    ON CONFLICT(source, source_player_id, draft_year) DO UPDATE SET
      player_name = excluded.player_name,
      draft_slot = excluded.draft_slot,
      nba_team = excluded.nba_team,
      nba_games = excluded.nba_games,
      nba_minutes = excluded.nba_minutes,
      nba_points = excluded.nba_points,
      nba_rebounds = excluded.nba_rebounds,
      nba_assists = excluded.nba_assists,
      nba_bpm = excluded.nba_bpm,
      source_last_updated = excluded.source_last_updated,
      updated_at = excluded.updated_at
  `);

  let promoted = 0;

  for (const row of rows) {
    const payload = parseJson(row.outcome_payload || row.draft_payload);
    const draftPayload = parseJson(row.draft_payload);
    const quality = upsertQualityGate(db, 'nba-outcomes', row, payload);
    if (quality.promotionStatus !== 'promoted') continue;
    const prospectHistoricalId = insertOrUpdateProspectHistorical(db, {
      player_id: null,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      season: null,
      school_team: draftPayload.schoolTeam ?? null,
      league: null,
      class_year: null,
      age: null,
      position: draftPayload.position ?? null,
      draft_year: row.draft_year,
      draft_slot: row.draft_slot,
      nba_team: row.nba_team,
      combine_year: null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });

    upsert.run({
      player_id: null,
      prospect_historical_id: prospectHistoricalId,
      source_player_id: row.source_player_id,
      player_name: row.player_name,
      draft_year: row.draft_year,
      draft_slot: row.draft_slot,
      nba_team: row.nba_team,
      nba_games: payload.nbaGames ?? null,
      nba_minutes: payload.nbaMinutes ?? null,
      nba_points: payload.nbaPoints ?? null,
      nba_rebounds: payload.nbaRebounds ?? null,
      nba_assists: payload.nbaAssists ?? null,
      nba_bpm: payload.nbaBpm ?? null,
      source: row.source,
      source_last_updated: row.source_last_updated,
      updated_at: nowIso(),
    });
    promoted += 1;
  }

  return { scanned: rows.length, promoted };
}

function normalizeHistoricalSources() {
  const db = openDatabase();
  const startedAt = nowIso();

  try {
    let scanned = 0;
    let promoted = 0;
    withTransaction(db, () => {
      const seasonStats = normalizeSeasonStats(db);
      const advanced = normalizeAdvancedMetrics(db);
      const measurements = normalizeCombineMeasurements(db);
      const outcomes = normalizeNbaOutcomes(db);
      scanned += seasonStats.scanned + advanced.scanned + measurements.scanned + outcomes.scanned;
      promoted += seasonStats.promoted + advanced.promoted + measurements.promoted + outcomes.promoted;
    });

    db.prepare(`
      INSERT INTO source_sync_log (
        source, sync_type, season, status, started_at, finished_at,
        records_fetched, records_written, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'HistoricalNormalization',
      'historical-normalize',
      'historical',
      'success',
      startedAt,
      nowIso(),
      scanned,
      promoted,
      JSON.stringify({
        normalizedTables: [
          'prospects_historical',
          'prospect_season_stats',
          'prospect_advanced_metrics',
          'prospect_physical_measurements',
          'prospect_nba_outcomes',
        ],
        qualityTable: 'historical_ingestion_quality',
        promotionPolicy: 'only promoted rows feed normalized tables',
      }),
    );

    console.log(`Normalized ${promoted} promoted historical source rows from ${scanned} scanned raw rows into Prospera tables.`);
  } catch (error) {
    db.prepare(`
      INSERT INTO source_sync_log (
        source, sync_type, season, status, started_at, finished_at,
        records_fetched, records_written, error_message, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'HistoricalNormalization',
      'historical-normalize',
      'historical',
      'error',
      startedAt,
      nowIso(),
      0,
      0,
      error.message,
      JSON.stringify({ error: error.message }),
    );
    throw error;
  } finally {
    db.close();
  }
}

if (require.main === module) {
  normalizeHistoricalSources();
}

module.exports = { normalizeHistoricalSources };
