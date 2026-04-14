function upsertEntityResolutionOverride(db, {
  sourceName,
  externalId,
  playerId,
  confidenceOverride = 1,
  notes = null,
}) {
  if (!sourceName || !externalId || !playerId) {
    throw new Error('sourceName, externalId, and playerId are required.');
  }

  const player = db.prepare(`
    SELECT id
    FROM players
    WHERE id = ?
  `).get(playerId);

  if (!player) {
    throw new Error(`Player ${playerId} does not exist.`);
  }

  db.prepare(`
    INSERT INTO entity_resolution_overrides (
      source_name,
      external_id,
      player_id,
      confidence_override,
      notes
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(source_name, external_id) DO UPDATE SET
      player_id = excluded.player_id,
      confidence_override = excluded.confidence_override,
      notes = excluded.notes,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    sourceName,
    externalId,
    playerId,
    confidenceOverride,
    notes,
  );

  return db.prepare(`
    SELECT
      source_name,
      external_id,
      player_id,
      confidence_override,
      notes,
      updated_at
    FROM entity_resolution_overrides
    WHERE source_name = ? AND external_id = ?
  `).get(sourceName, externalId);
}

module.exports = {
  upsertEntityResolutionOverride,
};
