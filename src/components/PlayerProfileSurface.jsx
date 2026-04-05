import { TAG_OPTIONS } from '../lib/constants';

export function PlayerProfileSurface({
  prospect,
  notes,
  viewMode,
  isWatched,
  isCompared,
  onToggleWatchlist,
  onToggleCompare,
  onUpdateTier,
  onToggleTag,
  onCreateNote,
}) {
  if (!prospect) {
    return (
      <div className="detail-empty">
        <p className="eyebrow">Player Detail</p>
        <h3>Select a prospect</h3>
        <p>Open a row to inspect profile context, traits, projection, and notes.</p>
      </div>
    );
  }

  return (
    <div className="detail-card">
      <div className="detail-top">
        <div>
          <p className="eyebrow">Player Profile</p>
          <h3>{prospect.name}</h3>
          <p className="detail-meta">{prospect.position}, {prospect.school}, {prospect.classYear}</p>
        </div>

        <div className="detail-actions">
          <span className="pill">{prospect.tier}</span>
          <button type="button" className={`action-button${isWatched ? ' is-active' : ''}`} onClick={() => onToggleWatchlist(prospect.id)}>
            {isWatched ? 'Saved' : 'Watchlist'}
          </button>
          <button type="button" className={`action-button${isCompared ? ' is-active' : ''}`} onClick={() => onToggleCompare(prospect.id)}>
            {isCompared ? 'Compared' : 'Compare'}
          </button>
        </div>
      </div>

      <section className="profile-hero-grid">
        <div className="profile-hero-card">
          <span className="stat-label">Composite</span>
          <strong>{prospect.overallComposite}</strong>
          <span className="stat-detail">{prospect.roleProjection}</span>
        </div>
        <div className="profile-hero-card">
          <span className="stat-label">Risk</span>
          <strong>{prospect.riskLevel}</strong>
          <span className="stat-detail">{prospect.projection.stockBand}</span>
        </div>
        <div className="profile-hero-card">
          <span className="stat-label">Archetype</span>
          <strong>{prospect.archetype}</strong>
          <span className="stat-detail">{prospect.archetypeBase}</span>
        </div>
      </section>

      <div className="detail-grid">
        {[
          ['Age', prospect.age],
          ['Measurements', prospect.measurementLine],
          ['Wingspan', prospect.wingspan || '--'],
          ['League', prospect.leagueType],
          ['Country', prospect.country],
          ['Offense', prospect.offenseScore],
          ['Defense', prospect.defenseScore],
          ['Draft Range', prospect.projection.draftRange],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{label}</strong>
            <span>{value}</span>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h4>Summary</h4>
        <p>{prospect.summary.synopsis}</p>
      </div>

      <div className="split-section">
        <div className="detail-section">
          <h4>Strengths</h4>
          <ul className="profile-list">
            {prospect.summary.strengths.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="detail-section">
          <h4>Weaknesses</h4>
          <ul className="profile-list">
            {prospect.summary.weaknesses.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="detail-section">
        <h4>Development Swing Factors</h4>
        <ul className="profile-list">
          {prospect.summary.swingFactors.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <div className="detail-section">
        <h4>Structured Trait Evaluation</h4>
        <div className="trait-grid">
          {prospect.traitScores.map((trait) => (
            <div key={trait.name} className="trait-card">
              <div className="trait-topline">
                <strong>{trait.name}</strong>
                <span>{trait.score}</span>
              </div>
              <div className="trait-meta">
                <span>{trait.band}</span>
                <span>{trait.confidence}</span>
              </div>
              <p>{trait.note}</p>
            </div>
          ))}
        </div>
      </div>

      {(viewMode === 'peek' || viewMode === 'peruse' || viewMode === 'deep-dive') && (
        <>
          <div className="detail-section">
            <h4>Statistical Context</h4>
            <div className="split-section">
              <div className="detail-grid compact-grid">
                {Object.entries(prospect.stats.season).map(([label, value]) => (
                  <div key={label}>
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div className="detail-grid compact-grid">
                {Object.entries(prospect.stats.advanced).map(([label, value]) => (
                  <div key={label}>
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="section-note">
              Game log and shot profile surfaces are componentized but currently using placeholders until real data is connected.
            </p>
          </div>

          <div className="detail-section">
            <h4>Projection</h4>
            <div className="projection-stack">
              <div><strong>Best outcome:</strong> {prospect.projection.bestOutcome}</div>
              <div><strong>Median outcome:</strong> {prospect.projection.medianOutcome}</div>
              <div><strong>Swing skill:</strong> {prospect.projection.swingSkill}</div>
              <div><strong>Risk summary:</strong> {prospect.projection.riskSummary}</div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Team Fit</h4>
            <p>{prospect.teamFit}</p>
          </div>
        </>
      )}

      {(viewMode === 'peruse' || viewMode === 'deep-dive') && (
        <>
          <div className="detail-section">
            <div className="detail-section-head">
              <h4>Tier Assignment</h4>
              <span className="section-meta">Local override</span>
            </div>
            <div className="tier-controls">
              {['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  className={`tier-button${prospect.tier === tier ? ' is-active' : ''}`}
                  onClick={() => onUpdateTier(prospect.id, tier === prospect.baseTier ? '' : tier)}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-head">
              <h4>Tags</h4>
              <span className="section-meta">Structured workflow markers</span>
            </div>
            <div className="tag-grid">
              {TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-button${prospect.tags.includes(tag) ? ' is-active' : ''}`}
                  onClick={() => onToggleTag(prospect.id, tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="detail-section">
        <div className="detail-section-head">
          <h4>Notes</h4>
          <button type="button" className="text-button" onClick={() => onCreateNote(prospect.id)}>New note</button>
        </div>
        {notes.length === 0 ? (
          <p className="empty-state">No notes attached yet.</p>
        ) : (
          <div className="note-preview-list">
            {notes.slice(0, 3).map((note) => (
              <article key={note.id} className="note-preview-card">
                <strong>{note.quickSummary || 'Untitled note'}</strong>
                <span>{new Date(note.updatedAt).toLocaleString()}</span>
                <p>{note.freeform || note.context || note.projection || 'Structured note saved.'}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
