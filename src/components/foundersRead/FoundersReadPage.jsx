import React from "react";
import founderContent from "../../data/founderContent.json";
import PROSPECTS_DATA from "../../data/prospects.json";
import PROSPECT_HEADSHOTS from "../../data/prospectHeadshots.json";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";

/**
 * FoundersReadPage — top-level page for the "Founder's Read" main nav tab.
 *
 * Contains four sub-sections, all curated by the founder via a static JSON
 * (src/data/founderContent.json):
 *
 *   - RANKINGS      The founder's personal top-N with one-line notes per pick.
 *                   Starts at Top 15; the JSON can grow over time.
 *   - CLASS NOTES   General observations about the class — themes, sleepers
 *                   to watch, what's still being evaluated.
 *   - SLEEPERS      Prospects the founder is higher on than consensus.
 *   - PER-PROSPECT  Existing per-prospect deep dive editor — this is where
 *                   the user/founder writes the long-form analysis. Lives as
 *                   a sub-section here so all founder content is grouped.
 *
 * Sub-nav state persists across visits. Default landing sub-tab: "Rankings"
 * since that's the most browsable content on first arrival.
 */

const T = {
  bg:         "var(--prospera-bg)",
  surface:    "var(--prospera-surface)",
  surface2:   "var(--prospera-surface-2)",
  card:       "var(--prospera-card)",
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

const statValue = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1',
};

// Tier colour palette — mirrors the Founder-authored ladder colours so the
// ranking tier pills tie visually to the rest of the founder content.
const TIER_COLOR = {
  Apex:     "var(--prospera-signal)",
  Star:     "var(--prospera-cyan)",
  Hit:      "#10B981",
  Swing:    "var(--prospera-warn)",
  Bust:     "var(--prospera-danger)",
};

// Look up a prospect by name (matches the canonical entries in prospects.json).
function resolveProspect(name) {
  if (!name) return null;
  const list = Array.isArray(PROSPECTS_DATA) ? PROSPECTS_DATA : (PROSPECTS_DATA.prospects || []);
  return list.find((p) => p.name === name) || null;
}

function resolveHeadshot(name) {
  if (!name) return null;
  return PROSPECT_HEADSHOTS[name]?.headshotUrl || null;
}

// ---------- Headshot helper ----------

function ProspectAvatar({ name, size = 56 }) {
  const url = resolveHeadshot(name);
  const [errored, setErrored] = React.useState(false);
  const showImage = url && !errored;
  const initials = (name || "")
    .split(/\s+/)
    .map((s) => s[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${T.surface2}, ${T.surface})`,
        border: `1px solid ${T.cyan}`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <img
          src={url}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
        />
      ) : (
        <span style={{ ...mono, fontSize: size * 0.34, color: T.cyan, fontWeight: 700 }}>{initials}</span>
      )}
    </div>
  );
}

// =============================================================================
// RANKINGS SECTION
// =============================================================================

function RankingsSection({ onOpenProfile }) {
  const { title, subtitle, items = [] } = founderContent.rankings || {};
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, color: T.text, margin: "0 0 4px", fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title || "Top Rankings"}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: T.textDim, margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => {
          const prospect = resolveProspect(item.prospectName);
          const tierColor = TIER_COLOR[item.tier] || T.cyan;
          return (
            <div
              key={item.rank + "-" + item.prospectName}
              role={prospect ? "button" : undefined}
              tabIndex={prospect ? 0 : undefined}
              onClick={prospect ? () => onOpenProfile?.(prospect.id) : undefined}
              onKeyDown={prospect ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenProfile?.(prospect.id);
                }
              } : undefined}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 64px 1fr 90px",
                gap: 14,
                alignItems: "center",
                padding: "14px 16px",
                background: T.surface,
                borderTop: `1px solid ${T.borderSoft}`,
                borderRight: `1px solid ${T.borderSoft}`,
                borderBottom: `1px solid ${T.borderSoft}`,
                borderLeft: `3px solid ${tierColor}`,
                cursor: prospect ? "pointer" : "default",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!prospect) return;
                e.currentTarget.style.background = "var(--prospera-accent-bg-soft)";
              }}
              onMouseLeave={(e) => {
                if (!prospect) return;
                e.currentTarget.style.background = T.surface;
              }}
            >
              {/* Rank number — big, the visual anchor */}
              <div
                style={{
                  ...statValue,
                  fontSize: 36,
                  color: T.cyan,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  textAlign: "center",
                }}
                title={`Founder's rank: #${item.rank}`}
              >
                {item.rank}
              </div>

              <ProspectAvatar name={item.prospectName} size={56} />

              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 16, color: T.text, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {item.prospectName}
                  </span>
                  {prospect && (
                    <span style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase" }}>
                      {prospect.school?.toUpperCase()} · {prospect.pos}
                    </span>
                  )}
                </div>
                {item.note && (
                  <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>
                    {item.note}
                  </div>
                )}
              </div>

              {/* Tier pill */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span
                  style={{
                    ...mono,
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: tierColor,
                    border: `1px solid ${tierColor}`,
                    background: `color-mix(in srgb, ${tierColor} 12%, transparent)`,
                    padding: "4px 9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                  title={`Founder's outcome tier: ${item.tier}`}
                >
                  {item.tier}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// CLASS NOTES SECTION
// =============================================================================

function ClassNotesSection() {
  const { title, sections = [] } = founderContent.classNotes || {};
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, color: T.text, margin: "0 0 4px", fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title || "Class Notes"}
        </h2>
        <p style={{ fontSize: 13, color: T.textDim, margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
          General observations about the class — themes, watch points, things still being evaluated.
        </p>
      </div>

      <div style={{ display: "grid", gap: 14, maxWidth: 800 }}>
        {sections.map((section, i) => (
          <div
            key={i}
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${T.cyan}`,
              padding: "16px 18px",
            }}
          >
            <h3
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.22em",
                color: T.cyan,
                textTransform: "uppercase",
                fontWeight: 800,
                margin: "0 0 10px",
              }}
            >
              {section.heading}
            </h3>
            <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SLEEPERS SECTION
// =============================================================================

function SleepersSection({ onOpenProfile }) {
  const { title, subtitle, items = [] } = founderContent.sleepers || {};
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, color: T.text, margin: "0 0 4px", fontWeight: 700, letterSpacing: "-0.01em" }}>
          {title || "Sleepers"}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 13, color: T.textDim, margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item, i) => {
          const prospect = resolveProspect(item.prospectName);
          return (
            <div
              key={i}
              role={prospect ? "button" : undefined}
              tabIndex={prospect ? 0 : undefined}
              onClick={prospect ? () => onOpenProfile?.(prospect.id) : undefined}
              onKeyDown={prospect ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenProfile?.(prospect.id);
                }
              } : undefined}
              style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: 14,
                alignItems: "center",
                padding: "14px 16px",
                background: T.surface,
                borderTop: `1px solid ${T.borderSoft}`,
                borderRight: `1px solid ${T.borderSoft}`,
                borderBottom: `1px solid ${T.borderSoft}`,
                borderLeft: `3px solid ${T.signal}`,
                cursor: prospect ? "pointer" : "default",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!prospect) return;
                e.currentTarget.style.background = "var(--prospera-accent-bg-soft)";
              }}
              onMouseLeave={(e) => {
                if (!prospect) return;
                e.currentTarget.style.background = T.surface;
              }}
            >
              <ProspectAvatar name={item.prospectName} size={48} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 16, color: T.text, fontWeight: 700, letterSpacing: "-0.01em" }}>
                    {item.prospectName}
                  </span>
                  {prospect && (
                    <span style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase" }}>
                      {prospect.school?.toUpperCase()} · {prospect.pos}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>
                  {item.note}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

const SUB_NAVS = [
  { key: "rankings",     label: "Rankings",     subtitle: "Top 15 with notes" },
  { key: "class-notes",  label: "Class Notes",  subtitle: "Themes + watch list" },
  { key: "sleepers",     label: "Sleepers",     subtitle: "Higher than consensus" },
  { key: "per-prospect", label: "Per-Prospect", subtitle: "Long-form deep dives" },
];

export default function FoundersReadPage({ onOpenProfile, perProspectChildren }) {
  const [subTab, setSubTab] = useLocalStorageState(
    "prospera.terminal.founders-read-sub",
    "rankings",
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.22em", color: T.signal, textTransform: "uppercase", fontWeight: 800, marginBottom: 6 }}>
          Founder's Read · 2026 Class
        </div>
        <h1 style={{ fontSize: 30, color: T.text, margin: "0 0 6px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          The Founder's Take
        </h1>
        <p style={{ fontSize: 14, color: T.textDim, margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
          {founderContent.intro}
        </p>
        <p style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase", marginTop: 8 }}>
          Last updated · {founderContent._lastUpdated}
        </p>
      </div>

      {/* Sub-nav strip */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderBottom: `1px solid ${T.border}`,
          overflowX: "auto",
        }}
        className="prospera-founders-subnav"
      >
        {SUB_NAVS.map((nav) => {
          const active = subTab === nav.key;
          return (
            <button
              key={nav.key}
              type="button"
              onClick={() => setSubTab(nav.key)}
              style={{
                background: "transparent",
                border: "none",
                color: active ? T.signal : T.textDim,
                padding: "12px 18px",
                cursor: "pointer",
                borderBottom: `2px solid ${active ? T.signal : "transparent"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              <span style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: active ? 800 : 600 }}>
                {nav.label}
              </span>
              <span style={{ ...mono, fontSize: 8, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase" }}>
                {nav.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active sub-section */}
      {subTab === "rankings"     && <RankingsSection onOpenProfile={onOpenProfile} />}
      {subTab === "class-notes"  && <ClassNotesSection />}
      {subTab === "sleepers"     && <SleepersSection onOpenProfile={onOpenProfile} />}
      {subTab === "per-prospect" && perProspectChildren}
    </div>
  );
}
