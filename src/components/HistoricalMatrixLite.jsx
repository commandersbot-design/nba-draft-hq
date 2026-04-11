import { useEffect, useMemo, useState } from 'react';
import historicalProspects from '../data/historicalProspects.json';

const COLUMN_OPTIONS = [
  { id: 'draftYear', label: 'Year' },
  { id: 'draftSlot', label: 'Draft Slot' },
  { id: 'position', label: 'Position' },
  { id: 'school', label: 'School' },
  { id: 'height', label: 'Height' },
  { id: 'age', label: 'Age' },
  { id: 'archetype', label: 'Archetype' },
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

export function HistoricalMatrixLite({ selectedHistoricalId, onClearSelectedHistorical }) {
  const [query, setQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
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
      (positionFilter === 'ALL' || entry.position === positionFilter)
    );
  }), [outcomeFilter, positionFilter, query]);

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
      </div>

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
                  <strong>{entry.name}</strong>
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
