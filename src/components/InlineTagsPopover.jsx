import React from "react";
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
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const count = tagIds.length;
  return (
    <div
      ref={wrapperRef}
      style={{ position: "relative", display: "inline-flex" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
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
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            zIndex: 60,
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          <PopoverContent
            prospectName={prospectName}
            tagIds={tagIds}
            toggleTag={toggleTag}
            selected={selected}
          />
        </div>
      )}
    </div>
  );
}
