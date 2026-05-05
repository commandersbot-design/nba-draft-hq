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

const TIER_COLORS = {
  "Tier 1": "#22D3EE",
  "Tier 2": "#3B82F6",
  "Tier 3": "#10B981",
  "Tier 4": "#F59E0B",
  "Tier 5": "#64748B",
};

// ---------- ZONES ----------
// 10 evocative archetype-driven zones. Each prospect is placed into the zone
// matching their archetype (legacy or catalog name). Zone ordering walks the
// dial clockwise from 12 o'clock so adjacent zones are stylistic neighbors.
const ZONES = [
  {
    id: "architects",
    label: "Architects",
    blurb: "Primary creators · lead playmakers",
    tint: "rgba(34, 211, 238, 0.06)",
    archetypes: [
      "Lead Initiator", "IQ Lead", "Floor General",
      "THE TOTALITY", "Tempo Manipulator", "Offensive Nexus",
    ],
  },
  {
    id: "hunters",
    label: "Hunters",
    blurb: "High-usage iso scorers",
    tint: "rgba(168, 85, 247, 0.06)",
    archetypes: [
      "Volume Lead Guard", "High-Usage Lead", "Bench Scoring Guard",
      "Iso Surgeon", "Slithery Creator", "THE REAPER",
      "Lead Creator", // legacy
    ],
  },
  {
    id: "snipers",
    label: "Snipers",
    blurb: "Pull-up + movement shooters",
    tint: "rgba(59, 130, 246, 0.06)",
    archetypes: [
      "Movement Shooter", "Spot-Up Specialist",
      "THE SINGULARITY", "Shot Maker", // legacy
    ],
  },
  {
    id: "specialists",
    label: "Specialists",
    blurb: "3-and-D · catch-and-shoot wings",
    tint: "rgba(16, 185, 129, 0.06)",
    archetypes: [
      "3-and-D", "Off-Ball Wing",
    ],
  },
  {
    id: "connectors",
    label: "Connectors",
    blurb: "Glue · passing wings · cutters",
    tint: "rgba(245, 158, 11, 0.06)",
    archetypes: [
      "Connector", "Connector Four",
    ],
  },
  {
    id: "hammers",
    label: "Hammers",
    blurb: "Athletic finishers · downhill drivers",
    tint: "rgba(216, 90, 48, 0.06)",
    archetypes: [
      "Off-Ball Wing Scorer", "Hammer Wing", "Vertical Phenom",
      "Pressure Valve Wing", "Volume Wing Scorer", // legacy
    ],
  },
  {
    id: "two-way-wings",
    label: "Two-Way Wings",
    blurb: "Multi-modal wings · star versatility",
    tint: "rgba(34, 211, 238, 0.06)",
    archetypes: [
      "Two-Way Wing", "Combo Forward", "Versatile Forward",
      "Three-Level Apex", "Silken Apex", "Two-Way Terminator",
      "Switchblade Wing", "Mismatch Cartographer", // legacy
    ],
  },
  {
    id: "lockdown",
    label: "Lockdown",
    blurb: "Point-of-attack defenders",
    tint: "rgba(168, 85, 247, 0.06)",
    archetypes: [
      "POA Defender",
    ],
  },
  {
    id: "anchors",
    label: "Anchors",
    blurb: "Rim protection · defensive bigs",
    tint: "rgba(59, 130, 246, 0.06)",
    archetypes: [
      "Rim Protector", "Switching Big", "Universal Big",
      "Two-Way Anchor", "Rim Pressure Titan", "Interior Dominator",
      "Defensive Anchor", // legacy
    ],
  },
  {
    id: "stretchers",
    label: "Stretchers",
    blurb: "Floor-spacing bigs · stretch fours",
    tint: "rgba(16, 185, 129, 0.06)",
    archetypes: [
      "Stretch Four", "Floor-Spacing Big", "Pick-and-Pop Big",
      "Rim-Running Big", "Skilled Center",
    ],
  },
];

// Build archetype -> zone index lookup, but only for SPECIFIC archetypes.
// The seed data labels most prospects "Lead Creator" generically, so we
// can't trust that for zone routing — use position + traits instead.
const SPECIFIC_ARCHETYPE_TO_ZONE = (() => {
  const map = new Map();
  ZONES.forEach((zone, idx) => {
    for (const arche of zone.archetypes) {
      // Skip the catch-all "Lead Creator" so it falls through to trait routing
      if (arche === "Lead Creator") continue;
      map.set(arche, idx);
    }
  });
  return map;
})();

const ZONE_ID_TO_INDEX = (() => {
  const map = new Map();
  ZONES.forEach((zone, idx) => map.set(zone.id, idx));
  return map;
})();

function zoneByKey(id) { return ZONE_ID_TO_INDEX.get(id) ?? 6; }

function zoneIndexFor(prospect) {
  if (!prospect) return null;

  // 1. If the prospect has a SPECIFIC archetype name, use that zone
  if (prospect.archetype && SPECIFIC_ARCHETYPE_TO_ZONE.has(prospect.archetype)) {
    return SPECIFIC_ARCHETYPE_TO_ZONE.get(prospect.archetype);
  }

  // 2. Otherwise route by position family + traits9 profile (the meaningful signal)
  const pos = String(prospect.pos || "").toUpperCase();
  const t = prospect.traits9 || {};
  const ac = Number(t["Advantage Creation"]) || 0;
  const dm = Number(t["Decision Making"]) || 0;
  const pc = Number(t["Passing Creation"]) || 0;
  const sg = Number(t["Shooting Gravity"]) || 0;
  const ob = Number(t["Off-Ball Value"]) || 0;
  const ps = Number(t["Processing Speed"]) || 0;
  const sc = Number(t["Scalability"]) || 0;
  const dv = Number(t["Defensive Versatility"]) || 0;

  // GUARDS
  if (/^PG/.test(pos) || pos === "G") {
    if (pc >= 7 && dm >= 7) return zoneByKey("architects");
    if (ac >= 7 && sg >= 6) return zoneByKey("hunters");
    if (sg >= 7 && pc < 6) return zoneByKey("snipers");
    if (dv >= 6 && sc >= 6 && ac < 7) return zoneByKey("lockdown");
    return zoneByKey("architects");
  }
  if (/^SG/.test(pos)) {
    if (sg >= 7 && ob >= 6) return zoneByKey("snipers");
    if (ac >= 7 && pc >= 6) return zoneByKey("hunters");
    if (sg >= 6 && dv >= 6) return zoneByKey("specialists");
    if (ac >= 7) return zoneByKey("hunters");
    return zoneByKey("snipers");
  }
  // WINGS
  if (/^SF|GF|F-G/.test(pos)) {
    if (dv >= 7 && sc >= 7) return zoneByKey("two-way-wings");
    if (sg >= 7 && ob >= 6 && ac < 7) return zoneByKey("snipers");
    if (sg >= 6 && dv >= 6 && ac < 7) return zoneByKey("specialists");
    if (ac >= 7 && sg < 6) return zoneByKey("hammers");
    if (ob >= 7 && pc >= 6 && ac < 7) return zoneByKey("connectors");
    return zoneByKey("two-way-wings");
  }
  // FORWARDS (4)
  if (/^PF|^F$/.test(pos)) {
    if (sc >= 7 && dv >= 6 && ac >= 6) return zoneByKey("two-way-wings");
    if (sg >= 6 && ob >= 6) return zoneByKey("stretchers");
    if (pc >= 6 && ob >= 6) return zoneByKey("connectors");
    if (dv >= 7) return zoneByKey("anchors");
    return zoneByKey("connectors");
  }
  // BIGS (5)
  if (/^C/.test(pos) || /CENTER/.test(pos)) {
    if (sg >= 6 && ob >= 5) return zoneByKey("stretchers");
    if (dv >= 7 && sc >= 6) return zoneByKey("anchors");
    if (pc >= 6) return zoneByKey("stretchers");
    return zoneByKey("anchors");
  }

  return zoneByKey("two-way-wings");
}

function tierKey(prospect) {
  const tier = prospect.tier || prospect.baseTier || "";
  const match = String(tier).match(/Tier\s+(\d)/);
  return match ? `Tier ${match[1]}` : null;
}

function colorForProspect(prospect) {
  const key = tierKey(prospect);
  return (key && TIER_COLORS[key]) || C.cyan;
}

// Deterministic pseudo-random
function seededRandom(id, salt) {
  let h = salt >>> 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  h = ((h ^ (h >>> 16)) * 0x85ebca6b) | 0;
  h = ((h ^ (h >>> 13)) * 0xc2b2ae35) | 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return (h % 100000) / 100000;
}

function layoutProspects(prospects, half, available) {
  if (!prospects.length) return [];
  const grouped = ZONES.map(() => []);
  for (const p of prospects) {
    const zoneIdx = zoneIndexFor(p);
    if (zoneIdx != null) grouped[zoneIdx].push(p);
  }

  const placed = [];
  const zoneCount = ZONES.length;
  const arcPerZone = (Math.PI * 2) / zoneCount;

  ZONES.forEach((zone, zoneIdx) => {
    const list = grouped[zoneIdx] || [];
    if (list.length === 0) return;
    // Center this zone at angle, leaving small gap between zones
    const centerAngle = -Math.PI / 2 + zoneIdx * arcPerZone + arcPerZone / 2;
    const usableArc = arcPerZone * 0.85;
    const minRadius = 70;
    const maxRadius = available - 8;

    const scores = list.map((p) => p.score ?? p.scores?.overallComposite ?? 50);
    const scoreMin = Math.min(...scores);
    const scoreMax = Math.max(...scores);
    const scoreSpan = Math.max(8, scoreMax - scoreMin);

    list.forEach((p) => {
      const score = p.score ?? p.scores?.overallComposite ?? 50;
      const rawT = Math.max(0, Math.min(1, (score - scoreMin) / scoreSpan));
      const scoreT = Math.pow(rawT, 0.55);
      const tier = tierKey(p);
      const isTopTier = tier === "Tier 1" || tier === "Tier 2";
      const jitterScale = isTopTier ? 0.15 : 0.32;
      const radialJitter = (seededRandom(p.id, 91) - 0.5) * jitterScale;
      const radiusT = Math.max(0, Math.min(1, scoreT + radialJitter));
      const radius = minRadius + radiusT * (maxRadius - minRadius);

      const angleT = seededRandom(p.id, 17) - 0.5;
      const angle = centerAngle + angleT * usableArc;

      const sizeBase = Math.max(0, Math.min(1, (score - 50) / 40));
      const sizeT = isTopTier ? Math.min(1, sizeBase * 1.2 + 0.15) : sizeBase;
      const r = 4 + sizeT * 11;
      placed.push({
        prospect: p,
        x: half + Math.cos(angle) * radius,
        y: half + Math.sin(angle) * radius,
        r,
        color: colorForProspect(p),
        zoneIdx,
      });
    });
  });

  // Resolve overlaps
  const minSep = 14;
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const want = Math.max(minSep, a.r + b.r + 4);
        if (dist < want) {
          const push = (want - dist) / 2;
          a.x -= (dx / dist) * push;
          a.y -= (dy / dist) * push;
          b.x += (dx / dist) * push;
          b.y += (dy / dist) * push;
        }
      }
    }
  }
  return placed;
}

// ---------- COMPONENT ----------
export const ClassConstellation = ({ prospects = [], onOpenProfile, size = 720 }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [connectionMode, setConnectionMode] = useState("off"); // off | school | archetype

  const filteredProspects = useMemo(() => {
    if (zoneFilter === "ALL") return prospects;
    const targetZone = ZONES.findIndex((z) => z.id === zoneFilter);
    return prospects.filter((p) => zoneIndexFor(p) === targetZone);
  }, [prospects, zoneFilter]);

  const half = size / 2;
  const available = half - 30;
  const placed = useMemo(() => layoutProspects(filteredProspects, half, available), [filteredProspects, half, available]);
  const hovered = hoveredId ? placed.find((p) => p.prospect.id === hoveredId) : null;

  const ringRadii = [available, available * 0.66, available * 0.33];

  // Compute connection edges based on mode
  const connections = useMemo(() => {
    if (connectionMode === "off") return [];
    const edges = [];
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        let connect = false;
        if (connectionMode === "school") {
          const aSchool = a.prospect.school;
          const bSchool = b.prospect.school;
          if (aSchool && bSchool && aSchool === bSchool) connect = true;
        } else if (connectionMode === "archetype") {
          if (a.prospect.archetype && a.prospect.archetype === b.prospect.archetype) connect = true;
        }
        if (connect) edges.push({ a, b });
      }
    }
    return edges;
  }, [placed, connectionMode]);

  const tierTotals = useMemo(() => {
    const totals = {};
    for (const p of prospects) {
      const key = tierKey(p) || "—";
      totals[key] = (totals[key] || 0) + 1;
    }
    return totals;
  }, [prospects]);

  const zoneCounts = useMemo(() => {
    const counts = ZONES.map(() => 0);
    for (const p of prospects) {
      const z = zoneIndexFor(p);
      if (z != null) counts[z]++;
    }
    return counts;
  }, [prospects]);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: C.textMute, textTransform: "uppercase" }}>Prospera Lens</div>
          <h1 style={{ fontSize: 32, color: C.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>Class Map</h1>
          <div style={{ fontSize: 13, color: C.textDim }}>
            {prospects.length} prospects · 10 archetype zones · sized by overall score · colored by board tier
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <span style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", color: C.textMute, alignSelf: "center", marginRight: 4 }}>CONNECT:</span>
            {[["off", "Off"], ["school", "School"], ["archetype", "Archetype"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setConnectionMode(id)}
                style={{
                  ...mono,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: connectionMode === id ? C.cyan : C.textDim,
                  background: connectionMode === id ? "rgba(34, 211, 238, 0.1)" : "transparent",
                  border: `1px solid ${connectionMode === id ? C.cyan : C.border}`,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Zone filter strip */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setZoneFilter("ALL")}
          style={{
            ...mono,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: zoneFilter === "ALL" ? C.cyan : C.textDim,
            background: zoneFilter === "ALL" ? "rgba(34, 211, 238, 0.08)" : "transparent",
            border: `1px solid ${zoneFilter === "ALL" ? C.cyan : C.border}`,
            padding: "5px 9px",
            cursor: "pointer",
          }}
        >
          All Zones · {prospects.length}
        </button>
        {ZONES.map((zone, idx) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => setZoneFilter(zone.id)}
            style={{
              ...mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: zoneFilter === zone.id ? C.cyan : C.textDim,
              background: zoneFilter === zone.id ? "rgba(34, 211, 238, 0.08)" : "transparent",
              border: `1px solid ${zoneFilter === zone.id ? C.cyan : C.border}`,
              padding: "5px 9px",
              cursor: "pointer",
            }}
          >
            {zone.label} · {zoneCounts[idx]}
          </button>
        ))}
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
            {/* zone tint wedges */}
            {ZONES.map((zone, idx) => {
              const arcPerZone = (Math.PI * 2) / ZONES.length;
              const start = -Math.PI / 2 + idx * arcPerZone + arcPerZone * 0.075;
              const end = -Math.PI / 2 + (idx + 1) * arcPerZone - arcPerZone * 0.075;
              const x1 = half + Math.cos(start) * available;
              const y1 = half + Math.sin(start) * available;
              const x2 = half + Math.cos(end) * available;
              const y2 = half + Math.sin(end) * available;
              const largeArc = (end - start) > Math.PI ? 1 : 0;
              const d = `M ${half} ${half} L ${x1} ${y1} A ${available} ${available} 0 ${largeArc} 1 ${x2} ${y2} Z`;
              return <path key={zone.id} d={d} fill={zone.tint} />;
            })}

            {/* radial rings */}
            {ringRadii.map((r, i) => (
              <circle key={i} cx={half} cy={half} r={r} fill="none" stroke={i === 0 ? C.borderSoft : C.ringMute} strokeWidth={1} strokeDasharray={i === 0 ? "2 4" : "1 4"} />
            ))}

            {/* zone labels */}
            {ZONES.map((zone, idx) => {
              const arcPerZone = (Math.PI * 2) / ZONES.length;
              const angle = -Math.PI / 2 + idx * arcPerZone + arcPerZone / 2;
              const lx = half + Math.cos(angle) * (available + 18);
              const ly = half + Math.sin(angle) * (available + 18);
              return (
                <text
                  key={zone.id}
                  x={lx}
                  y={ly}
                  fill={C.textDim}
                  fontFamily={mono.fontFamily}
                  fontSize={11}
                  fontWeight={600}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.16em"
                  style={{ textTransform: "uppercase" }}
                >
                  {zone.label}
                </text>
              );
            })}

            {/* connection lines */}
            {connections.map((edge, i) => (
              <line
                key={i}
                x1={edge.a.x}
                y1={edge.a.y}
                x2={edge.b.x}
                y2={edge.b.y}
                stroke="rgba(34, 211, 238, 0.18)"
                strokeWidth={0.7}
              />
            ))}

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
                <div style={{ ...mono, fontSize: 9, color: C.textMute, letterSpacing: "0.1em", marginTop: 4, textTransform: "uppercase" }}>
                  Zone: {ZONES[hovered.zoneIdx]?.label || "—"}
                </div>
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
              10 zones grouped by play-style archetype, walking clockwise from Architects at 12 o'clock. Closer to the rim = higher overall score. Star size scales with score; top-tier players sit on the outer ring. Toggle <span style={{ color: C.cyan }}>CONNECT</span> to draw lines between prospects sharing a school or archetype.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
