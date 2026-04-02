import { useEffect, useState } from 'react';
import prospects from './data/prospects.json';

const watchlistKey = 'prospera.watchlist';
const compareKey = 'prospera.compare';

function readSavedIds(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function App() {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('ALL');
  const [range, setRange] = useState('ALL');
  const [activeId, setActiveId] = useState(prospects[0]?.id ?? null);
  const [watchlist, setWatchlist] = useState([]);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    setWatchlist(readSavedIds(watchlistKey));
    setCompareIds(readSavedIds(compareKey));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    window.localStorage.setItem(compareKey, JSON.stringify(compareIds));
  }, [compareIds]);

  const positionOptions = [...new Set(prospects.map((prospect) => prospect.position))];
  const filteredProspects = prospects.filter((prospect) => {
    const haystack = [
      prospect.name,
      prospect.school,
      prospect.role,
      prospect.position,
      prospect.range,
      prospect.tools,
    ].join(' ').toLowerCase();

    const searchMatch = !query || haystack.includes(query.toLowerCase());
    const positionMatch = position === 'ALL' || prospect.position === position;
    const rangeMatch = range === 'ALL' || prospect.range === range;
    return searchMatch && positionMatch && rangeMatch;
  });

  useEffect(() => {
    if (!filteredProspects.find((prospect) => prospect.id === activeId)) {
      setActiveId(filteredProspects[0]?.id ?? null);
    }
  }, [activeId, filteredProspects]);

  const activeProspect = prospects.find((prospect) => prospect.id === activeId) ?? null;
  const watchlistProspects = watchlist
    .map((id) => prospects.find((prospect) => prospect.id === id))
    .filter(Boolean);
  const compareProspects = compareIds
    .map((id) => prospects.find((prospect) => prospect.id === id))
    .filter(Boolean);

  const toggleWatchlist = (id) => {
    setWatchlist((current) => (
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    ));
  };

  const toggleCompare = (id) => {
    setCompareIds((current) => (
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    ));
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Prospera</p>
          <h1>Prospera</h1>
        </div>
        <div className="topbar-meta">
          <span className="pill pill-live">Live Board</span>
          <span className="topbar-note">Built for evaluation, not marketing.</span>
        </div>
      </header>

      <main className="layout">
        <section className="hero panel">
          <div className="hero-copy">
            <p className="eyebrow">Draft Room</p>
            <h2>A cleaner board for real basketball decisions.</h2>
            <p>
              Compare prospects by role, age, shooting signal, defensive feel, and projected
              range without the usual fake-glass startup treatment.
            </p>
          </div>

          <div className="hero-stats">
            <article className="stat-card">
              <span className="stat-label">Prospects</span>
              <strong>{prospects.length}</strong>
              <span className="stat-detail">Tracked on the live board</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Lottery Pool</span>
              <strong>{prospects.filter((prospect) => prospect.range === 'Lottery').length}</strong>
              <span className="stat-detail">Projected top-14 range</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Wings</span>
              <strong>
                {prospects.filter((prospect) => prospect.position.includes('Wing') || prospect.position === 'F').length}
              </strong>
              <span className="stat-detail">Two-way perimeter bodies</span>
            </article>
          </div>
        </section>

        <section className="controls panel">
          <div className="control-block search-block">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              placeholder="Player, school, archetype"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="control-block">
            <label htmlFor="position-filter">Position</label>
            <select
              id="position-filter"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
            >
              <option value="ALL">All positions</option>
              {positionOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="control-block">
            <label htmlFor="range-filter">Draft range</label>
            <select
              id="range-filter"
              value={range}
              onChange={(event) => setRange(event.target.value)}
            >
              <option value="ALL">All ranges</option>
              <option value="Lottery">Lottery</option>
              <option value="Mid-first">Mid-first</option>
              <option value="Late-first">Late-first</option>
              <option value="Second">Second</option>
            </select>
          </div>
        </section>

        <section className="workflow panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Workflow</p>
              <h3>Shortlist and compare</h3>
            </div>
            <p className="section-meta">
              <span>{watchlistProspects.length}</span> saved - <span>{compareProspects.length}</span> in compare
            </p>
          </div>

          <div className="workflow-grid">
            <div className="workflow-column">
              <div className="workflow-head">
                <h4>Watchlist</h4>
              </div>
              <div className="chip-list">
                {watchlistProspects.length === 0 ? (
                  <p className="empty-state">Save players here while shaping your board.</p>
                ) : (
                  watchlistProspects.map((prospect) => (
                    <div key={prospect.id} className="chip">
                      <button type="button" className="chip-label" onClick={() => setActiveId(prospect.id)}>
                        {prospect.name}
                      </button>
                      <button type="button" aria-label={`Remove ${prospect.name} from watchlist`} onClick={() => toggleWatchlist(prospect.id)}>
                        x
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="workflow-column">
              <div className="workflow-head">
                <h4>Compare Queue</h4>
                <button type="button" className="text-button" onClick={() => setCompareIds([])}>
                  Clear
                </button>
              </div>
              <div className="compare-list">
                {compareProspects.length === 0 ? (
                  <p className="empty-state">Queue up a few players to keep role and range differences visible.</p>
                ) : (
                  compareProspects.map((prospect) => (
                    <button key={prospect.id} type="button" className="compare-card" onClick={() => setActiveId(prospect.id)}>
                      <strong>{prospect.name}</strong>
                      <span>{prospect.position} - {prospect.school}</span>
                      <span>{prospect.range} - {prospect.threePoint} 3PT</span>
                      <span>{prospect.tools}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="board panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Board</p>
              <h3>Draft board</h3>
            </div>
            <p className="section-meta">{filteredProspects.length} prospects shown</p>
          </div>

          <div className="table-head" aria-hidden="true">
            <span>Prospect</span>
            <span>Role</span>
            <span>Age</span>
            <span>3PT</span>
            <span>Tools</span>
            <span>Range</span>
          </div>

          <div className="board-list">
            {filteredProspects.length === 0 ? (
              <div className="detail-empty">
                <h3>No results</h3>
                <p>Change the filters or broaden the search terms.</p>
              </div>
            ) : (
              filteredProspects.map((prospect) => (
                <button
                  key={prospect.id}
                  type="button"
                  className={`board-row${prospect.id === activeId ? ' is-active' : ''}`}
                  onClick={() => setActiveId(prospect.id)}
                >
                  <div className="prospect-main">
                    <strong>{prospect.name}</strong>
                    <div className="prospect-meta">{prospect.school}</div>
                  </div>
                  <div className="prospect-role" data-label="Role">{prospect.role}</div>
                  <div className="board-cell mono" data-label="Age">{prospect.age}</div>
                  <div className="board-cell mono" data-label="3PT">{prospect.threePoint}</div>
                  <div className="board-cell" data-label="Tools">{prospect.tools}</div>
                  <div className="board-cell mono" data-label="Range">{prospect.range}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <aside className="detail panel">
          {!activeProspect ? (
            <div className="detail-empty">
              <p className="eyebrow">Player Detail</p>
              <h3>Select a prospect</h3>
              <p>Open a row from the board to inspect measurements, strengths, risk, and team-fit notes.</p>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-top">
                <div>
                  <p className="eyebrow">Player Detail</p>
                  <h3>{activeProspect.name}</h3>
                  <p className="detail-meta">
                    {activeProspect.school} / {activeProspect.position} / {activeProspect.range}
                  </p>
                </div>

                <div className="detail-actions">
                  <span className="pill">{activeProspect.tier}</span>
                  <button
                    type="button"
                    className={`action-button${watchlist.includes(activeProspect.id) ? ' is-active' : ''}`}
                    onClick={() => toggleWatchlist(activeProspect.id)}
                  >
                    {watchlist.includes(activeProspect.id) ? 'Saved to watchlist' : 'Save to watchlist'}
                  </button>
                  <button
                    type="button"
                    className={`action-button${compareIds.includes(activeProspect.id) ? ' is-active' : ''}`}
                    onClick={() => toggleCompare(activeProspect.id)}
                  >
                    {compareIds.includes(activeProspect.id) ? 'In compare queue' : 'Add to compare'}
                  </button>
                </div>
              </div>

              <div className="detail-grid">
                {[
                  ['Position', activeProspect.position],
                  ['Role', activeProspect.role],
                  ['Age', activeProspect.age],
                  ['3PT', activeProspect.threePoint],
                  ['Tools', activeProspect.tools],
                  ['Draft Range', activeProspect.range],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <h4>Strengths</h4>
                <p>{activeProspect.strengths}</p>
              </div>
              <div className="detail-section">
                <h4>Concerns</h4>
                <p>{activeProspect.concerns}</p>
              </div>
              <div className="detail-section">
                <h4>Prospera View</h4>
                <p>{activeProspect.summary}</p>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
