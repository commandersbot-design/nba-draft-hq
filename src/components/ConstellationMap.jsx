import React, { useMemo, useState } from "react";

// Tokens are kept local so this component stays self-contained even when
// imported elsewhere later.
const C = {
  bg: "#050A12",
  surface: "rgba(15, 23, 42, 0.6)",
  border: "#1F2937",
  borderSoft: "rgba(31, 41, 55, 0.6)",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMute: "#64748B",
  cyan: "#22D3EE",
  ringSoft: "rgba(34, 211, 238, 0.08)",
  ringMute: "rgba(148, 163, 184, 0.16)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const OUTCOME_COLORS = {
  Star: "#22D3EE",     // cyan
  Outlier: "#22D3EE",  // alias used by the seed dataset
  Hit: "#3B82F6",      // blue
  Swing: "#F59E0B",    // amber/orange
  Bust: "#64748B",     // muted gray
};

const OUTCOME_LABELS = ["Star", "Hit", "Swing", "Bust"];

// ---------- LAYOUT MATH ----------
const YEAR_MIN = 2000;
const YEAR_MAX = 2025;
const CENTER_GAP = 38;        // px around the center prospect that comps cannot enter
const RIM_PADDING = 20;       // px from outer edge of svg
const NODE_MIN = 4;
const NODE_MAX = 14;
const SIM_MIN_FOR_DISPLAY = 1; // anything ≤ this isn't worth drawing

function angleForYear(year) {
  const range = YEAR_MAX - YEAR_MIN;
  const clamped = Math.max(YEAR_MIN, Math.min(YEAR_MAX, year));
  // 0 (year=YEAR_MIN) -> -π/2 (top), sweep clockwise to 3π/2 = π*1.5 (also top after full circle).
  // We map full range to 0..2π and offset so YEAR_MIN sits at 12 o'clock (-π/2).
  const t = (clamped - YEAR_MIN) / range;
  return -Math.PI / 2 + t * Math.PI * 2;
}

function radiusForSim(sim, maxSim, available) {
  // Higher similarity -> smaller radius (closer to center).
  // sim=maxSim -> radius=CENTER_GAP. sim=0 -> radius=available.
  if (maxSim <= 0) return available;
  const closeness = Math.max(0, Math.min(1, sim / maxSim));
  return CENTER_GAP + (1 - closeness) * (available - CENTER_GAP);
}

function sizeForSim(sim, maxSim) {
  if (maxSim <= 0) return NODE_MIN;
  const t = Math.max(0, Math.min(1, sim / maxSim));
  return NODE_MIN + t * (NODE_MAX - NODE_MIN);
}

// ---------- COMPONENT ----------
export const ConstellationMap = ({ player, comparables, size = 480, onSelect }) => {
  const [hovered, setHovered] = useState(null);
  const top = useMemo(
    () =>
      (comparables || [])
        .filter((entry) => entry?.score > SIM_MIN_FOR_DISPLAY && entry.historical?.draftYear)
        .slice(0, 20),
    [comparables]
  );

  if (!player || top.length === 0) {
    return (
      <div style={{ ...mono, fontSize: 11, color: C.textMute, letterSpacing: "0.12em", padding: 24 }}>
        NOT ENOUGH HISTORICAL MATCHES TO DRAW A CONSTELLATION
      </div>
    );
  }

  const half = size / 2;
  const available = half - RIM_PADDING;
  const maxSim = top[0].score;

  const placed = top.map((entry) => {
    const angle = angleForYear(entry.historical.draftYear);
    const radius = radiusForSim(entry.score, maxSim, available);
    const x = half + Math.cos(angle) * radius;
    const y = half + Math.sin(angle) * radius;
    const r = sizeForSim(entry.score, maxSim);
    const color = OUTCOME_COLORS[entry.historical.outcomeTier] || C.textMute;
    return { ...entry, x, y, r, color };
  });

  const ringRadii = [available * 0.33, available * 0.66, available];
  const yearTicks = [2000, 2006, 2012, 2018, 2024];
  const hoveredEntry = hovered != null ? placed.find((p) => p.historical.id === hovered) : null;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: C.textMute, textTransform: "uppercase" }}>Prospera Lens</div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 2 }}>Constellation</div>
        </div>
        <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Top {placed.length} historical comps
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, padding: 16 }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          style={{ display: "block", maxWidth: size }}
          role="img"
          aria-label={`Historical comparables for ${player.name}`}
          onMouseLeave={() => setHovered(null)}
        >
          {/* radial rings */}
          {ringRadii.map((r, i) => (
            <circle
              key={i}
              cx={half}
              cy={half}
              r={r}
              fill="none"
              stroke={i === ringRadii.length - 1 ? C.borderSoft : C.ringMute}
              strokeWidth={1}
              strokeDasharray={i === ringRadii.length - 1 ? "2 4" : "1 4"}
            />
          ))}

          {/* year ticks (around the outer rim) */}
          {yearTicks.map((y) => {
            const a = angleForYear(y);
            const tx = half + Math.cos(a) * (available + 8);
            const ty = half + Math.sin(a) * (available + 8);
            return (
              <text
                key={y}
                x={tx}
                y={ty}
                fill={C.textMute}
                fontFamily={mono.fontFamily}
                fontSize={9}
                textAnchor="middle"
                dominantBaseline="middle"
                letterSpacing="0.12em"
              >
                {y}
              </text>
            );
          })}

          {/* connecting lines */}
          {placed.map((p) => (
            <line
              key={`line-${p.historical.id}`}
              x1={half}
              y1={half}
              x2={p.x}
              y2={p.y}
              stroke={hovered === p.historical.id ? p.color : C.ringSoft}
              strokeWidth={hovered === p.historical.id ? 1.5 : 0.5}
            />
          ))}

          {/* comp nodes */}
          {placed.map((p) => (
            <g
              key={p.historical.id}
              onMouseEnter={() => setHovered(p.historical.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect?.(p.historical)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r + 3}
                fill={p.color}
                opacity={hovered === p.historical.id ? 0.18 : 0.08}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={p.color}
                stroke={C.bg}
                strokeWidth={1}
              />
            </g>
          ))}

          {/* center: current prospect */}
          <circle cx={half} cy={half} r={CENTER_GAP - 6} fill={C.bg} stroke={C.cyan} strokeWidth={1.5} />
          <text
            x={half}
            y={half - 4}
            fill={C.cyan}
            fontFamily={mono.fontFamily}
            fontSize={9}
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing="0.14em"
          >
            #{String(player.rank ?? "—").padStart(2, "0")}
          </text>
          <text
            x={half}
            y={half + 8}
            fill={C.text}
            fontSize={10}
            fontWeight={600}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {String(player.first || player.name?.split(" ")[0] || "")}
          </text>
        </svg>

        {/* Hover detail card */}
        <div style={{ minHeight: 64, background: C.bg, border: `1px solid ${C.borderSoft}`, padding: "10px 12px" }}>
          {hoveredEntry ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, background: hoveredEntry.color, display: "inline-block", borderRadius: "50%" }} />
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {hoveredEntry.historical.name}
                  </span>
                </div>
                <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {hoveredEntry.historical.draftYear} · #{String(hoveredEntry.historical.draftSlot).padStart(2, "0")} · {hoveredEntry.historical.school || "—"} · {hoveredEntry.historical.outcomeTier}
                </div>
                {hoveredEntry.historical.archetype && (
                  <div style={{ ...mono, fontSize: 9, color: C.textDim, letterSpacing: "0.1em", marginTop: 3, textTransform: "uppercase" }}>
                    {hoveredEntry.historical.archetype}
                  </div>
                )}
              </div>
              <div style={{ ...mono, fontSize: 18, color: hoveredEntry.color, fontWeight: 700, lineHeight: 1 }}>
                {hoveredEntry.score}
              </div>
            </div>
          ) : (
            <div style={{ ...mono, fontSize: 10, color: C.textMute, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Hover or click a star to inspect a comparable
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {OUTCOME_LABELS.map((tier) => (
            <div key={tier} style={{ display: "flex", alignItems: "center", gap: 6, ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              <span style={{ width: 8, height: 8, background: OUTCOME_COLORS[tier], display: "inline-block", borderRadius: "50%" }} />
              {tier}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Closer = better match · Angle = draft year (2000 ↑ → 2025 ↑)
          </div>
        </div>
      </div>
    </div>
  );
};
