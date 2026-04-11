import { useState } from 'react';
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
  const [activeSection, setActiveSection] = useState('Overview');

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

      <div className="board-summary">
        <div className="summary-chip">Profile {prospect.dataQuality.profile}</div>
        <div className="summary-chip">Traits {prospect.dataQuality.traits}</div>
        <div className="summary-chip">Stats {prospect.dataQuality.stats}</div>
        <div className="summary-chip">Projection {prospect.dataQuality.projection}</div>
      </div>

      <div className="mode-tabs profile-tabs">
        {prospect.profileSections.map((section) => (
          <button
            key={section}
            type="button"
            className={`mode-tab${activeSection === section ? ' is-active' : ''}`}
            onClick={() => setActiveSection(section)}
          >
            {section}
          </button>
        ))}
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

      {(activeSection === 'Overview' || activeSection === 'Full Profile') && (
        <>
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
        </>
      )}

      {(activeSection === 'Model' || activeSection === 'Full Profile') && (
        <>
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

          <div className="detail-section">
            <h4>Projection</h4>
            <div className="projection-stack">
              <div><strong>Best outcome:</strong> {prospect.projection.bestOutcome}</div>
              <div><strong>Median outcome:</strong> {prospect.projection.medianOutcome}</div>
              <div><strong>Swing skill:</strong> {prospect.projection.swingSkill}</div>
              <div><strong>Risk summary:</strong> {prospect.projection.riskSummary}</div>
            </div>
          </div>
        </>
      )}

      {(viewMode === 'peek' || viewMode === 'peruse' || viewMode === 'deep-dive') && (activeSection === 'Stats' || activeSection === 'Full Profile') && (
        <>
          {prospect.statCards.length > 0 && (
            <div className="detail-section">
              <h4>Stat Cards</h4>
              <div className="stat-card-grid">
                {prospect.statCards.map((card) => (
                  <div key={card.label} className="profile-hero-card stat-mini-card">
                    <span className="stat-label">{card.label}</span>
                    <strong>{card.value}</strong>
                    <span className="stat-detail">{card.percentile ? `${card.percentile}th pct` : 'Awaiting percentile'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {prospect.dataQuality.stats === 'Structured'
                ? 'Stat rows are coming from structured source data.'
                : prospect.dataQuality.stats === 'Mixed'
                  ? 'Structured stats are partially connected; missing fields still fall back to derived placeholders.'
                  : 'Game log and shot profile surfaces are componentized but currently using inferred placeholders until real data is connected.'}
            </p>
          </div>

          {(prospect.statStrengths.length > 0 || prospect.statWeaknesses.length > 0) && (
            <div className="split-section">
              <div className="detail-section">
                <h4>Stat-Based Strengths</h4>
                <ul className="profile-list">
                  {(prospect.statStrengths.length ? prospect.statStrengths : ['No clear positive statistical signals yet.']).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="detail-section">
                <h4>Stat-Based Weaknesses</h4>
                <ul className="profile-list">
                  {(prospect.statWeaknesses.length ? prospect.statWeaknesses : ['No clear statistical weaknesses yet.']).map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h4>Team Fit</h4>
            <p>{prospect.teamFit}</p>
          </div>

          {prospect.sources.length > 0 && (
            <div className="detail-section">
              <h4>Sources</h4>
              <div className="chip-list">
                {prospect.sources.map((source) => (
                  source.url ? (
                    <a key={`${source.label}-${source.url}`} className="chip" href={source.url} target="_blank" rel="noreferrer">
                      <span className="chip-label">{source.label}</span>
                    </a>
                  ) : (
                    <div key={source.label} className="chip">
                      <span className="chip-label">{source.label}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {(activeSection === 'Comps' || activeSection === 'Full Profile') && (
        <div className="detail-section">
          <h4>Comparison Inputs</h4>
          <div className="projection-stack">
            <div><strong>Final score:</strong> {prospect.comparisonInputs.finalScore || prospect.overallComposite}</div>
            <div><strong>Offensive snapshot:</strong> {prospect.comparisonInputs.offensiveSummary || `${prospect.offenseScore} offense score`}</div>
            <div><strong>Defensive snapshot:</strong> {prospect.comparisonInputs.defensiveSummary || `${prospect.defenseScore} defense score`}</div>
            <div><strong>Archetype indicators:</strong> {(prospect.archetypeIndicators || []).join(', ') || 'Awaiting stat indicators'}</div>
          </div>

          <div className="detail-section">
            <h4>Historical Precedents</h4>
            <div className="note-preview-list">
              {(prospect.historicalPrecedents || []).map((entry) => (
                <article key={entry.id} className="note-preview-card">
                  <strong>{entry.name}</strong>
                  <span>{entry.draftYear} · #{entry.draftSlot} · {entry.outcomeTier}</span>
                  <p>
                    {entry.archetype} · {entry.roleOutcome} · {entry.pointsPerGame} PPG · {entry.trueShooting} TS · match {entry.matchScore}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
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

      {(activeSection === 'Notes' || activeSection === 'Full Profile') && (
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
      )}
    </div>
  );
}
