import React from "react";
import { createPortal } from "react-dom";
import { usePlayerTags } from "./TagEditor";
import { TagBadge } from "./TagBadge";
import { groupSkillsByCategory, getTagsByLayer, getTagById } from "../lib/tags/library";

/**
 * Inline tag editor for Scout Desk rows.
 *
 * Trigger button: shows "+ TAG" when empty or "+ N" when tags exist (where N
 * is the assigned count). Click → popover opens with all 30 tags grouped by
 * layer/category, each clickable to toggle. Reads/writes the same localStorage
 * key as the full profile editor so changes are perfectly bidirectional.
 *
 * Popover positioning: anchored to the right edge of the trigger button so it
 * floats over neighboring rows rather than pushing them. Max-height with
 * internal scroll. Conflict pairs (Lather ↔ Tuxedo Scorer) auto-swap.
 *
 * Click outside to close.
 */

const T = {
  surface:    "var(--prospera-card)",
  surface2:   "var(--prospera-surface-2)",
  border:     "var(--prospera-border)",
  borderSoft: "var(--prospera-border-soft)",
  text:       "var(--prospera-text)",
  textDim:    "var(--prospera-text-dim)",
  textMute:   "var(--prospera-text-mute)",
  cyan:       "var(--prospera-cyan)",
  signal:     "var(--prospera-signal)",
  danger:     "var(--prospera-danger)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

function ToggleChip({ tag, isActive, onClick }) {
  const layerColor =
    tag.layer === "outlook" ? T.signal :
    tag.layer === "concerns" ? T.danger :
    T.cyan;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={tag.usageGuide ? `${tag.description}\n\nUsage: ${tag.usageGuide}` : tag.description}
      style={{
        ...mono,
        fontSize: 9,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isActive ? "var(--prospera-bg)" : layerColor,
        background: isActive ? layerColor : "transparent",
        border: `1px solid ${layerColor}`,
        padding: "3px 7px",
        cursor: "pointer",
        fontWeight: isActive ? 700 : 500,
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = `color-mix(in srgb, ${layerColor} 12%, transparent)`; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {tag.name}
    </button>
  );
}

function PopoverContent({ prospectName, tagIds, toggleTag, selected }) {
  const skillGroups = React.useMemo(() => groupSkillsByCategory(), []);
  const outlookTags = React.useMemo(() => getTagsByLayer("outlook"), []);
  const concernTags = React.useMemo(() => getTagsByLayer("concerns"), []);

  return (
    <div style={{ padding: 12, maxHeight: 460, overflowY: "auto", width: 380 }}>
      <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em", marginBottom: 10, textTransform: "uppercase" }}>
        Edit tags · {prospectName || "Prospect"} · {tagIds.length} assigned
      </div>

      {/* Outlook (top, gold) */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...mono, fontSize: 9, color: T.signal, letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>
          Outlook
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {outlookTags.map((tag) => (
            <ToggleChip key={tag.id} tag={tag} isActive={selected.has(tag.id)} onClick={() => toggleTag(tag.id)} />
          ))}
        </div>
      </div>

      {/* Concerns */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ ...mono, fontSize: 9, color: T.danger, letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>
          Concerns
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {concernTags.map((tag) => (
            <ToggleChip key={tag.id} tag={tag} isActive={selected.has(tag.id)} onClick={() => toggleTag(tag.id)} />
          ))}
        </div>
      </div>

      {/* Skills (grouped) */}
      {skillGroups.map((group) => (
        <div key={group.category} style={{ marginBottom: 10 }}>
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em", fontWeight: 600, textTransform: "uppercase", marginBottom: 5 }}>
            {group.label}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {group.tags.map((tag) => (
              <ToggleChip key={tag.id} tag={tag} isActive={selected.has(tag.id)} onClick={() => toggleTag(tag.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InlineTagsPopover({ prospectId, prospectName }) {
  const { tagIds, toggleTag } = usePlayerTags(prospectId);
  const selected = React.useMemo(() => new Set(tagIds), [tagIds]);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef(null);
  const popoverRef = React.useRef(null);
  // Viewport-space coords where the popover should render. Recomputed on open
  // and on window scroll/resize so the popover tracks the trigger button.
  const [coords, setCoords] = React.useState(null);

  // Popover dimensions used for positioning math. Match the inline style on
  // PopoverContent (width: 380, max-height: 460 — see below).
  const POPOVER_WIDTH = 380;
  const POPOVER_MAX_HEIGHT = 460;
  const MARGIN = 6;

  const recomputeCoords = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // Anchor right edge of popover to right edge of trigger button (matches
    // the previous in-flow positioning). Pinned inside the viewport with a
    // small margin so it never gets clipped against a screen edge.
    let left = rect.right - POPOVER_WIDTH;
    if (left < MARGIN) left = MARGIN;
    if (left + POPOVER_WIDTH > window.innerWidth - MARGIN) {
      left = window.innerWidth - POPOVER_WIDTH - MARGIN;
    }
    // Drop below the trigger by default; flip above when there's not enough
    // room (avoids the popover spilling off the bottom of the viewport).
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    let top;
    if (spaceBelow >= POPOVER_MAX_HEIGHT + MARGIN || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
    } else {
      top = Math.max(MARGIN, rect.top - POPOVER_MAX_HEIGHT - 4);
    }
    setCoords({ top, left });
  }, []);

  // Open/close lifecycle: compute coords once on open, then update on scroll
  // (any scroll container) and resize. Close on outside click; close on
  // Escape.
  React.useEffect(() => {
    if (!open) return;
    recomputeCoords();
    const onDown = (e) => {
      const t = e.target;
      // Ignore clicks inside the trigger button OR inside the popover itself.
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      if (popoverRef.current && popoverRef.current.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    // `true` (capture phase) catches scroll on inner scroll containers too,
    // not just the document — critical since the trigger lives inside the
    // Scout Desk's overflow-auto wrapper.
    window.addEventListener("scroll", recomputeCoords, true);
    window.addEventListener("resize", recomputeCoords);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", recomputeCoords, true);
      window.removeEventListener("resize", recomputeCoords);
    };
  }, [open, recomputeCoords]);

  const count = tagIds.length;
  return (
    <span
      style={{ display: "inline-flex" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        title={count === 0 ? "Add tags to this prospect" : `${count} tag${count === 1 ? "" : "s"} assigned — click to edit`}
        style={{
          ...mono,
          fontSize: 9,
          letterSpacing: "0.1em",
          color: count > 0 ? T.cyan : T.textMute,
          background: count > 0 ? "color-mix(in srgb, var(--prospera-cyan) 10%, transparent)" : "transparent",
          border: `1px dashed ${count > 0 ? T.cyan : T.border}`,
          padding: "2px 7px",
          cursor: "pointer",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderStyle = "solid"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderStyle = "dashed"; }}
      >
        {count === 0 ? "+ TAG" : `+ EDIT`}
      </button>
      {open && coords && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            width: POPOVER_WIDTH,
            zIndex: 1000,
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
          // Stop click events here so they don't reach the document-level
          // listener and immediately close the popover.
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <PopoverContent
            prospectName={prospectName}
            tagIds={tagIds}
            toggleTag={toggleTag}
            selected={selected}
          />
        </div>,
        document.body,
      )}
    </span>
  );
}
