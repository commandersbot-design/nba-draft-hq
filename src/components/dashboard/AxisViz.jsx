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

function clamp(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
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
    const v = clamp(t[axis]);
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
        const v = clamp(t[axis]);
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
          const v = clamp(t[axis]);
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
                {v ? Math.round(v) : "—"}
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
