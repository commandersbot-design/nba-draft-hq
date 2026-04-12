const fs = require('fs');
const path = require('path');
const { resolvePlayer } = require('../../normalization/entityResolver');
const { ensureLeague, ensureSeason } = require('../../normalization/cbbdNormalizer');
const { normalizeNbaCombineRow } = require('../../normalization/nbaCombineNormalizer');
const { storeSourceRecord, withPlatformRun, withTransaction, writeSnapshot } = require('../../db/runStore');

const SOURCE = {
  displayName: 'NBA.com Draft Combine',
  reliabilityTier: 'primary',
  complianceMode: 'official-web-endpoint-defensive',
  snapshotDirectory: path.join('data', 'snapshots', 'nba-combine'),
};

function combineBootstrapPath() {
  return path.join(process.cwd(), 'imports', 'upstream', 'nba-combine', 'bootstrap.json');
}

function parseSeasonKey(combineYear) {
  const year = Number(combineYear || new Date().getUTCFullYear());
  return `${year}-${String(year + 1).slice(-2)}`;
}

async function fetchLiveCombineDataset() {
  const endpoint = process.env.NBA_COMBINE_ENDPOINT;
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ProsperaPlatform/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`NBA combine fetch failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.players)) return payload.players;
  if (Array.isArray(payload.measurements)) return payload.measurements;
  return [];
}

function loadBootstrapDataset() {
  const filePath = combineBootstrapPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function getNbaCombinePayload() {
  const livePayload = await fetchLiveCombineDataset();
  if (livePayload) {
    return {
      mode: 'live',
      rows: livePayload,
    };
  }

  return {
    mode: 'fixture',
    rows: loadBootstrapDataset(),
  };
}

function mapMeasurementRow(entry) {
  return {
    sourcePlayerId: entry.source_player_id || entry.sourcePlayerId || entry.player_id || entry.playerId || entry.player_name || entry.playerName,
    playerName: entry.player_name || entry.playerName,
    combineYear: entry.combine_year || entry.combineYear || entry.year,
    age: entry.age ?? null,
    position: entry.position || null,
    height: entry.height || entry.height_inches || null,
    weight: entry.weight || entry.weight_lbs || null,
    wingspan: entry.wingspan || entry.wingspan_inches || null,
    standingReach: entry.standing_reach || entry.standingReach || null,
    maxVertical: entry.max_vertical || entry.maxVertical || entry.vertical || null,
    laneAgility: entry.lane_agility || entry.laneAgility || null,
    shuttleRun: entry.shuttle_run || entry.shuttleRun || null,
    sprint: entry.sprint || entry.three_quarter_sprint || entry.threeQuarterSprint || null,
    payload: entry,
  };
}

function upsertCombineMeasurementsRaw(db, rows) {
  const stmt = db.prepare(`
    INSERT INTO combine_measurements_raw (
      source_player_id,
      player_name,
      combine_year,
      position,
      source,
      payload,
      source_last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, source_player_id, combine_year)
    DO UPDATE SET
      player_name = excluded.player_name,
      position = excluded.position,
      payload = excluded.payload,
      source_last_updated = excluded.source_last_updated,
      updated_at = CURRENT_TIMESTAMP
  `);

  const now = new Date().toISOString();
  for (const row of rows) {
    stmt.run(
      row.sourcePlayerId,
      row.playerName,
      row.combineYear,
      row.position,
      SOURCE.displayName,
      JSON.stringify(row.payload || {}),
      now,
    );
  }
}

function normalizeNbaCombineIntoPlatform(db, { rows, snapshotPath, runId }) {
  const leagueId = ensureLeague(db, {
    slug: 'nba-draft',
    name: 'NBA Draft',
    level: 'pre-draft',
    country: 'USA',
  });

  let normalizedRecords = 0;
  let playerLinkedRecords = 0;

  for (const row of rows) {
    const draftClass = Number(row.combineYear || 0);
    const resolution = resolvePlayer({
      db,
      playerName: row.playerName,
      schoolTeam: '',
      draftClass: Number.isFinite(draftClass) && draftClass > 0 ? draftClass : 2026,
      sourceName: SOURCE.displayName,
      externalId: row.sourcePlayerId || row.playerName,
    });

    const seasonId = ensureSeason(db, {
      seasonKey: parseSeasonKey(row.combineYear),
      leagueId,
    });

    const sourceRecordId = storeSourceRecord(db, {
      sourceName: SOURCE.displayName,
      reliabilityTier: SOURCE.reliabilityTier,
      entityType: resolution.playerId ? 'normalized-combine-measurement' : 'historical-combine-measurement',
      externalId: row.sourcePlayerId || row.playerName,
      snapshotPath,
      payload: row.payload,
      complianceMode: SOURCE.complianceMode,
      ingestionRunId: runId,
    });

    const result = normalizeNbaCombineRow(db, {
      playerId: resolution.playerId || null,
      seasonId,
      measurement: row,
      sourceName: SOURCE.displayName,
      sourceRecordId,
    });

    if (result?.historicalRecord) {
      normalizedRecords += 1;
    }
    if (result?.playerLinkedRecord) {
      playerLinkedRecords += 1;
    }
  }

  return {
    normalizedRecords,
    playerLinkedRecords,
  };
}

async function runNbaCombineFullRefresh(context = {}) {
  return withPlatformRun({
    sourceName: SOURCE.displayName,
    jobName: context.mode === 'incremental' ? 'nba-combine-incremental-refresh' : 'nba-combine-full-refresh',
    mode: context.mode || 'full',
    metadata: context,
  }, async ({ db, runId, runKey }) => {
    const payload = await getNbaCombinePayload();
    const rows = (payload.rows || [])
      .map(mapMeasurementRow)
      .filter((row) => row.playerName && row.combineYear);

    const snapshotRoot = path.join(process.cwd(), SOURCE.snapshotDirectory);
    const snapshotPath = writeSnapshot(snapshotRoot, `${runKey}-${payload.mode}`, {
      source: SOURCE.displayName,
      mode: payload.mode,
      rows,
    });

    withTransaction(db, () => {
      upsertCombineMeasurementsRaw(db, rows);
    });

    const normalization = withTransaction(db, () =>
      normalizeNbaCombineIntoPlatform(db, {
        rows,
        snapshotPath,
        runId,
      }));

    return {
      status: payload.mode === 'live' ? 'success' : 'partial',
      sourceName: SOURCE.displayName,
      recordsSeen: rows.length,
      recordsWritten: rows.length + normalization.normalizedRecords,
      recordsRejected: rows.length - normalization.playerLinkedRecords,
      message: payload.mode === 'live'
        ? 'NBA combine connector completed.'
        : 'NBA combine connector completed in fixture fallback mode because no live endpoint was configured.',
      metadata: {
        mode: payload.mode,
        snapshotPath,
        normalizedRecords: normalization.normalizedRecords,
        playerLinkedRecords: normalization.playerLinkedRecords,
      },
    };
  });
}

module.exports = {
  runNbaCombineFullRefresh,
};
