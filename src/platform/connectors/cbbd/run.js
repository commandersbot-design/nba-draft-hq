const path = require('path');
const { getCollegeBasketballDataPayload } = require('../../../../scripts/ingestion/sources/collegeBasketballData');
const { resolvePlayer } = require('../../normalization/entityResolver');
const {
  ensureLeague,
  ensurePlayerAlias,
  ensureSeason,
  ensureTeam,
  ensureGame,
  upsertAdvancedStats,
  upsertBoxScore,
} = require('../../normalization/cbbdNormalizer');
const { storeSourceRecord, withPlatformRun, withTransaction, writeSnapshot } = require('../../db/runStore');

const SOURCE = {
  displayName: 'CollegeBasketballData',
  reliabilityTier: 'primary',
  complianceMode: 'official-api-with-key',
  snapshotDirectory: path.join('data', 'snapshots', 'cbbd'),
};

function parseSeason(context) {
  return context.season || process.env.CBBD_SEASON || '2025-26';
}

function upsertPlayerStatsRaw(db, rows) {
  const stmt = db.prepare(`
    INSERT INTO player_stats_raw (player_id, season, source, external_player_key, payload, last_updated)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id, season, source, external_player_key)
    DO UPDATE SET payload = excluded.payload, last_updated = excluded.last_updated
  `);

  for (const row of rows) {
    stmt.run(row.playerId, row.season, row.source, row.externalPlayerKey, JSON.stringify(row.payload), new Date().toISOString());
  }
}

function upsertPlayerGameLogsRaw(db, rows) {
  const stmt = db.prepare(`
    INSERT INTO player_game_logs_raw (player_id, season, source, external_game_key, game_date, opponent, payload, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id, source, external_game_key)
    DO UPDATE SET payload = excluded.payload, game_date = excluded.game_date, opponent = excluded.opponent, last_updated = excluded.last_updated
  `);

  for (const row of rows) {
    stmt.run(row.playerId, row.season, row.source, row.externalGameKey, row.gameDate, row.opponent, JSON.stringify(row.payload), new Date().toISOString());
  }
}

function normalizeNameKey(value) {
  return String(value || '').trim().toLowerCase();
}

function buildResolvedRows(db, season, payloadPlayers = []) {
  const statsRows = [];
  const gameLogRows = [];

  for (const entry of payloadPlayers) {
    const resolution = resolvePlayer({
      db,
      playerName: entry.playerName,
      schoolTeam: entry.schoolTeam || entry.team || '',
      draftClass: 2026,
      sourceName: SOURCE.displayName,
      externalId: entry.externalPlayerKey || entry.playerName,
    });

    if (resolution.playerId) {
      statsRows.push({
        playerId: resolution.playerId,
        season,
        source: 'CollegeBasketballData',
        externalPlayerKey: entry.externalPlayerKey || entry.playerName,
        payload: entry.stats,
      });
    }

    for (const gameLog of entry.gameLogs || []) {
      if (!resolution.playerId) continue;
      gameLogRows.push({
        playerId: resolution.playerId,
        season,
        source: 'CollegeBasketballData',
        externalGameKey: gameLog.gameId,
        gameDate: gameLog.gameDate,
        opponent: gameLog.opponent,
        payload: gameLog,
        externalPlayerKey: entry.externalPlayerKey || entry.playerName,
      });
    }
  }

  return { statsRows, gameLogRows };
}

function normalizeCbbdIntoPlatform(db, { season, payloadPlayers, snapshotPath, runId }) {
  const leagueId = ensureLeague(db, {
    slug: 'ncaa',
    name: 'NCAA',
    level: 'college',
    country: 'USA',
  });
  const seasonId = ensureSeason(db, { seasonKey: season, leagueId });

  let normalizedRecords = 0;

  for (const row of payloadPlayers) {
    const resolution = resolvePlayer({
      db,
      playerName: row.playerName,
      schoolTeam: row.schoolTeam || row.team || '',
      draftClass: 2026,
      sourceName: SOURCE.displayName,
      externalId: row.externalPlayerKey || row.playerName,
    });

    if (!resolution.playerId) {
      continue;
    }

    const teamName = row.schoolTeam || row.team || db.prepare('SELECT college FROM players WHERE id = ?').get(resolution.playerId)?.college || 'Unknown Team';
    const teamId = ensureTeam(db, { teamName, leagueId });
    ensurePlayerAlias(db, {
      playerId: resolution.playerId,
      alias: row.externalPlayerKey || row.playerName,
      source: SOURCE.displayName,
    });

    const sourceRecordId = storeSourceRecord(db, {
      sourceName: SOURCE.displayName,
      reliabilityTier: SOURCE.reliabilityTier,
      entityType: 'normalized-player-season',
      externalId: row.externalPlayerKey || normalizeNameKey(row.playerName),
      snapshotPath,
      payload: {
        playerName: row.playerName,
        season,
        stats: row.stats,
      },
      complianceMode: SOURCE.complianceMode,
      ingestionRunId: runId,
    });

    upsertAdvancedStats(db, {
      playerId: resolution.playerId,
      seasonId,
      teamId,
      stats: row.stats || {},
      sourceRecordId,
    });
    normalizedRecords += 1;

    for (const gameLog of row.gameLogs || []) {
      const opponentTeamId = ensureTeam(db, {
        teamName: gameLog.opponent || 'Unknown Opponent',
        leagueId,
      });
      const gameId = ensureGame(db, {
        externalGameKey: gameLog.gameId,
        seasonId,
        leagueId,
        gameDate: gameLog.gameDate || null,
        homeTeamId: teamId,
        awayTeamId: opponentTeamId,
        source: SOURCE.displayName,
      });

      upsertBoxScore(db, {
        gameId,
        playerId: resolution.playerId,
        teamId,
        seasonId,
        gameLog,
        sourceRecordId,
      });
      normalizedRecords += 1;
    }
  }

  return {
    seasonId,
    leagueId,
    normalizedRecords,
  };
}

async function runCbbdFullRefresh(context = {}) {
  const season = parseSeason(context);
  const mode = context.mode || 'full';

  return withPlatformRun({
    sourceName: SOURCE.displayName,
    jobName: mode === 'incremental' ? 'cbbd-incremental-refresh' : 'cbbd-full-refresh',
    mode,
    metadata: { season },
  }, async ({ db, runId, runKey }) => {
    const snapshotRoot = path.join(process.cwd(), SOURCE.snapshotDirectory);
    const rawPayload = await getCollegeBasketballDataPayload(season);
    const payloadPlayers = rawPayload.players || [];
    const { statsRows, gameLogRows } = buildResolvedRows(db, season, payloadPlayers);
    const groupedSourcePayload = {
      season,
      source: SOURCE.displayName,
      metadata: {
        mode: process.env.CBBD_STATS_ENDPOINT ? 'live' : 'fixture',
      },
      players: payloadPlayers,
    };

    const snapshotPath = writeSnapshot(snapshotRoot, `${runKey}-${season}`, groupedSourcePayload);

    withTransaction(db, () => {
      upsertPlayerStatsRaw(db, statsRows);
      upsertPlayerGameLogsRaw(db, gameLogRows);
    });

    const normalization = withTransaction(db, () =>
      normalizeCbbdIntoPlatform(db, {
        season,
        payloadPlayers,
        snapshotPath,
        runId,
      }));

    return {
      status: process.env.CBBD_STATS_ENDPOINT ? 'success' : 'partial',
      sourceName: SOURCE.displayName,
      recordsSeen: payloadPlayers.length,
      recordsWritten: statsRows.length + gameLogRows.length + normalization.normalizedRecords,
      recordsRejected: payloadPlayers.length - statsRows.length,
      message: process.env.CBBD_STATS_ENDPOINT
        ? 'CBBD live connector completed.'
        : 'CBBD connector completed in fixture fallback mode because no live endpoint/key was configured.',
      metadata: {
        season,
        mode: process.env.CBBD_STATS_ENDPOINT ? 'live' : 'fixture',
        snapshotPath,
        normalizedRecords: normalization.normalizedRecords,
      },
    };
  });
}

module.exports = {
  runCbbdFullRefresh,
};
