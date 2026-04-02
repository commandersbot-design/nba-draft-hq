import { useEffect, useMemo, useState } from 'react';
import prospects from './data/prospects.json';

const watchlistKey = 'prospera.watchlist';
const compareKey = 'prospera.compare';
const notesKey = 'prospera.notes';
const customTierKey = 'prospera.custom-tiers';
const customTagsKey = 'prospera.custom-tags';

const tagOptions = [
  'upside',
  'safe',
  'shooter',
  'creator',
  'defender',
  'connector',
  'big-swing',
  'stash',
  'rim-pressure',
  'two-way',
];

function readSavedValue(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function boardBucket(rank) {
  if (rank <= 5) return 'Top 5';
  if (rank <= 14) return 'Lottery';
  if (rank <= 30) return 'First round';
  if (rank <= 60) return 'Second round';
  return 'Board depth';
}

function movementLabel(movement) {
  if (!movement || movement === '0') return 'No change';
  return movement.startsWith('+') ? `${movement} riser` : `${movement} faller`;
}

function movementValue(movement) {
  return Number.parseInt(movement, 10) || 0;
}

function tierOrder(tier) {
  const match = /(\d+)/.exec(tier || '');
  return match ? Number(match[1]) : 99;
}

function App() {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('ALL');
  const [school, setSchool] = useState('ALL');
  const [bucket, setBucket] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rank');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [activeId, setActiveId] = useState(prospects[0]?.id ?? null);
  const [watchlist, setWatchlist] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [notes, setNotes] = useState({});
  const [customTiers, setCustomTiers] = useState({});
  const [customTags, setCustomTags] = useState({});

  useEffect(() => {
    setWatchlist(readSavedValue(watchlistKey, []));
    setCompareIds(readSavedValue(compareKey, []));
    setNotes(readSavedValue(notesKey, {}));
    setCustomTiers(readSavedValue(customTierKey, {}));
    setCustomTags(readSavedValue(customTagsKey, {}));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    window.localStorage.setItem(compareKey, JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    window.localStorage.setItem(notesKey, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    window.localStorage.setItem(customTierKey, JSON.stringify(customTiers));
  }, [customTiers]);

  useEffect(() => {
    window.localStorage.setItem(customTagsKey, JSON.stringify(customTags));
  }, [customTags]);

  const enrichedProspects = useMemo(
    () => prospects.map((prospect) => ({
      ...prospect,
      tier: customTiers[prospect.id] || prospect.baseTier,
      tags: customTags[prospect.id] || prospect.tags || [],
    })),
    [customTags, customTiers],
  );

  const positions = useMemo(
    () => [...new Set(enrichedProspects.map((prospect) => prospect.position))],
    [enrichedProspects],
  );
  const schools = useMemo(
    () => [...new Set(enrichedProspects.map((prospect) => prospect.school))].sort((left, right) => left.localeCompare(right)),
    [enrichedProspects],
  );
  const tiers = useMemo(
    () => [...new Set(enrichedProspects.map((prospect) => prospect.tier))].sort((left, right) => tierOrder(left) - tierOrder(right)),
    [enrichedProspects],
  );

  const filteredProspects = useMemo(() => {
    const next = enrichedProspects.filter((prospect) => {
      const haystack = [
        prospect.name,
        prospect.school,
        prospect.position,
        prospect.height,
        prospect.classYear,
        prospect.weight || '',
        prospect.tier,
        prospect.tags.join(' '),
      ].join(' ').toLowerCase();

      const searchMatch = !query || haystack.includes(query.toLowerCase());
      const positionMatch = position === 'ALL' || prospect.position === position;
      const schoolMatch = school === 'ALL' || prospect.school === school;
      const bucketMatch = bucket === 'ALL' || boardBucket(prospect.rank) === bucket;
      const tierMatch = tierFilter === 'ALL' || prospect.tier === tierFilter;
      const tagMatch = tagFilter === 'ALL' || prospect.tags.includes(tagFilter);
      const watchlistMatch = !watchlistOnly || watchlist.includes(prospect.id);
      return searchMatch && positionMatch && schoolMatch && bucketMatch && tierMatch && tagMatch && watchlistMatch;
    });

    return [...next].sort((left, right) => {
      switch (sortBy) {
        case 'movement':
          return movementValue(right.movement) - movementValue(left.movement);
        case 'school':
          return left.school.localeCompare(right.school);
        case 'name':
          return left.name.localeCompare(right.name);
        case 'size':
          return right.height.localeCompare(left.height, undefined, { numeric: true });
        case 'tier':
          return tierOrder(left.tier) - tierOrder(right.tier) || left.rank - right.rank;
        default:
          return left.rank - right.rank;
      }
    });
  }, [bucket, enrichedProspects, position, query, school, sortBy, tagFilter, tierFilter, watchlist, watchlistOnly]);

  useEffect(() => {
    if (!filteredProspects.find((prospect) => prospect.id === activeId)) {
      setActiveId(filteredProspects[0]?.id ?? null);
    }
  }, [activeId, filteredProspects]);

  const activeProspect = enrichedProspects.find((prospect) => prospect.id === activeId) ?? null;
  const watchlistProspects = watchlist.map((id) => enrichedProspects.find((prospect) => prospect.id === id)).filter(Boolean);
  const compareProspects = compareIds.map((id) => enrichedProspects.find((prospect) => prospect.id === id)).filter(Boolean);
  const internationalCount = enrichedProspects.filter((prospect) => /^\d{4}$/.test(prospect.classYear)).length;
  const notesCount = Object.values(notes).filter((value) => value?.trim()).length;
  const taggedCount = Object.values(customTags).filter((tags) => tags.length > 0).length;
  const customTierCount = Object.keys(customTiers).length;

  const toggleWatchlist = (id) => {
    setWatchlist((current) => (
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    ));
  };

  const toggleCompare = (id) => {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((entry) => entry !== id);
      }
      if (current.length >= 4) {
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
  };

  const clearFilters = () => {
    setQuery('');
    setPosition('ALL');
    setSchool('ALL');
    setBucket('ALL');
    setTierFilter('ALL');
    setTagFilter('ALL');
    setSortBy('rank');
    setWatchlistOnly(false);
  };

  const updateNote = (id, value) => {
    setNotes((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const updateTier = (id, value) => {
    setCustomTiers((current) => {
      if (!value) {
        const { [id]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [id]: value };
    });
  };

  const toggleTag = (id, tag) => {
    setCustomTags((current) => {
      const nextTags = current[id] || [];
      const updated = nextTags.includes(tag)
        ? nextTags.filter((entry) => entry !== tag)
        : [...nextTags, tag];

      if (updated.length === 0) {
        const { [id]: _removed, ...rest } = current;
        return rest;
      }

      return { ...current, [id]: updated };
    });
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Prospera</p>
          <h1>Prospera</h1>
        </div>
        <div className="topbar-meta">
          <span className="pill pill-live">2026 Board</span>
          <span className="topbar-note">Structured data, custom tiers, and draft tags.</span>
        </div>
      </header>

      <main className="layout">
        <section className="hero panel">
          <div className="hero-copy">
            <p className="eyebrow">Big Board</p>
            <h2>A clean board with actual workflow now built in.</h2>
            <p>
              The board data now lives in a structured JSON file, and you can layer your own tiers
              and scouting tags on top without touching the base rankings.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className={`action-button${watchlistOnly ? ' is-active' : ''}`}
                onClick={() => setWatchlistOnly((current) => !current)}
              >
                {watchlistOnly ? 'Showing watchlist only' : 'Focus watchlist'}
              </button>
              <button type="button" className="text-button" onClick={clearFilters}>
                Reset filters
              </button>
            </div>
          </div>

          <div className="hero-stats">
            <article className="stat-card">
              <span className="stat-label">Prospects</span>
              <strong>{enrichedProspects.length}</strong>
              <span className="stat-detail">Normalized into structured board data</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Custom Tiers</span>
              <strong>{customTierCount}</strong>
              <span className="stat-detail">Players with overridden board tiers</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Tagged Players</span>
              <strong>{taggedCount}</strong>
              <span className="stat-detail">Prospects marked with draft workflow tags</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">International</span>
              <strong>{internationalCount}</strong>
              <span className="stat-detail">Tagged with birth-year intake</span>
            </article>
            <article className="stat-card">
              <span className="stat-label">Notes Logged</span>
              <strong>{notesCount}</strong>
              <span className="stat-detail">Prospects with saved room notes</span>
            </article>
          </div>
        </section>

        <section className="controls panel">
          <div className="control-block search-block">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              placeholder="Player, school, position, tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="control-block">
            <label htmlFor="position-filter">Position</label>
            <select id="position-filter" value={position} onChange={(event) => setPosition(event.target.value)}>
              <option value="ALL">All positions</option>
              {positions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="control-block">
            <label htmlFor="school-filter">School</label>
            <select id="school-filter" value={school} onChange={(event) => setSchool(event.target.value)}>
              <option value="ALL">All schools</option>
              {schools.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="control-block">
            <label htmlFor="bucket-filter">Board Segment</label>
            <select id="bucket-filter" value={bucket} onChange={(event) => setBucket(event.target.value)}>
              <option value="ALL">Entire board</option>
              <option value="Top 5">Top 5</option>
              <option value="Lottery">Lottery</option>
              <option value="First round">First round</option>
              <option value="Second round">Second round</option>
              <option value="Board depth">Board depth</option>
            </select>
          </div>
          <div className="control-block">
            <label htmlFor="tier-filter">Tier</label>
            <select id="tier-filter" value={tierFilter} onChange={(event) => setTierFilter(event.target.value)}>
              <option value="ALL">All tiers</option>
              {tiers.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="control-block">
            <label htmlFor="tag-filter">Tag</label>
            <select id="tag-filter" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
              <option value="ALL">All tags</option>
              {tagOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="control-block">
            <label htmlFor="sort-filter">Sort</label>
            <select id="sort-filter" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="rank">Rank</option>
              <option value="tier">Tier</option>
              <option value="movement">Movement</option>
              <option value="school">School</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
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
                        #{prospect.rank} {prospect.name}
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
                  <p className="empty-state">Queue up players to compare size, movement, tier, and tags.</p>
                ) : (
                  compareProspects.map((prospect) => (
                    <button key={prospect.id} type="button" className="compare-card" onClick={() => setActiveId(prospect.id)}>
                      <strong>#{prospect.rank} {prospect.name}</strong>
                      <span>{prospect.position} - {prospect.school}</span>
                      <span>{prospect.height} / {prospect.weight || '--'} lb</span>
                      <span>{prospect.tier}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {compareProspects.length > 0 && (
            <div className="compare-matrix">
              <div className="matrix-row matrix-head">
                <span>Category</span>
                {compareProspects.map((prospect) => (
                  <span key={prospect.id}>{prospect.name}</span>
                ))}
              </div>
              {[
                ['Rank', 'rank'],
                ['Tier', 'tier'],
                ['Position', 'position'],
                ['Height', 'height'],
                ['Weight', 'weight'],
                ['School', 'school'],
                ['Class', 'classYear'],
                ['Movement', 'movement'],
              ].map(([label, key]) => (
                <div key={label} className="matrix-row">
                  <span>{label}</span>
                  {compareProspects.map((prospect) => (
                    <span key={`${prospect.id}-${key}`}>{prospect[key] || '--'}</span>
                  ))}
                </div>
              ))}
              <div className="matrix-row">
                <span>Tags</span>
                {compareProspects.map((prospect) => (
                  <span key={`${prospect.id}-tags`}>{prospect.tags.length ? prospect.tags.join(', ') : '--'}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="board panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">Board</p>
              <h3>Draft board</h3>
            </div>
            <p className="section-meta">{filteredProspects.length} prospects shown</p>
          </div>

          <div className="board-summary">
            <div className="summary-chip">{watchlistOnly ? 'Watchlist focus' : 'Full board view'}</div>
            <div className="summary-chip">{bucket === 'ALL' ? 'All board segments' : bucket}</div>
            <div className="summary-chip">{tierFilter === 'ALL' ? 'All tiers' : tierFilter}</div>
            <div className="summary-chip">{tagFilter === 'ALL' ? 'All tags' : `Tag: ${tagFilter}`}</div>
          </div>

          <div className="table-head" aria-hidden="true">
            <span>Prospect</span>
            <span>Position</span>
            <span>Height</span>
            <span>Weight</span>
            <span>Tier</span>
            <span>Move</span>
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
                    <div className="prospect-title">
                      <strong>#{prospect.rank} {prospect.name}</strong>
                      {watchlist.includes(prospect.id) && <span className="row-badge">Watchlist</span>}
                    </div>
                    <div className="prospect-meta">{prospect.school} / {prospect.classYear}</div>
                    {prospect.tags.length > 0 && (
                      <div className="inline-tags">
                        {prospect.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="mini-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="prospect-role" data-label="Position">{prospect.position}</div>
                  <div className="board-cell mono" data-label="Height">{prospect.height}</div>
                  <div className="board-cell mono" data-label="Weight">{prospect.weight || '--'}</div>
                  <div className="board-cell mono" data-label="Tier">{prospect.tier}</div>
                  <div className="board-cell mono" data-label="Move">{prospect.movement}</div>
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
              <p>Open a row to inspect rank, size, custom tier, tags, and your notes.</p>
            </div>
          ) : (
            <div className="detail-card">
              <div className="detail-top">
                <div>
                  <p className="eyebrow">Player Detail</p>
                  <h3>#{activeProspect.rank} {activeProspect.name}</h3>
                  <p className="detail-meta">
                    {activeProspect.school} / {activeProspect.position} / {activeProspect.classYear}
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
                  ['Rank', activeProspect.rank],
                  ['Base Tier', activeProspect.baseTier],
                  ['Current Tier', activeProspect.tier],
                  ['Height', activeProspect.height],
                  ['Weight', activeProspect.weight || '--'],
                  ['School', activeProspect.school],
                  ['Class', activeProspect.classYear],
                  ['Movement', movementLabel(activeProspect.movement)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <strong>{label}</strong>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <div className="detail-section-head">
                  <h4>Tier Assignment</h4>
                  <span className="section-meta">Overrides save locally</span>
                </div>
                <div className="tier-controls">
                  {['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      className={`tier-button${activeProspect.tier === tier ? ' is-active' : ''}`}
                      onClick={() => updateTier(activeProspect.id, tier === activeProspect.baseTier ? '' : tier)}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-section-head">
                  <h4>Workflow Tags</h4>
                  <span className="section-meta">Use tags to shape your board</span>
                </div>
                <div className="tag-grid">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-button${activeProspect.tags.includes(tag) ? ' is-active' : ''}`}
                      onClick={() => toggleTag(activeProspect.id, tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Board Context</h4>
                <p>
                  This prospect sits in the <strong>{boardBucket(activeProspect.rank)}</strong> segment of your board
                  at <strong>#{activeProspect.rank}</strong>, with a listed movement of <strong>{activeProspect.movement}</strong>.
                </p>
              </div>

              <div className="detail-section">
                <div className="detail-section-head">
                  <h4>Room Notes</h4>
                  <span className="section-meta">Saved locally in this browser</span>
                </div>
                <textarea
                  className="notes-input"
                  placeholder="Add role notes, bet size, fit concerns, or live eval thoughts."
                  value={notes[activeProspect.id] || ''}
                  onChange={(event) => updateNote(activeProspect.id, event.target.value)}
                />
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default App;
