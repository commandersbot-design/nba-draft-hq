function getPlayerSourceProvenance(db, playerId) {
  const player = db.prepare(`
    SELECT id, first_name, last_name
    FROM players
    WHERE id = ?
  `).get(playerId);

  if (!player) {
    return null;
  }

  const aliases = db.prepare(`
    SELECT alias, alias_type, source, confidence, is_primary
    FROM player_aliases
    WHERE player_id = ?
    ORDER BY is_primary DESC, confidence DESC, id ASC
  `).all(playerId);

  const measurements = db.prepare(`
    SELECT
      m.measurement_context,
      sr.source_name,
      sr.source_last_updated,
      sr.snapshot_path
    FROM measurements m
    LEFT JOIN source_records sr ON sr.id = m.source_record_id
    WHERE m.player_id = ?
    ORDER BY m.updated_at DESC, m.id DESC
  `).all(playerId);

  const advancedStats = db.prepare(`
    SELECT
      s.season_key,
      t.name AS team_name,
      sr.source_name,
      sr.source_last_updated,
      sr.snapshot_path
    FROM advanced_stats a
    LEFT JOIN seasons s ON s.id = a.season_id
    LEFT JOIN teams t ON t.id = a.team_id
    LEFT JOIN source_records sr ON sr.id = a.source_record_id
    WHERE a.player_id = ?
    ORDER BY a.updated_at DESC, a.id DESC
  `).all(playerId);

  const draftInfo = db.prepare(`
    SELECT
      d.draft_year,
      d.combine_invite,
      sr.source_name,
      sr.source_last_updated,
      sr.snapshot_path
    FROM draft_info d
    LEFT JOIN source_records sr ON sr.id = d.source_record_id
    WHERE d.player_id = ?
    LIMIT 1
  `).get(playerId);

  return {
    player: {
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
    },
    aliases,
    measurements,
    advancedStats,
    draftInfo: draftInfo || null,
  };
}

module.exports = {
  getPlayerSourceProvenance,
};
