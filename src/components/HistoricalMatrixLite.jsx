import { useEffect, useMemo, useState } from 'react';
import { buildHistoricalDataset, draftSlotBand } from '../lib/historicalComps';

const COLUMN_OPTIONS = [
  { id: 'draftYear', label: 'Year' },
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
const historicalProspects = buildHistoricalDataset();

export function HistoricalMatrixLite({ selectedHistoricalId, onClearSelectedHistorical }) {
  const [query, setQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [slotFilter, setSlotFilter] = useState('ALL');
  const [archetypeFilter, setArchetypeFilter] = useState('ALL');
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_COLUMNS);

  useEffect(() => {
    if (!selectedHistoricalId) return;
    const selectedEntry = historicalProspects.find((entry) => entry.id === selectedHistoricalId);
    if (!selectedEntry) return;
    setQuery(selectedEntry.name);
  }, [selectedHistoricalId]);

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

  const rows = useMemo(() => historicalProspects.filter((entry) => {
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
      (outcomeFilter === 'ALL' || entry.outcomeTier === outcomeFilter) &&
      (positionFilter === 'ALL' || entry.position === positionFilter) &&
      (slotFilter === 'ALL' || entry.draftSlotBand === slotFilter) &&
      (archetypeFilter === 'ALL' || entry.archetypeFamily === archetypeFilter)
    );
  }), [archetypeFilter, outcomeFilter, positionFilter, query, slotFilter]);

  const focusedEntry = useMemo(
    () => historicalProspects.find((entry) => entry.id === selectedHistoricalId) || rows[0] || null,
    [rows, selectedHistoricalId],
  );

  const overview = useMemo(() => {
    const average = (values) => values.length ? (values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const outcomeCounts = rows.reduce((accumulator, entry) => {
      accumulator[entry.outcomeTier] = (accumulator[entry.outcomeTier] || 0) + 1;
      return accumulator;
    }, {});

    return {
      averageBpm: rows.length ? average(rows.map((entry) => Number(entry.bpm) || 0)).toFixed(1) : '--',
      averageTs: rows.length ? `${average(rows.map((entry) => Number.parseFloat(String(entry.trueShooting).replace('%', '')) || 0)).toFixed(1)}%` : '--',
      topOutcome: Object.entries(outcomeCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || '--',
      slotContext: slotFilter === 'ALL' ? 'All slot bands' : slotFilter,
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
                ['School', focusedEntry.school],
                ['BPM', focusedEntry.bpm],
                ['TS%', focusedEntry.trueShooting],
                ['Draft Slot', focusedEntry.draftSlot],
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
              <tr key={entry.id} className={selectedHistoricalId === entry.id ? 'is-focused' : ''}>
                <td>
                  <button type="button" className="historical-row-button" onClick={() => setQuery(entry.name)}>
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
        This matrix is intentionally lightweight: it is for quick precedent checks and outcome framing, not full research sprawl.
      </p>
    </section>
  );
}
