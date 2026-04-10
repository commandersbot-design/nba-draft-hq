import { TAG_OPTIONS } from '../lib/constants';

export function NotesWorkspace({
  notes,
  prospectsById,
  selectedPlayerId,
  onSelectPlayer,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onExportJson,
  onExportCsv,
}) {
  return (
    <section className="workspace-section panel">
      <div className="section-head">
        <div>
          <p className="eyebrow">Notes Workspace</p>
          <h3>Structured evaluator notes</h3>
        </div>
        <div className="detail-actions">
          <button type="button" className="inline-action" onClick={onExportCsv}>
            Export CSV
          </button>
          <button type="button" className="inline-action" onClick={onExportJson}>
            Export JSON
          </button>
          <button type="button" className="action-button" onClick={() => onCreateNote(selectedPlayerId)}>
            New note
          </button>
        </div>
      </div>

      <div className="notes-layout">
        <div className="note-list-panel">
          {notes.length === 0 ? (
            <p className="empty-state">No notes yet. Create one from a profile or here.</p>
          ) : (
            notes.map((note) => {
              const prospect = prospectsById[note.playerId];
              return (
                <button key={note.id} type="button" className={`note-list-item${selectedPlayerId === note.playerId ? ' is-active' : ''}`} onClick={() => onSelectPlayer(note.playerId)}>
                  <strong>{note.quickSummary || 'Untitled note'}</strong>
                  <span>{prospect?.name || 'Unknown prospect'}</span>
                  <span>{new Date(note.updatedAt).toLocaleString()}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="note-editor-stack">
          {notes.filter((note) => note.playerId === selectedPlayerId).map((note) => (
            <article key={note.id} className="note-editor-card">
              <div className="detail-section-head">
                <h4>{prospectsById[note.playerId]?.name || 'Note'}</h4>
                <button type="button" className="text-button" onClick={() => onDeleteNote(note.id)}>Delete</button>
              </div>

              <div className="note-grid">
                <input className="notes-input" value={note.quickSummary} placeholder="Quick summary" onChange={(event) => onUpdateNote(note.id, 'quickSummary', event.target.value)} />
                <textarea className="notes-input" value={note.strengths} placeholder="Strengths" onChange={(event) => onUpdateNote(note.id, 'strengths', event.target.value)} />
                <textarea className="notes-input" value={note.weaknesses} placeholder="Weaknesses" onChange={(event) => onUpdateNote(note.id, 'weaknesses', event.target.value)} />
                <textarea className="notes-input" value={note.projection} placeholder="Projection" onChange={(event) => onUpdateNote(note.id, 'projection', event.target.value)} />
                <textarea className="notes-input" value={note.context} placeholder="Context / live eval" onChange={(event) => onUpdateNote(note.id, 'context', event.target.value)} />
                <textarea className="notes-input" value={note.freeform} placeholder="Freeform note" onChange={(event) => onUpdateNote(note.id, 'freeform', event.target.value)} />
              </div>

              <div className="tag-grid">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-button${note.tags.includes(tag) ? ' is-active' : ''}`}
                    onClick={() => {
                      const nextTags = note.tags.includes(tag)
                        ? note.tags.filter((entry) => entry !== tag)
                        : [...note.tags, tag];
                      onUpdateNote(note.id, 'tags', nextTags);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
