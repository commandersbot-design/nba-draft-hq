import { useMemo, useState } from 'react';
import { TAG_OPTIONS } from '../lib/constants';
import { buildHistoricalContext, buildHistoricalSignals, findHistoricalPrecedents } from '../lib/historicalComps';

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
  onOpenHistorical,
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

  const whyItMatters = prospect.summary?.strengths?.[0] || prospect.summary?.synopsis;
  const topTrait = [...(prospect.traitScores || [])].sort((left, right) => right.score - left.score)[0];
  const historicalPrecedents = useMemo(() => findHistoricalPrecedents(prospect), [prospect]);
  const comparisonAnchors = historicalPrecedents.slice(0, 3);
  const historicalContext = useMemo(() => buildHistoricalContext(prospect), [prospect]);
  const historicalSignals = useMemo(() => buildHistoricalSignals(historicalPrecedents, historicalContext), [historicalContext, historicalPrecedents]);
  const modelBreakdown = useMemo(() => ({
    ...prospect.modelBreakdown,
    historicalSignal: historicalSignals,
    interpretationCard: {
      ...prospect.modelBreakdown.interpretationCard,
      historicalSignal: historicalSignals.summary,
    },
  }), [historicalSignals, prospect.modelBreakdown]);

  return (
    <div className="detail-card">
      <div className="profile-spotlight">
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

        <div className="profile-hero-grid">
          <div className="profile-hero-card profile-hero-card-main">
            <span className="stat-label">Role Path</span>
            <strong>{prospect.roleProjection}</strong>
            <span className="stat-detail">{prospect.archetype}</span>
          </div>
          <div className="profile-hero-card">
            <span className="stat-label">Composite</span>
            <strong>{prospect.overallComposite}</strong>
            <span className="stat-detail">{prospect.projection.draftRange}</span>
          </div>
          <div className="profile-hero-card">
            <span className="stat-label">Risk</span>
            <strong>{prospect.riskLevel}</strong>
            <span className="stat-detail">{prospect.projection.stockBand}</span>
          </div>
        </div>

        <div className="highlight-section spotlight-copy">
          <h4>Why This Player Matters</h4>
          <p>
            {whyItMatters}
            {topTrait ? ` ${topTrait.name} is the clearest reason this profile stays relevant on the board.` : ''}
          </p>
        </div>
      </div>

      <div className="board-summary board-summary-subtle">
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

      <div className="detail-grid detail-grid-primary">
        {[
          ['Age', prospect.age],
          ['Measurements', prospect.measurementLine],
          ['League', prospect.leagueType],
          ['Country', prospect.country],
          ['Offense', prospect.offenseScore],
          ['Defense', prospect.defenseScore],
          ['Top Trait', topTrait?.name || '--'],
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
          <div className="split-section">
            <div className="detail-section detail-section-emphasis">
              <h4>Overview</h4>
              <p>{prospect.summary.synopsis}</p>
            </div>
            <div className="detail-section detail-section-emphasis">
              <h4>Role Projection</h4>
              <p>{prospect.projection.medianOutcome}</p>
            </div>
          </div>

          <div className="split-section">
            <div className="detail-section">
              <h4>Strengths</h4>
              <ul className="profile-list">
                {prospect.summary.strengths.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div className="detail-section">
              <h4>Weaknesses / Concerns</h4>
              <ul className="profile-list">
                {prospect.summary.weaknesses.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>

          <div className="split-section">
            <div className="detail-section">
              <h4>Physical Profile</h4>
              <div className="detail-grid compact-grid">
                {[
                  ['Height', prospect.height],
                  ['Weight', prospect.weight ? `${prospect.weight} lb` : '--'],
                  ['Wingspan', prospect.wingspan || '--'],
                  ['Measurement Status', prospect.measurements?.sourceStatus || 'profile-listed'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="detail-section">
              <h4>Comparison Anchors</h4>
              {comparisonAnchors.length === 0 ? (
                <p className="empty-state">Historical anchors will appear here as the comparison layer expands.</p>
              ) : (
                <div className="note-preview-list">
                  {comparisonAnchors.map((entry) => (
                    <article key={entry.id} className="note-preview-card">
                      <strong>{entry.name}</strong>
                      <span>{entry.roleOutcome} · {entry.outcomeTier}</span>
                      <p>{entry.archetype} · match {entry.matchScore}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h4>Context Notes</h4>
            <ul className="profile-list">
              {prospect.summary.swingFactors.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          {historicalContext && (
            <div className="detail-section detail-section-emphasis">
              <div className="detail-section-head">
                <h4>Historical Context</h4>
                <span className="section-meta">{historicalContext.draftSlotBand} precedent band</span>
              </div>
              <div className="historical-context-grid">
                <div className="profile-hero-card stat-mini-card">
                  <span className="stat-label">Archetype Matches</span>
                  <strong>{historicalContext.archetypeMatchCount}</strong>
                  <span className="stat-detail">{historicalContext.archetypeFamily} comps in dataset</span>
                </div>
                <div className="profile-hero-card stat-mini-card">
                  <span className="stat-label">Slot Matches</span>
                  <strong>{historicalContext.slotBandMatchCount}</strong>
                  <span className="stat-detail">{historicalContext.draftSlotBand} peers</span>
                </div>
                <div className="profile-hero-card stat-mini-card">
                  <span className="stat-label">Average BPM</span>
                  <strong>{historicalContext.averageBpm}</strong>
                  <span className="stat-detail">Comparable pool impact</span>
                </div>
                <div className="profile-hero-card stat-mini-card">
                  <span className="stat-label">Average TS%</span>
                  <strong>{historicalContext.averageTrueShooting}</strong>
                  <span className="stat-detail">Comparable pool efficiency</span>
                </div>
              </div>
              <p>{historicalContext.narrative}</p>
              {historicalSignals?.summary && (
                <p className="section-note">{historicalSignals.summary}</p>
              )}
              <p className="section-note">{historicalContext.riskSignal}</p>
            </div>
          )}
        </>
      )}

      {(activeSection === 'Model' || activeSection === 'Full Profile') && (
        <>
          <div className="split-section">
            <div className="detail-section detail-section-emphasis">
              <h4>Final Score Card</h4>
              <div className="projection-stack">
                <div><strong>Final board score:</strong> {modelBreakdown.finalBoardScore}</div>
                <div><strong>Weighted trait score:</strong> {modelBreakdown.weightedTraitScore}</div>
                <div><strong>Risk penalty:</strong> {modelBreakdown.riskPenalty}</div>
                <div><strong>Model tier:</strong> {modelBreakdown.modelTier}</div>
                <div><strong>Board rank:</strong> #{modelBreakdown.boardRank}</div>
              </div>
            </div>
            <div className="detail-section detail-section-emphasis">
              <h4>Interpretation Card</h4>
              <div className="projection-stack">
                <div><strong>Swing skill:</strong> {modelBreakdown.interpretationCard.swingSkill}</div>
                <div><strong>Summary:</strong> {modelBreakdown.interpretationCard.summarySentence}</div>
                <div><strong>Historical read:</strong> {modelBreakdown.interpretationCard.historicalSignal}</div>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h4>Trait Grades / Model Outputs</h4>
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
            <h4>Core Trait Bars</h4>
            <div className="model-bar-stack">
              {modelBreakdown.coreTraitBars.map((trait) => (
                <div key={trait.key} className="model-bar-row">
                  <div className="model-bar-head">
                    <strong>{trait.label}</strong>
                    <span>{trait.score}</span>
                  </div>
                  <div className="model-bar-track">
                    <div className="model-bar-fill" style={{ width: trait.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="split-section">
            <div className="detail-section">
              <h4>Risk Panel</h4>
              <div className="note-preview-list">
                {modelBreakdown.riskPanel.map((flag) => (
                  <article key={flag.key} className="note-preview-card">
                    <strong>{flag.label}</strong>
                    <span>{flag.severity}</span>
                  </article>
                ))}
              </div>
            </div>
            <div className="detail-section">
              <h4>Auto Strengths / Weaknesses</h4>
              <div className="projection-stack">
                {modelBreakdown.interpretationCard.strengths.map((item) => (
                  <div key={item.label}><strong>{item.label}:</strong> {item.explanation}</div>
                ))}
                {modelBreakdown.interpretationCard.weaknesses.map((item) => (
                  <div key={item.label}><strong>{item.label}:</strong> {item.explanation}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="projection-stack">
            <div><strong>Best outcome:</strong> {prospect.projection.bestOutcome}</div>
            <div><strong>Median outcome:</strong> {prospect.projection.medianOutcome}</div>
            <div><strong>Swing skill:</strong> {prospect.projection.swingSkill}</div>
            <div><strong>Risk summary:</strong> {prospect.projection.riskSummary}</div>
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
            <h4>Percentile Context</h4>
            <div className="projection-stack">
              {Object.entries(prospect.statPercentiles || {}).slice(0, 6).map(([key, value]) => (
                <div key={key}><strong>{key}:</strong> {value}th percentile</div>
              ))}
            </div>
          </div>

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
            <div><strong>Historical percentile tags:</strong> {Object.entries(prospect.statPercentiles || {}).slice(0, 4).map(([key, value]) => `${key} ${value}`).join(' · ') || 'Awaiting percentiles'}</div>
            <div><strong>Historical signal:</strong> {historicalSignals?.topOutcomeShare || 'Awaiting cohort signal'}</div>
          </div>

          <div className="detail-section">
            <h4>Historical Precedents</h4>
            <div className="note-preview-list">
              {historicalPrecedents.map((entry) => (
                <article key={entry.id} className="note-preview-card">
                  <strong>{entry.name}</strong>
                  <span>{entry.draftYear} · #{entry.draftSlot} · {entry.outcomeTier}</span>
                  <p>
                    {entry.archetype} · {entry.roleOutcome} · {entry.pointsPerGame} PPG · {entry.trueShooting} TS · match {entry.matchScore}
                  </p>
                  <button type="button" className="inline-action" onClick={() => onOpenHistorical(entry.id)}>
                    Open in Historical
                  </button>
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
