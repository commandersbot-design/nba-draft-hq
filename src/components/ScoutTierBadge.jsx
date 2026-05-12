import React from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

/**
 * Read-only Floor→Ceiling tier badge — surfaces the user's Scout View
 * tier call (`prospera.terminal.scout-views[prospectId].tierRating`) so
 * it can appear next to a prospect name on the profile hero, Mock Draft
 * picks, My Board rows, etc.
 *
 * Mirrors InlineTierPill's visual language (same TIERS palette) but is
 * non-interactive — just a small badge that shows up wherever the prospect
 * appears so the user's scouting opinion is visible site-wide.
 *
 * Renders null when no tier has been set. That keeps surfaces clean when
 * the user hasn't authored anything yet for that prospect.
 *
 * Variants:
 *   - "sm" (default): compact pill for board rows / mock picks
 *   - "lg":           larger pill with full label for the profile hero
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

function tierMeta(abbr) {
  return TIERS.find((t) => t.abbr === abbr) || null;
}

export default function ScoutTierBadge({ prospectId, size = "sm", showLabel = false, title }) {
  const [allViews] = useLocalStorageState("prospera.terminal.scout-views", {});
  const tier = allViews?.[prospectId]?.tierRating || "";
  if (!tier) return null;

  const meta = tierMeta(tier);
  if (!meta) return null;
  const color = meta.color;

  const isLg = size === "lg";

  return (
    <span
      title={title || `Your Scout View tier call: ${meta.label}`}
      style={{
        ...mono,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: isLg ? 10 : 9,
        letterSpacing: "0.14em",
        color,
        background: `color-mix(in srgb, ${color} 14%, transparent)`,
        border: `1px solid ${color}`,
        padding: isLg ? "3px 9px" : "2px 6px",
        fontWeight: 700,
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.7, fontWeight: 500 }}>YOU</span>
      <span>{tier}</span>
      {showLabel && <span style={{ opacity: 0.85, fontWeight: 600 }}>· {meta.label}</span>}
    </span>
  );
}
