import React from "react";
import { X, ExternalLink } from "lucide-react";
import { useCustomWeights } from "../CustomWeights";
import { usePlayerTags } from "../TagEditor";
import { TagBadge } from "../TagBadge";
import ScoutTierBadge from "../ScoutTierBadge";
import { resolveHeadshotUrl as resolveHeadshotByName } from "../../lib/headshots";

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
  return p ? resolveHeadshotByName(p.name) : null;
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
  const [hovering, setHovering] = React.useState(false);

  if (!p) return null;
  const personal = displayScore(p);

  // The whole card is a clickable tile that opens the profile. The X (remove)
  // button stops propagation so it doesn't trigger the underlying open. We
  // use a div (with role=button) rather than a real <button> here because
  // having interactive children (the X button, the open profile button)
  // inside a real button is invalid markup.
  const handleCardClick = () => { onOpenProfile?.(); };
  const handleRemoveClick = (e) => {
    e.stopPropagation();
    onRemove?.();
  };
  const handleOpenClick = (e) => {
    e.stopPropagation();
    onOpenProfile?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenProfile?.();
        }
      }}
      title={`Open ${p.name}'s profile`}
      style={{
        background: T.card,
        border: `1px solid ${hovering ? T.cyan : T.border}`,
        boxShadow: hovering
          ? `0 0 0 1px ${T.cyan}, 0 8px 20px rgba(0, 0, 0, 0.35)`
          : "none",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        position: "relative",
        cursor: "pointer",
        transition: "border-color 0.12s ease, box-shadow 0.12s ease",
        outline: "none",
      }}
    >
      <div style={{ position: "relative" }}>
        <LineupHeadshot p={p} />

        {/* Hover overlay on the headshot — makes the "open" intent obvious
            the first time a user moves over a card. Dimmed gradient + label. */}
        {hovering && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(5,10,18,0.0) 50%, rgba(5,10,18,0.78) 100%)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "0 0 10px",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.18em",
                color: T.cyan,
                fontWeight: 700,
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(5, 10, 18, 0.78)",
                padding: "5px 10px",
                border: `1px solid ${T.cyan}`,
              }}
            >
              View Profile <ExternalLink size={11} />
            </span>
          </div>
        )}
      </div>

      {/* Remove button — top-right corner. stopPropagation prevents the card's
          underlying onClick from also firing. */}
      <button
        type="button"
        onClick={handleRemoveClick}
        title="Remove from dashboard"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          background: "rgba(5, 10, 18, 0.78)",
          border: `1px solid ${T.border}`,
          color: T.textMute,
          padding: 3,
          cursor: "pointer",
          lineHeight: 0,
          zIndex: 3,
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

        {/* Score + explicit OPEN PROFILE button. The button is the primary
            affordance for "expand this card" — solid cyan fill with label so
            it reads at a glance and pairs with the whole-card click target
            for redundant clarity. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
            paddingTop: 8,
            borderTop: `1px solid ${T.borderSoft}`,
          }}
        >
          <div style={{ minWidth: 0 }}>
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
            onClick={handleOpenClick}
            title="Open profile"
            style={{
              ...mono,
              fontSize: 9,
              letterSpacing: "0.16em",
              color: T.bg,
              background: T.cyan,
              border: `1px solid ${T.cyan}`,
              padding: "7px 10px",
              cursor: "pointer",
              textTransform: "uppercase",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            Open <ExternalLink size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}
