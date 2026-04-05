function traitMap(prospect) {
  return Object.fromEntries(prospect.traitScores.map((trait) => [trait.name, trait]));
}

export function CompareEngine({ prospects, notesByPlayer }) {
  if (prospects.length < 2) {
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

  const [left, right] = prospects;
  const leftTraits = traitMap(left);
  const rightTraits = traitMap(right);
  const leftNotes = notesByPlayer[left.id] || [];
  const rightNotes = notesByPlayer[right.id] || [];

  const whyLeft = [
    left.overallComposite > right.overallComposite ? `Higher composite score (${left.overallComposite} vs ${right.overallComposite})` : null,
    left.projection.stockBand === 'Rising' && right.projection.stockBand !== 'Rising' ? 'Better current stock momentum' : null,
    left.offenseScore > right.offenseScore ? 'Cleaner offensive signal' : null,
  ].filter(Boolean);

  const whyRight = [
    right.overallComposite > left.overallComposite ? `Higher composite score (${right.overallComposite} vs ${left.overallComposite})` : null,
    right.defenseScore > left.defenseScore ? 'Better defensive floor' : null,
    right.riskLevel === 'Low-Moderate' && left.riskLevel !== 'Low-Moderate' ? 'Lower risk pathway' : null,
  ].filter(Boolean);

  return (
    <section className="workspace-section panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Compare Engine</p>
          <h3>{left.name} vs {right.name}</h3>
        </div>
      </div>

      <div className="compare-sheet">
        <div className="compare-column">
          <h4>{left.name}</h4>
          <p>{left.position}, {left.school}</p>
        </div>
        <div className="compare-column">
          <h4>{right.name}</h4>
          <p>{right.position}, {right.school}</p>
        </div>
      </div>

      <div className="compare-grid">
        {[
          ['Measurements', `${left.measurementLine} / ${left.wingspan || '--'}`, `${right.measurementLine} / ${right.wingspan || '--'}`],
          ['Stats', `${left.stats.season.points} pts / ${left.stats.season.rebounds} reb / ${left.stats.season.assists} ast`, `${right.stats.season.points} pts / ${right.stats.season.rebounds} reb / ${right.stats.season.assists} ast`],
          ['Advanced', `TS ${left.stats.advanced.trueShooting} / BPM ${left.stats.advanced.bpm}`, `TS ${right.stats.advanced.trueShooting} / BPM ${right.stats.advanced.bpm}`],
          ['Offense', left.offenseScore, right.offenseScore],
          ['Defense', left.defenseScore, right.defenseScore],
          ['Role Projection', left.roleProjection, right.roleProjection],
          ['Risk', left.riskLevel, right.riskLevel],
        ].map(([label, leftValue, rightValue]) => (
          <div key={label} className="compare-row">
            <span>{label}</span>
            <span>{leftValue}</span>
            <span>{rightValue}</span>
          </div>
        ))}
      </div>

      <div className="detail-section">
        <h4>Prospera Traits</h4>
        <div className="trait-compare-grid">
          {left.traitScores.map((trait) => (
            <div key={trait.name} className="compare-row">
              <span>{trait.name}</span>
              <span>{leftTraits[trait.name]?.score}</span>
              <span>{rightTraits[trait.name]?.score}</span>
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

      <div className="split-section">
        <div className="detail-section">
          <h4>Notes Snapshot</h4>
          {leftNotes.length === 0 ? <p className="empty-state">No notes saved.</p> : leftNotes.slice(0, 2).map((note) => <p key={note.id}>{note.quickSummary || note.freeform || 'Structured note'}</p>)}
        </div>
        <div className="detail-section">
          <h4>Notes Snapshot</h4>
          {rightNotes.length === 0 ? <p className="empty-state">No notes saved.</p> : rightNotes.slice(0, 2).map((note) => <p key={note.id}>{note.quickSummary || note.freeform || 'Structured note'}</p>)}
        </div>
      </div>
    </section>
  );
}
