import React from "react";
import { tierColor } from "../grading/authoredComps";

/**
 * Visual analog of AuthoredCompsLadder, but for the statistical comp engine's
 * output. Renders headline + body + shadow as ladder rungs ordered Best Match
 * → Cautionary, with the same color-coded-rung rhythm as the authored ladder.
 *
 * Drop-in for the statistical comp section. Each rung shows:
 *   - Color-coded left border (by outcome tier)
 *   - Role label (HEADLINE / BODY / SHADOW)
 *   - Player name + outcome tier pill
 *   - School · year · sim score (right side, mono muted)
 *   - Optional: top-3 matching features inline
 */

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

// Map outcome tier (engine) to a tier color via the same lookup as authored
function outcomeColor(tier) {
  if (!tier) return "var(--prospera-text-mute)";
  const lower = tier.toLowerCase();
  if (lower === "legend") return "#A855F7";
  if (lower === "star")   return "var(--prospera-cyan)";
  if (lower === "hit")    return "var(--prospera-positive)";
  if (lower === "swing")  return "var(--prospera-warn)";
  if (lower === "bust")   return "var(--prospera-danger)";
  return "var(--prospera-text-mute)";
}

const ROLE_LABELS = {
  headline:  "Headline",
  shadow:    "Shadow",
  body:      "Body",
  scout_anchored: "Anchor",
};

/**
 * Position-aware label: peak rung is "STRONGEST MATCH", base is "CAUTIONARY",
 * middle entries use the role label. Avoids the awkward case where the engine
 * has no Legend/Star headline and the top rung renders as "BODY".
 */
function rungLabel(role, isPeak, isBase, totalRungs) {
  if (totalRungs === 1) return "MATCH";
  if (isPeak) return "STRONGEST MATCH";
  if (isBase) return "CAUTIONARY";
  // Middle rungs use a uniform "MATCH" label so the visual rhythm is clean.
  // The outcome-tier pill on the right already conveys quality (Hit / Swing / Bust).
  return "MATCH";
}

function Rung({ entry, role, isPeak, isBase, totalRungs, compact }) {
  const tier = entry.tier || entry.outcomeTier;
  const color = outcomeColor(tier);
  const label = rungLabel(role, isPeak, isBase, totalRungs);
  const name = entry.name;
  const year = entry.year || entry.draftYear;
  const school = entry.school;
  const sim = entry.similarity;

  return (
    <div
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
        {isPeak && "↑ "}{label}{isBase && " ↓"}
      </span>
      <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
        <span style={{
          fontSize: compact ? 13 : 14,
          color: T.text,
          fontWeight: isPeak || isBase ? 600 : 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {name}
        </span>
        {(school || year) && (
          <span style={{
            ...mono, fontSize: 10, color: T.textMute,
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}>
            {school?.toUpperCase()}{school && year ? " · " : ""}{year || ""}
          </span>
        )}
      </span>
      <span style={{ display: "flex", gap: 6, alignItems: "center", whiteSpace: "nowrap" }}>
        {typeof sim === "number" && (
          <span style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.08em" }}>
            {Math.round(sim)}% sim
          </span>
        )}
        {tier && (
          <span style={{
            ...mono, fontSize: 10,
            color, border: `1px solid ${color}`,
            padding: "2px 8px", letterSpacing: "0.1em",
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            textTransform: "uppercase",
          }}>
            {tier}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Props:
 *   - prospectName?: string — for the header
 *   - entries: Array<{
 *       role: "headline" | "shadow" | "body",
 *       name: string,
 *       tier?: string,             // outcome tier
 *       year?: number,
 *       school?: string,
 *       similarity?: number,       // 0-100
 *     }>
 *   - title?: string — header title (default: "Statistical Outcome Ladder · Engine Read")
 *   - subtitle?: string
 *   - compact?: boolean
 */
export default function ComputedOutcomesLadder({
  prospectName,
  entries,
  title = "Statistical Outcome Ladder · Engine Read",
  subtitle,
  compact = false,
}) {
  if (!entries || entries.length === 0) return null;

  // Sort: headline first, then body (by similarity desc), then shadow last
  const ordered = React.useMemo(() => {
    const headline = entries.filter((e) => e.role === "headline");
    const body     = entries.filter((e) => e.role === "body").slice().sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    const shadow   = entries.filter((e) => e.role === "shadow");
    const other    = entries.filter((e) => !["headline", "body", "shadow"].includes(e.role));
    return [...headline, ...body, ...shadow, ...other];
  }, [entries]);

  const computedSubtitle = subtitle ??
    (prospectName
      ? `Statistical engine read for ${prospectName} — ranked best match → cautionary tale.`
      : "Ranked best match → cautionary tale.");

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 16, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.cyan, textTransform: "uppercase", fontWeight: 700 }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
            {computedSubtitle}
          </div>
        </div>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase" }}>
          Best Match → Cautionary
        </div>
      </div>

      <div style={{ display: "grid", gap: compact ? 4 : 6 }}>
        {ordered.map((e, i) => (
          <Rung
            key={`${e.role}-${e.name}-${i}`}
            entry={e}
            role={e.role}
            isPeak={i === 0}
            isBase={i === ordered.length - 1}
            totalRungs={ordered.length}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
