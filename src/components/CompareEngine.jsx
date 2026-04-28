import { useState } from 'react';
import {
  buildHistoricalContext,
  buildHistoricalSignals,
  buildHistoricalSimilarity,
  findHistoricalPrecedents,
} from '../lib/historicalComps';

function traitMap(prospect) {
  return Object.fromEntries(prospect.traitScores.map((trait) => [trait.name, trait]));
}

function renderCell(value) {
  return value ?? '--';
}

function topTrait(prospect) {
  return [...prospect.traitScores].sort((left, right) => right.score - left.score)[0];
}

function buildDecisionBullets(primary, secondary) {
  const primaryTopTrait = topTrait(primary);
  const secondaryTopTrait = topTrait(secondary);
  const primaryHistorical = primary.historicalSignals;
  const secondaryHistorical = secondary.historicalSignals;

  return [
    primaryTopTrait && (!secondaryTopTrait || primaryTopTrait.score > secondaryTopTrait.score)
      ? `${primaryTopTrait.name} is the cleaner headlining trait.`
      : null,
    primary.autoInterpretation?.strengths?.[0]
      ? `${primary.autoInterpretation.strengths[0].label}: ${primary.autoInterpretation.strengths[0].explanation}.`
      : primary.summary?.strengths?.[0] || null,
    primary.riskLevel === 'Low-Moderate' && secondary.riskLevel !== 'Low-Moderate'
      ? 'Lower risk pathway.'
      : null,
    primaryHistorical?.signal === 'stable' && secondaryHistorical?.signal !== 'stable'
      ? `Historical backdrop is cleaner: ${primaryHistorical.topOutcomeShare}.`
      : null,
    primaryHistorical?.signal === 'mixed' && secondaryHistorical?.signal === 'volatile'
      ? `Historical pool is less volatile around ${primaryHistorical.topComparableName || 'the current archetype lane'}.`
      : null,
    primary.projection?.swingSkill && primary.projection.swingSkill !== secondary.projection?.swingSkill
      ? `More convincing swing skill pathway through ${primary.projection.swingSkill}.`
      : null,
  ].filter(Boolean).slice(0, 3);
}

const FUTURE_HISTORICAL_TRACKS = [
  'Prior-class percentile ranges',
  'Era-aware stat normalization',
  'Historical archetype clusters',
  'Outcome bands by draft slot',
];

const HISTORICAL_MODES = [
  { id: 'archetype', label: 'Same Archetype' },
  { id: 'slot-band', label: 'Same Slot Band' },
  { id: 'position-family', label: 'Same Position Family' },
];

export function CompareEngine({ prospects, notesByPlayer, onOpenHistorical, onOpenProfile }) {
  const compareProspects = prospects.slice(0, 3);
  const [historicalMode, setHistoricalMode] = useState('archetype');

  if (compareProspects.length < 2) {
    return (
      <section className="workspace-section panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Compare</p>
            <h3>Add at least two prospects</h3>
          </div>
        </div>
        <p className="empty-state">Use the compare buttons from the board or profile to populate this workspace.</p>
      </section>
    );
  }

  const [left, right] = compareProspects;
  const historicalBundles = compareProspects.map((prospect) => {
    const precedents = findHistoricalPrecedents(prospect);
    const context = buildHistoricalContext(prospect);
    const signals = buildHistoricalSignals(precedents, context);

    return {
      prospect: {
        ...prospect,
        historicalPrecedents: precedents,
        historicalContext: context,
        historicalSignals: signals,
        modelBreakdown: {
          ...prospect.modelBreakdown,
          historicalSignal: signals,
        },
      },
      precedents,
      context,
      signals,
    };
  });

  const compareProspectsWithHistory = historicalBundles.map((entry) => entry.prospect);
  const [leftWithHistory, rightWithHistory] = compareProspectsWithHistory;
  const leftTraits = traitMap(leftWithHistory);
  const rightTraits = traitMap(rightWithHistory);
  const whyLeftWithHistory = buildDecisionBullets(leftWithHistory, rightWithHistory);
  const whyRightWithHistory = buildDecisionBullets(rightWithHistory, leftWithHistory);
  const historicalSimilarity = compareProspectsWithHistory.map((prospect) => ({
    prospect,
    similarity: buildHistoricalSimilarity(prospect, historicalMode),
  }));

  const rows = [
    {
      label: 'Measurements',
      values: compareProspectsWithHistory.map((prospect) => `${prospect.measurementLine} / ${prospect.wingspan || '--'}`),
    },
    {
      label: 'Production',
      values: compareProspectsWithHistory.map(
        (prospect) => `${prospect.stats.season.points} pts / ${prospect.stats.season.rebounds} reb / ${prospect.stats.season.assists} ast`,
      ),
    },
    {
      label: 'Efficiency',
      values: compareProspectsWithHistory.map(
        (prospect) => `TS ${prospect.stats.advanced.trueShooting || '--'} / BPM ${renderCell(prospect.stats.advanced.bpm)}`,
      ),
    },
    {
      label: 'Final Score',
      values: compareProspectsWithHistory.map(
        (prospect) => prospect.modelBreakdown?.finalBoardScore || prospect.comparisonInputs.finalScore || prospect.overallComposite,
      ),
    },
    {
      label: 'Role',
      values: compareProspectsWithHistory.map((prospect) => prospect.roleProjection),
    },
    {
      label: 'Risk',
      values: compareProspectsWithHistory.map((prospect) => prospect.riskLevel),
    },
  ];

  return (
    <section className="workspace-section panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Compare</p>
          <h3>{compareProspectsWithHistory.map((prospect) => prospect.name).join(' vs ')}</h3>
        </div>
        <p className="section-meta">Built for side-by-side evaluation with expandable historical context.</p>
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspectsWithHistory.length}`}>
        {compareProspectsWithHistory.map((prospect) => (
          <div key={prospect.id} className="compare-column compare-column-hero">
            <div className="compare-column-top">
              <div>
                <span className="stat-label">#{prospect.rank}</span>
                <h4>{prospect.name}</h4>
                <p>{prospect.position} / {prospect.school}</p>
              </div>
              {onOpenProfile && (
                <button type="button" className="inline-action" onClick={() => onOpenProfile(prospect.id)}>
                  Open Profile
                </button>
              )}
            </div>
            <div className="compare-hero-metrics">
              <div>
                <strong>{prospect.modelBreakdown?.finalBoardScore || prospect.overallComposite}</strong>
                <span>final score</span>
              </div>
              <div>
                <strong>{prospect.offenseScore}</strong>
                <span>offense</span>
              </div>
              <div>
                <strong>{prospect.defenseScore}</strong>
                <span>defense</span>
              </div>
            </div>
            <p>{prospect.autoInterpretation?.summarySentence || prospect.summary?.synopsis}</p>
            {prospect.historicalContext && (
              <p className="section-note">
                {prospect.historicalContext.draftSlotBand} history: {prospect.historicalContext.bestHistoricalOutcome}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="compare-grid compare-grid-emphasis">
        {rows.map((row) => (
          <div key={row.label} className={`compare-row compare-row-${compareProspectsWithHistory.length}`}>
            <span>{row.label}</span>
            {row.values.map((value, index) => (
              <span key={`${row.label}-${compareProspectsWithHistory[index].id}`}>{value}</span>
            ))}
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h4>Trait Comparison</h4>
        <div className="trait-compare-grid">
          {left.traitScores.map((trait) => (
            <div key={trait.name} className={`compare-row compare-row-${compareProspectsWithHistory.length}`}>
              <span>{trait.name}</span>
              {compareProspectsWithHistory.map((prospect) => {
                const traits = prospect.id === leftWithHistory.id
                  ? leftTraits
                  : prospect.id === rightWithHistory.id
                    ? rightTraits
                    : traitMap(prospect);
                return <span key={`${trait.name}-${prospect.id}`}>{traits[trait.name]?.score}</span>;
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="split-section">
        <div className="detail-section detail-section-emphasis">
          <h4>Why {left.name} over {right.name}</h4>
          <ul className="profile-list">
            {(whyLeftWithHistory.length
              ? whyLeftWithHistory
              : ['Decision comes down to stylistic preference rather than a clear authored edge.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="detail-section detail-section-emphasis">
          <h4>Why {right.name} over {left.name}</h4>
          <ul className="profile-list">
            {(whyRightWithHistory.length
              ? whyRightWithHistory
              : ['Decision comes down to role context rather than a clear authored edge.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspectsWithHistory.length}`}>
        {compareProspectsWithHistory.map((prospect) => (
          <div key={`${prospect.id}-model`} className="detail-section compare-notes-column">
            <h4>Model Breakdown</h4>
            <div className="projection-stack">
              <div><strong>Weighted traits:</strong> {prospect.modelBreakdown?.weightedTraitScore}</div>
              <div><strong>Risk penalty:</strong> {prospect.modelBreakdown?.riskPenalty}</div>
              <div><strong>Model tier:</strong> {prospect.modelBreakdown?.modelTier}</div>
              <div><strong>Swing skill:</strong> {prospect.modelBreakdown?.interpretationCard?.swingSkill}</div>
              <div><strong>Historical signal:</strong> {prospect.modelBreakdown?.historicalSignal?.signal || '--'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspectsWithHistory.length}`}>
        {compareProspectsWithHistory.map((prospect) => (
          <div key={`${prospect.id}-stat-context`} className="detail-section compare-notes-column">
            <h4>Stat Context</h4>
            <div className="projection-stack">
              {Object.entries(prospect.statPercentiles || {}).slice(0, 5).map(([key, value]) => (
                <div key={key}><strong>{key}:</strong> {value}th pct</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="detail-section compare-future">
        <div className="detail-section-head">
          <h4>Historical Similarity Mode</h4>
          <span className="section-meta">Switch the cohort lens without leaving compare</span>
        </div>
        <div className="tag-grid">
          {HISTORICAL_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`tag-button${historicalMode === mode.id ? ' is-active' : ''}`}
              onClick={() => setHistoricalMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspectsWithHistory.length}`}>
        {historicalSimilarity.map(({ prospect, similarity }) => (
          <div key={`${prospect.id}-historical-similarity`} className="detail-section compare-notes-column">
            <div className="detail-section-head">
              <h4>{similarity.label}</h4>
              <span className="section-meta">{similarity.poolSize} comps in pool</span>
            </div>
            <div className="projection-stack">
              <div><strong>Outcome range:</strong> {similarity.outcomeRange}</div>
              <div><strong>Most common result:</strong> {similarity.topOutcome}</div>
              <div><strong>Outcome mix:</strong> {similarity.outcomeMix.map((entry) => `${entry.tier} ${entry.share}`).join(' / ') || '--'}</div>
            </div>
            <div className="note-preview-list">
              {similarity.matches.length === 0 ? (
                <p className="empty-state">No close cohort matches for this lens yet.</p>
              ) : (
                similarity.matches.map((entry) => (
                  <article key={`${prospect.id}-${entry.id}`} className="note-preview-card">
                    <strong>{entry.name}</strong>
                    <span>{entry.draftYear} / #{entry.draftSlot} / {entry.outcomeTier}</span>
                    <p>{entry.roleOutcome} / {entry.archetype} / match {entry.matchScore}</p>
                    <button type="button" className="inline-action" onClick={() => onOpenHistorical(entry.id)}>
                      Open cohort comp
                    </button>
                  </article>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspectsWithHistory.length}`}>
        {compareProspectsWithHistory.map((prospect) => (
          <div key={`${prospect.id}-historical-context`} className="detail-section compare-notes-column">
            <h4>Historical Context</h4>
            {prospect.historicalContext ? (
              <>
                <p>{prospect.historicalContext.narrative}</p>
                <div className="projection-stack">
                  <div><strong>Slot band:</strong> {prospect.historicalContext.draftSlotBand}</div>
                  <div><strong>Best precedent:</strong> {prospect.historicalContext.bestHistoricalOutcome}</div>
                  <div><strong>Avg BPM:</strong> {prospect.historicalContext.averageBpm}</div>
                  <div><strong>Avg TS:</strong> {prospect.historicalContext.averageTrueShooting}</div>
                  <div><strong>Pool signal:</strong> {prospect.historicalSignals?.topOutcomeShare || '--'}</div>
                </div>
              </>
            ) : (
              <p className="empty-state">Historical context is not available yet.</p>
            )}
          </div>
        ))}
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspectsWithHistory.length}`}>
        {compareProspectsWithHistory.map((prospect) => {
          const notes = notesByPlayer[prospect.id] || [];
          return (
            <div key={`${prospect.id}-notes`} className="detail-section compare-notes-column">
              <h4>Notes Snapshot</h4>
              {notes.length === 0
                ? <p className="empty-state">No notes saved.</p>
                : notes.slice(0, 2).map((note) => <p key={note.id}>{note.quickSummary || note.freeform || 'Structured note'}</p>)}
            </div>
          );
        })}
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspectsWithHistory.length}`}>
        {compareProspectsWithHistory.map((prospect) => (
          <div key={`${prospect.id}-historical`} className="detail-section compare-notes-column">
            <h4>Historical Anchors</h4>
            {(prospect.historicalPrecedents || []).length === 0 ? (
              <p className="empty-state">No historical precedents available.</p>
            ) : (
              prospect.historicalPrecedents.slice(0, 2).map((entry) => (
                <div key={entry.id} className="compare-precedent-row">
                  <p>
                    <strong>{entry.name}</strong> / {entry.draftYear} / {entry.roleOutcome} / {entry.outcomeTier}
                  </p>
                  <button type="button" className="inline-action" onClick={() => onOpenHistorical(entry.id)}>
                    Open
                  </button>
                </div>
              ))
            )}
          </div>
        ))}
      </div>

      <div className="detail-section compare-future">
        <div className="detail-section-head">
          <h4>Historical Data Expansion Path</h4>
          <span className="section-meta">Foundation ready for deeper compare layers</span>
        </div>
        <ul className="profile-list">
          {FUTURE_HISTORICAL_TRACKS.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>
    </section>
  );
}
