import { useEffect, useMemo, useState } from 'react';
import { buildHistoricalDataset, draftSlotBand } from '../lib/historicalComps';
import historicalCoverage from '../data/historicalCoverage.json';

const COLUMN_OPTIONS = [
  { id: 'draftYear', label: 'Year' },
  { id: 'eraBucket', label: 'Era' },
  { id: 'draftSlot', label: 'Draft Slot' },
  { id: 'draftSlotBand', label: 'Slot Band' },
  { id: 'position', label: 'Position' },
  { id: 'positionFamily', label: 'Position Family' },
  { id: 'school', label: 'School' },
  { id: 'height', label: 'Height' },
  { id: 'age', label: 'Age' },
  { id: 'archetype', label: 'Archetype' },
  { id: 'archetypeFamily', label: 'Archetype Family' },
  { id: 'roleOutcome', label: 'Role Outcome' },
  { id: 'outcomeTier', label: 'Outcome Tier' },
  { id: 'pointsPerGame', label: 'PPG' },
  { id: 'reboundsPerGame', label: 'RPG' },
  { id: 'assistsPerGame', label: 'APG' },
  { id: 'trueShooting', label: 'TS%' },
  { id: 'bpm', label: 'BPM' },
  { id: 'notes', label: 'Context' },
];

const DEFAULT_COLUMNS = ['draftYear', 'draftSlot', 'position', 'archetype', 'roleOutcome', 'outcomeTier', 'pointsPerGame', 'trueShooting', 'bpm'];
const COHORT_MODES = [
  { id: 'all', label: 'All Results' },
  { id: 'same-archetype', label: 'Same Archetype' },
  { id: 'same-slot-band', label: 'Same Slot Band' },
  { id: 'same-position-family', label: 'Same Position Family' },
];

const historicalProspects = buildHistoricalDataset();

function cohortRows(rows, focusedEntry, cohortMode) {
  if (!focusedEntry || cohortMode === 'all') return rows;
  if (cohortMode === 'same-archetype') return rows.filter((entry) => entry.archetype === focusedEntry.archetype);
  if (cohortMode === 'same-slot-band') return rows.filter((entry) => entry.draftSlotBand === focusedEntry.draftSlotBand);
  if (cohortMode === 'same-position-family') return rows.filter((entry) => entry.positionFamily === focusedEntry.positionFamily);
  return rows;
}

export function HistoricalMatrixLite({ selectedHistoricalId, onClearSelectedHistorical }) {
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState(selectedHistoricalId);
  const [cohortMode, setCohortMode] = useState('all');
  const [draftYearFilter, setDraftYearFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [slotFilter, setSlotFilter] = useState('ALL');
  const [archetypeFilter, setArchetypeFilter] = useState('ALL');
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  useEffect(() => {
    if (!selectedHistoricalId) return;
    const selectedEntry = historicalProspects.find((entry) => entry.id === selectedHistoricalId);
    if (!selectedEntry) return;
    setFocusedId(selectedEntry.id);
    setQuery(selectedEntry.name);
  }, [selectedHistoricalId]);

  const draftYearOptions = useMemo(
    () => [...new Set(historicalProspects.map((entry) => entry.draftYear))].sort((left, right) => right - left),
    [],
  );

  const outcomeOptions = useMemo(
    () => [...new Set(historicalProspects.map((entry) => entry.outcomeTier))],
    [],
  );

  const positionOptions = useMemo(
    () => [...new Set(historicalProspects.map((entry) => entry.position))],
    [],
  );

  const slotOptions = useMemo(
    () => [...new Set(historicalProspects.map((entry) => entry.draftSlotBand))],
    [],
  );

  const archetypeFamilies = useMemo(
    () => [...new Set(historicalProspects.map((entry) => entry.archetypeFamily))],
    [],
  );

  const filteredRows = useMemo(() => historicalProspects.filter((entry) => {
    const haystack = [
      entry.name,
      entry.school,
      entry.position,
      entry.archetype,
      entry.roleOutcome,
      entry.outcomeTier,
      entry.notes,
    ].join(' ').toLowerCase();

    return (
      (!query || haystack.includes(query.toLowerCase())) &&
      (draftYearFilter === 'ALL' || String(entry.draftYear) === draftYearFilter) &&
      (outcomeFilter === 'ALL' || entry.outcomeTier === outcomeFilter) &&
      (positionFilter === 'ALL' || entry.position === positionFilter) &&
      (slotFilter === 'ALL' || entry.draftSlotBand === slotFilter) &&
      (archetypeFilter === 'ALL' || entry.archetypeFamily === archetypeFilter)
    );
  }), [archetypeFilter, draftYearFilter, outcomeFilter, positionFilter, query, slotFilter]);

  const focusedEntry = useMemo(
    () => historicalProspects.find((entry) => entry.id === focusedId) || historicalProspects.find((entry) => entry.id === selectedHistoricalId) || filteredRows[0] || null,
    [filteredRows, focusedId, selectedHistoricalId],
  );

  const rows = useMemo(
    () => cohortRows(filteredRows, focusedEntry, cohortMode),
    [cohortMode, filteredRows, focusedEntry],
  );

  const overview = useMemo(() => {
    const average = (values) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const outcomeCounts = rows.reduce((accumulator, entry) => {
      accumulator[entry.outcomeTier] = (accumulator[entry.outcomeTier] || 0) + 1;
      return accumulator;
    }, {});

    return {
      yearRange: rows.length ? `${Math.min(...rows.map((entry) => entry.draftYear))}-${Math.max(...rows.map((entry) => entry.draftYear))}` : '--',
      averageBpm: rows.length ? average(rows.map((entry) => Number(entry.bpm) || 0)).toFixed(1) : '--',
      averageTs: rows.length ? `${average(rows.map((entry) => Number.parseFloat(String(entry.trueShooting).replace('%', '')) || 0)).toFixed(1)}%` : '--',
      topOutcome: Object.entries(outcomeCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || '--',
      slotContext: slotFilter === 'ALL' ? 'All slot bands' : slotFilter,
      outcomeMix: ['Outlier', 'Hit', 'Swing', 'Miss']
        .filter((tier) => outcomeCounts[tier])
        .map((tier) => `${tier} ${Math.round((outcomeCounts[tier] / rows.length) * 100)}%`)
        .join(' · ') || '--',
    };
  }, [rows, slotFilter]);

  const toggleColumn = (columnId) => {
    setVisibleColumns((current) => (
      current.includes(columnId)
        ? current.filter((entry) => entry !== columnId)
        : [...current, columnId]
    ));
  };

  return (
    <section className="workspace-section panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Historical Matrix</p>
          <h3>Outcome context without dashboard clutter</h3>
        </div>
        <div className="detail-actions">
          {selectedHistoricalId && (
            <button type="button" className="inline-action" onClick={onClearSelectedHistorical}>
              Clear focus
            </button>
          )}
          <p className="section-meta">{rows.length} historical records shown</p>
        </div>
      </div>

      <div className="board-summary board-summary-subtle">
        <div className="summary-chip">
          Raw {Object.values(historicalCoverage.rawCounts || {}).reduce((sum, value) => sum + Number(value || 0), 0)}
        </div>
        <div className="summary-chip">
          Promoted {historicalCoverage.quality?.statuses?.promoted || 0}
        </div>
        <div className="summary-chip">
          Review {historicalCoverage.quality?.statuses?.review || 0}
        </div>
        <div className="summary-chip">
          Rejected {historicalCoverage.quality?.statuses?.rejected || 0}
        </div>
        <div className="summary-chip">
          Classes {historicalCoverage.classWindow?.minYear || '--'}-{historicalCoverage.classWindow?.maxYear || '--'}
        </div>
      </div>

      {focusedEntry && (
        <div className="detail-section compare-future">
          <div className="detail-section-head">
            <h4>Cohort Tabs</h4>
            <span className="section-meta">Open the historical workspace around the active precedent</span>
          </div>
          <div className="tag-grid">
            {COHORT_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={`tag-button${cohortMode === mode.id ? ' is-active' : ''}`}
                onClick={() => setCohortMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="matrix-toolbar">
        <div className="control-block search-block">
          <label htmlFor="historical-search">Search</label>
          <input
            id="historical-search"
            type="search"
            placeholder="Player, archetype, school, outcome"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="control-block">
          <label htmlFor="historical-year">Draft Year</label>
          <select id="historical-year" value={draftYearFilter} onChange={(event) => setDraftYearFilter(event.target.value)}>
            <option value="ALL">All draft years</option>
            {draftYearOptions.map((option) => <option key={option} value={String(option)}>{option}</option>)}
          </select>
        </div>
        <div className="control-block">
          <label htmlFor="historical-outcome">Outcome</label>
          <select id="historical-outcome" value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value)}>
            <option value="ALL">All outcomes</option>
            {outcomeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="control-block">
          <label htmlFor="historical-position">Position</label>
          <select id="historical-position" value={positionFilter} onChange={(event) => setPositionFilter(event.target.value)}>
            <option value="ALL">All positions</option>
            {positionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="control-block">
          <label htmlFor="historical-slot">Draft Band</label>
          <select id="historical-slot" value={slotFilter} onChange={(event) => setSlotFilter(event.target.value)}>
            <option value="ALL">All draft bands</option>
            {slotOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="control-block">
          <label htmlFor="historical-archetype">Archetype Family</label>
          <select id="historical-archetype" value={archetypeFilter} onChange={(event) => setArchetypeFilter(event.target.value)}>
            <option value="ALL">All archetype families</option>
            {archetypeFamilies.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      </div>

      <div className="historical-overview-grid">
        <article className="profile-hero-card stat-mini-card">
          <span className="stat-label">Records</span>
          <strong>{rows.length}</strong>
          <span className="stat-detail">{overview.slotContext}</span>
        </article>
        <article className="profile-hero-card stat-mini-card">
          <span className="stat-label">Class Window</span>
          <strong>{overview.yearRange}</strong>
          <span className="stat-detail">{draftYearFilter === 'ALL' ? 'Filtered cohort range' : `Draft year ${draftYearFilter}`}</span>
        </article>
        <article className="profile-hero-card stat-mini-card">
          <span className="stat-label">Top Outcome</span>
          <strong>{overview.topOutcome}</strong>
          <span className="stat-detail">Dominant result in current slice</span>
        </article>
        <article className="profile-hero-card stat-mini-card">
          <span className="stat-label">Average BPM</span>
          <strong>{overview.averageBpm}</strong>
          <span className="stat-detail">Historical impact context</span>
        </article>
        <article className="profile-hero-card stat-mini-card">
          <span className="stat-label">Average TS%</span>
          <strong>{overview.averageTs}</strong>
          <span className="stat-detail">Efficiency baseline for this view</span>
        </article>
        <article className="profile-hero-card stat-mini-card">
          <span className="stat-label">Promoted Rows</span>
          <strong>{historicalCoverage.quality?.statuses?.promoted || 0}</strong>
          <span className="stat-detail">Rows trusted into normalized historical tables</span>
        </article>
      </div>

      <div className="board-summary board-summary-subtle">
        <div className="summary-chip">{draftYearFilter === 'ALL' ? 'All classes' : `Class ${draftYearFilter}`}</div>
        <div className="summary-chip">{focusedEntry ? `${focusedEntry.name}` : 'No focused precedent'}</div>
        <div className="summary-chip">{cohortMode === 'all' ? 'All results' : COHORT_MODES.find((mode) => mode.id === cohortMode)?.label}</div>
        <div className="summary-chip">{overview.slotContext}</div>
        <div className="summary-chip">{overview.outcomeMix}</div>
      </div>

      {focusedEntry && (
        <div className="detail-section detail-section-emphasis">
          <div className="detail-section-head">
            <h4>Focused Historical Anchor</h4>
            <span className="section-meta">{focusedEntry.draftYear} · #{focusedEntry.draftSlot} · {draftSlotBand(focusedEntry.draftSlot)}</span>
          </div>
          <div className="split-section">
            <div>
              <strong>{focusedEntry.name}</strong>
              <p>{focusedEntry.archetype} · {focusedEntry.roleOutcome}</p>
              <p>{focusedEntry.notes}</p>
            </div>
            <div className="detail-grid compact-grid">
              {[
                ['Outcome', focusedEntry.outcomeTier],
                ['Position Family', focusedEntry.positionFamily],
                ['Era', focusedEntry.eraBucket],
                ['BPM', focusedEntry.bpm],
                ['TS%', focusedEntry.trueShooting],
                ['BPM Percentile', focusedEntry.percentiles?.bpm ? `${focusedEntry.percentiles.bpm}th` : '--'],
              ].map(([label, value]) => (
                <div key={label}>
                  <strong>{label}</strong>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="detail-section">
        <div className="detail-section-head">
          <h4>Columns</h4>
        </div>
        <div className="tag-grid">
          {COLUMN_OPTIONS.map((column) => (
            <button
              key={column.id}
              type="button"
              className={`tag-button${visibleColumns.includes(column.id) ? ' is-active' : ''}`}
              onClick={() => toggleColumn(column.id)}
            >
              {column.label}
            </button>
          ))}
        </div>
      </div>

      <div className="historical-table-wrap">
        <table className="historical-table">
          <thead>
            <tr>
              <th>Player</th>
              {visibleColumns.map((columnId) => {
                const column = COLUMN_OPTIONS.find((entry) => entry.id === columnId);
                return <th key={columnId}>{column?.label || columnId}</th>;
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.id} className={focusedEntry?.id === entry.id ? 'is-focused' : ''}>
                <td>
                  <button type="button" className="historical-row-button" onClick={() => { setFocusedId(entry.id); setQuery(entry.name); }}>
                    <strong>{entry.name}</strong>
                  </button>
                </td>
                {visibleColumns.map((columnId) => (
                  <td key={`${entry.id}-${columnId}`}>{entry[columnId] ?? '--'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="section-note">
        This matrix is now cohort-first: focus a precedent, then pivot through archetype, slot-band, and position-family lenses without leaving the workspace.
      </p>
    </section>
  );
}
