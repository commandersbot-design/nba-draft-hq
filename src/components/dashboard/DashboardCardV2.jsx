import React from "react";
import { X, ExternalLink } from "lucide-react";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useCustomWeights } from "../CustomWeights";
import { usePlayerTags } from "../TagEditor";
import { TagBadge } from "../TagBadge";
import ScoutTierBadge from "../ScoutTierBadge";
import { AxisRadar8, AxisBars8 } from "./AxisViz";
import PROSPECT_HEADSHOTS from "../../data/prospectHeadshots.json";

// Same name-keyed headshot resolver used elsewhere on the site. Imported
// directly here so the Dashboard card doesn't depend on ScoutingTerminal's
// internal helpers.
function resolveHeadshotUrl(p) {
  if (!p || !p.name) return null;
  const entry = PROSPECT_HEADSHOTS[p.name];
  return entry?.headshotUrl || null;
}

/**
 * DashboardCardV2 — the new decision-aid card.
 *
 * Layout (top → bottom):
 *   1. RICH HERO — image + name + meta + rank chip + remove button. Below the
 *      name, a chip row: archetype, position, the user's tier-call badge,
 *      and the user's top assigned tags.
 *   2. RISK DOTS — small inline strip showing count of flags at each level
 *      (Critical / Real Risk / Watch). Hidden when no flags.
 *   3. AXIS VIZ — either AxisRadar8 (polar) or AxisBars8 (horizontal bars),
 *      controlled by the parent via `axisStyle` prop so all cards on the
 *      Dashboard render the same style at once.
 *   4. OUTCOME RANGE — collapsed two-line view of the user's Deep Dive
 *      Floor and Ceiling outcome-tier labels (e.g., "Bench" → "All-Star").
 *      Falls back to "—" when those haven't been set.
 *   5. SCORES — Personal Score (custom weights, when active) + Trait Score
 *      side-by-side. Compact.
 *   6. FOOTER — Open Profile link.
 *
 * No interactive editing happens on the card itself — the user navigates to
 * the profile page (or Scout Desk) to author. The Dashboard is a read-only
 * decision surface.
 */

const T = {
  card:       "var(--prospera-card)",
  surface:    "var(--prospera-surface)",
  surface2:   "var(--prospera-surface-2)",
  border:     "var(--prospera-border)",
  borderSoft: "var(--prospera-border-soft)",
  text:       "var(--prospera-text)",
  textDim:    "var(--prospera-text-dim)",
  textMute:   "var(--prospera-text-mute)",
  cyan:       "var(--prospera-cyan)",
  signal:     "var(--prospera-signal)",
  warn:       "var(--prospera-warn)",
  danger:     "var(--prospera-danger)",
  blue:       "#3B82F6",
  purple:     "#A855F7",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

// Outcome-tier label color map (mirrors Deep Dive's palette).
const OUTCOME_COLORS = {
  Legend:   T.purple,
  Star:     T.cyan,
  Hit:      "#10B981",
  Swing:    T.warn,
  Bust:     T.danger,
};

// Flag-level palette (mirrors what FlagDot uses elsewhere on the site).
const FLAG_COLORS = {
  3: T.danger,    // Critical
  2: "#F59E0B",   // Real Risk
  1: T.cyan,      // Watch
};
const FLAG_LABELS = {
  3: "Critical",
  2: "Real Risk",
  1: "Watch",
};

function ProspectAvatar({ p, size = 56 }) {
  const headshotUrl = resolveHeadshotUrl(p);
  const [errored, setErrored] = React.useState(false);
  const showImage = headshotUrl && !errored;
  const initials =
    p?.initials ||
    ((p?.first?.[0] || "") + (p?.last?.[0] || "")).toUpperCase() ||
    "?";

  return (
    <div
      style={{
        width: size,
        height: size,
        border: `1px solid ${T.cyan}`,
        background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <img
          src={headshotUrl}
          alt={p?.name || ""}
          loading="lazy"
          onError={() => setErrored(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
          }}
        />
      ) : (
        <span
          style={{
            ...mono,
            fontSize: size * 0.34,
            color: T.cyan,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

// Measurables strip — height / weight / wingspan / age. Each cell shows a
// short label and the value. Values are rendered as "—" when missing so the
// strip stays a fixed shape across cards (international prospects often miss
// wingspan or age data).
function MeasurablesStrip({ p }) {
  const items = [
    ["HT",   p?.height   || "—"],
    ["WT",   p?.weight   || "—"],
    ["WING", p?.wingspan || "—"],
    ["AGE",  p?.age != null ? String(p.age) : "—"],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        background: T.surface2,
        borderTop: `1px solid ${T.borderSoft}`,
        borderBottom: `1px solid ${T.borderSoft}`,
      }}
    >
      {items.map(([label, value], i) => (
        <div
          key={label}
          style={{
            padding: "6px 8px",
            borderRight: i < items.length - 1 ? `1px solid ${T.borderSoft}` : "none",
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...mono,
              fontSize: 8,
              letterSpacing: "0.18em",
              color: T.textMute,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            {label}
          </div>
          <div
            style={{
              ...mono,
              fontSize: 12,
              color: value === "—" ? T.textMute : T.text,
              fontWeight: 600,
              marginTop: 2,
              letterSpacing: "0.02em",
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chip({ label, color = T.textDim, bg = "transparent", border = T.border, title }) {
  return (
    <span
      title={title}
      style={{
        ...mono,
        fontSize: 9,
        letterSpacing: "0.14em",
        color,
        background: bg,
        border: `1px solid ${border}`,
        padding: "3px 7px",
        textTransform: "uppercase",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function RiskStrip({ flags }) {
  if (!flags || flags.length === 0) return null;
  // Aggregate counts by level
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const f of flags) {
    const lvl = Math.max(1, Math.min(3, Number(f.lvl) || 1));
    counts[lvl] += 1;
  }
  const totalShown = counts[3] + counts[2] + counts[1];
  if (totalShown === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "6px 12px",
        background: T.surface2,
        borderTop: `1px solid ${T.borderSoft}`,
        borderBottom: `1px solid ${T.borderSoft}`,
      }}
    >
      <span
        style={{
          ...mono,
          fontSize: 8,
          letterSpacing: "0.18em",
          color: T.textMute,
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        Risks
      </span>
      {[3, 2, 1].map((lvl) => (
        counts[lvl] > 0 && (
          <span
            key={lvl}
            title={`${counts[lvl]} ${FLAG_LABELS[lvl]} flag${counts[lvl] === 1 ? "" : "s"}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              ...mono,
              fontSize: 10,
              color: FLAG_COLORS[lvl],
              fontWeight: 600,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                background: FLAG_COLORS[lvl],
                borderRadius: "50%",
              }}
            />
            {counts[lvl]}
          </span>
        )
      ))}
    </div>
  );
}

function OutcomeRange({ deepDive }) {
  const floor = deepDive?.floorTier || null;
  const ceiling = deepDive?.ceilingTier || null;
  if (!floor && !ceiling) {
    return (
      <div
        style={{
          padding: "10px 12px",
          ...mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          color: T.textMute,
          textTransform: "uppercase",
        }}
      >
        Outcome range not set
      </div>
    );
  }
  const Row = ({ label, tier }) => {
    const color = tier ? (OUTCOME_COLORS[tier] || T.textDim) : T.textMute;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "56px 1fr",
          gap: 10,
          alignItems: "center",
          padding: "6px 12px",
        }}
      >
        <span
          style={{
            ...mono,
            fontSize: 9,
            letterSpacing: "0.16em",
            color: T.textMute,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            ...mono,
            fontSize: 12,
            color,
            fontWeight: 700,
            letterSpacing: "0.06em",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              background: color,
              borderRadius: "50%",
            }}
          />
          {tier || "—"}
        </span>
      </div>
    );
  };
  return (
    <div>
      <Row label="Ceiling" tier={ceiling} />
      <Row label="Floor" tier={floor} />
    </div>
  );
}

function ScoreCell({ title, value, sub, color }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: T.surface2,
        border: `1px solid ${T.borderSoft}`,
      }}
    >
      <div
        style={{
          ...mono,
          fontSize: 8,
          letterSpacing: "0.18em",
          color,
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          ...mono,
          fontSize: 20,
          color: T.text,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value != null && Number.isFinite(value) ? value.toFixed(1) : "—"}
      </div>
      {sub && (
        <div
          style={{
            ...mono,
            fontSize: 8,
            letterSpacing: "0.14em",
            color: T.textMute,
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export default function DashboardCardV2({
  p,
  axisStyle = "radar",
  onOpenProfile,
  onRemove,
}) {
  const { displayScore, active: weightsActive } = useCustomWeights();
  const [allDeepDives] = useLocalStorageState("prospera.terminal.deep-dives", {});
  const { tagIds } = usePlayerTags(p?.id || "");
  // Limit chips to top 3 assigned tags so the hero stays single-line on most widths.
  const topTagIds = (tagIds || []).slice(0, 3);

  if (!p) return null;
  const deepDive = allDeepDives?.[p.id] || null;
  const personal = displayScore(p);
  const traitScore = p.weightedTraitScore;

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* ====== RICH HERO ====== */}
      <div
        style={{
          padding: "14px 14px 12px",
          borderBottom: `1px solid ${T.borderSoft}`,
          position: "relative",
        }}
      >
        {/* Top row: avatar + name block + rank chip + remove */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <ProspectAvatar p={p} size={56} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                color: T.text,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {p.name}
            </div>
            <div
              style={{
                ...mono,
                fontSize: 9,
                color: T.textMute,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: 3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {(p.school || "—").toUpperCase()} · {p.pos || "—"} · {p.cls || "—"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            {p.rank != null && (
              <span
                style={{
                  ...mono,
                  fontSize: 10,
                  color: T.cyan,
                  background: "var(--prospera-accent-bg)",
                  border: `1px solid var(--prospera-accent-border-faint)`,
                  padding: "2px 6px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                }}
                title="Class rank"
              >
                #{String(p.rank).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              onClick={onRemove}
              title="Remove from dashboard"
              style={{
                background: "transparent",
                border: `1px solid ${T.border}`,
                color: T.textMute,
                padding: 3,
                cursor: "pointer",
                lineHeight: 0,
              }}
            >
              <X size={11} />
            </button>
          </div>
        </div>

        {/* Chip row: archetype + tier-call + assigned tags */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 10,
            alignItems: "center",
          }}
        >
          {p.archetype && (
            <Chip
              label={p.archetype}
              color={T.cyan}
              bg="var(--prospera-accent-bg)"
              border="var(--prospera-accent-border-faint)"
            />
          )}
          <ScoutTierBadge prospectId={p.id} />
          {topTagIds.map((tagId) => (
            <TagBadge key={tagId} tagId={tagId} size="sm" />
          ))}
        </div>
      </div>

      {/* ====== MEASURABLES ====== */}
      <MeasurablesStrip p={p} />

      {/* ====== RISK STRIP ====== */}
      <RiskStrip flags={p.flags} />

      {/* ====== AXIS VIZ ====== */}
      <div style={{ padding: "16px 14px 14px", borderBottom: `1px solid ${T.borderSoft}` }}>
        {axisStyle === "radar" ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AxisRadar8 traits9={p.traits9} size={220} />
          </div>
        ) : (
          <AxisBars8 traits9={p.traits9} />
        )}
      </div>

      {/* ====== OUTCOME RANGE ====== */}
      <div style={{ borderBottom: `1px solid ${T.borderSoft}`, paddingTop: 4, paddingBottom: 4 }}>
        <div
          style={{
            ...mono,
            fontSize: 8,
            letterSpacing: "0.2em",
            color: T.textMute,
            textTransform: "uppercase",
            fontWeight: 700,
            padding: "8px 12px 4px",
          }}
        >
          Outcome Range
        </div>
        <OutcomeRange deepDive={deepDive} />
      </div>

      {/* ====== SCORES ====== */}
      <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <ScoreCell
          title={weightsActive ? "Personal" : "Score"}
          value={personal}
          sub={weightsActive ? "Custom weights" : "Default weights"}
          color={T.cyan}
        />
        <ScoreCell
          title="Trait"
          value={traitScore}
          sub={p.percentile ? `${p.percentile}th pct` : null}
          color={T.blue}
        />
      </div>

      {/* ====== FOOTER ====== */}
      <button
        type="button"
        onClick={onOpenProfile}
        style={{
          ...mono,
          fontSize: 10,
          letterSpacing: "0.16em",
          color: T.cyan,
          background: "transparent",
          border: "none",
          borderTop: `1px solid ${T.borderSoft}`,
          padding: "10px 14px",
          cursor: "pointer",
          textAlign: "left",
          textTransform: "uppercase",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Open Profile <ExternalLink size={11} />
      </button>
    </div>
  );
}
