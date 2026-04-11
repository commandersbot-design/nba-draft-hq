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

  return [
    primaryTopTrait && (!secondaryTopTrait || primaryTopTrait.score > secondaryTopTrait.score)
      ? `${primaryTopTrait.name} is the cleaner headlining trait.`
      : null,
    primary.summary?.strengths?.[0] || null,
    primary.riskLevel === 'Low-Moderate' && secondary.riskLevel !== 'Low-Moderate'
      ? 'Lower risk pathway.'
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

export function CompareEngine({ prospects, notesByPlayer, onOpenHistorical }) {
  const compareProspects = prospects.slice(0, 3);

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
  const leftTraits = traitMap(left);
  const rightTraits = traitMap(right);
  const whyLeft = buildDecisionBullets(left, right);
  const whyRight = buildDecisionBullets(right, left);

  const rows = [
    {
      label: 'Measurements',
      values: compareProspects.map((prospect) => `${prospect.measurementLine} / ${prospect.wingspan || '--'}`),
    },
    {
      label: 'Production',
      values: compareProspects.map((prospect) => `${prospect.stats.season.points} pts / ${prospect.stats.season.rebounds} reb / ${prospect.stats.season.assists} ast`),
    },
    {
      label: 'Efficiency',
      values: compareProspects.map((prospect) => `TS ${prospect.stats.advanced.trueShooting || '--'} / BPM ${renderCell(prospect.stats.advanced.bpm)}`),
    },
    {
      label: 'Final Score',
      values: compareProspects.map((prospect) => prospect.comparisonInputs.finalScore || prospect.overallComposite),
    },
    {
      label: 'Role',
      values: compareProspects.map((prospect) => prospect.roleProjection),
    },
    {
      label: 'Risk',
      values: compareProspects.map((prospect) => prospect.riskLevel),
    },
  ];

  return (
    <section className="workspace-section panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Compare</p>
          <h3>{compareProspects.map((prospect) => prospect.name).join(' vs ')}</h3>
        </div>
        <p className="section-meta">Built for side-by-side evaluation now, historical comp depth next.</p>
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspects.length}`}>
        {compareProspects.map((prospect) => (
          <div key={prospect.id} className="compare-column compare-column-hero">
            <span className="stat-label">#{prospect.rank}</span>
            <h4>{prospect.name}</h4>
            <p>{prospect.position} · {prospect.school}</p>
            <div className="compare-hero-metrics">
              <div>
                <strong>{prospect.overallComposite}</strong>
                <span>overall</span>
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
            <p>{prospect.summary?.synopsis}</p>
          </div>
        ))}
      </div>

      <div className="compare-grid compare-grid-emphasis">
        {rows.map((row) => (
          <div key={row.label} className={`compare-row compare-row-${compareProspects.length}`}>
            <span>{row.label}</span>
            {row.values.map((value, index) => <span key={`${row.label}-${compareProspects[index].id}`}>{value}</span>)}
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h4>Trait Comparison</h4>
        <div className="trait-compare-grid">
          {left.traitScores.map((trait) => (
            <div key={trait.name} className={`compare-row compare-row-${compareProspects.length}`}>
              <span>{trait.name}</span>
              {compareProspects.map((prospect) => {
                const traits = prospect.id === left.id ? leftTraits : prospect.id === right.id ? rightTraits : traitMap(prospect);
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
            {(whyLeft.length ? whyLeft : ['Decision comes down to stylistic preference rather than a clear authored edge.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="detail-section detail-section-emphasis">
          <h4>Why {right.name} over {left.name}</h4>
          <ul className="profile-list">
            {(whyRight.length ? whyRight : ['Decision comes down to role context rather than a clear authored edge.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="detail-section">
        <h4>Decision Context</h4>
        <p>
          Choose {left.name} if you need {left.roleProjection.toLowerCase()} with {topTrait(left)?.name?.toLowerCase() || 'strong trait support'} driving the case.
          Choose {right.name} if you prefer a {right.archetypeBase.toLowerCase()} pathway and are buying {topTrait(right)?.name?.toLowerCase() || 'the top trait'} as the cleaner answer.
        </p>
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspects.length}`}>
        {compareProspects.map((prospect) => {
          const notes = notesByPlayer[prospect.id] || [];
          return (
            <div key={`${prospect.id}-notes`} className="detail-section compare-notes-column">
              <h4>Notes Snapshot</h4>
              {notes.length === 0 ? <p className="empty-state">No notes saved.</p> : notes.slice(0, 2).map((note) => <p key={note.id}>{note.quickSummary || note.freeform || 'Structured note'}</p>)}
            </div>
          );
        })}
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspects.length}`}>
        {compareProspects.map((prospect) => (
          <div key={`${prospect.id}-historical`} className="detail-section compare-notes-column">
            <h4>Historical Anchors</h4>
            {(prospect.historicalPrecedents || []).length === 0 ? (
              <p className="empty-state">No historical precedents available.</p>
            ) : (
              prospect.historicalPrecedents.slice(0, 2).map((entry) => (
                <div key={entry.id} className="compare-precedent-row">
                  <p>
                    <strong>{entry.name}</strong> · {entry.draftYear} · {entry.roleOutcome} · {entry.outcomeTier}
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
