import React from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

/**
 * Tiny inline Floor→Ceiling tier control for use on Scout Desk rows.
 *
 * Reads/writes the same localStorage key as the player profile's Scout View
 * tab (`prospera.terminal.scout-views`) so a tier set inline shows up in the
 * full editor and vice versa.
 *
 * Visual: a single pill showing the current tier (or "·" if unset). Click
 * opens a 5-button strip (FL / LE / MID / HE / C) plus a clear button. Click
 * any tier → sets it + closes the strip. Click outside → closes.
 *
 * Compact size matches the row density (small mono pill, ~22px tall).
 */

const TIERS = [
  { abbr: "FL",  label: "Floor",    color: "var(--prospera-text-mute)" },
  { abbr: "LE",  label: "Low End",  color: "var(--prospera-text-dim)" },
  { abbr: "MID", label: "Middle",   color: "var(--prospera-cyan)" },
  { abbr: "HE",  label: "High End", color: "#F59E0B" },
  { abbr: "C",   label: "Ceiling",  color: "var(--prospera-signal)" },
];

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

function colorForTier(abbr) {
  return TIERS.find((t) => t.abbr === abbr)?.color || "var(--prospera-text-mute)";
}

export default function InlineTierPill({ prospectId }) {
  const [allViews, setAllViews] = useLocalStorageState("prospera.terminal.scout-views", {});
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  const currentTier = allViews[prospectId]?.tierRating || "";
  const color = currentTier ? colorForTier(currentTier) : "var(--prospera-border)";

  const setTier = (abbr) => {
    setAllViews((prev) => {
      const existing = prev[prospectId] || { tierNotes: { floor: "", lowEnd: "", middle: "", highEnd: "", ceiling: "" }, overallCeilingCall: "", summary: "" };
      return {
        ...prev,
        [prospectId]: {
          ...existing,
          tierRating: abbr,
          lastUpdated: new Date().toISOString(),
        },
      };
    });
    setOpen(false);
  };

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={wrapperRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        title={currentTier ? `Tier call: ${TIERS.find(t=>t.abbr===currentTier)?.label}. Click to change.` : "Set Floor→Ceiling tier call"}
        style={{
          ...mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          color: currentTier ? color : "var(--prospera-text-mute)",
          background: currentTier ? `color-mix(in srgb, ${color} 14%, transparent)` : "transparent",
          border: `1px solid ${color}`,
          padding: "2px 7px",
          cursor: "pointer",
          fontWeight: currentTier ? 700 : 400,
          textTransform: "uppercase",
          minWidth: 28,
          textAlign: "center",
        }}
      >
        {currentTier || "·"}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            display: "flex",
            gap: 4,
            padding: 6,
            background: "var(--prospera-card)",
            border: `1px solid var(--prospera-border)`,
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            whiteSpace: "nowrap",
          }}
        >
          {TIERS.map((t) => {
            const isActive = currentTier === t.abbr;
            return (
              <button
                key={t.abbr}
                type="button"
                onClick={(e) => { e.stopPropagation(); setTier(t.abbr); }}
                title={t.label}
                style={{
                  ...mono,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: isActive ? "var(--prospera-bg)" : t.color,
                  background: isActive ? t.color : "transparent",
                  border: `1px solid ${t.color}`,
                  padding: "3px 7px",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 500,
                  textTransform: "uppercase",
                  minWidth: 32,
                }}
              >
                {t.abbr}
              </button>
            );
          })}
          {currentTier && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setTier(""); }}
              title="Clear tier call"
              style={{
                ...mono, fontSize: 10, letterSpacing: "0.1em",
                color: "var(--prospera-text-mute)",
                background: "transparent",
                border: `1px dashed var(--prospera-border)`,
                padding: "3px 7px",
                cursor: "pointer",
                marginLeft: 4,
              }}
            >
              CLR
            </button>
          )}
        </div>
      )}
    </div>
  );
}
