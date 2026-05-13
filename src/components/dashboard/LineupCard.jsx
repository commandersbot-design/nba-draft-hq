import React from "react";
import { X, ExternalLink } from "lucide-react";
import { useCustomWeights } from "../CustomWeights";
import { usePlayerTags } from "../TagEditor";
import { TagBadge } from "../TagBadge";
import ScoutTierBadge from "../ScoutTierBadge";
import PROSPECT_HEADSHOTS from "../../data/prospectHeadshots.json";

/**
 * LineupCard — the third Dashboard view mode (alongside Radar and Bars).
 *
 * Shape: a compact portrait card dominated by the headshot, so a row of these
 * functions like a roster lineup — you scan faces quickly and see who's pinned
 * at a glance. Less info per card than the Decision card (no axis viz, no
 * outcome range, no measurables strip) — just identity + your tier-call +
 * top tag + score.
 *
 * Used in the dashboard when viewMode === "lineup". The grid container renders
 * more columns than the Decision-card grid (5-up desktop) so more prospects
 * fit on screen at once.
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
  bg:         "var(--prospera-bg)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

function resolveHeadshotUrl(p) {
  if (!p || !p.name) return null;
  const entry = PROSPECT_HEADSHOTS[p.name];
  return entry?.headshotUrl || null;
}

function LineupHeadshot({ p }) {
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
        width: "100%",
        aspectRatio: "4 / 5",
        background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
        borderBottom: `1px solid ${T.border}`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
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
            fontSize: 64,
            color: T.cyan,
            fontWeight: 700,
            letterSpacing: "0.06em",
            opacity: 0.6,
          }}
        >
          {initials}
        </span>
      )}

      {/* Rank chip overlay (top-left) */}
      {p?.rank != null && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            ...mono,
            fontSize: 11,
            letterSpacing: "0.08em",
            color: T.bg,
            background: T.cyan,
            padding: "3px 7px",
            fontWeight: 700,
          }}
        >
          #{String(p.rank).padStart(2, "0")}
        </div>
      )}

      {/* Remove button (top-right) */}
    </div>
  );
}

export default function LineupCard({ p, onOpenProfile, onRemove }) {
  const { displayScore, active: weightsActive } = useCustomWeights();
  const { tagIds } = usePlayerTags(p?.id || "");
  // Only show the single top tag in the lineup mode — keep it visually quiet.
  const topTagId = (tagIds || [])[0] || null;

  if (!p) return null;
  const personal = displayScore(p);

  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        position: "relative",
      }}
    >
      <LineupHeadshot p={p} />

      {/* Remove button — top-right of the whole card so it doesn't sit on
          top of the headshot image and isn't visually intrusive. */}
      <button
        type="button"
        onClick={onRemove}
        title="Remove from dashboard"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "rgba(5, 10, 18, 0.7)",
          border: `1px solid ${T.border}`,
          color: T.textMute,
          padding: 3,
          cursor: "pointer",
          lineHeight: 0,
          zIndex: 2,
        }}
      >
        <X size={11} />
      </button>

      {/* Body — name, meta, badges, score */}
      <div style={{ padding: "10px 12px", display: "grid", gap: 6 }}>
        <div
          style={{
            fontSize: 14,
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
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {(p.school || "—")} · {p.pos || "—"} · {p.cls || "—"}
        </div>

        {/* Badge row: tier-call + top tag (only renders if either set) */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginTop: 2,
            minHeight: 18, // reserve space so cards align even when no badges
          }}
        >
          <ScoutTierBadge prospectId={p.id} />
          {topTagId && <TagBadge tagId={topTagId} size="sm" showLabel={false} />}
        </div>

        {/* Score row + open profile in one strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 4,
            paddingTop: 8,
            borderTop: `1px solid ${T.borderSoft}`,
          }}
        >
          <div>
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
              {weightsActive ? "Personal" : "Score"}
            </div>
            <div
              style={{
                ...mono,
                fontSize: 18,
                color: T.cyan,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {personal != null && Number.isFinite(personal)
                ? personal.toFixed(1)
                : "—"}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            title="Open profile"
            style={{
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.cyan,
              padding: 5,
              cursor: "pointer",
              lineHeight: 0,
            }}
          >
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
