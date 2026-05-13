import React from "react";

/**
 * Two trait visualisation styles for the Dashboard decision card.
 *
 * Canonical 8 axes (the `traits9` field is misnamed — actual count is 8):
 *   Offense: Advantage Creation, Shooting Gravity, Passing Creation, Off-Ball Value
 *   Defense: Defensive Versatility, Scalability, Processing Speed, Decision Making
 *
 * Components:
 *   - AxisRadar8 — polar SVG radar, 8 spokes, offense/defense color-coded
 *   - AxisBars8  — 8 horizontal bars grouped in offense / defense pairs
 *
 * Both consume the same `traits9` shape: `{ [axisName]: number }` where the
 * number is the 0-100 (or thereabouts) trait grade. Values are clamped 0-100
 * for display; missing axes render as zero / empty.
 */

const OFFENSE_AXES = [
  "Advantage Creation",
  "Shooting Gravity",
  "Passing Creation",
  "Off-Ball Value",
];
const DEFENSE_AXES = [
  "Defensive Versatility",
  "Scalability",
  "Processing Speed",
  "Decision Making",
];

// Short labels for tight spaces (radar/bar end-caps).
const AXIS_SHORT = {
  "Advantage Creation":   "ADV",
  "Shooting Gravity":     "SHT",
  "Passing Creation":     "PASS",
  "Off-Ball Value":       "OFFB",
  "Defensive Versatility":"DV",
  "Scalability":          "SCL",
  "Processing Speed":     "PROC",
  "Decision Making":      "DM",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const COLORS = {
  offense:    "var(--prospera-cyan)",
  defense:    "var(--prospera-signal)",
  textDim:    "var(--prospera-text-dim)",
  textMute:   "var(--prospera-text-mute)",
  borderSoft: "var(--prospera-border-soft)",
  surface2:   "var(--prospera-surface-2)",
};

// `traits9` values are authored on a 1-10 grade scale (see DeepDives.jsx and
// StatProfilePanelFromTraits which renders "1–10 SCALE"). Both viz styles
// here render against a 0-100 axis, so we map grade → display.
//
// The mapping is also slightly amplified: most college prospects' grades
// cluster in 4-8, so a literal *10 would mean every card looks like it
// fills 40-80% of the bar — differences subtle. Anchoring to 3-10 expands
// that mid-range to ~0-100% so differences POP across cards. A grade of
// 3 or below renders empty (truly weak axis); a grade of 10 pegs full.
//
// If a caller passes a value already in 11-100 range (the new pipeline's
// percentile outputs), we use it as-is and skip the grade transform.
function toDisplay(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 10) {
    // Already on a 0-100 scale; clamp and return.
    return Math.min(100, Math.max(0, n));
  }
  // 1-10 grade → anchored 0-100 spread.
  const spread = ((n - 3) / 7) * 100;
  return Math.min(100, Math.max(0, spread));
}

// =============================================================================
// RADAR
// =============================================================================

/**
 * 8-spoke polar radar. Offense axes occupy the top half (Adv / Sht / Pass / OffB,
 * walking clockwise from the top), defense axes the bottom half (DV / Scl /
 * Proc / DM, walking clockwise from the bottom). The filled polygon is split
 * into two halves so offense and defense can carry their own brand colour.
 */
export function AxisRadar8({ traits9, size = 200 }) {
  const t = traits9 || {};
  // Ordering — clockwise from top: 4 offense, then 4 defense.
  const ordered = [...OFFENSE_AXES, ...DEFENSE_AXES];
  const n = ordered.length;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36; // leave label room
  // Start at the top (-90°), step clockwise.
  const angleFor = (i) => (-Math.PI / 2) + (i * (2 * Math.PI) / n);
  const pointFor = (i, frac) => {
    const ang = angleFor(i);
    return [cx + Math.cos(ang) * r * frac, cy + Math.sin(ang) * r * frac];
  };

  // Guide rings at 25 / 50 / 75 / 100
  const rings = [0.25, 0.5, 0.75, 1];

  // Build polygon points string for the score shape
  const scorePoints = ordered.map((axis, i) => {
    const v = toDisplay(t[axis]);
    const [x, y] = pointFor(i, v / 100);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block" }}
    >
      {/* Guide rings */}
      {rings.map((rr, idx) => {
        const ringPts = ordered.map((_, i) => {
          const [x, y] = pointFor(i, rr);
          return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(" ");
        return (
          <polygon
            key={idx}
            points={ringPts}
            fill="none"
            stroke={COLORS.borderSoft}
            strokeWidth={0.5}
            strokeDasharray={rr === 1 ? "" : "2 3"}
          />
        );
      })}

      {/* Axis spokes */}
      {ordered.map((axis, i) => {
        const [x, y] = pointFor(i, 1);
        return (
          <line
            key={axis}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={COLORS.borderSoft}
            strokeWidth={0.5}
          />
        );
      })}

      {/* Score polygon — split into two halves so offense vs defense can
          carry their own fill colour. We render two trapezoids: idx 0..4 join
          back to centre on the defense side, and 4..8 on the offense side. */}
      <polygon
        points={scorePoints}
        fill="rgba(34,211,238,0.18)"
        stroke={COLORS.offense}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Axis labels — short codes at outer end of each spoke */}
      {ordered.map((axis, i) => {
        const labelR = r + (size * 0.07);
        const ang = angleFor(i);
        const lx = cx + Math.cos(ang) * labelR;
        const ly = cy + Math.sin(ang) * labelR;
        const isOff = OFFENSE_AXES.includes(axis);
        return (
          <text
            key={axis + "-l"}
            x={lx}
            y={ly}
            fontSize={size * 0.055}
            fill={isOff ? COLORS.offense : COLORS.defense}
            textAnchor="middle"
            dominantBaseline="middle"
            style={mono}
            fontWeight={600}
            letterSpacing="0.1em"
          >
            {AXIS_SHORT[axis]}
          </text>
        );
      })}

      {/* Score dots at vertices for emphasis */}
      {ordered.map((axis, i) => {
        const v = toDisplay(t[axis]);
        const [x, y] = pointFor(i, v / 100);
        const isOff = OFFENSE_AXES.includes(axis);
        return (
          <circle
            key={axis + "-d"}
            cx={x}
            cy={y}
            r={2.4}
            fill={isOff ? COLORS.offense : COLORS.defense}
          />
        );
      })}
    </svg>
  );
}

// =============================================================================
// BARS
// =============================================================================

/**
 * 8 horizontal bars in two grouped sections (Offense / Defense). Each bar shows
 * label · filled-bar · numeric value. Bars are colour-coded by group so a row
 * of cards can be scanned for "offense-heavy / defense-heavy" shape.
 */
export function AxisBars8({ traits9 }) {
  const t = traits9 || {};

  const renderGroup = (label, axes, color) => (
    <div>
      <div
        style={{
          ...mono,
          fontSize: 8,
          letterSpacing: "0.18em",
          color,
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {axes.map((axis) => {
          const raw = t[axis];                // original 1-10 grade for the label
          const v = toDisplay(raw);           // 0-100 spread for the bar width
          const rawNum = Number(raw);
          const rawDisplay = Number.isFinite(rawNum) && rawNum > 0
            ? (rawNum <= 10 ? Math.round(rawNum) : Math.round(rawNum / 10))
            : null;
          return (
            <div
              key={axis}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr 22px",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span
                style={{
                  ...mono,
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  color: COLORS.textDim,
                  textTransform: "uppercase",
                  fontWeight: 500,
                }}
              >
                {AXIS_SHORT[axis]}
              </span>
              <div
                style={{
                  height: 6,
                  background: COLORS.surface2,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${v}%`,
                    background: color,
                    transition: "width 0.2s",
                  }}
                />
              </div>
              <span
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "var(--prospera-text)",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {rawDisplay != null ? rawDisplay : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {renderGroup("Offense", OFFENSE_AXES, COLORS.offense)}
      {renderGroup("Defense", DEFENSE_AXES, COLORS.defense)}
    </div>
  );
}
