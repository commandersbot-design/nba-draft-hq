const { normalizeName } = require('../normalization/entityResolver');

function nameTokens(value) {
  return normalizeName(value).split(' ').filter(Boolean);
}

function scoreCandidate(unmatchedName, player) {
  const target = normalizeName(unmatchedName);
  const candidateName = normalizeName(`${player.first_name} ${player.last_name}`);

  if (target === candidateName) {
    return 1;
  }

  const targetTokens = nameTokens(unmatchedName);
  const candidateTokens = candidateName.split(' ').filter(Boolean);
  const overlap = targetTokens.filter((token) => candidateTokens.includes(token)).length;
  if (!overlap) return 0;

  return overlap / Math.max(targetTokens.length, candidateTokens.length);
}

function findCandidatePlayers(db, { playerName, combineYear, limit = 5 }) {
  const players = db.prepare(`
    SELECT id, first_name, last_name, college, draft_class
    FROM players
    ORDER BY draft_class DESC, id ASC
  `).all();

  return players
    .map((player) => ({
      playerId: player.id,
      name: `${player.first_name} ${player.last_name}`,
      college: player.college,
      draftClass: player.draft_class,
      score: scoreCandidate(playerName, player),
      classDistance: combineYear ? Math.abs((player.draft_class || 0) - combineYear) : null,
    }))
    .filter((player) => player.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (left.classDistance ?? 999) - (right.classDistance ?? 999);
    })
    .slice(0, limit);
}

function getResolutionQueue(db, { sourceName = 'NBA.com Draft Combine', limit = 25 } = {}) {
  const numericLimit = Number.isFinite(Number(limit)) ? Number(limit) : 25;

  const rows = db.prepare(`
    SELECT
      ppm.source_player_id,
      ppm.player_name,
      ppm.combine_year,
      ppm.position,
      ppm.source,
      ppm.height,
      ppm.weight,
      ppm.wingspan
    FROM prospect_physical_measurements ppm
    WHERE ppm.player_id IS NULL
      AND ppm.source = ?
    GROUP BY ppm.source, ppm.source_player_id, ppm.combine_year
    ORDER BY ppm.combine_year DESC, ppm.player_name ASC
    LIMIT ?
  `).all(sourceName, numericLimit);

  return rows.map((row) => ({
    ...row,
    candidates: findCandidatePlayers(db, {
      playerName: row.player_name,
      combineYear: row.combine_year,
    }),
  }));
}

module.exports = {
  getResolutionQueue,
};
