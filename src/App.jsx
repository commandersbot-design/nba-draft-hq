import { useMemo, useState } from 'react';
import prospects from './data/prospects.json';
import { CompareEngine } from './components/CompareEngine';
import { HistoricalMatrixLite } from './components/HistoricalMatrixLite';
import { MyBoardBuilder } from './components/MyBoardBuilder';
import { NotesWorkspace } from './components/NotesWorkspace';
import { PlayerProfileSurface } from './components/PlayerProfileSurface';
import { ProspectRankCard } from './components/ProspectRankCard';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { buildBoardExportRows, buildNotesExportRows, downloadCsv, downloadJson } from './lib/exporters';
import { APP_VIEWS, BOARD_CARD_SETTINGS, TAG_OPTIONS, VIEW_MODES } from './lib/constants';
import { createEmptyStructuredNote, enrichProspects } from './lib/prospectModel';

const watchlistKey = 'prospera.watchlist';
const compareKey = 'prospera.compare';
const notesKey = 'prospera.notes.workspace';
const customTierKey = 'prospera.custom-tiers';
const customTagsKey = 'prospera.custom-tags';
const myBoardKey = 'prospera.my-board';
const myBoardViewKey = 'prospera.my-board-view';
const cardSettingsKey = 'prospera.card-settings';
const savedBoardsKey = 'prospera.saved-boards';
const savedViewsKey = 'prospera.saved-views';
const historicalSelectionKey = 'prospera.historical-selection';

const FILTER_PRESETS = [
  {
    id: 'top-of-board',
    label: 'Top of Board',
    state: { bucket: 'Lottery', sortBy: 'rank', viewMode: 'peek', appView: 'big-board' },
  },
  {
    id: 'international',
    label: 'International',
    state: { leagueType: 'International Pro', sortBy: 'overall', viewMode: 'peruse', appView: 'big-board' },
  },
  {
    id: 'tier-1',
    label: 'Tier 1',
    state: { tierFilter: 'Tier 1', sortBy: 'overall', viewMode: 'peruse', appView: 'big-board' },
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    state: { watchlistOnly: true, sortBy: 'manual', viewMode: 'deep-dive', appView: 'my-board' },
  },
];

function boardBucket(rank) {
  if (rank <= 5) return 'Top 5';
  if (rank <= 14) return 'Lottery';
  if (rank <= 30) return 'First round';
  if (rank <= 60) return 'Second round';
  return 'Board depth';
}

function movementValue(movement) {
  return Number.parseInt(movement, 10) || 0;
}

function tierOrder(tier) {
  const match = /(\d+)/.exec(tier || '');
  return match ? Number(match[1]) : 99;
}

function defaultCardSettings() {
  return Object.fromEntries(BOARD_CARD_SETTINGS.map((setting) => [setting.id, true]));
}

function App() {
  const [appView, setAppView] = useState('big-board');
  const [viewMode, setViewMode] = useState('peek');
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('ALL');
  const [school, setSchool] = useState('ALL');
  const [leagueType, setLeagueType] = useState('ALL');
  const [bucket, setBucket] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rank');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [activeId, setActiveId] = useState(prospects[0]?.id ?? null);

  const [watchlist, setWatchlist] = useLocalStorageState(watchlistKey, []);
  const [compareIds, setCompareIds] = useLocalStorageState(compareKey, []);
  const [notes, setNotes] = useLocalStorageState(notesKey, []);
  const [customTiers, setCustomTiers] = useLocalStorageState(customTierKey, {});
  const [customTags, setCustomTags] = useLocalStorageState(customTagsKey, {});
  const [myBoard, setMyBoard] = useLocalStorageState(myBoardKey, prospects.map((prospect) => prospect.id));
  const [myBoardView, setMyBoardView] = useLocalStorageState(myBoardViewKey, 'card');
  const [cardSettings, setCardSettings] = useLocalStorageState(cardSettingsKey, defaultCardSettings());
  const [savedBoards, setSavedBoards] = useLocalStorageState(savedBoardsKey, []);
  const [savedViews, setSavedViews] = useLocalStorageState(savedViewsKey, []);
  const [selectedHistoricalId, setSelectedHistoricalId] = useLocalStorageState(historicalSelectionKey, null);
  const [viewName, setViewName] = useState('');

  const enrichedProspects = useMemo(
    () => enrichProspects(prospects).map((prospect) => ({
      ...prospect,
      tier: customTiers[prospect.id] || prospect.baseTier,
      tags: customTags[prospect.id] || prospect.tags || [],
    })),
    [customTags, customTiers],
  );

  const prospectsById = useMemo(
    () => Object.fromEntries(enrichedProspects.map((prospect) => [prospect.id, prospect])),
    [enrichedProspects],
  );

  const positions = useMemo(() => [...new Set(enrichedProspects.map((prospect) => prospect.position))], [enrichedProspects]);
  const schools = useMemo(
    () => [...new Set(enrichedProspects.map((prospect) => prospect.school))].sort((left, right) => left.localeCompare(right)),
    [enrichedProspects],
  );
  const leagueTypes = useMemo(() => [...new Set(enrichedProspects.map((prospect) => prospect.leagueType))], [enrichedProspects]);
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
        prospect.leagueType,
        prospect.country,
        prospect.archetype,
        prospect.archetypeBase,
        prospect.roleProjection,
        prospect.riskLevel,
        prospect.tags.join(' '),
      ].join(' ').toLowerCase();

      return (
        (!query || haystack.includes(query.toLowerCase())) &&
        (position === 'ALL' || prospect.position === position) &&
        (school === 'ALL' || prospect.school === school) &&
        (leagueType === 'ALL' || prospect.leagueType === leagueType) &&
        (bucket === 'ALL' || boardBucket(prospect.rank) === bucket) &&
        (tierFilter === 'ALL' || prospect.tier === tierFilter) &&
        (tagFilter === 'ALL' || prospect.tags.includes(tagFilter)) &&
        (!watchlistOnly || watchlist.includes(prospect.id))
      );
    });

    return [...next].sort((left, right) => {
      switch (sortBy) {
        case 'manual':
          return myBoard.indexOf(left.id) - myBoard.indexOf(right.id);
        case 'overall':
          return right.overallComposite - left.overallComposite;
        case 'tier':
          return tierOrder(left.tier) - tierOrder(right.tier) || left.rank - right.rank;
        case 'age':
          return left.age - right.age;
        case 'position':
          return left.position.localeCompare(right.position);
        case 'offense':
          return right.offenseScore - left.offenseScore;
        case 'defense':
          return right.defenseScore - left.defenseScore;
        case 'movement':
          return movementValue(right.movement) - movementValue(left.movement);
        case 'school':
          return left.school.localeCompare(right.school);
        case 'name':
          return left.name.localeCompare(right.name);
        case 'size':
          return right.height.localeCompare(left.height, undefined, { numeric: true });
        default:
          return left.rank - right.rank;
      }
    });
  }, [bucket, enrichedProspects, leagueType, myBoard, position, query, school, sortBy, tagFilter, tierFilter, watchlist, watchlistOnly]);

  const activeProspect = prospectsById[activeId] || filteredProspects[0] || null;
  const activeProspectNotes = notes.filter((note) => note.playerId === activeProspect?.id);
  const compareProspects = compareIds.map((id) => prospectsById[id]).filter(Boolean);
  const watchlistProspects = watchlist.map((id) => prospectsById[id]).filter(Boolean);
  const myBoardProspects = myBoard.map((id) => prospectsById[id]).filter(Boolean);
  const selectedMode = VIEW_MODES.find((mode) => mode.id === viewMode);
  const internationalCount = enrichedProspects.filter((prospect) => /^\d{4}$/.test(prospect.classYear)).length;
  const notesCount = notes.length;
  const taggedCount = Object.values(customTags).filter((tags) => tags.length > 0).length;
  const customTierCount = Object.keys(customTiers).length;

  const notesByPlayer = useMemo(
    () => notes.reduce((accumulator, note) => {
      accumulator[note.playerId] = accumulator[note.playerId] || [];
      accumulator[note.playerId].push(note);
      return accumulator;
    }, {}),
    [notes],
  );

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
      if (current.length >= 3) {
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
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

  const createNote = (playerId) => {
    if (!playerId) return;
    const note = createEmptyStructuredNote(playerId);
    setNotes((current) => [note, ...current]);
    setActiveId(playerId);
    setAppView('notes');
  };

  const updateNote = (noteId, field, value) => {
    setNotes((current) => current.map((note) => (
      note.id === noteId
        ? { ...note, [field]: value, updatedAt: new Date().toISOString() }
        : note
    )));
  };

  const deleteNote = (noteId) => {
    setNotes((current) => current.filter((note) => note.id !== noteId));
  };

  const reorderMyBoard = (fromIndex, toIndex) => {
    setMyBoard((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const toggleCardSetting = (key) => {
    setCardSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const saveCurrentBoard = (name) => {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) return;

    setSavedBoards((current) => [
      {
        id: `${Date.now()}`,
        name: normalizedName,
        board: myBoard,
        createdAt: new Date().toISOString(),
      },
      ...current.filter((entry) => entry.name !== normalizedName),
    ]);
  };

  const loadSavedBoard = (id) => {
    const board = savedBoards.find((entry) => entry.id === id);
    if (!board) return;
    setMyBoard(board.board);
  };

  const deleteSavedBoard = (id) => {
    setSavedBoards((current) => current.filter((entry) => entry.id !== id));
  };

  const clearFilters = () => {
    setQuery('');
    setPosition('ALL');
    setSchool('ALL');
    setLeagueType('ALL');
    setBucket('ALL');
    setTierFilter('ALL');
    setTagFilter('ALL');
    setSortBy('rank');
    setWatchlistOnly(false);
  };

  const getCurrentViewState = () => ({
    appView,
    viewMode,
    query,
    position,
    school,
    leagueType,
    bucket,
    tierFilter,
    tagFilter,
    sortBy,
    watchlistOnly,
  });

  const applyViewState = (state = {}) => {
    setAppView(state.appView || 'big-board');
    setViewMode(state.viewMode || 'peek');
    setQuery(state.query || '');
    setPosition(state.position || 'ALL');
    setSchool(state.school || 'ALL');
    setLeagueType(state.leagueType || 'ALL');
    setBucket(state.bucket || 'ALL');
    setTierFilter(state.tierFilter || 'ALL');
    setTagFilter(state.tagFilter || 'ALL');
    setSortBy(state.sortBy || 'rank');
    setWatchlistOnly(Boolean(state.watchlistOnly));
  };

  const saveCurrentView = (name) => {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) return;

    const state = getCurrentViewState();
    setSavedViews((current) => [
      {
        id: `${Date.now()}`,
        name: normalizedName,
        state,
        createdAt: new Date().toISOString(),
      },
      ...current.filter((entry) => entry.name !== normalizedName),
    ]);
  };

  const loadSavedView = (id) => {
    const savedView = savedViews.find((entry) => entry.id === id);
    if (!savedView) return;
    applyViewState(savedView.state);
  };

  const deleteSavedView = (id) => {
    setSavedViews((current) => current.filter((entry) => entry.id !== id));
  };

  const openHistorical = (historicalId) => {
    setSelectedHistoricalId(historicalId);
    setAppView('historical');
  };

  const exportNotesJson = () => {
    downloadJson('prospera-notes', buildNotesExportRows(notes, prospectsById));
  };

  const exportNotesCsv = () => {
    downloadCsv('prospera-notes', buildNotesExportRows(notes, prospectsById));
  };

  const exportBoardJson = () => {
    downloadJson('prospera-board', buildBoardExportRows(myBoardProspects));
  };

  const exportBoardCsv = () => {
    downloadCsv('prospera-board', buildBoardExportRows(myBoardProspects));
  };

  return (
    <div className="page-shell">
      {/* Implementation note: Tier 1 surfaces are split into modular workspaces so
          profiles, board building, compare, and notes can evolve independently. */}
      <header className="guide-header panel">
        <div className="guide-brand">
          <p className="eyebrow">2026</p>
          <h1>Prospera Draft Guide</h1>
          <p className="guide-copy">
            A structured scouting operating system: profiles, board building, compare, and notes,
            all inside the same decision surface.
          </p>
        </div>
        <div className="guide-meta">
          <span className="pill pill-live">Tier 1</span>
          <span className="topbar-note">Profiles, board builder, compare engine, notes workspace.</span>
        </div>
      </header>

      <section className="mode-bar panel">
        <div className="mode-copy">
          <p className="eyebrow">Workspace</p>
          <h2>{selectedMode?.label}</h2>
          <p>{selectedMode?.description}</p>
        </div>
        <div className="mode-tabs">
          {APP_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              className={`mode-tab${appView === view.id ? ' is-active' : ''}`}
              onClick={() => setAppView(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mode-bar panel compact-bar">
        <div className="mode-copy">
          <p className="eyebrow">Depth</p>
          <h2>{selectedMode?.label}</h2>
          <p>{selectedMode?.description}</p>
        </div>
        <div className="mode-tabs">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`mode-tab${viewMode === mode.id ? ' is-active' : ''}`}
              onClick={() => setViewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </section>

      <main className="guide-layout">
        <section className="left-column">
          <section className="hero panel">
            <div className="hero-copy">
              <p className="eyebrow">Board Summary</p>
              <h2>Evaluate more clearly. Decide faster.</h2>
              <p>
                The board now supports structured profiles, a personal board, side-by-side compare,
                and notes built for front-office workflow instead of casual browsing.
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
                <span className="stat-detail">Structured profile records</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Custom Tiers</span>
                <strong>{customTierCount}</strong>
                <span className="stat-detail">Personal overrides applied</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Tagged Players</span>
                <strong>{taggedCount}</strong>
                <span className="stat-detail">Structured workflow labels assigned</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">International</span>
                <strong>{internationalCount}</strong>
                <span className="stat-detail">Prospects outside the NCAA track</span>
              </article>
              <article className="stat-card">
                <span className="stat-label">Notes Logged</span>
                <strong>{notesCount}</strong>
                <span className="stat-detail">Structured evaluator notes saved</span>
              </article>
            </div>
          </section>

          <section className="controls panel">
            <div className="saved-views-bar">
              <div className="saved-view-controls">
                <input
                  className="notes-input compact-input"
                  value={viewName}
                  placeholder="Save current view"
                  onChange={(event) => setViewName(event.target.value)}
                />
                <button
                  type="button"
                  className="action-button"
                  onClick={() => {
                    saveCurrentView(viewName);
                    setViewName('');
                  }}
                >
                  Save View
                </button>
              </div>

              <div className="preset-row">
                {FILTER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="mode-tab"
                    onClick={() => applyViewState(preset.state)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="saved-view-list">
                {savedViews.length === 0 ? (
                  <p className="empty-state">No saved views yet. Save a filter stack to reuse it across workspaces.</p>
                ) : (
                  savedViews.map((savedView) => (
                    <div key={savedView.id} className="saved-view-card">
                      <div>
                        <strong>{savedView.name}</strong>
                        <span>{new Date(savedView.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="detail-actions">
                        <button type="button" className="inline-action" onClick={() => loadSavedView(savedView.id)}>Load</button>
                        <button type="button" className="inline-action" onClick={() => deleteSavedView(savedView.id)}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="control-block search-block">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="search"
                placeholder="Player, school, position, archetype"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="control-block">
              <label htmlFor="position-filter">Position</label>
              <select id="position-filter" value={position} onChange={(event) => setPosition(event.target.value)}>
                <option value="ALL">All positions</option>
                {positions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="control-block">
              <label htmlFor="school-filter">School</label>
              <select id="school-filter" value={school} onChange={(event) => setSchool(event.target.value)}>
                <option value="ALL">All schools</option>
                {schools.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="control-block">
              <label htmlFor="league-filter">League Type</label>
              <select id="league-filter" value={leagueType} onChange={(event) => setLeagueType(event.target.value)}>
                <option value="ALL">All leagues</option>
                {leagueTypes.map((option) => <option key={option} value={option}>{option}</option>)}
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
                {tiers.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="control-block">
              <label htmlFor="tag-filter">Tag</label>
              <select id="tag-filter" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
                <option value="ALL">All tags</option>
                {TAG_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div className="control-block">
              <label htmlFor="sort-filter">Sort</label>
              <select id="sort-filter" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="rank">Rank</option>
                <option value="overall">Overall Score</option>
                <option value="tier">Tier</option>
                <option value="age">Age</option>
                <option value="position">Position</option>
                <option value="offense">Offensive Score</option>
                <option value="defense">Defensive Score</option>
                <option value="manual">Custom Order</option>
                <option value="movement">Movement</option>
              </select>
            </div>
          </section>

          {appView === 'big-board' && (
            <section className="board panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Big Board Surface</p>
                  <h3>{filteredProspects.length} prospects shown</h3>
                </div>
                <p className="section-meta">{sortBy === 'manual' ? 'Manual order active' : `Sorted by ${sortBy}`}</p>
              </div>

              <div className="board-summary">
                <div className="summary-chip">{watchlistOnly ? 'Watchlist focus' : 'Full board view'}</div>
                <div className="summary-chip">{bucket === 'ALL' ? 'All board segments' : bucket}</div>
                <div className="summary-chip">{tierFilter === 'ALL' ? 'All tiers' : tierFilter}</div>
                <div className="summary-chip">{tagFilter === 'ALL' ? 'All tags' : `Tag: ${tagFilter}`}</div>
              </div>

              <div className="rank-list">
                {filteredProspects.map((prospect) => (
                  <ProspectRankCard
                    key={prospect.id}
                    prospect={prospect}
                    isActive={prospect.id === activeProspect?.id}
                    viewMode={viewMode}
                    isWatched={watchlist.includes(prospect.id)}
                    cardSettings={cardSettings}
                    onSelect={setActiveId}
                    onToggleCompare={toggleCompare}
                    onQuickNote={createNote}
                  />
                ))}
              </div>
            </section>
          )}

          {appView === 'my-board' && (
            <MyBoardBuilder
              prospects={filteredProspects}
              customBoard={myBoard}
              boardView={myBoardView}
              cardSettings={cardSettings}
              watchlist={watchlist}
              activeId={activeProspect?.id}
              onSelect={setActiveId}
              onToggleCompare={toggleCompare}
              onQuickNote={createNote}
              onSetBoardView={setMyBoardView}
              onToggleCardSetting={toggleCardSetting}
              onReorder={reorderMyBoard}
              savedBoards={savedBoards}
              onSaveBoard={saveCurrentBoard}
              onLoadBoard={loadSavedBoard}
              onDeleteBoard={deleteSavedBoard}
              onExportBoardJson={exportBoardJson}
              onExportBoardCsv={exportBoardCsv}
            />
          )}

          {appView === 'compare' && (
            <CompareEngine prospects={compareProspects} notesByPlayer={notesByPlayer} onOpenHistorical={openHistorical} />
          )}

          {appView === 'notes' && (
            <NotesWorkspace
              notes={notes}
              prospectsById={prospectsById}
              selectedPlayerId={activeProspect?.id}
              onSelectPlayer={(playerId) => {
                setActiveId(playerId);
                setAppView('notes');
              }}
              onCreateNote={createNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onExportJson={exportNotesJson}
              onExportCsv={exportNotesCsv}
            />
          )}

          {appView === 'historical' && (
            <HistoricalMatrixLite
              selectedHistoricalId={selectedHistoricalId}
              onClearSelectedHistorical={() => setSelectedHistoricalId(null)}
            />
          )}
        </section>

        <aside className="detail panel">
          <PlayerProfileSurface
            prospect={activeProspect}
            notes={activeProspectNotes}
            viewMode={viewMode}
            isWatched={!!activeProspect && watchlist.includes(activeProspect.id)}
            isCompared={!!activeProspect && compareIds.includes(activeProspect.id)}
            onToggleWatchlist={toggleWatchlist}
            onToggleCompare={toggleCompare}
            onUpdateTier={updateTier}
            onToggleTag={toggleTag}
            onCreateNote={createNote}
            onOpenHistorical={openHistorical}
          />

          <section className="workflow panel side-workflow">
            <div className="section-head">
              <div>
                <p className="eyebrow">Workflow</p>
                <h3>Shortlist and compare</h3>
              </div>
            </div>

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

            <div className="workflow-column compare-stack">
              <div className="workflow-head">
                <h4>Compare Queue</h4>
                <button type="button" className="text-button" onClick={() => setCompareIds([])}>Clear</button>
              </div>
              <div className="compare-list">
                {compareProspects.length === 0 ? (
                  <p className="empty-state">Queue players here for the compare workspace.</p>
                ) : (
                  compareProspects.map((prospect) => (
                    <button key={prospect.id} type="button" className="compare-card" onClick={() => { setActiveId(prospect.id); setAppView('compare'); }}>
                      <strong>#{prospect.rank} {prospect.name}</strong>
                      <span>{prospect.position} - {prospect.school}</span>
                      <span>{prospect.tier}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
