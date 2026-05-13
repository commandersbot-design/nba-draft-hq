import React from "react";
import { createPortal } from "react-dom";
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

// Approximate width of the 5-tier strip + CLR button, used for clamping the
// popover to the viewport so it never spills off the right edge on phones.
const STRIP_APPROX_WIDTH = 252;
const STRIP_APPROX_HEIGHT = 36;
const VIEWPORT_MARGIN = 6;

export default function InlineTierPill({ prospectId }) {
  const [allViews, setAllViews] = useLocalStorageState("prospera.terminal.scout-views", {});
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef(null);
  const popoverRef = React.useRef(null);
  // Viewport-space coords for the portalised popover. See InlineTagsPopover
  // for the underlying reason this needs to escape its container: the Scout
  // Desk row table wraps everything in an overflow-auto scroller, which
  // forces clipping on both axes and would otherwise cut off this strip.
  const [coords, setCoords] = React.useState(null);

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

  const recomputeCoords = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    // Anchor the strip's left edge to the trigger's left edge, then clamp
    // inside the viewport so phone widths don't cause overflow.
    let left = rect.left;
    if (left + STRIP_APPROX_WIDTH > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - STRIP_APPROX_WIDTH - VIEWPORT_MARGIN;
    }
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    // Drop below the trigger by default; flip above when there isn't room.
    const spaceBelow = window.innerHeight - rect.bottom;
    let top;
    if (spaceBelow >= STRIP_APPROX_HEIGHT + VIEWPORT_MARGIN) {
      top = rect.bottom + 4;
    } else {
      top = Math.max(VIEWPORT_MARGIN, rect.top - STRIP_APPROX_HEIGHT - 4);
    }
    setCoords({ top, left });
  }, []);

  // Open lifecycle: compute coords, track scroll/resize, close on outside
  // click or Escape. Scroll listener uses capture phase to catch the inner
  // scroll wrap that sits between this trigger and the document.
  React.useEffect(() => {
    if (!open) return;
    recomputeCoords();
    const onDown = (e) => {
      const t = e.target;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      if (popoverRef.current && popoverRef.current.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", recomputeCoords, true);
    window.addEventListener("resize", recomputeCoords);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", recomputeCoords, true);
      window.removeEventListener("resize", recomputeCoords);
    };
  }, [open, recomputeCoords]);

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={triggerRef}
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
      {open && coords && createPortal(
        <div
          ref={popoverRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 1000,
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
        </div>,
        document.body,
      )}
    </span>
  );
}
