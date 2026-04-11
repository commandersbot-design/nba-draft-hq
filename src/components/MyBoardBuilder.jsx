import { useState } from 'react';
import { ProspectRankCard } from './ProspectRankCard';

export function MyBoardBuilder({
  prospects,
  customBoard,
  boardView,
  cardSettings,
  watchlist,
  activeId,
  onSelect,
  onToggleWatchlist,
  onToggleCompare,
  onQuickNote,
  onSetBoardView,
  onToggleCardSetting,
  onReorder,
  savedBoards,
  onSaveBoard,
  onLoadBoard,
  onDeleteBoard,
  onExportBoardJson,
  onExportBoardCsv,
}) {
  const [boardName, setBoardName] = useState('');
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
          <button type="button" className="inline-action" onClick={onExportBoardCsv}>Export CSV</button>
          <button type="button" className="inline-action" onClick={onExportBoardJson}>Export JSON</button>
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

      <div className="detail-section">
        <div className="detail-section-head">
          <h4>Saved Boards</h4>
        </div>
        <div className="saved-board-toolbar">
          <input
            className="notes-input compact-input"
            value={boardName}
            placeholder="Board name"
            onChange={(event) => setBoardName(event.target.value)}
          />
          <button
            type="button"
            className="action-button"
            onClick={() => {
              onSaveBoard(boardName);
              setBoardName('');
            }}
          >
            Save Board
          </button>
        </div>
        <div className="saved-board-list">
          {savedBoards.length === 0 ? (
            <p className="empty-state">No saved boards yet.</p>
          ) : (
            savedBoards.map((board) => (
              <div key={board.id} className="saved-board-card">
                <div>
                  <strong>{board.name}</strong>
                  <span>{new Date(board.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-actions">
                  <button type="button" className="inline-action" onClick={() => onLoadBoard(board.id)}>Load</button>
                  <button type="button" className="inline-action" onClick={() => onDeleteBoard(board.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
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
              onToggleWatchlist={onToggleWatchlist}
              onToggleCompare={onToggleCompare}
              onQuickNote={onQuickNote}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
