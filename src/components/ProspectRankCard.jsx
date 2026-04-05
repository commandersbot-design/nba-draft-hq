export function ProspectRankCard({
  prospect,
  isActive,
  viewMode,
  isWatched,
  cardSettings,
  onSelect,
  onToggleCompare,
  onQuickNote,
}) {
  return (
    <button
      type="button"
      className={`rank-card${isActive ? ' is-active' : ''}`}
      onClick={() => onSelect(prospect.id)}
    >
      <div className="rank-number">{prospect.rank}</div>
      <div className="rank-content">
        <div className="rank-topline">
          <strong>{prospect.name}</strong>
          {isWatched && <span className="row-badge">Watchlist</span>}
          <span className={`risk-pill risk-${prospect.riskLevel.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{prospect.riskLevel}</span>
        </div>
        <div className="rank-subline">{prospect.position}, {prospect.school}</div>

        {cardSettings.school && (
          <div className="rank-meta-line">
            <span>{prospect.classYear}</span>
            <span>{prospect.leagueType}</span>
            {cardSettings.age && <span>Age {prospect.age}</span>}
          </div>
        )}

        {cardSettings.measurements && (
          <div className="rank-meta-line">
            <span>{prospect.measurementLine}</span>
          </div>
        )}

        {viewMode !== 'skim' && (
          <div className="rank-meta-line">
            {cardSettings.tier && <span>{prospect.tier}</span>}
            {cardSettings.roleProjection && <span>{prospect.roleProjection}</span>}
            <span>{prospect.overallComposite} composite</span>
            <span>{prospect.projection.stockBand}</span>
          </div>
        )}

        {(viewMode === 'peek' || viewMode === 'peruse' || viewMode === 'deep-dive') && (
          <div className="rank-description">
            {cardSettings.archetype && <span>{prospect.archetype}</span>}
            {cardSettings.traitSummary && (
              <span>{prospect.traitScores.slice(0, 2).map((trait) => `${trait.name.split(' ')[0]} ${trait.score}`).join(' / ')}</span>
            )}
          </div>
        )}

        {(viewMode === 'peruse' || viewMode === 'deep-dive') && (
          <div className="rank-actions">
            <button type="button" className="inline-action" onClick={(event) => { event.stopPropagation(); onToggleCompare(prospect.id); }}>
              Compare
            </button>
            <button type="button" className="inline-action" onClick={(event) => { event.stopPropagation(); onQuickNote(prospect.id); }}>
              Note
            </button>
            {cardSettings.defensiveSummary && <span className="rank-chip">Def {prospect.defenseScore}</span>}
            {cardSettings.shootingSummary && <span className="rank-chip">Shoot {prospect.traitScores.find((trait) => trait.name === 'Shooting Gravity')?.score}</span>}
          </div>
        )}

        {prospect.tags.length > 0 && (
          <div className="inline-tags">
            {prospect.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="mini-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
