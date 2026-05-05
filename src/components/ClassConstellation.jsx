import React, { useMemo, useState } from "react";

const C = {
  bg: "#050A12",
  surface: "rgba(15, 23, 42, 0.6)",
  border: "#1F2937",
  borderSoft: "rgba(31, 41, 55, 0.6)",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMute: "#64748B",
  cyan: "#22D3EE",
  ringMute: "rgba(148, 163, 184, 0.18)",
  ringSoft: "rgba(34, 211, 238, 0.06)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

// Tier color map. Falls back to cyan if a prospect has no tier.
const TIER_COLORS = {
  "Tier 1": "#22D3EE", // cyan — Franchise / Star
  "Tier 2": "#3B82F6", // blue — All-Star
  "Tier 3": "#10B981", // green — Starter
  "Tier 4": "#F59E0B", // amber — Rotation
  "Tier 5": "#64748B", // gray — Developmental
  Star: "#22D3EE",
  Hit: "#3B82F6",
  Swing: "#F59E0B",
  Bust: "#64748B",
};

const QUADRANTS = [
  { id: "Guard", label: "Guards", center: -Math.PI / 2 }, // 12 o'clock
  { id: "Wing", label: "Wings", center: 0 },             // 3 o'clock
  { id: "Forward", label: "Forwards", center: Math.PI / 2 }, // 6 o'clock
  { id: "Big", label: "Bigs", center: Math.PI },          // 9 o'clock
];

// Map a prospect's pos string to a quadrant id.
function positionFamily(pos) {
  if (!pos) return "Wing";
  const upper = String(pos).toUpperCase().trim();
  if (/^PG$|^SG$|^G$/.test(upper) || /GUARD/.test(upper)) return "Guard";
  if (/^SF$|^GF$|^F-G$|^G-F$/.test(upper)) return "Wing";
  if (/^PF$|FORWARD-CENTER|^F$/.test(upper)) return "Forward";
  if (/^C$|CENTER|F-C/.test(upper)) return "Big";
  if (/FORWARD/.test(upper)) return "Forward";
  return "Wing";
}

function tierKey(prospect) {
  const tier = prospect.tier || prospect.baseTier || "";
  // Match "Tier 1 - ..." style
  const match = String(tier).match(/Tier\s+(\d)/);
  if (match) return `Tier ${match[1]}`;
  return null;
}

function colorForProspect(prospect) {
  const key = tierKey(prospect);
  return (key && TIER_COLORS[key]) || C.cyan;
}

// Layout the prospects into a polar coordinate per-quadrant.
// Each quadrant gets a 90° arc; within it, prospects are placed by rank
// (rank 1 closest to outer rim, last rank closest to center), with a
// deterministic spread along the angular axis to avoid overlap.
function layoutProspects(prospects, half, available) {
  if (!prospects.length) return [];
  const grouped = new Map();
  for (const p of prospects) {
    const fam = positionFamily(p.pos);
    if (!grouped.has(fam)) grouped.set(fam, []);
    grouped.get(fam).push(p);
  }

  const placed = [];
  for (const quadrant of QUADRANTS) {
    const list = (grouped.get(quadrant.id) || []).slice().sort((a, b) => a.rank - b.rank);
    const count = list.length;
    const arc = (Math.PI / 2) * 0.9; // 81° usable per quadrant; leaves padding
    list.forEach((p, idx) => {
      // Radius: rank 1 → outer; last rank → inner.
      const ringT = count > 1 ? idx / (count - 1) : 0.5;
      const minRadius = 70;
      const radius = available - ringT * (available - minRadius);
      // Angle: distribute prospects evenly across the quadrant arc.
      const t = count > 1 ? idx / (count - 1) - 0.5 : 0;
      const jitter = ((idx * 137) % 13) / 13 - 0.5; // tiny deterministic jitter
      const angle = quadrant.center + t * arc + jitter * (arc / Math.max(count, 6));
      const score = p.score ?? p.scores?.overallComposite ?? 50;
      const sizeT = Math.max(0, Math.min(1, (score - 50) / 40));
      const r = 4 + sizeT * 10;
      placed.push({
        prospect: p,
        x: half + Math.cos(angle) * radius,
        y: half + Math.sin(angle) * radius,
        r,
        color: colorForProspect(p),
        quadrant: quadrant.id,
      });
    });
  }
  return placed;
}

export const ClassConstellation = ({ prospects = [], onOpenProfile, size = 640 }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filteredProspects = useMemo(() => {
    if (activeFilter === "ALL") return prospects;
    return prospects.filter((p) => positionFamily(p.pos) === activeFilter);
  }, [prospects, activeFilter]);

  const half = size / 2;
  const available = half - 30;
  const placed = useMemo(() => layoutProspects(filteredProspects, half, available), [filteredProspects, half, available]);
  const hovered = hoveredId ? placed.find((p) => p.prospect.id === hoveredId) : null;

  const ringRadii = [available, available * 0.66, available * 0.33];
  const tierTotals = useMemo(() => {
    const totals = {};
    for (const p of prospects) {
      const key = tierKey(p) || "—";
      totals[key] = (totals[key] || 0) + 1;
    }
    return totals;
  }, [prospects]);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: C.textMute, textTransform: "uppercase" }}>Prospera Lens</div>
          <h1 style={{ fontSize: 32, color: C.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>Class Map</h1>
          <div style={{ fontSize: 13, color: C.textDim }}>
            All {prospects.length} prospects · sized by overall score · colored by board tier
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["ALL", "Guard", "Wing", "Forward", "Big"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: activeFilter === tab ? C.cyan : C.textDim,
                background: activeFilter === tab ? "rgba(34, 211, 238, 0.1)" : "transparent",
                border: `1px solid ${activeFilter === tab ? C.cyan : C.border}`,
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              {tab === "ALL" ? "All Positions" : tab + "s"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "start" }} className="prospera-eval-grid">
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 16 }}>
          <svg
            viewBox={`0 0 ${size} ${size}`}
            width="100%"
            style={{ display: "block", maxWidth: size, margin: "0 auto" }}
            role="img"
            aria-label="Class constellation map"
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* radial rings */}
            {ringRadii.map((r, i) => (
              <circle key={i} cx={half} cy={half} r={r} fill="none" stroke={i === 0 ? C.borderSoft : C.ringMute} strokeWidth={1} strokeDasharray={i === 0 ? "2 4" : "1 4"} />
            ))}
            {/* quadrant separators (cross at 45° offsets) */}
            {[Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4].map((a) => (
              <line
                key={a}
                x1={half + Math.cos(a) * 30}
                y1={half + Math.sin(a) * 30}
                x2={half + Math.cos(a) * available}
                y2={half + Math.sin(a) * available}
                stroke={C.ringMute}
                strokeWidth={1}
                strokeDasharray="2 6"
              />
            ))}
            {/* quadrant labels */}
            {QUADRANTS.map((q) => {
              const lx = half + Math.cos(q.center) * (available + 16);
              const ly = half + Math.sin(q.center) * (available + 16);
              return (
                <text
                  key={q.id}
                  x={lx}
                  y={ly}
                  fill={C.textMute}
                  fontFamily={mono.fontFamily}
                  fontSize={11}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.16em"
                  style={{ textTransform: "uppercase" }}
                >
                  {q.label}
                </text>
              );
            })}
            {/* center marker */}
            <circle cx={half} cy={half} r={3} fill={C.borderSoft} />
            {/* prospect nodes */}
            {placed.map((node) => {
              const isHovered = hoveredId === node.prospect.id;
              return (
                <g
                  key={node.prospect.id}
                  onMouseEnter={() => setHoveredId(node.prospect.id)}
                  onClick={() => onOpenProfile?.(node.prospect.id)}
                  style={{ cursor: onOpenProfile ? "pointer" : "default" }}
                >
                  <circle cx={node.x} cy={node.y} r={node.r + 3} fill={node.color} opacity={isHovered ? 0.22 : 0.08} />
                  <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} stroke={C.bg} strokeWidth={1} />
                  {isHovered && (
                    <text
                      x={node.x}
                      y={node.y - node.r - 5}
                      fill={C.text}
                      fontSize={10}
                      fontFamily={mono.fontFamily}
                      textAnchor="middle"
                      dominantBaseline="alphabetic"
                      letterSpacing="0.05em"
                    >
                      #{node.prospect.rank} {node.prospect.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: C.textMute, textTransform: "uppercase", marginBottom: 10 }}>
              Hovered Prospect
            </div>
            {hovered ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 10, height: 10, background: hovered.color, display: "inline-block", borderRadius: "50%" }} />
                  <span style={{ ...mono, fontSize: 11, color: C.cyan, letterSpacing: "0.12em" }}>
                    #{String(hovered.prospect.rank).padStart(2, "0")}
                  </span>
                </div>
                <div style={{ fontSize: 16, color: C.text, fontWeight: 600 }}>{hovered.prospect.name}</div>
                <div style={{ ...mono, fontSize: 9, color: C.textDim, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" }}>
                  {(hovered.prospect.school || "—")} · {hovered.prospect.pos || "—"} · {hovered.prospect.cls || "—"}
                </div>
                {hovered.prospect.archetype && (
                  <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" }}>
                    {hovered.prospect.archetype}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.borderSoft}` }}>
                  <div>
                    <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.12em" }}>BOARD</div>
                    <div style={{ ...mono, fontSize: 18, color: hovered.color, fontWeight: 700 }}>{(hovered.prospect.score ?? "—")}</div>
                  </div>
                  <div>
                    <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.12em" }}>TIER</div>
                    <div style={{ ...mono, fontSize: 11, color: C.text }}>{hovered.prospect.tier || "—"}</div>
                  </div>
                </div>
                {onOpenProfile && (
                  <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.12em", marginTop: 10, textTransform: "uppercase" }}>
                    Click to open profile
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...mono, fontSize: 10, color: C.textMute, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Hover any star
              </div>
            )}
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: C.textMute, textTransform: "uppercase", marginBottom: 10 }}>
              Tier Distribution
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5"].map((tier) => {
                const count = tierTotals[tier] || 0;
                if (count === 0) return null;
                return (
                  <div key={tier} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, background: TIER_COLORS[tier], display: "inline-block", borderRadius: "50%" }} />
                    <span style={{ ...mono, fontSize: 10, color: C.textDim, letterSpacing: "0.1em", flex: 1 }}>{tier}</span>
                    <span style={{ ...mono, fontSize: 11, color: C.text }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: 14 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: C.textMute, textTransform: "uppercase", marginBottom: 8 }}>
              Reading the Map
            </div>
            <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.55 }}>
              Outer ring = top of the class. Inner ring = deeper bench. Quadrants split by position family. Star size scales with overall score.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
