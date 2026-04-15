import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { MyBoardBuilder } from './components/MyBoardBuilder';
import { NotesWorkspace } from './components/NotesWorkspace';
import { ProspectRankCard } from './components/ProspectRankCard';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { buildBoardExportRows, buildNotesExportRows, downloadCsv, downloadJson } from './lib/exporters';
import { APP_VIEWS, BOARD_CARD_SETTINGS, TAG_OPTIONS, VIEW_MODES } from './lib/constants';

const CompareEngine = lazy(() => import('./components/CompareEngine').then((module) => ({ default: module.CompareEngine })));
const HistoricalMatrixLite = lazy(() => import('./components/HistoricalMatrixLite').then((module) => ({ default: module.HistoricalMatrixLite })));
const PlayerProfileSurface = lazy(() => import('./components/PlayerProfileSurface').then((module) => ({ default: module.PlayerProfileSurface })));

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
    state: { tierFilter: 'Tier 1', sortBy: 'rank', viewMode: 'peek', appView: 'big-board' },
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
  const [runtime, setRuntime] = useState({
    prospects: [],
    currentMeasurements: {},
    enrichBoardProspects: null,
    enrichProspectDetail: null,
    createEmptyStructuredNote: null,
    loaded: false,
  });
  const [detailRuntime, setDetailRuntime] = useState({
    profileStats: {},
    authoredProfiles: {},
    loaded: false,
    loading: false,
  });
  const [appView, setAppView] = useState('big-board');
  const [viewMode, setViewMode] = useState('peek');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState('ALL');
  const [school, setSchool] = useState('ALL');
  const [leagueType, setLeagueType] = useState('ALL');
  const [bucket, setBucket] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [tagFilter, setTagFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('rank');
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const [watchlist, setWatchlist] = useLocalStorageState(watchlistKey, []);
  const [compareIds, setCompareIds] = useLocalStorageState(compareKey, []);
  const [notes, setNotes] = useLocalStorageState(notesKey, []);
  const [customTiers, setCustomTiers] = useLocalStorageState(customTierKey, {});
  const [customTags, setCustomTags] = useLocalStorageState(customTagsKey, {});
  const [myBoard, setMyBoard] = useLocalStorageState(myBoardKey, []);
  const [myBoardView, setMyBoardView] = useLocalStorageState(myBoardViewKey, 'card');
  const [cardSettings, setCardSettings] = useLocalStorageState(cardSettingsKey, defaultCardSettings());
  const [savedBoards, setSavedBoards] = useLocalStorageState(savedBoardsKey, []);
  const [savedViews, setSavedViews] = useLocalStorageState(savedViewsKey, []);
  const [selectedHistoricalId, setSelectedHistoricalId] = useLocalStorageState(historicalSelectionKey, null);
  const [viewName, setViewName] = useState('');

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      import('./data/prospects.json'),
      import('./lib/prospectModel'),
      import('./data/currentMeasurements.json'),
    ]).then(([
      prospectsModule,
      modelModule,
      currentMeasurementsModule,
    ]) => {
      if (!isMounted) return;
      setRuntime({
        prospects: prospectsModule.default || [],
        currentMeasurements: currentMeasurementsModule.default || {},
        enrichBoardProspects: modelModule.enrichBoardProspects,
        enrichProspectDetail: modelModule.enrichProspectDetail,
        createEmptyStructuredNote: modelModule.createEmptyStructuredNote,
        loaded: true,
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!runtime.loaded || detailRuntime.loaded || detailRuntime.loading) return;

    const needsDetailData = !!activeId || compareIds.length > 0 || appView === 'compare';
    if (!needsDetailData) return;

    let isMounted = true;
    setDetailRuntime((current) => ({ ...current, loading: true }));

    Promise.all([
      import('./data/profileStats.json'),
      import('./data/authoredProfilesTier3.json'),
      import('./data/authoredProfilesTier4'),
      import('./data/authoredProfilesTier5'),
    ]).then(([
      profileStatsModule,
      authoredProfilesTier3Module,
      authoredProfilesTier4Module,
      authoredProfilesTier5Module,
    ]) => {
      if (!isMounted) return;
      setDetailRuntime({
        profileStats: profileStatsModule.default || {},
        authoredProfiles: {
          ...(authoredProfilesTier3Module.default || {}),
          ...(authoredProfilesTier4Module.default || {}),
          ...(authoredProfilesTier5Module.default || {}),
        },
        loaded: true,
        loading: false,
      });
    });

    return () => {
      isMounted = false;
    };
  }, [activeId, appView, compareIds.length, detailRuntime.loaded, detailRuntime.loading, runtime.loaded]);

  useEffect(() => {
    if (!runtime.loaded || runtime.prospects.length === 0) return;

    setActiveId((current) => current || runtime.prospects[0]?.id || null);
    setMyBoard((current) => {
      const validIds = new Set(runtime.prospects.map((prospect) => prospect.id));
      const persisted = current.filter((id) => validIds.has(id));
      const missing = runtime.prospects.map((prospect) => prospect.id).filter((id) => !persisted.includes(id));
      return [...persisted, ...missing];
    });
  }, [runtime.loaded, runtime.prospects, setMyBoard]);

  const enrichedProspects = useMemo(
    () => (runtime.enrichBoardProspects
      ? runtime.enrichBoardProspects(runtime.prospects, {
        currentMeasurements: runtime.currentMeasurements,
      })
      : []
    ).map((prospect) => ({
      ...prospect,
      tier: customTiers[prospect.id] || prospect.baseTier,
      tags: customTags[prospect.id] || prospect.tags || [],
    })),
    [
      customTags,
      customTiers,
      runtime.currentMeasurements,
      runtime.enrichBoardProspects,
      runtime.prospects,
    ],
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

  const activeProspectBase = prospectsById[activeId] || filteredProspects[0] || null;
  const activeProspect = useMemo(
    () => (runtime.enrichProspectDetail && activeProspectBase && detailRuntime.loaded
      ? runtime.enrichProspectDetail(activeProspectBase, {
        currentMeasurements: runtime.currentMeasurements,
        profileStats: detailRuntime.profileStats,
        authoredProfiles: detailRuntime.authoredProfiles,
      })
      : activeProspectBase),
    [
      activeProspectBase,
      detailRuntime.authoredProfiles,
      detailRuntime.loaded,
      detailRuntime.profileStats,
      runtime.currentMeasurements,
      runtime.enrichProspectDetail,
    ],
  );
  const activeProspectNotes = notes.filter((note) => note.playerId === activeProspect?.id);
  const compareProspects = useMemo(
    () => compareIds
      .map((id) => prospectsById[id])
      .filter(Boolean)
      .map((prospect) => (
        runtime.enrichProspectDetail && detailRuntime.loaded
          ? runtime.enrichProspectDetail(prospect, {
            currentMeasurements: runtime.currentMeasurements,
            profileStats: detailRuntime.profileStats,
            authoredProfiles: detailRuntime.authoredProfiles,
          })
          : prospect
      )),
    [
      compareIds,
      detailRuntime.authoredProfiles,
      detailRuntime.loaded,
      detailRuntime.profileStats,
      prospectsById,
      runtime.currentMeasurements,
      runtime.enrichProspectDetail,
    ],
  );
  const watchlistProspects = watchlist.map((id) => prospectsById[id]).filter(Boolean);
  const myBoardProspects = myBoard.map((id) => prospectsById[id]).filter(Boolean);
  const selectedMode = VIEW_MODES.find((mode) => mode.id === viewMode);
  const internationalCount = enrichedProspects.filter((prospect) => /^\d{4}$/.test(prospect.classYear)).length;
  const notesCount = notes.length;
  const taggedCount = Object.values(customTags).filter((tags) => tags.length > 0).length;
  const customTierCount = Object.keys(customTiers).length;
  const isFirstRun = watchlist.length === 0 && notes.length === 0 && savedViews.length === 0 && savedBoards.length === 0;
  const advancedFiltersActive = school !== 'ALL' || leagueType !== 'ALL' || bucket !== 'ALL' || tierFilter !== 'ALL' || tagFilter !== 'ALL' || watchlistOnly;

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
      const next = current.length >= 3
        ? [...current.slice(1), id]
        : [...current, id];
      if (next.length >= 2) {
        setAppView('compare');
      }
      setActiveId(id);
      return next;
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
    if (!playerId || !runtime.createEmptyStructuredNote) return;
    const note = runtime.createEmptyStructuredNote(playerId);
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

  const applyQuickDiscovery = (mode) => {
    clearFilters();

    switch (mode) {
      case 'top':
        setTierFilter('Tier 1');
        setSortBy('rank');
        setViewMode('peek');
        break;
      case 'guards':
        setPosition('PG');
        setSortBy('overall');
        break;
      case 'wings':
        setQuery('wing');
        setSortBy('overall');
        break;
      case 'bigs':
        setQuery('big');
        setSortBy('defense');
        break;
      case 'upside':
        setTagFilter('upside');
        setViewMode('peruse');
        break;
      case 'international':
        setLeagueType('International Pro');
        setSortBy('overall');
        break;
      default:
        break;
    }
  };

  if (!runtime.loaded) {
    return (
      <div className="page-shell">
        <header className="guide-header panel">
          <div className="guide-brand">
            <p className="eyebrow">2026</p>
            <h1>Prospera Draft HQ</h1>
            <p className="guide-copy">Loading board, profiles, and historical context.</p>
          </div>
        </header>
        <main className="guide-layout">
          <section className="left-column">
            <section className="panel">
              <p className="empty-state">Loading scouting workspace…</p>
            </section>
          </section>
          <aside className="detail panel">
            <div className="detail-empty">
              <p className="eyebrow">Player Detail</p>
              <h3>Preparing profiles</h3>
              <p>Prospera is loading the board and model context.</p>
            </div>
          </aside>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell">
      {/* Implementation note: Tier 1 surfaces are split into modular workspaces so
          profiles, board building, compare, and notes can evolve independently. */}
      <header className="guide-header panel">
        <div className="guide-brand">
          <p className="eyebrow">2026</p>
          <h1>Prospera Draft HQ</h1>
          <p className="guide-copy">
            Scouting, simplified. Explore the board, compare prospects, and organize your evaluation
            without losing the thread of what actually matters.
          </p>
        </div>
        <div className="guide-meta">
          <span className="pill pill-live">Tier 1</span>
          <span className="topbar-note">Profiles, board builder, compare, notes, and historical context.</span>
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
          <section className="board-command panel">
            <div className="board-command-shell">
              <div className="board-command-main">
                <div className="hero-copy">
                  <p className="eyebrow">Draft Workspace</p>
                  <h2>One place to scan, compare, and decide.</h2>
                  <p>
                    Prospera is built to move from first look to real evaluation fast. Open the board,
                    narrow the field, compare tradeoffs, and keep context attached to every player.
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
                    <span className="stat-label">Board</span>
                    <strong>{enrichedProspects.length}</strong>
                    <span className="stat-detail">Prospects with structured profile layers</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">Saved Players</span>
                    <strong>{watchlist.length}</strong>
                    <span className="stat-detail">Shortlist built directly from the board</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">Compare Queue</span>
                    <strong>{compareIds.length}</strong>
                    <span className="stat-detail">Prospects ready for side-by-side evaluation</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">Tagged</span>
                    <strong>{taggedCount}</strong>
                    <span className="stat-detail">Workflow labels attached across the board</span>
                  </article>
                  <article className="stat-card">
                    <span className="stat-label">International</span>
                    <strong>{internationalCount}</strong>
                    <span className="stat-detail">Prospects outside the standard NCAA pipeline</span>
                  </article>
                </div>
              </div>

              <div className="board-command-side">
                <div className="section-head section-head-compact">
                  <div>
                    <p className="eyebrow">Start Exploring</p>
                    <h3>Open the board with one click</h3>
                  </div>
                </div>
                <div className="discovery-grid">
                  <button type="button" className="discovery-card" onClick={() => applyQuickDiscovery('top')}>
                    <strong>Top of board</strong>
                    <span>Start with the clearest top-end names and the first decision tier.</span>
                  </button>
                  <button type="button" className="discovery-card" onClick={() => applyQuickDiscovery('guards')}>
                    <strong>Lead guards</strong>
                    <span>Jump straight into initiators, creators, and shot-driving profiles.</span>
                  </button>
                  <button type="button" className="discovery-card" onClick={() => applyQuickDiscovery('wings')}>
                    <strong>Wings</strong>
                    <span>Scan the strongest scalable wing archetypes and lineup fits.</span>
                  </button>
                  <button type="button" className="discovery-card" onClick={() => applyQuickDiscovery('bigs')}>
                    <strong>Bigs</strong>
                    <span>Focus on rim pressure, size, and defensive translation.</span>
                  </button>
                  <button type="button" className="discovery-card" onClick={() => applyQuickDiscovery('international')}>
                    <strong>International</strong>
                    <span>See global prospects and non-NCAA development paths quickly.</span>
                  </button>
                  <button type="button" className="discovery-card" onClick={() => applyQuickDiscovery('upside')}>
                    <strong>Upside swings</strong>
                    <span>Filter toward longer-term bets and volatile ceiling outcomes.</span>
                  </button>
                </div>

                {isFirstRun && (
                  <div className="quick-start-inline">
                    <article className="quick-start-card">
                      <strong>Scan the board</strong>
                      <p>Use `Summary` first, then save names that survive the first pass.</p>
                    </article>
                    <article className="quick-start-card">
                      <strong>Compare before ranking</strong>
                      <p>Queue two or three players before moving them into `My Board`.</p>
                    </article>
                  </div>
                )}
              </div>
            </div>

            <div className="controls board-controls">
              <div className="control-block search-block">
              <label htmlFor="search">Search</label>
              <input
                id="search"
                type="search"
                placeholder="Search player, school, archetype, or role"
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
              <label htmlFor="sort-filter">Sort</label>
              <select id="sort-filter" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="rank">Rank</option>
                <option value="overall">Overall Score</option>
                <option value="tier">Tier</option>
                <option value="age">Age</option>
                <option value="position">Position</option>
                <option value="offense">Offense</option>
                <option value="defense">Defense</option>
                <option value="manual">Custom Order</option>
                <option value="movement">Movement</option>
              </select>
            </div>
            <div className="control-block">
              <label htmlFor="mode-filter">View</label>
              <select id="mode-filter" value={viewMode} onChange={(event) => setViewMode(event.target.value)}>
                {VIEW_MODES.map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}
              </select>
            </div>
            <div className="control-block controls-toggle-block">
              <label>More</label>
              <button
                type="button"
                className={`action-button controls-toggle${showAdvancedFilters ? ' is-active' : ''}`}
                onClick={() => setShowAdvancedFilters((current) => !current)}
              >
                {showAdvancedFilters ? 'Hide advanced' : advancedFiltersActive ? 'Advanced filters active' : 'Show advanced'}
              </button>
              </div>

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

              {showAdvancedFilters && (
                <>
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
                    <label>Saved Players</label>
                    <button
                      type="button"
                      className={`action-button controls-toggle${watchlistOnly ? ' is-active' : ''}`}
                      onClick={() => setWatchlistOnly((current) => !current)}
                    >
                      {watchlistOnly ? 'Showing saved only' : 'Show saved only'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          {appView === 'big-board' && (
            <section className="board panel">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Big Board</p>
                  <h3>{filteredProspects.length} prospects shown</h3>
                </div>
                <p className="section-meta">{sortBy === 'manual' ? 'Custom order active' : `Sorted by ${sortBy}`}</p>
              </div>

              <div className="board-summary board-summary-subtle">
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
                    onToggleWatchlist={toggleWatchlist}
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
              onToggleWatchlist={toggleWatchlist}
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
            <Suspense fallback={<section className="workspace-section panel"><p className="empty-state">Loading compare workspace…</p></section>}>
              <CompareEngine prospects={compareProspects} notesByPlayer={notesByPlayer} onOpenHistorical={openHistorical} />
            </Suspense>
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
            <Suspense fallback={<section className="workspace-section panel"><p className="empty-state">Loading historical workspace…</p></section>}>
              <HistoricalMatrixLite
                selectedHistoricalId={selectedHistoricalId}
                onClearSelectedHistorical={() => setSelectedHistoricalId(null)}
              />
            </Suspense>
          )}
          
          <section className="profile-stage panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">Player Detail</p>
                <h3>{activeProspect ? `${activeProspect.name} dossier` : 'Select a prospect'}</h3>
              </div>
              {activeProspect && (
                <p className="section-meta">Selected from the board for full-profile review, not a side preview rail.</p>
              )}
            </div>

            <Suspense fallback={<div className="detail-empty"><p className="eyebrow">Player Detail</p><h3>Loading profile</h3><p>Preparing scouting context.</p></div>}>
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
            </Suspense>
          </section>

          <section className="workflow panel workflow-stage">
            <div className="section-head">
              <div>
                <p className="eyebrow">Workflow</p>
                <h3>Shortlist and compare</h3>
              </div>
            </div>

            <div className="workflow-stage-grid">
              <div className="workflow-column">
                <div className="workflow-head">
                  <h4>Watchlist</h4>
                </div>
                <div className="chip-list">
                  {watchlistProspects.length === 0 ? (
                    <p className="empty-state">Save players here as your shortlist takes shape.</p>
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
                  <div className="detail-actions">
                    {compareProspects.length >= 2 && (
                      <button type="button" className="inline-action is-active" onClick={() => setAppView('compare')}>
                        Open Compare
                      </button>
                    )}
                    <button type="button" className="text-button" onClick={() => setCompareIds([])}>Clear</button>
                  </div>
                </div>
                <div className="compare-list">
                  {compareProspects.length === 0 ? (
                    <p className="empty-state">Queue players here to compare them side by side.</p>
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
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;
