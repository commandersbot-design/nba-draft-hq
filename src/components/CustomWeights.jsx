import React, { useMemo, createContext, useContext } from "react";
import { X, RefreshCw } from "lucide-react";
// deriveAdvantageProfile no longer needed — personal score now computed from
// traits9 directly via the 6-axis scout taxonomy. Import removed.
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { getProspectScoresByName } from "../grading/precomputed";

// PROSPERA · Signal Orange tokens — single source: src/styles/tokens.css.
const T = {
  bg:           "var(--prospera-bg)",
  surface:      "var(--prospera-surface-cw)",
  surfaceSolid: "var(--prospera-surface-solid)",
  border:       "var(--prospera-border)",
  borderSoft:   "var(--prospera-border-soft)",
  text:         "var(--prospera-text)",
  textDim:      "var(--prospera-text-dim)",
  textMute:     "var(--prospera-text-mute)",
  cyan:         "var(--prospera-cyan)",
  accentBg:     "var(--prospera-accent-bg)",
  signal:       "var(--prospera-signal)",
  warn:         "var(--prospera-warn)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

// Six scout-readable weighting categories. Each one is a label a scout would
// actually use when describing what they value in a prospect — not internal
// pipeline jargon like "initiate / extend / contain / disrupt". Each category
// is a blend of one or more 1-10 trait grades from the canonical 8-axis
// taxonomy (see traits9). Categories can overlap (e.g. Shooting Gravity
// feeds both Scoring and Shooting) so a user who weights both Shooting AND
// Scoring is signalling "I care extra about scoring that comes from shooting"
// — exactly what they'd say in plain language.
//
// Sliders are INDEPENDENT (no shared budget cap). Each axis is 0-100 and the
// final score is a weighted average — only ratios matter, so independent
// sliders read naturally as "how much do I care about this?".
export const SCOUT_AXES = [
  {
    key: "scoring",
    label: "Scoring",
    help: "Self-creation, finishing, getting buckets at any level",
    blend: { "Advantage Creation": 0.5, "Shooting Gravity": 0.3, "Off-Ball Value": 0.2 },
  },
  {
    key: "shooting",
    label: "Shooting",
    help: "Perimeter shooting + the spacing gravity it creates",
    blend: { "Shooting Gravity": 1.0 },
  },
  {
    key: "passing",
    label: "Passing",
    help: "Playmaking, court vision, assist creation",
    blend: { "Passing Creation": 0.6, "Decision Making": 0.4 },
  },
  {
    key: "defense",
    label: "Defense",
    help: "On-ball pressure + help / rotations",
    blend: { "Defensive Versatility": 0.7, "Scalability": 0.3 },
  },
  {
    key: "feel",
    label: "Feel / IQ",
    help: "Decision-making, processing speed, anticipation",
    blend: { "Decision Making": 0.5, "Processing Speed": 0.5 },
  },
  {
    key: "versatility",
    label: "Versatility",
    help: "Lineup flexibility, switchability, fits multiple roles",
    blend: { "Scalability": 0.7, "Defensive Versatility": 0.3 },
  },
];

// Back-compat aliases — some surfaces import ALL_AXES expecting the legacy
// pipeline shape. Point them at the new scout list so the imports keep
// resolving without code churn.
export const ALL_AXES = SCOUT_AXES;
export const TRAIT_AXES = SCOUT_AXES;
export const STAT_INDICATOR_AXES = [];

// Default weights — start each axis with a moderate non-zero value so that
// when the user activates custom weights for the first time they get a
// reasonable balanced read rather than zeros. Ratios are what matter; these
// numbers just express "all roughly equal, slight emphasis on Scoring +
// Defense" as a balanced two-way starting bias.
export const DEFAULT_WEIGHTS = {
  scoring:     25,
  shooting:    20,
  passing:     15,
  defense:     25,
  feel:        15,
  versatility: 15,
};

export const ZERO_WEIGHTS = ALL_AXES.reduce((acc, axis) => {
  acc[axis.key] = 0;
  return acc;
}, {});

// Compute a 0-100 value for a scout axis (Scoring / Shooting / Passing / etc.)
// from a prospect's 8 underlying trait grades. Each axis is a weighted blend
// defined on SCOUT_AXES — e.g. "Scoring" = 50% Advantage Creation + 30%
// Shooting Gravity + 20% Off-Ball Value. Grades are 1-10; output is 0-100.
function computeScoutAxisValue(prospect, axisKey) {
  const blend = SCOUT_AXES.find((a) => a.key === axisKey)?.blend;
  if (!blend) return null;
  const traits = prospect?.traits9 || {};
  let sum = 0;
  let weight = 0;
  for (const [traitName, w] of Object.entries(blend)) {
    const v = traits[traitName];
    if (v == null) continue;
    sum += v * w;
    weight += w;
  }
  if (weight <= 0) return null;
  // 1-10 grade → 0-100 display range.
  return Math.max(0, Math.min(100, (sum / weight) * 10));
}

// Compute a 0-100 personal score from a prospect + weights. Iterates the
// six scout-readable axes, computes each axis's 0-100 value from the
// underlying trait blend, and returns the weighted average. Independent
// sliders — only the ratios between weights matter.
export function computePersonalScore(prospect, weights) {
  if (!prospect || !weights) return null;
  let total = 0;
  let totalWeight = 0;
  for (const axis of SCOUT_AXES) {
    const w = weights[axis.key] || 0;
    if (w <= 0) continue;
    const value = computeScoutAxisValue(prospect, axis.key);
    if (value == null) continue;
    total += value * w;
    totalWeight += w;
  }
  if (totalWeight <= 0) return null;
  return Math.round((total / totalWeight) * 10) / 10;
}

// ---------- CONTEXT ----------
const CustomWeightsContext = createContext(null);

export function CustomWeightsProvider({ children }) {
  const [weights, setWeights] = useLocalStorageState("prospera.terminal.custom-weights", DEFAULT_WEIGHTS);
  const [active, setActive] = useLocalStorageState("prospera.terminal.custom-weights-active", false);
  const value = useMemo(() => ({
    weights,
    setWeights,
    active,
    setActive,
    // Returns the user's personalized score for a prospect, or null when
    // custom weighting is off (so display sites can hide the score).
    displayScore: (prospect) => (active ? computePersonalScore(prospect, weights) : null),
  }), [weights, active, setWeights, setActive]);
  return <CustomWeightsContext.Provider value={value}>{children}</CustomWeightsContext.Provider>;
}

export function useCustomWeights() {
  const ctx = useContext(CustomWeightsContext);
  if (!ctx) {
    // Safe fallback when used outside provider — no score, no-ops.
    return {
      weights: DEFAULT_WEIGHTS,
      setWeights: () => {},
      active: false,
      setActive: () => {},
      displayScore: () => null,
    };
  }
  return ctx;
}

// Small helper for inline score displays. Shows the user's personal-weights
// score when custom weights are active (1 decimal); otherwise falls back to
// the computed pipeline score (integer). The fallback was previously just
// "—", which meant every row showed an em-dash by default until the user
// activated custom weights — confusing for first-time visitors who had no
// reason to know what custom weights even are.
export const ScoreCell = ({ prospect, fallback = "—", style, decimals = 1 }) => {
  const { displayScore } = useCustomWeights();
  const personal = displayScore(prospect);
  if (personal != null) {
    return <span style={style}>{personal.toFixed(decimals)}</span>;
  }
  // Fall back to the new pipeline's computed display score so the row
  // always carries a real number when one exists. Lazy lookup — most code
  // paths hit this when the prospect has a precomputed entry; international
  // prospects without NCAA data fall through to the fallback string.
  const computed = prospect?.name ? getProspectScoresByName(prospect.name) : null;
  const display = computed?.summary?.overallDisplay;
  if (display != null) {
    return <span style={style}>{Math.round(display)}</span>;
  }
  return <span style={style}>{fallback}</span>;
};

// Independent slider range. Sliders no longer share a global budget — each
// axis runs 0-100 freely. The personal-score math takes a weighted average
// of the active axes, so ratios between weights are what matter; absolute
// values just express how strongly the user cares about each category.
export const PER_AXIS_MAX = 100;
// Back-compat constants for any caller that still imports them. No longer
// enforced; kept so imports don't break.
export const TOTAL_CAP = 100;
export const PER_AXIS_CAP = 100;

export const CustomWeightsDrawer = ({ open, onClose, weights, setWeights, active, setActive }) => {
  const setOne = (key, value) => {
    // Independent slider: only the axis being moved changes. No squeezing
    // of others to maintain a shared total — that was the source of the
    // "all the sliders move when I drag one" complaint.
    setWeights((curr) => ({
      ...curr,
      [key]: Math.max(0, Math.min(PER_AXIS_MAX, Math.round(value))),
    }));
  };

  const reset = () => setWeights({ ...DEFAULT_WEIGHTS });
  const zeroAll = () => setWeights({ ...ZERO_WEIGHTS });

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(420px, 100vw)",
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        backdropFilter: "blur(8px)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 0 60px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase" }}>Prospera Lens</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 2 }}>Custom Weights</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.textDim, padding: 4, cursor: "pointer", display: "flex" }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase" }}>Status</div>
          <div style={{ fontSize: 12, color: active ? T.cyan : T.textDim, marginTop: 4, fontWeight: 600 }}>
            {active ? "Active · scores reflect your weights" : "Off · scores hidden everywhere"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActive(!active)}
          style={{
            ...mono,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: active ? T.bg : T.cyan,
            background: active ? T.cyan : "transparent",
            border: `1px solid ${T.cyan}`,
            padding: "6px 12px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {active ? "Disable" : "Enable"}
        </button>
      </div>

      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.textDim, lineHeight: 1.55 }}>
        Slide each category to set how much you care about it. Sliders are independent — moving one doesn't change the others. Only the ratios between them matter; the personal score weighs each category accordingly.
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
        <SliderSection
          axes={SCOUT_AXES}
          weights={weights}
          setOne={setOne}
        />
      </div>

      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
        <button
          type="button"
          onClick={zeroAll}
          style={pillBtn(T.textMute)}
        >
          ZERO
        </button>
        <button
          type="button"
          onClick={reset}
          style={pillBtn(T.textDim)}
        >
          <RefreshCw size={11} /> RESET
        </button>
      </div>
    </div>
  );
};

function SliderSection({ axes, weights, setOne }) {
  // Total only used for showing each axis's relative share (the actual
  // score math uses the ratios). When all sliders are 0, share renders as 0%.
  const total = axes.reduce((acc, a) => acc + (weights[a.key] || 0), 0);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {axes.map((axis) => {
        const value = weights[axis.key] || 0;
        const sharePct = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div key={axis.key}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, color: T.text, fontWeight: 700 }}>{axis.label}</div>
                <div style={{ fontSize: 11, color: T.textDim, marginTop: 2, lineHeight: 1.45 }}>
                  {axis.help}
                </div>
              </div>
              <div style={{ ...mono, fontSize: 11, color: value > 0 ? T.cyan : T.textMute, fontWeight: 700, minWidth: 78, textAlign: "right" }}>
                {value}
                <span style={{ color: T.textMute, fontSize: 9, marginLeft: 4 }}>
                  · {sharePct}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(e) => setOne(axis.key, Number(e.target.value))}
              style={{ width: "100%", accentColor: T.cyan }}
            />
          </div>
        );
      })}
    </div>
  );
}

function pillBtn(color) {
  return {
    fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color,
    background: "transparent",
    border: `1px solid ${color}`,
    padding: "5px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 5,
  };
}
