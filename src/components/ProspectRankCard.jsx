export function ProspectRankCard({
  prospect,
  isActive,
  viewMode,
  isWatched,
  cardSettings,
  onSelect,
  onToggleWatchlist,
  onToggleCompare,
  onQuickNote,
}) {
  const topTrait = prospect.traitScores?.[0];
  const whyItMatters = prospect.summary?.strengths?.[0] || prospect.summary?.synopsis;
  const shootingScore = prospect.traitScores.find((trait) => trait.name === 'Shooting Gravity')?.score;
  const isFeatured = prospect.rank <= 5;
  const isPriority = prospect.rank <= 14;
  const hasVerifiedMeasurements = prospect.measurements?.sourceStatus === 'verified-current';

  return (
    <button
      type="button"
      className={`rank-card${isActive ? ' is-active' : ''}${isFeatured ? ' is-featured' : ''}${isPriority ? ' is-priority' : ''}`}
      onClick={() => onSelect(prospect.id)}
    >
      <div className="rank-number">{prospect.rank}</div>
      <div className="rank-content">
        <div className="rank-topline">
          <strong>{prospect.name}</strong>
          {isFeatured && <span className="row-badge row-badge-featured">Top Prospect</span>}
          {hasVerifiedMeasurements && <span className="row-badge row-badge-verified">Verified meas.</span>}
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
            <span>{prospect.overallComposite} overall</span>
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

        {viewMode !== 'skim' && whyItMatters && (
          <p className="rank-why">
            <strong>Why it matters:</strong> {whyItMatters}
            {topTrait ? ` ${topTrait.name} is currently the clearest carrying trait.` : ''}
          </p>
        )}

        {viewMode !== 'skim' && (
          <div className="rank-actions">
            <button
              type="button"
              className={`inline-action${isWatched ? ' is-active' : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleWatchlist(prospect.id);
              }}
            >
              {isWatched ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="inline-action" onClick={(event) => { event.stopPropagation(); onToggleCompare(prospect.id); }}>
              Compare
            </button>
            <button type="button" className="inline-action" onClick={(event) => { event.stopPropagation(); onQuickNote(prospect.id); }}>
              Note
            </button>
            {cardSettings.defensiveSummary && <span className="rank-chip">Def {prospect.defenseScore}</span>}
            {cardSettings.shootingSummary && <span className="rank-chip">Shot {shootingScore}</span>}
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
