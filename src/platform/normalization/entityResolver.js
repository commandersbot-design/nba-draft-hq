function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPlayerIndex(db) {
  const players = db.prepare(`
    SELECT id, first_name, last_name, college, draft_class
    FROM players
  `).all();

  const aliases = db.prepare(`
    SELECT player_id, alias
    FROM player_aliases
  `).all();

  const index = new Map();

  for (const player of players) {
    const fullName = normalizeName(`${player.first_name} ${player.last_name}`);
    index.set(`${fullName}|${player.draft_class}`, {
      playerId: player.id,
      confidence: 1,
      strategy: 'exact-name-draft-class',
    });

    if (player.college) {
      index.set(`${fullName}|${normalizeName(player.college)}|${player.draft_class}`, {
        playerId: player.id,
        confidence: 1,
        strategy: 'exact-name-college-draft-class',
      });
    }
  }

  for (const alias of aliases) {
    const normalizedAlias = normalizeName(alias.alias);
    const existing = index.get(normalizedAlias);
    if (!existing) {
      index.set(normalizedAlias, {
        playerId: alias.player_id,
        confidence: 0.95,
        strategy: 'manual-alias',
      });
    }
  }

  return index;
}

function findOverride(db, { sourceName, externalId }) {
  if (!sourceName || !externalId) return null;

  const row = db.prepare(`
    SELECT player_id, confidence_override
    FROM entity_resolution_overrides
    WHERE source_name = ? AND external_id = ?
  `).get(sourceName, externalId);

  if (!row) return null;

  return {
    playerId: row.player_id,
    confidence: row.confidence_override ?? 1,
    strategy: 'manual-override',
  };
}

function resolvePlayer({ db, playerName, schoolTeam = '', draftClass = 2026, sourceName = '', externalId = '' }) {
  const override = findOverride(db, { sourceName, externalId });
  if (override) {
    return override;
  }

  const index = buildPlayerIndex(db);
  const normalizedName = normalizeName(playerName);
  const normalizedSchool = normalizeName(schoolTeam);

  const exactKey = `${normalizedName}|${normalizedSchool}|${draftClass}`;
  if (index.has(exactKey)) return index.get(exactKey);

  const nameKey = `${normalizedName}|${draftClass}`;
  if (index.has(nameKey)) return index.get(nameKey);

  if (index.has(normalizedName)) return index.get(normalizedName);

  return {
    playerId: null,
    confidence: 0,
    strategy: 'unresolved',
  };
}

module.exports = {
  buildPlayerIndex,
  findOverride,
  normalizeName,
  resolvePlayer,
};
