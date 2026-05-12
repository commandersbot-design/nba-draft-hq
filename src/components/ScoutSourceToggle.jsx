import React from "react";
import { useScoutSource } from "../lib/scoutSource";

/**
 * Two-state pill toggle for the global scout-source. Sits in the top nav
 * area. Click to flip between "Yours" (user content only) and "Founder"
 * (also shows founder's pre-baked authored content).
 *
 * Tooltip explains what changes when the toggle flips.
 */

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

export default function ScoutSourceToggle() {
  const { source, setSource } = useScoutSource();
  const isYours = source === "yours";

  return (
    <div
      style={{
        display: "inline-flex",
        border: `1px solid var(--prospera-border)`,
        background: "var(--prospera-surface-2)",
      }}
      title={
        isYours
          ? "YOURS mode — showing your own scout notes / tier calls / tags. Founder's hand-authored Floor→Ceiling ladders are hidden. Click to flip."
          : "FOUNDER mode — also showing founder's hand-curated Floor→Ceiling ladders alongside your scouting. Click to return to YOURS-only."
      }
    >
      <button
        type="button"
        onClick={() => setSource("yours")}
        style={{
          ...mono,
          fontSize: 9,
          letterSpacing: "0.16em",
          color: isYours ? "var(--prospera-bg)" : "var(--prospera-text-mute)",
          background: isYours ? "var(--prospera-cyan)" : "transparent",
          border: "none",
          padding: "5px 10px",
          cursor: "pointer",
          textTransform: "uppercase",
          fontWeight: isYours ? 700 : 500,
        }}
      >
        Yours
      </button>
      <button
        type="button"
        onClick={() => setSource("founder")}
        style={{
          ...mono,
          fontSize: 9,
          letterSpacing: "0.16em",
          color: !isYours ? "var(--prospera-bg)" : "var(--prospera-text-mute)",
          background: !isYours ? "var(--prospera-signal)" : "transparent",
          border: "none",
          borderLeft: `1px solid var(--prospera-border)`,
          padding: "5px 10px",
          cursor: "pointer",
          textTransform: "uppercase",
          fontWeight: !isYours ? 700 : 500,
        }}
      >
        + Founder
      </button>
    </div>
  );
}
