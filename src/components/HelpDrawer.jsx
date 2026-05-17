import React from "react";
import { X, HelpCircle } from "lucide-react";

/**
 * HelpDrawer — slide-out side drawer with a plain-language guide to the site.
 *
 * The platform uses concepts (outcome tiers, Floor→Ceiling ladders, Founder
 * vs Your Read, trait grades, tier-calls, tags) that read naturally to a
 * scout or basketball-ops type but can feel jargon-heavy for a casual fan.
 * This drawer is the one place those concepts get explained, so anyone
 * landing on the site cold can orient themselves in two minutes.
 *
 * Always-accessible from a "?" button in the top nav. Sticky open state
 * managed by the parent (so the same component can be re-used elsewhere if
 * needed). Content is curated for first-visit clarity, not exhaustive
 * documentation.
 */

const T = {
  bg:         "var(--prospera-bg)",
  surface:    "var(--prospera-surface)",
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

// Tier palette mirrors the Founder's Read tier pills + outcome rails used
// elsewhere on the site, so the glossary tier list reads as the same
// colour-coded language a visitor sees in the wild.
const TIER_DEFS = [
  { label: "Apex",  color: "var(--prospera-signal)",      desc: "Realistic All-Star / generational outcome. Reserve sparingly — a handful per class at most." },
  { label: "Star",  color: "var(--prospera-cyan)",        desc: "Realistic All-Star track. The class's headline names." },
  { label: "Hit",   color: "#10B981",                     desc: "Solid long-term starter. Not a star, but the franchise gets the pick right." },
  { label: "Swing", color: "var(--prospera-warn)",        desc: "Real ceiling AND real floor. Outcome depends on a couple swing factors." },
  { label: "Bust",  color: "var(--prospera-danger)",      desc: "Realistic 'didn't pan out' outcome." },
];

const SECTIONS = [
  {
    title: "What is Prospera Draft HQ?",
    body:
      "A scouting workstation for the 2026 NBA Draft class. It's built so YOU can do your own scouting — sort the class, set tier calls, weight what you care about, write notes, pin a watchlist. The 'Founder's Read' tab is the cherry on top: my personal takes, kept separate from the platform's neutral data layer so you can compare or ignore as you like.",
  },
  {
    title: "How to read the site",
    body:
      "Start on Dashboard — your pinned prospects in one view (Lineup mode = portrait grid, Radar/Bars = deeper read). Click any card to open that prospect's profile. Scout Desk is the full class as a sortable / filterable list — that's where you do most of the work. Founder's Read is everything I've written. Everything else (My Board, Scout Notes, Mock Draft, etc.) is your personal authoring surface.",
  },
];

const CONCEPTS = [
  {
    term: "Outcome Tier",
    body: "How likely a prospect lands at a given NBA outcome. Apex / Star / Hit / Swing / Bust. See the colour-coded list below.",
  },
  {
    term: "Floor → Ceiling",
    body: "Every prospect has a range of outcomes, not a single projection. The 'Floor' is the realistic worst case if things go wrong; the 'Ceiling' is the best case if things break right. Comp ladders use this rung structure: Floor / Low-End / Middle / High-End / Ceiling.",
  },
  {
    term: "Tier Call",
    body: "Your one-line read on a prospect's outcome band. Five options: FL (Floor), LE (Low-End), MID (Middle), HE (High-End), C (Ceiling). Set inline on Scout Desk rows or in the player profile's Scout View tab.",
  },
  {
    term: "Trait Grades",
    body: "8-axis evaluation taxonomy on a 1–10 scale. Four offensive axes (Advantage Creation, Shooting Gravity, Passing Creation, Off-Ball Value) and four defensive (Defensive Versatility, Scalability, Processing Speed, Decision Making). Lives on the Traits tab of each player's profile.",
  },
  {
    term: "Personal Score",
    body: "0-100 prospect score under YOUR custom weights (set them in the Weights drawer). When custom weights are off, this field shows the computed pipeline score instead — so the column always reads as one cyan number per row.",
  },
  {
    term: "Tags",
    body: "30 attributes a prospect can carry — split across Skills (Scoring, Creation, Passing, Defense, etc.), Outlook (Star Upside), and Concerns (Injury Concerns). Assigned by you per prospect via the inline + TAG button on Scout Desk rows. Conflict pairs (e.g., Rhythm Scorer ↔ Pure Scorer) auto-resolve.",
  },
  {
    term: "Risk Profile",
    body: "Eight risk dimensions (Shooting, Physical Translation, Creation Translation, Defensive Role, Processing, Age/Upside, Motor/Consistency, Medical) graded as Clear / Watch / Real Risk / Critical. Surfaces on the Traits tab.",
  },
  {
    term: "Comp Ladder",
    body: "Five-rung Floor→Ceiling comparison to past NBA players, with an outcome tier per rung. Lives on the Comparables tab of each profile. Founder-authored ladders exist for prospects I've written full evals on; computed ladders run for the rest.",
  },
  {
    term: "Founder's Read vs Your Read (in-profile)",
    body: "On each player profile, a toggle near the top switches between the founder's authored grades + risks (what I wrote) and your overrides (what you've changed). Stats / measurables / college numbers don't change between views — only the analysis does.",
  },
  {
    term: "Founder's Read (top nav)",
    body: "The whole tab. My personal rankings, tier boards, position boards, mock draft, takes (sleepers / risers / fallers / watchlist), class notes, updates log, and an about page. All authored by me, all visible to everyone.",
  },
  {
    term: "Divergence Chip (↑N / ↓N)",
    body: "Small pill on Scout Desk rows showing how much your tier call differs from the prospect's consensus rank. ↑ in cyan = you're bullish (you have them higher than the market). ↓ in warn = you're bearish. The number is tier slots between calls.",
  },
];

const PAGE_GUIDE = [
  { name: "Dashboard",     desc: "Pinned prospects in one quick-glance view. Pick the layout (Lineup / Radar / Bars). Top 12 auto-pinned by default; pin / unpin to taste." },
  { name: "Scout Desk",    desc: "The full class as a sortable, filterable list. Inline tier calls + tag editing per row. Bulk-select to tag multiple prospects at once." },
  { name: "My Board",      desc: "Your personal big board. Drag to reorder; multiple modes (manual / preset weights / team-need weights). Save and load multiple boards." },
  { name: "Scout Notes",   desc: "Master-detail editor for your Floor→Ceiling tier-call notes. Pick a prospect on the left, write per-rung notes on the right." },
  { name: "Founder's Read",desc: "My take. Rankings + tier boards + position boards + mock draft + sleepers / risers / fallers / watchlist + class notes + updates log + about." },
  { name: "Mock Draft",    desc: "60-pick simulation. Drag prospects onto pick slots; team needs surface alongside each pick. Export to JSON or print." },
  { name: "Class Map",     desc: "Scatter visualization of the whole class. Useful for seeing the shape of the class — which positions are deep, where the cliffs are." },
  { name: "Compare",       desc: "Side-by-side deep comparison of 2-3 prospects. Pulls every trait, risk, and stat onto a single page." },
  { name: "Notes",         desc: "Free-text per-prospect quick notes. The lightest-weight surface — for one-liners and observations you don't want to lose." },
  { name: "Historical",    desc: "The historical NBA outcome archive used by the comp engine. Browse past prospects by outcome tier to recalibrate the band." },
];

const PROFILE_TABS = [
  { name: "Scout View",  desc: "Your per-prospect tier-call summary. Set the FL/LE/MID/HE/C tier and write narrative notes per rung." },
  { name: "Stats",       desc: "Real college stats — counting line (Per Game / Per 36 / Per 100), advanced metrics (TS%, eFG%, USG%, etc.), shooting splits, shot diet, defensive metrics, and shot distribution chart when available." },
  { name: "Evaluation",  desc: "The Story narrative + tier override + tag editor + 'What's Driving the Grade' rationale." },
  { name: "Traits",      desc: "The 8-axis trait grading on a 1-10 scale, grouped by Offence and Defence. Risk profile and Model Output (Tier / Personal Score / Percentile) live on the right side." },
  { name: "Comparables", desc: "Comp Constellation (star-map of nearest historical neighbors) + Authored ladder (when I've written one) + Computed Outcomes ladder. Pin or hide comps to refine." },
  { name: "Notes",       desc: "Quick free-text notes log for this prospect, newest first." },
];

export default function HelpDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop — dims the rest of the site so the drawer is the focus.
          Click anywhere outside the drawer to close. */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 10, 18, 0.7)",
          zIndex: 99,
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(560px, 100vw)",
          background: T.surface,
          borderLeft: `1px solid ${T.border}`,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 0 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.2em", color: T.textMute, textTransform: "uppercase", fontWeight: 700 }}>
              Prospera Draft HQ
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 2, letterSpacing: "-0.01em" }}>
              How to read the site
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close guide"
            style={{
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.textDim,
              padding: 5,
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 32px", display: "grid", gap: 26 }}>
          {/* TOP-LEVEL SECTIONS (What is this / How to read) */}
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3
                style={{
                  ...mono,
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: T.cyan,
                  textTransform: "uppercase",
                  fontWeight: 800,
                  margin: "0 0 8px",
                }}
              >
                {s.title}
              </h3>
              <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, margin: 0 }}>
                {s.body}
              </p>
            </section>
          ))}

          {/* OUTCOME TIERS — colour-coded list. This is the most-encountered
              jargon (every Founder's Read row carries a tier pill) so it
              gets its own section above the general concept glossary. */}
          <section>
            <h3
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.22em",
                color: T.signal,
                textTransform: "uppercase",
                fontWeight: 800,
                margin: "0 0 12px",
              }}
            >
              Outcome Tiers
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {TIER_DEFS.map((t) => (
                <div
                  key={t.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      color: t.color,
                      border: `1px solid ${t.color}`,
                      background: `color-mix(in srgb, ${t.color} 12%, transparent)`,
                      padding: "4px 9px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    }}
                  >
                    {t.label}
                  </span>
                  <p style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, margin: 0 }}>
                    {t.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* KEY CONCEPTS — alphabetized-ish glossary */}
          <section>
            <h3
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.22em",
                color: T.cyan,
                textTransform: "uppercase",
                fontWeight: 800,
                margin: "0 0 12px",
              }}
            >
              Key Concepts
            </h3>
            <div style={{ display: "grid", gap: 12 }}>
              {CONCEPTS.map((c) => (
                <div key={c.term}>
                  <div style={{ fontSize: 14, color: T.text, fontWeight: 700, marginBottom: 3 }}>
                    {c.term}
                  </div>
                  <p style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, margin: 0 }}>
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* MAIN NAV TAB GUIDE */}
          <section>
            <h3
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.22em",
                color: T.cyan,
                textTransform: "uppercase",
                fontWeight: 800,
                margin: "0 0 12px",
              }}
            >
              The 10 Tabs
            </h3>
            <div style={{ display: "grid", gap: 10 }}>
              {PAGE_GUIDE.map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "130px 1fr",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      color: T.cyan,
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    {p.name}
                  </span>
                  <p style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* PLAYER PROFILE SUB-TABS */}
          <section>
            <h3
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.22em",
                color: T.cyan,
                textTransform: "uppercase",
                fontWeight: 800,
                margin: "0 0 12px",
              }}
            >
              Inside a Player Profile
            </h3>
            <p style={{ fontSize: 13, color: T.textMute, lineHeight: 1.55, margin: "0 0 12px" }}>
              Click any prospect anywhere on the site to open their profile. The profile has 6 tabs:
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {PROFILE_TABS.map((p) => (
                <div
                  key={p.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "130px 1fr",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      ...mono,
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      color: T.signal,
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    {p.name}
                  </span>
                  <p style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, margin: 0 }}>
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer hint */}
          <div
            style={{
              borderTop: `1px solid ${T.borderSoft}`,
              paddingTop: 16,
              ...mono,
              fontSize: 10,
              letterSpacing: "0.14em",
              color: T.textMute,
              textTransform: "uppercase",
            }}
          >
            Hover the Apex/Star/Hit/Swing/Bust pills anywhere on the site for a quick reminder of what each tier means.
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * HelpButton — small button suitable for placement in a nav strip. Click to
 * open the HelpDrawer. Designed to be visually quiet but discoverable.
 */
export function HelpButton({ onClick, label = "Guide" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Open the Prospera Draft HQ guide — explains tiers, scores, tags, and how each tab works."
      style={{
        ...mono,
        fontSize: 9,
        letterSpacing: "0.16em",
        color: T.cyan,
        background: "transparent",
        border: `1px solid var(--prospera-accent-border-faint)`,
        padding: "6px 10px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        textTransform: "uppercase",
        fontWeight: 700,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.cyan; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--prospera-accent-border-faint)"; }}
    >
      <HelpCircle size={11} />
      {label}
    </button>
  );
}
