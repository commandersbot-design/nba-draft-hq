import React from "react";
import founderContent from "../../data/founderContent.json";
import PROSPECTS_DATA from "../../data/prospects.json";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { resolveHeadshotUrl } from "../../lib/headshots";

/**
 * FoundersReadPage — the founder's curated section. Eight sub-tabs:
 *
 *   - RANKINGS     Top 15 with one-line founder notes.
 *   - BOARDS       Tier boards + Position boards (sub-views).
 *   - MOCK DRAFT   The founder's pick-by-pick mock with rationale.
 *   - TAKES        Sleepers / Risers / Fallers / Watchlist (sub-views).
 *   - CLASS NOTES  Thematic writeups about the class.
 *   - UPDATES      Chronological log of takes + shifts.
 *   - PER-PROSPECT Existing DeepDivesPage editor — long-form per-prospect.
 *   - ABOUT        Founder bio + philosophy.
 *
 * Content lives entirely in src/data/founderContent.json. The founder edits
 * that file + redeploys; the running site does not write back to it. Sub-tab
 * state persists across visits.
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
  warn:       "var(--prospera-warn)",
  danger:     "var(--prospera-danger)",
  positive:   "var(--prospera-positive)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const statValue = {
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1',
};

const TIER_COLOR = {
  Apex:  "var(--prospera-signal)",
  Star:  "var(--prospera-cyan)",
  Hit:   "#10B981",
  Swing: "var(--prospera-warn)",
  Bust:  "var(--prospera-danger)",
};

// =============================================================================
// HELPERS
// =============================================================================

// Slug-normaliser shared with the headshot resolver — strips diacritics,
// "Jr." / "Sr." / "III" suffixes, and punctuation so the founder-authored
// "Darius Acuff Jr." resolves to the canonical "Darius Acuff" prospect.
function prospectSlug(name) {
  if (!name) return "";
  let s = String(name).normalize("NFKD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[\s,.]+(jr|sr|ii|iii|iv|v)\.?\s*$/i, "");
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Prospect lookup with the same slug fallback. Without this, founder-display
// name variants (Jr suffix etc.) leave their rows un-clickable + breaks the
// click-to-open-profile flow from Founder's Read.
const PROSPECT_LIST = (() => {
  const raw = Array.isArray(PROSPECTS_DATA)
    ? PROSPECTS_DATA
    : (PROSPECTS_DATA.prospects || []);
  return raw;
})();
const PROSPECT_BY_SLUG = (() => {
  const out = {};
  for (const p of PROSPECT_LIST) out[prospectSlug(p.name)] = p;
  return out;
})();

function resolveProspect(name) {
  if (!name) return null;
  // Direct hit first.
  const exact = PROSPECT_LIST.find((p) => p.name === name);
  if (exact) return exact;
  // Slug fallback handles Jr./Sr./III + accents.
  const slug = prospectSlug(name);
  return slug ? (PROSPECT_BY_SLUG[slug] || null) : null;
}

function ProspectAvatar({ name, size = 48, accent = T.cyan }) {
  const url = resolveHeadshotUrl(name);
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
        border: `1px solid ${accent}`,
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
        <span style={{ ...mono, fontSize: size * 0.34, color: accent, fontWeight: 700 }}>{initials}</span>
      )}
    </div>
  );
}

// Re-usable section title block.
function SectionHeader({ title, subtitle, eyebrow, eyebrowColor }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {eyebrow && (
        <div
          style={{
            ...mono,
            fontSize: 9,
            letterSpacing: "0.22em",
            color: eyebrowColor || T.signal,
            textTransform: "uppercase",
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2 style={{ fontSize: 22, color: T.text, margin: "0 0 4px", fontWeight: 700, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: T.textDim, margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Re-usable prospect-row card. Used by Rankings, Sleepers/Risers/Fallers,
// Watchlist, Tier-board items, Position-board items, Mock Draft picks.
function ProspectRow({
  prospectName,
  note,
  onOpenProfile,
  leadCell,        // optional left cell (rank #, pick #, etc.)
  trailing,        // optional right cell (tier pill, team, etc.)
  accent = T.cyan,
}) {
  const prospect = resolveProspect(prospectName);
  return (
    <div
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
        gridTemplateColumns: leadCell ? "56px 56px 1fr auto" : "56px 1fr auto",
        gap: 14,
        alignItems: "center",
        padding: "12px 16px",
        background: T.surface,
        borderTop: `1px solid ${T.borderSoft}`,
        borderRight: `1px solid ${T.borderSoft}`,
        borderBottom: `1px solid ${T.borderSoft}`,
        borderLeft: `3px solid ${accent}`,
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
      {leadCell && <div style={{ textAlign: "center" }}>{leadCell}</div>}
      <ProspectAvatar name={prospectName} size={48} accent={accent} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 16, color: T.text, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {prospectName}
          </span>
          {prospect && (
            <span style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase" }}>
              {prospect.school?.toUpperCase()} · {prospect.pos}
            </span>
          )}
        </div>
        {note && (
          <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55 }}>
            {note}
          </div>
        )}
      </div>
      {trailing && <div>{trailing}</div>}
    </div>
  );
}

function TierPill({ tier }) {
  const color = TIER_COLOR[tier] || T.cyan;
  return (
    <span
      style={{
        ...mono,
        fontSize: 9,
        letterSpacing: "0.18em",
        color,
        border: `1px solid ${color}`,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        padding: "4px 9px",
        fontWeight: 700,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
      title={`Founder's outcome tier: ${tier}`}
    >
      {tier}
    </span>
  );
}

// =============================================================================
// RANKINGS
// =============================================================================

function RankingsSection({ onOpenProfile }) {
  const { title, subtitle, items = [] } = founderContent.rankings || {};
  return (
    <div>
      <SectionHeader title={title || "Top Rankings"} subtitle={subtitle} />
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => {
          const tierColor = TIER_COLOR[item.tier] || T.cyan;
          return (
            <ProspectRow
              key={item.rank + "-" + item.prospectName}
              prospectName={item.prospectName}
              note={item.note}
              onOpenProfile={onOpenProfile}
              accent={tierColor}
              leadCell={
                <span
                  style={{
                    ...statValue,
                    fontSize: 36,
                    color: T.cyan,
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                    lineHeight: 1,
                  }}
                >
                  {item.rank}
                </span>
              }
              trailing={<TierPill tier={item.tier} />}
            />
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// BOARDS (tier + position sub-views)
// =============================================================================

function TierBoards({ onOpenProfile }) {
  const { tiers = [] } = founderContent.tierBoards || {};
  return (
    <div style={{ display: "grid", gap: 22 }}>
      {tiers.map((tier) => {
        const color = TIER_COLOR[tier.key] || T.cyan;
        return (
          <div key={tier.key}>
            <div
              style={{
                ...mono,
                fontSize: 11,
                letterSpacing: "0.2em",
                color,
                textTransform: "uppercase",
                fontWeight: 800,
                marginBottom: 6,
                paddingBottom: 6,
                borderBottom: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span>{tier.label}</span>
              <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em", fontWeight: 500, textTransform: "none" }}>
                {tier.items.length} prospect{tier.items.length === 1 ? "" : "s"}
              </span>
            </div>
            {tier.description && (
              <p style={{ fontSize: 12, color: T.textDim, margin: "0 0 10px", lineHeight: 1.55 }}>
                {tier.description}
              </p>
            )}
            {tier.items.length === 0 ? (
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase", padding: "10px 12px", border: `1px dashed ${T.border}` }}>
                No prospects in this tier.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {tier.items.map((item) => (
                  <ProspectRow
                    key={item.prospectName}
                    prospectName={item.prospectName}
                    note={item.note}
                    onOpenProfile={onOpenProfile}
                    accent={color}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PositionBoards({ onOpenProfile }) {
  const { positions = [] } = founderContent.positionBoards || {};
  return (
    <div style={{ display: "grid", gap: 22 }}>
      {positions.map((group) => (
        <div key={group.key}>
          <div
            style={{
              ...mono,
              fontSize: 11,
              letterSpacing: "0.2em",
              color: T.cyan,
              textTransform: "uppercase",
              fontWeight: 800,
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: `1px solid color-mix(in srgb, ${T.cyan} 35%, transparent)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>{group.label}</span>
            <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.14em", fontWeight: 500, textTransform: "none" }}>
              {group.items.length}
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {group.items.map((item, i) => (
              <ProspectRow
                key={item.prospectName}
                prospectName={item.prospectName}
                note={item.note}
                onOpenProfile={onOpenProfile}
                accent={T.cyan}
                leadCell={
                  <span style={{ ...statValue, fontSize: 22, color: T.cyan, fontWeight: 800, lineHeight: 1 }}>
                    {i + 1}
                  </span>
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BoardsSection({ onOpenProfile }) {
  const [view, setView] = useLocalStorageState(
    "prospera.terminal.founders-boards-view",
    "tier",
  );
  return (
    <div>
      <SectionHeader
        title="Boards"
        subtitle="Two ways to slice the class: by realistic outcome tier, or by position depth."
      />
      <div style={{ display: "inline-flex", border: `1px solid ${T.border}`, background: T.surface2, marginBottom: 18 }}>
        {[
          { key: "tier",     label: "By Tier" },
          { key: "position", label: "By Position" },
        ].map((opt, i) => {
          const active = view === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setView(opt.key)}
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.14em",
                color: active ? T.bg : T.textMute,
                background: active ? T.signal : "transparent",
                border: "none",
                borderLeft: i === 0 ? "none" : `1px solid ${T.border}`,
                padding: "8px 14px",
                cursor: "pointer",
                textTransform: "uppercase",
                fontWeight: active ? 700 : 500,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {view === "tier"     && <TierBoards onOpenProfile={onOpenProfile} />}
      {view === "position" && <PositionBoards onOpenProfile={onOpenProfile} />}
    </div>
  );
}

// =============================================================================
// MOCK DRAFT
// =============================================================================

function MockDraftSection({ onOpenProfile }) {
  const { title, subtitle, picks = [], lastUpdated } = founderContent.mockDraft || {};
  return (
    <div>
      <SectionHeader title={title || "My Mock Draft"} subtitle={subtitle} />
      {lastUpdated && (
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase", marginBottom: 18 }}>
          Last updated · {lastUpdated}
        </div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {picks.map((pick) => (
          <ProspectRow
            key={pick.pick + "-" + pick.prospectName}
            prospectName={pick.prospectName}
            note={pick.rationale}
            onOpenProfile={onOpenProfile}
            accent={T.signal}
            leadCell={
              <div>
                <div style={{ ...mono, fontSize: 8, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase", fontWeight: 700 }}>
                  Pick
                </div>
                <div style={{ ...statValue, fontSize: 28, color: T.signal, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>
                  {String(pick.pick).padStart(2, "0")}
                </div>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TAKES (sleepers + risers + fallers + watchlist)
// =============================================================================

const TAKE_ACCENTS = {
  sleepers:  T.signal,
  risers:    T.positive || "#10B981",
  fallers:   T.warn,
  watchlist: T.cyan,
};

function TakesGroupView({ group, accent, onOpenProfile }) {
  if (!group) return null;
  const { label, description, items = [] } = group;
  return (
    <div>
      <div
        style={{
          ...mono,
          fontSize: 11,
          letterSpacing: "0.2em",
          color: accent,
          textTransform: "uppercase",
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {description && (
        <p style={{ fontSize: 12, color: T.textDim, margin: "0 0 12px", lineHeight: 1.55 }}>
          {description}
        </p>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {items.length === 0 ? (
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase", padding: "10px 12px", border: `1px dashed ${T.border}` }}>
            Nothing here yet.
          </div>
        ) : (
          items.map((item) => (
            <ProspectRow
              key={item.prospectName}
              prospectName={item.prospectName}
              note={item.note}
              onOpenProfile={onOpenProfile}
              accent={accent}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TakesSection({ onOpenProfile }) {
  const takes = founderContent.takes || {};
  const [view, setView] = useLocalStorageState(
    "prospera.terminal.founders-takes-view",
    "sleepers",
  );

  const TABS = [
    { key: "sleepers",  label: "Sleepers" },
    { key: "risers",    label: "Risers" },
    { key: "fallers",   label: "Fallers" },
    { key: "watchlist", label: "Watchlist" },
  ];

  return (
    <div>
      <SectionHeader
        title={takes.title || "Takes"}
        subtitle={takes.subtitle || "Where my read diverges from consensus."}
      />
      <div style={{ display: "inline-flex", border: `1px solid ${T.border}`, background: T.surface2, marginBottom: 22 }}>
        {TABS.map((opt, i) => {
          const active = view === opt.key;
          const accent = TAKE_ACCENTS[opt.key];
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setView(opt.key)}
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.14em",
                color: active ? T.bg : T.textMute,
                background: active ? accent : "transparent",
                border: "none",
                borderLeft: i === 0 ? "none" : `1px solid ${T.border}`,
                padding: "8px 14px",
                cursor: "pointer",
                textTransform: "uppercase",
                fontWeight: active ? 700 : 500,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <TakesGroupView
        group={takes[view]}
        accent={TAKE_ACCENTS[view]}
        onOpenProfile={onOpenProfile}
      />
    </div>
  );
}

// =============================================================================
// CLASS NOTES
// =============================================================================

function ClassNotesSection() {
  const { title, sections = [] } = founderContent.classNotes || {};
  return (
    <div>
      <SectionHeader
        title={title || "Class Notes"}
        subtitle="General observations about the class — themes, watch points, things still being evaluated."
      />
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
// UPDATES
// =============================================================================

function UpdatesSection() {
  const { title, subtitle, entries = [] } = founderContent.updates || {};
  return (
    <div>
      <SectionHeader title={title || "Updates"} subtitle={subtitle} />
      <div style={{ display: "grid", gap: 14, maxWidth: 800 }}>
        {entries.map((entry, i) => (
          <article
            key={i}
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${T.cyan}`,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  ...mono,
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  color: T.cyan,
                  background: "var(--prospera-accent-bg)",
                  border: `1px solid var(--prospera-accent-border-faint)`,
                  padding: "3px 8px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {entry.date}
              </span>
              <h3 style={{ fontSize: 16, color: T.text, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
                {entry.title}
              </h3>
            </div>
            <p style={{ fontSize: 14, color: T.textDim, lineHeight: 1.7, margin: 0 }}>
              {entry.body}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ABOUT
// =============================================================================

function AboutSection() {
  const about = founderContent.about || {};
  const { title, intro, voice = [], credentials = [], philosophy = [] } = about;
  return (
    <div style={{ maxWidth: 720 }}>
      <SectionHeader title={title || "About"} />
      {intro && (
        <p style={{ fontSize: 15, color: T.text, lineHeight: 1.75, marginTop: 0, marginBottom: 22 }}>
          {intro}
        </p>
      )}
      {voice.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", color: T.signal, textTransform: "uppercase", fontWeight: 800, margin: "0 0 12px" }}>
            Voice
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {voice.map((line, i) => (
              <p key={i} style={{ fontSize: 14, color: T.textDim, lineHeight: 1.7, margin: 0 }}>
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
      {philosophy.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <h3 style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", color: T.cyan, textTransform: "uppercase", fontWeight: 800, margin: "0 0 12px" }}>
            Philosophy
          </h3>
          <ul style={{ paddingLeft: 18, margin: 0, color: T.textDim, lineHeight: 1.75, fontSize: 14 }}>
            {philosophy.map((line, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {credentials.length > 0 && (
        <div>
          <h3 style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", color: T.textMute, textTransform: "uppercase", fontWeight: 800, margin: "0 0 12px" }}>
            Credentials
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {credentials.map((line, i) => (
              <li
                key={i}
                style={{
                  fontSize: 13,
                  color: T.textDim,
                  paddingLeft: 14,
                  position: "relative",
                  lineHeight: 1.6,
                }}
              >
                <span style={{ position: "absolute", left: 0, top: 0, color: T.cyan }}>·</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

// "Per-Prospect" sub-tab removed. It used to render the localStorage-only
// DeepDivesPage editor, but that data lives per-browser and never travels
// with the share link — so visitors saw an empty editor on a tab labeled
// "Founder's Read", which made no sense. Per-prospect founder commentary
// now lives in Rankings notes, Tier-board notes, Position-board notes,
// Mock Draft rationales, Takes notes, and Updates entries — all
// JSON-authored, all shipped with the deploy.
//
// If long-form per-prospect content (a full essay per prospect) becomes
// the need later, add a `deepDives` array to founderContent.json and
// render it as long-form cards here. Existing localStorage dive data is
// orphaned but preserved; recovery is straightforward.
const SUB_NAVS = [
  { key: "rankings",    label: "Rankings",    subtitle: "Top 15 with notes" },
  { key: "boards",      label: "Boards",      subtitle: "By tier + by position" },
  { key: "mock-draft",  label: "Mock Draft",  subtitle: "Pick-by-pick with rationale" },
  { key: "takes",       label: "Takes",       subtitle: "Sleepers / risers / fallers / watchlist" },
  { key: "class-notes", label: "Class Notes", subtitle: "Themes + watch points" },
  { key: "updates",     label: "Updates",     subtitle: "Chronological log" },
  { key: "about",       label: "About",       subtitle: "Founder bio + philosophy" },
];

export default function FoundersReadPage({ onOpenProfile }) {
  const [subTab, setSubTab] = useLocalStorageState(
    "prospera.terminal.founders-read-sub",
    "rankings",
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Page header */}
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
                padding: "12px 16px",
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

      {/* Active sub-section. If a user has the now-removed "per-prospect" key
          stuck in localStorage from a prior visit, fall back to Rankings
          so they don't land on a blank page. */}
      {(() => {
        const validKeys = SUB_NAVS.map((n) => n.key);
        const resolved = validKeys.includes(subTab) ? subTab : "rankings";
        switch (resolved) {
          case "rankings":    return <RankingsSection onOpenProfile={onOpenProfile} />;
          case "boards":      return <BoardsSection onOpenProfile={onOpenProfile} />;
          case "mock-draft":  return <MockDraftSection onOpenProfile={onOpenProfile} />;
          case "takes":       return <TakesSection onOpenProfile={onOpenProfile} />;
          case "class-notes": return <ClassNotesSection />;
          case "updates":     return <UpdatesSection />;
          case "about":       return <AboutSection />;
          default:            return <RankingsSection onOpenProfile={onOpenProfile} />;
        }
      })()}
    </div>
  );
}
