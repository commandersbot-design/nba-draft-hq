import React, { useMemo, createContext, useContext } from "react";
import { X, RefreshCw } from "lucide-react";
import { deriveAdvantageProfile } from "./AdvantageBars";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

const T = {
  bg: "#050A12",
  surface: "rgba(15, 23, 42, 0.92)",
  surfaceSolid: "#0A0F1C",
  border: "#1F2937",
  borderSoft: "rgba(31, 41, 55, 0.6)",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMute: "#64748B",
  cyan: "#22D3EE",
  warn: "#F59E0B",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

// The 9 advantage traits + 1 meta layer (Translate). Default weights model a
// "balanced two-way wing" priority — adjust to taste.
export const TRAIT_AXES = [
  { key: "translate", label: "Translate", region: "Meta", help: "Projection / NBA fit" },
  { key: "initiate", label: "Initiate", region: "On-Ball", help: "Self-creation, advantage building" },
  { key: "extend", label: "Extend", region: "On-Ball", help: "Secondary playmaking" },
  { key: "close", label: "Close", region: "On-Ball", help: "Finishing, shot-making" },
  { key: "space", label: "Space", region: "Off-Ball", help: "Off-ball gravity, shooting" },
  { key: "connect", label: "Connect", region: "Off-Ball", help: "Glue plays, cuts, passing" },
  { key: "contain", label: "Contain", region: "Defense", help: "POA defense, on-ball" },
  { key: "disrupt", label: "Disrupt", region: "Defense", help: "Rim protection, steals" },
  { key: "switch", label: "Switch", region: "Defense", help: "Positional range" },
  { key: "transition", label: "Transition", region: "Game-State", help: "Pace impact" },
];

// Phase B: Statistical indicator axes — analytics-style adjustments. For
// prospects with rich data (Stathead CBB / NBA stats), values come from real
// numbers. For 2026 prospects without per-game stats yet, trait grades serve
// as proxies. User can dial these in alongside trait grades.
export const STAT_INDICATOR_AXES = [
  { key: "bpm", label: "BPM", region: "Stats", help: "Box Plus/Minus (CBB if available, composite proxy otherwise)" },
  { key: "age_curve", label: "Age Curve", region: "Stats", help: "Younger = bigger NBA upside (22-age × ~7)" },
  { key: "shooting_threat", label: "Shooting Threat", region: "Stats", help: "3P% × volume (proxy: Shooting Gravity trait)" },
  { key: "steal_rate", label: "Steal Rate", region: "Stats", help: "Best NBA defensive predictor (proxy: Defensive Versatility)" },
  { key: "ast_usg", label: "AST/USG", region: "Stats", help: "Pure playmaker vs scoring-dominant (proxy: Passing Creation)" },
  { key: "plus_minus", label: "Plus/Minus", region: "Stats", help: "On/off impact for older prospects (career WS proxy)" },
  { key: "league_translation", label: "League Translate", region: "Stats", help: "NCAA 0.6× / G-League 0.95× / Euro 0.85× / NBA 1.0×" },
];

export const ALL_AXES = [...TRAIT_AXES, ...STAT_INDICATOR_AXES];

export const DEFAULT_WEIGHTS = {
  // Trait grades (default balanced)
  translate: 12,
  initiate: 12,
  extend: 8,
  close: 12,
  space: 10,
  connect: 8,
  contain: 10,
  disrupt: 8,
  switch: 10,
  transition: 10,
  // Stat indicators (default off — opt in)
  bpm: 0,
  age_curve: 0,
  shooting_threat: 0,
  steal_rate: 0,
  ast_usg: 0,
  plus_minus: 0,
  league_translation: 0,
};

export const ZERO_WEIGHTS = ALL_AXES.reduce((acc, axis) => {
  acc[axis.key] = 0;
  return acc;
}, {});

// Compute a 0-100 statistical indicator value from a prospect's available
// data. Falls back to trait-grade proxies when raw stats aren't there yet
// (mostly the case for 2026 current prospects).
export function computeStatValue(prospect, key) {
  if (!prospect) return null;
  const t = prospect.traits9 || {};
  const cbb = prospect.cbbStats || null;
  const sr = prospect.srNbaStats || null;
  const nba = prospect.nbaStats || null;

  switch (key) {
    case "bpm": {
      // Real college BPM scaled to 0-100: BPM 5 → 75, BPM 0 → 50, BPM -5 → 25
      const cbbBpm = cbb?.bpm;
      if (cbbBpm != null) return Math.max(0, Math.min(100, 50 + cbbBpm * 5));
      // Proxy: composite trait avg
      const grades = Object.values(t).filter((v) => Number.isFinite(v));
      if (grades.length > 0) {
        const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
        return Math.max(0, Math.min(100, avg * 10));
      }
      return null;
    }
    case "age_curve": {
      const age = prospect.age;
      if (age == null) return null;
      // 18 → 78, 19 → 71, 22 → 50, 25 → 29
      return Math.max(0, Math.min(100, 50 + (22 - age) * 7));
    }
    case "shooting_threat": {
      const threePct = cbb?.threePct;
      if (threePct != null) {
        // 35% → 52, 40% → 60, 45% → 67
        return Math.max(0, Math.min(100, threePct * 1.5));
      }
      // Proxy: Shooting Gravity trait (1-10 → 0-100)
      const sg = t["Shooting Gravity"];
      if (sg != null) return Math.max(0, Math.min(100, sg * 10));
      return null;
    }
    case "steal_rate": {
      const spg = Number(nba?.careerSpg) || Number(sr?.tsPct) || null;
      if (Number.isFinite(spg)) {
        // 1.5 SPG → 75
        return Math.max(0, Math.min(100, spg * 50));
      }
      // Proxy: Defensive Versatility trait
      const dv = t["Defensive Versatility"];
      if (dv != null) return Math.max(0, Math.min(100, dv * 10));
      return null;
    }
    case "ast_usg": {
      const apg = Number(nba?.careerApg);
      const ppg = Number(nba?.careerPpg);
      if (Number.isFinite(apg) && Number.isFinite(ppg) && ppg > 0) {
        // Pure playmaker has high apg per ppg/10. Scale: apg=8/ppg=18 → 4.4 → 88
        const ratio = apg / Math.max(1, ppg / 10);
        return Math.max(0, Math.min(100, ratio * 20));
      }
      // Proxy: Passing Creation trait
      const pc = t["Passing Creation"];
      if (pc != null) return Math.max(0, Math.min(100, pc * 10));
      return null;
    }
    case "plus_minus": {
      const ws = Number(sr?.winShares) || null;
      if (Number.isFinite(ws)) {
        // 100 WS → 50, 200 WS → 100
        return Math.max(0, Math.min(100, ws * 0.5));
      }
      // Proxy: prospect.score (overall composite)
      if (prospect.score != null) return prospect.score;
      return null;
    }
    case "league_translation": {
      const league = (prospect.leagueType || cbb?.source || "").toLowerCase();
      if (/ncaa|college/.test(league)) return 60;
      if (/g[\-\s]?league|nba g/.test(league)) return 95;
      if (/euro/.test(league)) return 85;
      if (/international|fiba|aussie|nbl/.test(league)) return 80;
      if (/nba/.test(league)) return 100;
      // Default neutral
      return 60;
    }
  }
  return null;
}

// Compute a 0-100 personal score from a prospect + weights. Combines:
//   1. Trait axes (initiate/extend/close/space/connect/contain/disrupt/switch/transition + translate)
//      pulled from advantage profile (authored or derived)
//   2. Statistical indicator axes (BPM, age curve, shooting threat, steal rate,
//      AST/USG, plus/minus, league translation) computed from raw data with
//      trait-grade proxies as fallbacks
// Each axis contributes its value × weight; final score is the weighted average.
export function computePersonalScore(prospect, weights) {
  if (!prospect || !weights) return null;
  const profile = deriveAdvantageProfile(prospect);

  let total = 0;
  let totalWeight = 0;

  // Trait axes
  for (const axis of TRAIT_AXES) {
    const w = weights[axis.key] || 0;
    if (w <= 0) continue;
    let value;
    if (axis.key === "translate") {
      value = profile?.translate?.archetype ?? null;
    } else {
      value = profile?.traits?.[axis.key]?.archetype?.score ?? null;
    }
    if (value == null) continue;
    total += value * w;
    totalWeight += w;
  }

  // Statistical indicator axes
  for (const axis of STAT_INDICATOR_AXES) {
    const w = weights[axis.key] || 0;
    if (w <= 0) continue;
    const value = computeStatValue(prospect, axis.key);
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

// Small helper for inline score displays. When custom weighting is off,
// renders the fallback (typically "—"). When on, renders the user's
// personalized score formatted to one decimal.
export const ScoreCell = ({ prospect, fallback = "—", style, decimals = 1 }) => {
  const { displayScore } = useCustomWeights();
  const score = displayScore(prospect);
  if (score == null) return <span style={style}>{fallback}</span>;
  return <span style={style}>{score.toFixed(decimals)}</span>;
};

export const CustomWeightsDrawer = ({ open, onClose, weights, setWeights, active, setActive }) => {
  const total = ALL_AXES.reduce((acc, a) => acc + (weights[a.key] || 0), 0);

  const setOne = (key, value) => {
    setWeights((curr) => ({ ...curr, [key]: Math.max(0, Math.min(40, Math.round(value))) }));
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
        Slide each trait to set how much it counts. Higher = more important. The mix gets normalized; absolute totals don't matter, ratios do.
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
        <SliderSection
          title="Trait Grades"
          subtitle="Scout-judgment axes from the 9-trait Advantage system"
          axes={TRAIT_AXES}
          weights={weights}
          total={total}
          setOne={setOne}
        />
        <SliderSection
          title="Statistical Indicators"
          subtitle="Analytics-style axes (BPM, age curve, shooting threat, etc.). Default off — opt in."
          axes={STAT_INDICATOR_AXES}
          weights={weights}
          total={total}
          setOne={setOne}
        />
      </div>

      <div style={{ padding: "12px 18px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: T.textMute, textTransform: "uppercase" }}>
          Sum: {total}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
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
    </div>
  );
};

function SliderSection({ title, subtitle, axes, weights, total, setOne }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.cyan, textTransform: "uppercase", fontWeight: 600 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, lineHeight: 1.5 }}>{subtitle}</div>
        )}
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {axes.map((axis) => {
          const value = weights[axis.key] || 0;
          const sharePct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={axis.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{axis.label}</div>
                  <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2, textTransform: "uppercase" }}>
                    {axis.region} · {axis.help}
                  </div>
                </div>
                <div style={{ ...mono, fontSize: 11, color: value > 0 ? T.cyan : T.textMute, fontWeight: 600, minWidth: 72, textAlign: "right" }}>
                  {value} <span style={{ color: T.textMute, fontSize: 9 }}>· {sharePct}%</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={value}
                onChange={(e) => setOne(axis.key, Number(e.target.value))}
                style={{ width: "100%", accentColor: T.cyan }}
              />
            </div>
          );
        })}
      </div>
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
