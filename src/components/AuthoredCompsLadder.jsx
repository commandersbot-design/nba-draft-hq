import React from "react";
import { getAuthoredCompLadder, getLadderRungs, tierColor, LADDER_LABELS } from "../grading/authoredComps";

const T = {
  bg:         "var(--prospera-bg)",
  surface:    "var(--prospera-card)",
  surface2:   "var(--prospera-surface-2)",
  border:     "var(--prospera-border)",
  borderSoft: "var(--prospera-border-soft)",
  text:       "var(--prospera-text)",
  textDim:    "var(--prospera-text-dim)",
  textMute:   "var(--prospera-text-mute)",
  cyan:       "var(--prospera-cyan)",
  signal:     "var(--prospera-signal)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

/**
 * Authored comp ladder — the user's eye-test outcome distribution from
 * Ceiling (best case) down to Floor (worst case). Rendered as a labeled
 * 5-rung visual with each rung tier-color-coded.
 *
 * Returns null when no authored ladder exists for the prospect — the
 * caller should show statistical comps as the primary view in that case.
 */
export default function AuthoredCompsLadder({ prospectName, compact = false }) {
  const ladder = React.useMemo(() => {
    if (!prospectName) return null;
    return getAuthoredCompLadder(prospectName);
  }, [prospectName]);

  if (!ladder) return null;

  // Render Ceiling at top, Floor at bottom (best → worst)
  const rungs = React.useMemo(() => {
    return getLadderRungs(ladder).slice().reverse();
  }, [ladder]);

  if (rungs.length === 0) return null;

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 16, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.signal, textTransform: "uppercase", fontWeight: 700 }}>
            Authored Outcome Ladder · Scout Read
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
            Hand-authored eye-test ladder from {ladder.prospectName}'s ceiling down to floor.
          </div>
        </div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase" }}>
          Ceiling → Floor
        </div>
      </div>

      <div style={{ display: "grid", gap: compact ? 4 : 6 }}>
        {rungs.map(({ level, entry }, i) => {
          const color = tierColor(entry.tier);
          const isPeak = i === 0;
          const isBase = i === rungs.length - 1;
          return (
            <div
              key={level}
              style={{
                display: "grid",
                gridTemplateColumns: "84px 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: compact ? "6px 10px" : "10px 12px",
                background: isPeak ? `color-mix(in srgb, ${color} 10%, transparent)` : T.surface2,
                borderTop: `1px solid ${T.borderSoft}`,
                borderRight: `1px solid ${T.borderSoft}`,
                borderBottom: `1px solid ${T.borderSoft}`,
                borderLeft: `4px solid ${color}`,
              }}
            >
              <span style={{
                ...mono, fontSize: 9, letterSpacing: "0.16em",
                color: isPeak ? color : T.textMute,
                textTransform: "uppercase",
                fontWeight: isPeak ? 700 : 500,
              }}>
                {isPeak && "↑ "}{LADDER_LABELS[level]}{isBase && " ↓"}
              </span>
              <span style={{ fontSize: compact ? 13 : 14, color: T.text, fontWeight: isPeak || isBase ? 600 : 500 }}>
                {entry.name}
              </span>
              <span style={{
                ...mono, fontSize: 10,
                color, border: `1px solid ${color}`,
                padding: "2px 8px", letterSpacing: "0.1em",
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                whiteSpace: "nowrap",
              }}>
                {entry.tier}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
