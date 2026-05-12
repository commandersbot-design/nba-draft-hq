import React from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { getTagLibrary, getTagsByLayer, groupSkillsByCategory, getConflictsFor, getTagById, sortTagIds } from "../lib/tags/library";
import { TagBadge } from "./TagBadge";

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

/**
 * Hook: per-player tag assignments backed by localStorage.
 * Returns { tagIds, addTag, removeTag, toggleTag, clearTags, conflicts }
 */
export function usePlayerTags(prospectId) {
  const [allTags, setAllTags] = useLocalStorageState("prospera.terminal.player-tags", {});
  const record = allTags[prospectId];
  const tagIds = React.useMemo(() => sortTagIds(record?.tagIds || []), [record?.tagIds]);

  const setTagIds = React.useCallback((next) => {
    setAllTags((prev) => ({
      ...prev,
      [prospectId]: {
        tagIds: next,
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, [setAllTags, prospectId]);

  const toggleTag = React.useCallback((tagId) => {
    setAllTags((prev) => {
      const existing = prev[prospectId]?.tagIds || [];
      const has = existing.includes(tagId);
      let next;
      if (has) {
        next = existing.filter((id) => id !== tagId);
      } else {
        // Auto-remove any conflicting tags first
        const conflicting = getConflictsFor(tagId, existing);
        next = [...existing.filter((id) => !conflicting.includes(id)), tagId];
      }
      return {
        ...prev,
        [prospectId]: {
          tagIds: next,
          lastUpdated: new Date().toISOString(),
        },
      };
    });
  }, [setAllTags, prospectId]);

  const removeTag = React.useCallback((tagId) => {
    setAllTags((prev) => {
      const existing = prev[prospectId]?.tagIds || [];
      return {
        ...prev,
        [prospectId]: {
          tagIds: existing.filter((id) => id !== tagId),
          lastUpdated: new Date().toISOString(),
        },
      };
    });
  }, [setAllTags, prospectId]);

  const clearTags = React.useCallback(() => {
    setAllTags((prev) => {
      const next = { ...prev };
      delete next[prospectId];
      return next;
    });
  }, [setAllTags, prospectId]);

  return { tagIds, setTagIds, toggleTag, removeTag, clearTags };
}

/**
 * Checklist editor for assigning tags to a single prospect.
 * Tags grouped by layer (Skills → Outlook → Concerns) and sub-category within Skills.
 * Selected tags show as filled pills; click to toggle on/off.
 * Conflicting tag auto-removes its conflict pair on activation.
 */
export default function TagEditor({ prospectId, prospectName, compact = false }) {
  const { tagIds, toggleTag, clearTags } = usePlayerTags(prospectId);
  const selected = React.useMemo(() => new Set(tagIds), [tagIds]);
  const skillGroups = React.useMemo(() => groupSkillsByCategory(), []);
  const outlookTags = React.useMemo(() => getTagsByLayer("outlook"), []);
  const concernTags = React.useMemo(() => getTagsByLayer("concerns"), []);

  const totalSelected = tagIds.length;
  const skillCount = tagIds.filter((id) => getTagById(id)?.layer === "skills").length;
  const outlookCount = tagIds.filter((id) => getTagById(id)?.layer === "outlook").length;
  const concernCount = tagIds.filter((id) => getTagById(id)?.layer === "concerns").length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.signal, textTransform: "uppercase", fontWeight: 700 }}>
            Player Tags · Personal Library
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
            Manually assign. Skills (cyan) · Outlook (gold, restrictive) · Concerns (red). Click to toggle. Conflicting tags auto-swap.
          </div>
        </div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase", textAlign: "right" }}>
          <div>{totalSelected} active</div>
          <div style={{ color: T.textDim, marginTop: 2 }}>
            {skillCount} skill · {outlookCount} outlook · {concernCount} concern
          </div>
        </div>
      </div>

      {/* Current selection preview */}
      {totalSelected > 0 && (
        <div style={{ marginBottom: 18, padding: "10px 12px", background: T.surface, borderLeft: `3px solid ${T.cyan}`, borderTop: `1px solid ${T.borderSoft}`, borderRight: `1px solid ${T.borderSoft}`, borderBottom: `1px solid ${T.borderSoft}` }}>
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em", marginBottom: 8, textTransform: "uppercase" }}>
            Currently assigned
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tagIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleTag(id)}
                title="Click to remove"
                style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
              >
                <TagBadge tagId={id} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SKILLS — grouped by category */}
      <Section title="Skills" tone="neutral">
        {skillGroups.map((group) => (
          <div key={group.category} style={{ marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 6 }}>
              {group.label}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {group.tags.map((tag) => (
                <ToggleTagButton
                  key={tag.id}
                  tag={tag}
                  isActive={selected.has(tag.id)}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* OUTLOOK — gold layer with usage guidance */}
      <Section title="Outlook · Gold layer" tone="gold" hint="Restrictive. Single player should rarely wear more than 2-3 of these.">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {outlookTags.map((tag) => (
            <ToggleTagButton
              key={tag.id}
              tag={tag}
              isActive={selected.has(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </div>
      </Section>

      {/* CONCERNS */}
      <Section title="Concerns" tone="risk">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {concernTags.map((tag) => (
            <ToggleTagButton
              key={tag.id}
              tag={tag}
              isActive={selected.has(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </div>
      </Section>

      {/* Clear all */}
      {totalSelected > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6, opacity: 0.7 }}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Clear all ${totalSelected} tag${totalSelected === 1 ? "" : "s"} for ${prospectName || "this prospect"}?`)) {
                clearTags();
              }
            }}
            style={{
              ...mono, fontSize: 9, letterSpacing: "0.14em",
              color: T.textMute, background: "transparent",
              border: `1px dashed ${T.border}`, padding: "4px 10px",
              cursor: "pointer", textTransform: "uppercase",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.danger; e.currentTarget.style.borderColor = T.danger; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMute; e.currentTarget.style.borderColor = T.border; }}
          >
            Clear all tags
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, tone = "neutral", hint, children }) {
  const accent = tone === "gold" ? T.signal : tone === "risk" ? T.danger : T.cyan;
  return (
    <div style={{ marginBottom: 22, borderLeft: `3px solid ${accent}`, paddingLeft: 12 }}>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.16em", color: accent, textTransform: "uppercase", fontWeight: 700, marginBottom: hint ? 4 : 10 }}>
        {title}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: T.textDim, fontStyle: "italic", marginBottom: 10 }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}

function ToggleTagButton({ tag, isActive, onClick }) {
  const layerColor =
    tag.layer === "outlook" ? T.signal :
    tag.layer === "concerns" ? T.danger :
    T.cyan;
  return (
    <button
      type="button"
      onClick={onClick}
      title={tag.usageGuide ? `${tag.description}\n\nUsage: ${tag.usageGuide}` : tag.description}
      style={{
        ...mono,
        fontSize: 10,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: isActive ? "var(--prospera-bg)" : layerColor,
        background: isActive ? layerColor : "transparent",
        border: `1px solid ${layerColor}`,
        padding: "4px 9px",
        cursor: "pointer",
        fontWeight: isActive ? 700 : 500,
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = `color-mix(in srgb, ${layerColor} 12%, transparent)`; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {tag.name}
    </button>
  );
}
