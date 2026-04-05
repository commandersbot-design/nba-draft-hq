import { ProspectRankCard } from './ProspectRankCard';

export function MyBoardBuilder({
  prospects,
  customBoard,
  boardView,
  cardSettings,
  watchlist,
  activeId,
  onSelect,
  onToggleCompare,
  onQuickNote,
  onSetBoardView,
  onToggleCardSetting,
  onReorder,
}) {
  const orderedProspects = customBoard
    .map((id) => prospects.find((prospect) => prospect.id === id))
    .filter(Boolean);

  const move = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedProspects.length) return;
    onReorder(index, nextIndex);
  };

  return (
    <section className="workspace-section panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">My Board</p>
          <h3>Manual board builder</h3>
        </div>
        <div className="mode-tabs">
          <button type="button" className={`mode-tab${boardView === 'card' ? ' is-active' : ''}`} onClick={() => onSetBoardView('card')}>Card View</button>
          <button type="button" className={`mode-tab${boardView === 'list' ? ' is-active' : ''}`} onClick={() => onSetBoardView('list')}>Compact View</button>
        </div>
      </div>

      <div className="detail-section">
        <div className="detail-section-head">
          <h4>Board Card Settings</h4>
        </div>
        <div className="tag-grid">
          {Object.entries(cardSettings).map(([key, enabled]) => (
            <button
              key={key}
              type="button"
              className={`tag-button${enabled ? ' is-active' : ''}`}
              onClick={() => onToggleCardSetting(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className={`my-board-list view-${boardView}`}>
        {orderedProspects.map((prospect, index) => (
          <div
            key={prospect.id}
            className="my-board-row"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', String(index));
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const fromIndex = Number(event.dataTransfer.getData('text/plain'));
              if (!Number.isNaN(fromIndex)) {
                onReorder(fromIndex, index);
              }
            }}
          >
            <div className="my-board-handle">
              <button type="button" className="text-button" onClick={() => move(index, -1)}>Up</button>
              <button type="button" className="text-button" onClick={() => move(index, 1)}>Down</button>
            </div>
            <ProspectRankCard
              prospect={prospect}
              isActive={prospect.id === activeId}
              viewMode="deep-dive"
              isWatched={watchlist.includes(prospect.id)}
              cardSettings={cardSettings}
              onSelect={onSelect}
              onToggleCompare={onToggleCompare}
              onQuickNote={onQuickNote}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
