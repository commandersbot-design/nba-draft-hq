import React from "react";
import {
  Flame, TrendingUp, Sparkles, Target, Zap, Rocket, WandSparkles, Cloud, Anchor, Magnet,
  Crosshair, Wind, ArrowUpCircle, Navigation, Puzzle, Wand2, CircleDot, Shield, UserCheck,
  AlertOctagon, ShieldCheck, Shuffle, GitFork, Mountain, BatteryCharging, Hand, Crown, Gem,
  Sprout, Sun, Dice3, PlugZap, Scale, AlertCircle, Ruler, HelpCircle, Hourglass, Circle,
  Eraser, Compass, Shapes, Link,
} from "lucide-react";
import { getTagById } from "../lib/tags/library";

// Map semantic icon names from the tag library to actual lucide components.
// Anything missing falls through to a generic Circle so the UI doesn't crash.
const ICON_MAP = {
  "flame": Flame, "trending-up": TrendingUp, "sparkles": Sparkles, "target": Target,
  "zap": Zap, "rocket": Rocket, "wand-sparkles": WandSparkles, "cloud": Cloud,
  "anchor": Anchor, "magnet": Magnet, "crosshair": Crosshair, "wind": Wind,
  "arrow-up-circle": ArrowUpCircle, "navigation": Navigation, "puzzle": Puzzle,
  "wand-2": Wand2, "circle-dot": CircleDot, "shield": Shield, "user-check": UserCheck,
  "alert-octagon": AlertOctagon, "shield-check": ShieldCheck, "shuffle": Shuffle,
  "git-fork": GitFork, "mountain": Mountain, "battery-charging": BatteryCharging,
  "hand": Hand, "crown": Crown, "gem": Gem, "sprout": Sprout, "sun": Sun,
  "dice-3": Dice3, "plug-zap": PlugZap, "scale": Scale, "alert-circle": AlertCircle,
  "ruler": Ruler, "help-circle": HelpCircle, "hourglass": Hourglass,
  // 2026-05-12 new tag icons
  "eraser": Eraser, "compass": Compass, "shapes": Shapes, "link": Link,
};

function iconFor(name) { return ICON_MAP[name] || Circle; }

/**
 * A single tag pill. Color-coded by layer.
 *   size="sm" — compact for profile header / row strips
 *   size="md" — standard
 */
export function TagBadge({ tagId, size = "md", showLabel = true }) {
  const t = React.useMemo(() => getTagById(tagId), [tagId]);
  if (!t) return null;
  const Icon = iconFor(t.icon);
  const layerColor = t.layer === "outlook"
    ? "var(--prospera-signal)"
    : t.layer === "concerns"
      ? "var(--prospera-danger)"
      : "var(--prospera-cyan)";
  const bg = `color-mix(in srgb, ${layerColor} ${t.layer === "outlook" ? 12 : 8}%, transparent)`;
  const fontSize = size === "sm" ? 9 : 10;
  const padding = size === "sm" ? "2px 7px" : "4px 9px";
  const iconSize = size === "sm" ? 10 : 12;
  return (
    <span
      title={t.usageGuide ? `${t.description}\n\nUsage: ${t.usageGuide}` : t.description}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
        fontSize,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: layerColor,
        border: `1px solid ${layerColor}`,
        background: bg,
        padding,
        fontWeight: t.layer === "outlook" ? 700 : 500,
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      <Icon size={iconSize} />
      {showLabel && t.name}
    </span>
  );
}

/**
 * Renders a flow of tag badges for a given list of ids. Sorts to canonical
 * order (skills → outlook → concerns; skills sorted by category).
 *
 * Returns null when the player has no tags so callers can use {tagIds.length > 0 && ...}.
 */
export function TagBadgeRow({ tagIds = [], size = "md", emptyLabel }) {
  if (!tagIds || tagIds.length === 0) {
    if (!emptyLabel) return null;
    return (
      <span style={{
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: 10, color: "var(--prospera-text-mute)", letterSpacing: "0.1em",
        textTransform: "uppercase", fontStyle: "italic",
      }}>
        {emptyLabel}
      </span>
    );
  }
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {tagIds.map((id) => <TagBadge key={id} tagId={id} size={size} />)}
    </div>
  );
}
