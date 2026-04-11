function traitMap(prospect) {
  return Object.fromEntries(prospect.traitScores.map((trait) => [trait.name, trait]));
}

function renderCell(value) {
  return value ?? '--';
}

export function CompareEngine({ prospects, notesByPlayer }) {
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

  const whyLeft = [
    left.overallComposite > right.overallComposite ? `Higher composite score (${left.overallComposite} vs ${right.overallComposite})` : null,
    (left.comparisonInputs.finalScore || 0) > (right.comparisonInputs.finalScore || 0) ? 'Stronger stat-backed comparison score' : null,
    left.offenseScore > right.offenseScore ? 'Cleaner offensive signal' : null,
  ].filter(Boolean);

  const whyRight = [
    right.overallComposite > left.overallComposite ? `Higher composite score (${right.overallComposite} vs ${left.overallComposite})` : null,
    right.defenseScore > left.defenseScore ? 'Better defensive floor' : null,
    right.riskLevel === 'Low-Moderate' && left.riskLevel !== 'Low-Moderate' ? 'Lower risk pathway' : null,
  ].filter(Boolean);

  const rows = [
    {
      label: 'Measurements',
      values: compareProspects.map((prospect) => `${prospect.measurementLine} / ${prospect.wingspan || '--'}`),
    },
    {
      label: 'Stats',
      values: compareProspects.map((prospect) => `${prospect.stats.season.points} pts / ${prospect.stats.season.rebounds} reb / ${prospect.stats.season.assists} ast`),
    },
    {
      label: 'Advanced',
      values: compareProspects.map((prospect) => `TS ${prospect.stats.advanced.trueShooting || '--'} / BPM ${renderCell(prospect.stats.advanced.bpm)}`),
    },
    {
      label: 'Final Score',
      values: compareProspects.map((prospect) => prospect.comparisonInputs.finalScore || prospect.overallComposite),
    },
    {
      label: 'Offense',
      values: compareProspects.map((prospect) => prospect.offenseScore),
    },
    {
      label: 'Defense',
      values: compareProspects.map((prospect) => prospect.defenseScore),
    },
    {
      label: 'Role Projection',
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
          <p className="eyebrow">Compare Engine</p>
          <h3>{compareProspects.map((prospect) => prospect.name).join(' vs ')}</h3>
        </div>
      </div>

      <div className={`compare-sheet compare-sheet-${compareProspects.length}`}>
        {compareProspects.map((prospect) => (
          <div key={prospect.id} className="compare-column">
            <h4>{prospect.name}</h4>
            <p>{prospect.position}, {prospect.school}</p>
            <p>{prospect.comparisonInputs.offensiveSummary || `${prospect.overallComposite} composite`}</p>
          </div>
        ))}
      </div>

      <div className="compare-grid">
        {rows.map((row) => (
          <div key={row.label} className={`compare-row compare-row-${compareProspects.length}`}>
            <span>{row.label}</span>
            {row.values.map((value, index) => <span key={`${row.label}-${compareProspects[index].id}`}>{value}</span>)}
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h4>Prospera Traits</h4>
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
        <div className="detail-section">
          <h4>Why {left.name} over {right.name}</h4>
          <ul className="profile-list">
            {(whyLeft.length ? whyLeft : ['Decision comes down to stylistic preference rather than a clear edge.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="detail-section">
          <h4>Why {right.name} over {left.name}</h4>
          <ul className="profile-list">
            {(whyRight.length ? whyRight : ['Decision comes down to role context rather than a clear edge.']).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="detail-section">
        <h4>Decision Context</h4>
        <p>
          Choose {left.name} if you need {left.roleProjection.toLowerCase()} and want {left.archetype.toLowerCase()} traits.
          Choose {right.name} if you value {right.riskLevel.toLowerCase()} risk exposure and a {right.archetypeBase.toLowerCase()} path.
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
            <h4>Historical Precedents</h4>
            {(prospect.historicalPrecedents || []).length === 0 ? (
              <p className="empty-state">No historical precedents available.</p>
            ) : (
              prospect.historicalPrecedents.slice(0, 2).map((entry) => (
                <p key={entry.id}>
                  <strong>{entry.name}</strong> · {entry.draftYear} · {entry.roleOutcome} · {entry.outcomeTier}
                </p>
              ))
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
