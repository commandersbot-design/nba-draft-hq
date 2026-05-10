import React from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

/**
 * ScoutTab — pure-qualitative personal scouting view.
 *
 * Floor → Ceiling 5-tier framework: FL / LE / MID / HET / C.
 * Each player gets:
 *   - A current tier rating (where you peg them today)
 *   - Per-tier written notes (what does this player LOOK like at this level?)
 *   - An overall ceiling call (one-liner)
 *   - A personal scout summary (paragraph, multi-line)
 *
 * Zero auto-computed values. Zero third-party scores. Pure scout writing,
 * persisted per-prospect in localStorage.
 */

const T = {
  bg:           "var(--prospera-bg)",
  surface:      "var(--prospera-card)",
  surface2:     "var(--prospera-surface-2)",
  border:       "var(--prospera-border)",
  borderSoft:   "var(--prospera-border-soft)",
  text:         "var(--prospera-text)",
  textDim:      "var(--prospera-text-dim)",
  textMute:     "var(--prospera-text-mute)",
  cyan:         "var(--prospera-cyan)",
  signal:       "var(--prospera-signal)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

// Tier definitions in order Floor → Ceiling.
const TIERS = [
  { key: "floor",   abbr: "FL",  label: "Floor",     hint: "Worst-case outcome — what they look like if everything goes wrong" },
  { key: "lowEnd",  abbr: "LE",  label: "Low End",   hint: "Below-median outcome — modest contributor, tools without translation" },
  { key: "middle",  abbr: "MID", label: "Middle",    hint: "Median outcome — the projection that feels most likely" },
  { key: "highEnd", abbr: "HE",  label: "High End",  hint: "Above-median outcome — bet pays off, role expands" },
  { key: "ceiling", abbr: "C",   label: "Ceiling",   hint: "Best-case outcome — everything translates, peak version" },
];

// Tier color rhythm — same vocabulary as the rest of the app.
// Floor muted → Ceiling signal-orange, with a clean gradient through.
const TIER_COLOR = {
  floor:   "var(--prospera-text-mute)",
  lowEnd:  "var(--prospera-text-dim)",
  middle:  "var(--prospera-cyan)",
  highEnd: "#F59E0B",
  ceiling: "var(--prospera-signal)",
};

// Default empty record for a prospect.
function emptyScoutView() {
  return {
    tierRating: "",       // "FL" | "LE" | "MID" | "HET" | "C" or "" (unrated)
    tierNotes: {
      floor: "",
      lowEnd: "",
      middle: "",
      highEnd: "",
      ceiling: "",
    },
    overallCeilingCall: "",
    summary: "",
    lastUpdated: null,
  };
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

// =============================================================================
// PIECES
// =============================================================================

function TierPill({ abbr, isActive, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...mono,
        fontSize: 11,
        letterSpacing: "0.16em",
        padding: "5px 11px",
        color: isActive ? T.bg : color,
        background: isActive ? color : "transparent",
        border: `1px solid ${color}`,
        cursor: "pointer",
        fontWeight: isActive ? 700 : 500,
        textTransform: "uppercase",
        minWidth: 48,
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = `color-mix(in srgb, ${color} 12%, transparent)`; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      {abbr}
    </button>
  );
}

function TextArea({ value, onChange, onBlur, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "rgba(10, 15, 28, 0.7)",
        border: `1px solid ${T.border}`,
        color: T.text,
        padding: "10px 12px",
        fontSize: 13,
        lineHeight: 1.55,
        fontFamily: "inherit",
        resize: "vertical",
        outline: "none",
        boxSizing: "border-box",
      }}
      onFocus={(e) => { e.target.style.borderColor = T.cyan; }}
    />
  );
}

function SingleLineInput({ value, onChange, onBlur, placeholder }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "rgba(10, 15, 28, 0.7)",
        border: `1px solid ${T.border}`,
        color: T.text,
        padding: "10px 12px",
        fontSize: 14,
        fontFamily: "inherit",
        outline: "none",
        boxSizing: "border-box",
      }}
      onFocus={(e) => { e.target.style.borderColor = T.cyan; }}
    />
  );
}

// =============================================================================
// MAIN
// =============================================================================

export default function ScoutTab({ p }) {
  const [allViews, setAllViews] = useLocalStorageState("prospera.terminal.scout-views", {});
  const view = allViews[p.id] || emptyScoutView();

  // Update helper — patches the prospect's record + bumps lastUpdated.
  const update = React.useCallback((patch) => {
    setAllViews((prev) => {
      const existing = prev[p.id] || emptyScoutView();
      return {
        ...prev,
        [p.id]: {
          ...existing,
          ...patch,
          lastUpdated: new Date().toISOString(),
        },
      };
    });
  }, [setAllViews, p.id]);

  const updateTierNote = React.useCallback((tierKey, value) => {
    setAllViews((prev) => {
      const existing = prev[p.id] || emptyScoutView();
      return {
        ...prev,
        [p.id]: {
          ...existing,
          tierNotes: { ...existing.tierNotes, [tierKey]: value },
          lastUpdated: new Date().toISOString(),
        },
      };
    });
  }, [setAllViews, p.id]);

  const setTierRating = (abbr) => {
    update({ tierRating: view.tierRating === abbr ? "" : abbr });
  };

  const ratingTierMeta = TIERS.find((t) => t.abbr === view.tierRating);
  const ratingColor = ratingTierMeta ? TIER_COLOR[ratingTierMeta.key] : T.textMute;

  return (
    <div style={{ padding: "0 4px", maxWidth: 980 }}>
      {/* HEADER */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.signal, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
          Personal Scout View · 100% Qualitative
        </div>
        <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, marginBottom: 14 }}>
          Floor → Ceiling framework. No auto-computed grades, no stats, no third-party scores.
          Just your written reads. Auto-saves on blur.
        </div>

        {/* TIER RATING */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase" }}>
            Current Tier Call:
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {TIERS.map((t) => (
              <TierPill
                key={t.abbr}
                abbr={t.abbr}
                isActive={view.tierRating === t.abbr}
                color={TIER_COLOR[t.key]}
                onClick={() => setTierRating(t.abbr)}
              />
            ))}
          </div>
          {ratingTierMeta && (
            <span style={{ ...mono, fontSize: 11, color: ratingColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              → {ratingTierMeta.label}
            </span>
          )}
          {view.lastUpdated && (
            <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", marginLeft: "auto" }}>
              Last edit · {formatRelativeTime(view.lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* PER-TIER NOTES */}
      <div style={{ display: "grid", gap: 14, marginBottom: 26 }}>
        {TIERS.map((t) => {
          const color = TIER_COLOR[t.key];
          return (
            <div
              key={t.key}
              style={{
                background: T.surface,
                borderTop: `1px solid ${T.borderSoft}`,
                borderRight: `1px solid ${T.borderSoft}`,
                borderBottom: `1px solid ${T.borderSoft}`,
                borderLeft: `4px solid ${color}`,
                padding: "14px 16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{
                  ...mono, fontSize: 10, letterSpacing: "0.16em",
                  color, textTransform: "uppercase", fontWeight: 700,
                  border: `1px solid ${color}`,
                  padding: "2px 8px",
                  background: `color-mix(in srgb, ${color} 12%, transparent)`,
                }}>
                  {t.abbr} · {t.label}
                </span>
                <span style={{ fontSize: 12, color: T.textDim, fontStyle: "italic" }}>{t.hint}</span>
              </div>
              <TextArea
                value={view.tierNotes?.[t.key]}
                onChange={(v) => updateTierNote(t.key, v)}
                placeholder={`What does ${p.name} look like at the ${t.label.toLowerCase()}? Write what you see — role, fit, weaknesses that show up here, comparable players at this level...`}
                rows={3}
              />
            </div>
          );
        })}
      </div>

      {/* CEILING CALL */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase", marginBottom: 6 }}>
          Overall Ceiling Call
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, fontStyle: "italic" }}>
          One-liner — your headline read on what this player can be at peak.
        </div>
        <SingleLineInput
          value={view.overallCeilingCall}
          onChange={(v) => update({ overallCeilingCall: v })}
          placeholder={`e.g., "Two-way wing with All-Star creation upside" or "Backup big with switch-defender utility"`}
        />
      </div>

      {/* PERSONAL SCOUT SUMMARY */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase", marginBottom: 6 }}>
          Personal Scout Summary
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginBottom: 8, fontStyle: "italic" }}>
          Free-form. The full scout writeup — what makes this player interesting, the bet you're making, what you'd watch for.
        </div>
        <TextArea
          value={view.summary}
          onChange={(v) => update({ summary: v })}
          placeholder={`Open with what stands out. Describe the bet — what has to translate, what the worry is, who they remind you of stylistically. Close with the watch-item that would move you up or down on them...`}
          rows={10}
        />
      </div>

      {/* DELETE / RESET */}
      {(view.tierRating || view.summary || view.overallCeilingCall ||
        Object.values(view.tierNotes || {}).some((s) => s && s.trim())) && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, opacity: 0.7 }}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Clear all scout notes for ${p.name}? This wipes every tier note + ceiling call + summary. Cannot be undone.`)) {
                setAllViews((prev) => {
                  const next = { ...prev };
                  delete next[p.id];
                  return next;
                });
              }
            }}
            style={{
              ...mono, fontSize: 9, letterSpacing: "0.14em",
              color: T.textMute, background: "transparent",
              border: `1px dashed ${T.border}`, padding: "4px 10px",
              cursor: "pointer", textTransform: "uppercase",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--prospera-danger)"; e.currentTarget.style.borderColor = "var(--prospera-danger)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textMute; e.currentTarget.style.borderColor = T.border; }}
          >
            Clear all notes
          </button>
        </div>
      )}
    </div>
  );
}
