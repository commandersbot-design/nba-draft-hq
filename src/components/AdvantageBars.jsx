import React, { useState, useMemo } from "react";

// ---------- DESIGN TOKENS (mirror the spec) ----------
const A = {
  positive: "#1D9E75",
  positiveBand: "rgba(29, 158, 117, 0.18)",
  positiveFade: "rgba(29, 158, 117, 0.45)",
  negative: "#D85A30",
  negativeBand: "rgba(216, 90, 48, 0.18)",
  negativeFade: "rgba(216, 90, 48, 0.45)",
  rule: "#1F2937",
  ruleSoft: "rgba(31, 41, 55, 0.6)",
  surface: "rgba(17, 24, 39, 0.72)",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMute: "#64748B",
  neutral: "#475569",
  baseline: "#334155",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const TRAIT_REGIONS = [
  { id: "on-ball", label: "On-Ball Offense", traits: ["initiate", "extend", "close"] },
  { id: "off-ball", label: "Off-Ball Offense", traits: ["space", "connect"] },
  { id: "defense", label: "Defense", traits: ["contain", "disrupt", "switch"] },
  { id: "game-state", label: "Game State", traits: ["transition"] },
];

const TRAIT_LABELS = {
  initiate: "Initiate",
  extend: "Extend",
  close: "Close",
  space: "Space",
  connect: "Connect",
  contain: "Contain",
  disrupt: "Disrupt",
  switch: "Switch",
  transition: "Transition",
};

const TRAIT_BLURBS = {
  initiate: "Self-creation, downhill drives, pull-up gravity",
  extend: "Secondary playmaking, drive-and-kick, advantage passing",
  close: "Finishing, shot-making, isolation scoring",
  space: "Off-ball gravity, movement shooting, spot-ups",
  connect: "Cuts, hockey assists, keep-it-moving plays",
  contain: "Point-of-attack, on-ball defense, screen navigation",
  disrupt: "Rim protection, steals, defensive playmaking",
  switch: "Positional range, scheme versatility",
  transition: "Pace, transition offense + defense",
};

// ---------- DERIVATION FROM TRAITS9 ----------
// Convert the existing 1-10 grade into a 0-100 percentile-ish score.
// Authored advantageProfile data on a prospect will override this.
function clamp(value, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, value));
}

function band(score, spread) {
  return {
    min: Math.round(clamp(score - spread)),
    max: Math.round(clamp(score + spread)),
  };
}

function asScore(traits9, key) {
  const value = traits9?.[key];
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(clamp(value * 10));
}

function efficient(score, threshold = 58) {
  return score >= threshold;
}

export function deriveAdvantageProfile(prospect) {
  if (!prospect) return null;
  if (prospect.advantageProfile) return prospect.advantageProfile;
  const t = prospect.traits9 || {};
  const ac = asScore(t, "Advantage Creation");
  const dm = asScore(t, "Decision Making");
  const pc = asScore(t, "Passing Creation");
  const sg = asScore(t, "Shooting Gravity");
  const ob = asScore(t, "Off-Ball Value");
  const ps = asScore(t, "Processing Speed");
  const sc = asScore(t, "Scalability");
  const dv = asScore(t, "Defensive Versatility");
  if ([ac, dm, pc, sg, ob, ps, sc, dv].some((v) => v == null)) return null;

  const initiate = ac;
  const extend = Math.round((pc + dm) / 2);
  const close = sg;
  const space = Math.round(sg * 0.55 + ob * 0.45);
  const connect = Math.round(ob * 0.7 + ps * 0.3);
  const contain = dv;
  const disrupt = Math.round(dv * 0.7 + ps * 0.3);
  const switchScore = Math.round(sc * 0.5 + dv * 0.5);
  const transition = Math.round(ac * 0.5 + ob * 0.5);

  const baseScore = prospect.score != null ? Math.round(prospect.score) : Math.round((ac + sg + sc) / 3);
  const translateScore = clamp(baseScore);

  const offTrait = (score) => ({
    archetype: { score, ...band(score, 11), efficient: efficient(score) },
    absolute: { score: clamp(score - 5), ...band(clamp(score - 5), 14), efficient: efficient(score) },
  });
  const defTrait = (score) => ({
    archetype: { score, ...band(score, 13) },
    absolute: { score: clamp(score - 5), ...band(clamp(score - 5), 16) },
  });

  return {
    archetype: prospect.archetype || "Unknown",
    derived: true,
    translate: { archetype: translateScore, absolute: translateScore },
    traits: {
      initiate: offTrait(initiate),
      extend: offTrait(extend),
      close: offTrait(close),
      space: offTrait(space),
      connect: offTrait(connect),
      contain: defTrait(contain),
      disrupt: defTrait(disrupt),
      switch: defTrait(switchScore),
      transition: offTrait(transition),
    },
  };
}

// ---------- ATOMS ----------
const Pill = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      ...mono,
      fontSize: 10,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      padding: "5px 10px",
      background: active ? "rgba(34, 211, 238, 0.1)" : "transparent",
      color: active ? "#22D3EE" : A.textDim,
      border: `1px solid ${active ? "#22D3EE" : A.rule}`,
      cursor: "pointer",
    }}
  >
    {children}
  </button>
);

const ToggleGroup = ({ label, value, onChange, options }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ ...mono, fontSize: 9, color: A.textMute, letterSpacing: "0.14em", marginRight: 4 }}>{label}</span>
    <div style={{ display: "flex", gap: 0, border: `1px solid ${A.rule}` }}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            ...mono,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "5px 10px",
            background: value === opt.value ? "rgba(34, 211, 238, 0.12)" : "transparent",
            color: value === opt.value ? "#22D3EE" : A.textDim,
            border: "none",
            borderLeft: i === 0 ? "none" : `1px solid ${A.rule}`,
            cursor: "pointer",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const RegionHeader = ({ label }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, margin: "18px 0 10px" }}>
    <div style={{ height: 1, background: A.ruleSoft }} />
    <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: A.textMute, textTransform: "uppercase" }}>{label}</div>
    <div style={{ height: 1, background: A.ruleSoft }} />
  </div>
);

const PlayerHeaderCard = ({ player, mirror = false }) => {
  const initials = useMemo(
    () =>
      String(player?.name || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [player?.name]
  );
  const direction = mirror ? "row-reverse" : "row";
  const align = mirror ? "right" : "left";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: A.surface,
        border: `1px solid ${A.rule}`,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          background: player?.color || "#534AB7",
          color: "#fff",
          ...mono,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.05em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {initials || "—"}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: align }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {player?.name || "—"}
        </div>
        <div style={{ ...mono, fontSize: 9, color: A.textDim, letterSpacing: "0.1em", marginTop: 3, textTransform: "uppercase" }}>
          {player?.archetype || "—"} · {player?.school || "—"}{player?.age != null ? ` · ${player.age}` : ""}
        </div>
      </div>
    </div>
  );
};

// ---------- TRANSLATE RIBBON (comparison) ----------
const TranslateRibbon = ({ playerA, playerB, scoreA, scoreB }) => {
  const left = Math.min(scoreA, scoreB);
  const right = Math.max(scoreA, scoreB);
  const leftColor = scoreA <= scoreB ? playerA.color : playerB.color;
  const rightColor = scoreA <= scoreB ? playerB.color : playerA.color;
  return (
    <div>
      <RegionHeader label="Translate" />
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", gap: 10 }}>
        <div style={{ ...mono, fontSize: 18, color: playerA.color, fontWeight: 700, textAlign: "right" }}>{Math.round(scoreA)}</div>
        <div style={{ position: "relative", height: 14, background: A.neutral, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${left}%`,
              background: leftColor,
              transition: "width 320ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: `${100 - right}%`,
              background: rightColor,
              transition: "width 320ms ease",
            }}
          />
          {/* Markers */}
          <div
            style={{
              position: "absolute",
              left: `calc(${scoreA}% - 5px)`,
              top: 2,
              width: 10,
              height: 10,
              border: `2px solid ${playerA.color}`,
              background: "rgba(255,255,255,0.85)",
              borderRadius: "50%",
              transition: "left 320ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `calc(${scoreB}% - 5px)`,
              top: 2,
              width: 10,
              height: 10,
              border: `2px solid ${playerB.color}`,
              background: "rgba(255,255,255,0.85)",
              borderRadius: "50%",
              transition: "left 320ms ease",
            }}
          />
        </div>
        <div style={{ ...mono, fontSize: 18, color: playerB.color, fontWeight: 700 }}>{Math.round(scoreB)}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 4, padding: "0 50px" }}>
        {[0, 50, 100].map((label) => (
          <div key={label} style={{ ...mono, fontSize: 8, color: A.textMute, letterSpacing: "0.12em", textAlign: label === 0 ? "left" : label === 100 ? "right" : "center" }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- MIRRORED BAR (comparison) ----------
const MirroredBar = ({
  trait,
  dataA,
  dataB,
  colorA,
  colorB,
  efficiencyMode,
}) => {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: A.text,
          textAlign: "center",
          marginBottom: 4,
          letterSpacing: "0.02em",
        }}
        title={TRAIT_BLURBS[trait]}
      >
        {TRAIT_LABELS[trait]}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: 0 }}>
        <SideBar data={dataA} side="left" baselineColor={colorA} efficiencyMode={efficiencyMode} />
        <SideBar data={dataB} side="right" baselineColor={colorB} efficiencyMode={efficiencyMode} />
      </div>
    </div>
  );
};

const SideBar = ({ data, side, baselineColor, efficiencyMode }) => {
  if (!data) return <div style={{ height: 22 }} />;
  const score = Math.round(data.score);
  const above = score >= 50;
  const fill = above ? A.positive : A.negative;
  const bandFill = above ? A.positiveBand : A.negativeBand;
  const fadeFill = above ? A.positiveFade : A.negativeFade;
  const efficient = data.efficient;
  const showDot = efficiencyMode === "dot" && efficient !== undefined;
  const showTwoTone = efficiencyMode === "two-tone" && efficient === false;

  // Bar width = |score - 50| / 50 * 100% of the column
  const barWidthPct = (Math.abs(score - 50) / 50) * 100;
  const min = data.min ?? score;
  const max = data.max ?? score;
  // Volatility band: from min to max, mirrored same way
  const bandStartPct = (Math.abs(min - 50) / 50) * 100;
  const bandEndPct = (Math.abs(max - 50) / 50) * 100;
  const bandLeft = Math.min(bandStartPct, bandEndPct);
  const bandWidth = Math.abs(bandEndPct - bandStartPct);

  // For mirrored layout: left side bar grows from right edge toward center (left).
  // We render bars positioned absolute within an inner relative wrapper, anchored to the
  // baseline (right edge for left side, left edge for right side).
  const isLeft = side === "left";
  const anchor = isLeft ? "right" : "left";
  const flipDir = isLeft ? -1 : 1;

  return (
    <div
      style={{
        position: "relative",
        height: 22,
        paddingRight: isLeft ? 0 : 6,
        paddingLeft: isLeft ? 6 : 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          height: 14,
          [anchor]: 0,
          left: isLeft ? "auto" : 0,
          right: isLeft ? 0 : "auto",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Volatility band (from min..max, mirrored from baseline) */}
        <div
          style={{
            position: "absolute",
            top: 4,
            height: 6,
            [anchor]: `${bandLeft}%`,
            width: `${bandWidth}%`,
            background: bandFill,
            transition: "all 320ms ease",
          }}
        />
        {/* Main bar */}
        {showTwoTone ? (
          <>
            <div
              style={{
                position: "absolute",
                top: 0,
                height: 14,
                [anchor]: 0,
                width: `${barWidthPct * 0.65}%`,
                background: fill,
                transition: "all 320ms ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                height: 14,
                [anchor]: `${barWidthPct * 0.65}%`,
                width: `${barWidthPct * 0.35}%`,
                background: fadeFill,
                transition: "all 320ms ease",
              }}
            />
          </>
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              height: 14,
              [anchor]: 0,
              width: `${barWidthPct}%`,
              background: fill,
              transition: "all 320ms ease",
            }}
          />
        )}
      </div>
      {/* Score number at outer edge */}
      <div
        style={{
          position: "absolute",
          top: 3,
          [isLeft ? "left" : "right"]: 6,
          ...mono,
          fontSize: 11,
          color: A.text,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {isLeft && showDot && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: efficient ? A.positive : A.negative,
            }}
          />
        )}
        {score}
        {!isLeft && showDot && (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: efficient ? A.positive : A.negative,
            }}
          />
        )}
      </div>
    </div>
  );
};

// Center baseline divider
const Baseline = () => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: 0,
      bottom: 0,
      width: 1,
      background: A.baseline,
      transform: "translateX(-0.5px)",
      pointerEvents: "none",
    }}
  />
);

// ---------- COMPARISON VIEW ----------
export const AdvantageComparison = ({ playerA, playerB }) => {
  const [scope, setScope] = useState("archetype");
  const [efficiencyMode, setEfficiencyMode] = useState("dot");

  const profileA = useMemo(() => deriveAdvantageProfile(playerA), [playerA]);
  const profileB = useMemo(() => deriveAdvantageProfile(playerB), [playerB]);

  if (!profileA || !profileB) {
    return (
      <div style={{ ...mono, fontSize: 11, color: A.textMute, letterSpacing: "0.12em", padding: 16 }}>
        ADVANTAGE PROFILE NOT AVAILABLE FOR ONE OR BOTH PLAYERS
      </div>
    );
  }

  const colorA = playerA.color || "#534AB7";
  const colorB = playerB.color || "#1D9E75";
  const scoreA = profileA.translate[scope];
  const scoreB = profileB.translate[scope];

  return (
    <div style={{ background: A.surface, border: `1px solid ${A.rule}`, padding: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: A.textMute, textTransform: "uppercase" }}>
            Prospera Lens
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: A.text, marginTop: 4, letterSpacing: "-0.01em" }}>
            Advantage Profile
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <ToggleGroup
            label="Scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: "archetype", label: "Archetype" },
              { value: "absolute", label: "Absolute" },
            ]}
          />
          <ToggleGroup
            label="Efficiency"
            value={efficiencyMode}
            onChange={setEfficiencyMode}
            options={[
              { value: "dot", label: "Dot" },
              { value: "two-tone", label: "Two-tone" },
            ]}
          />
        </div>
      </div>

      {/* Player headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <PlayerHeaderCard player={{ ...playerA, color: colorA, archetype: profileA.archetype }} />
        <PlayerHeaderCard player={{ ...playerB, color: colorB, archetype: profileB.archetype }} mirror />
      </div>

      {/* Translate ribbon */}
      <TranslateRibbon
        playerA={{ color: colorA }}
        playerB={{ color: colorB }}
        scoreA={scoreA}
        scoreB={scoreB}
      />

      {/* Trait regions */}
      <div style={{ position: "relative", marginTop: 8 }}>
        <Baseline />
        {TRAIT_REGIONS.map((region) => (
          <div key={region.id}>
            <RegionHeader label={region.label} />
            {region.traits.map((trait) => (
              <MirroredBar
                key={trait}
                trait={trait}
                dataA={profileA.traits[trait]?.[scope]}
                dataB={profileB.traits[trait]?.[scope]}
                colorA={colorA}
                colorB={colorB}
                efficiencyMode={efficiencyMode}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Footer legend */}
      <Legend />

      {(profileA.derived || profileB.derived) && (
        <div style={{ ...mono, fontSize: 9, color: A.textMute, letterSpacing: "0.12em", marginTop: 14, textAlign: "center", textTransform: "uppercase" }}>
          Scores derived from current 9-trait grades · authored advantage data will override
        </div>
      )}
    </div>
  );
};

const Legend = () => (
  <div style={{ display: "flex", gap: 16, marginTop: 18, padding: "10px 0 0", borderTop: `1px solid ${A.ruleSoft}`, flexWrap: "wrap" }}>
    {[
      { swatch: <span style={{ width: 10, height: 10, background: A.positive, display: "inline-block" }} />, label: "Above baseline" },
      { swatch: <span style={{ width: 10, height: 10, background: A.negative, display: "inline-block" }} />, label: "Below baseline" },
      { swatch: <span style={{ width: 10, height: 10, border: `1px solid ${A.textMute}`, display: "inline-block" }} />, label: "Volatility" },
      { swatch: <span style={{ width: 7, height: 7, background: A.positive, borderRadius: "50%", display: "inline-block" }} />, label: "Efficient" },
      { swatch: <span style={{ width: 7, height: 7, background: A.negative, borderRadius: "50%", display: "inline-block" }} />, label: "Costly" },
    ].map((item, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, ...mono, fontSize: 10, color: A.textMute, letterSpacing: "0.08em" }}>
        {item.swatch}
        <span>{item.label}</span>
      </div>
    ))}
  </div>
);

// ---------- SINGLE-PLAYER VIEW ----------
const SingleBar = ({ trait, data, efficiencyMode }) => {
  if (!data) return null;
  const score = Math.round(data.score);
  const above = score >= 50;
  const fill = above ? A.positive : A.negative;
  const bandFill = above ? A.positiveBand : A.negativeBand;
  const fadeFill = above ? A.positiveFade : A.negativeFade;
  const efficient = data.efficient;
  const showDot = efficiencyMode === "dot" && efficient !== undefined;
  const showTwoTone = efficiencyMode === "two-tone" && efficient === false;

  const barWidthPct = score;
  const bandLeft = data.min ?? score;
  const bandWidth = (data.max ?? score) - (data.min ?? score);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 36px 14px", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 12, color: A.text, fontWeight: 500 }} title={TRAIT_BLURBS[trait]}>
          {TRAIT_LABELS[trait]}
        </div>
        <div style={{ position: "relative", height: 14, background: "rgba(15, 23, 42, 0.6)", overflow: "hidden" }}>
          {/* Volatility band */}
          <div
            style={{
              position: "absolute",
              top: 4,
              height: 6,
              left: `${bandLeft}%`,
              width: `${bandWidth}%`,
              background: bandFill,
              transition: "all 320ms ease",
            }}
          />
          {/* Bar */}
          {showTwoTone ? (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  height: 14,
                  left: 0,
                  width: `${barWidthPct * 0.65}%`,
                  background: fill,
                  transition: "all 320ms ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  height: 14,
                  left: `${barWidthPct * 0.65}%`,
                  width: `${barWidthPct * 0.35}%`,
                  background: fadeFill,
                  transition: "all 320ms ease",
                }}
              />
            </>
          ) : (
            <div
              style={{
                position: "absolute",
                top: 0,
                height: 14,
                left: 0,
                width: `${barWidthPct}%`,
                background: fill,
                transition: "width 320ms ease",
              }}
            />
          )}
          {/* Hairline at 50 */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 1,
              background: A.baseline,
              transform: "translateX(-0.5px)",
            }}
          />
        </div>
        <div style={{ ...mono, fontSize: 11, color: A.text, fontWeight: 600, textAlign: "right" }}>{score}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {showDot && (
            <span
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: efficient ? A.positive : A.negative,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const AdvantageProfile = ({ player }) => {
  const [scope, setScope] = useState("archetype");
  const [efficiencyMode, setEfficiencyMode] = useState("dot");
  const profile = useMemo(() => deriveAdvantageProfile(player), [player]);

  if (!profile) {
    return (
      <div style={{ ...mono, fontSize: 11, color: A.textMute, letterSpacing: "0.12em", padding: 16 }}>
        ADVANTAGE PROFILE NOT AVAILABLE FOR THIS PLAYER
      </div>
    );
  }

  const translateScore = profile.translate[scope];
  const color = player.color || "#22D3EE";

  return (
    <div style={{ background: A.surface, border: `1px solid ${A.rule}`, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: A.textMute, textTransform: "uppercase" }}>
            Prospera Lens
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: A.text, marginTop: 4, letterSpacing: "-0.01em" }}>
            Advantage Profile
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <ToggleGroup
            label="Scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: "archetype", label: "Archetype" },
              { value: "absolute", label: "Absolute" },
            ]}
          />
          <ToggleGroup
            label="Efficiency"
            value={efficiencyMode}
            onChange={setEfficiencyMode}
            options={[
              { value: "dot", label: "Dot" },
              { value: "two-tone", label: "Two-tone" },
            ]}
          />
        </div>
      </div>

      {/* Translate single bar */}
      <RegionHeader label="Translate" />
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 36px", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <div style={{ ...mono, fontSize: 10, color: A.textDim, letterSpacing: "0.12em", textTransform: "uppercase" }}>Translate</div>
        <div style={{ position: "relative", height: 14, background: "rgba(15, 23, 42, 0.6)", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              height: 14,
              left: 0,
              width: `${translateScore}%`,
              background: color,
              transition: "width 320ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: 1,
              background: A.baseline,
              transform: "translateX(-0.5px)",
            }}
          />
        </div>
        <div style={{ ...mono, fontSize: 11, color: A.text, fontWeight: 600, textAlign: "right" }}>{Math.round(translateScore)}</div>
      </div>

      {TRAIT_REGIONS.map((region) => (
        <div key={region.id}>
          <RegionHeader label={region.label} />
          {region.traits.map((trait) => (
            <SingleBar
              key={trait}
              trait={trait}
              data={profile.traits[trait]?.[scope]}
              efficiencyMode={efficiencyMode}
            />
          ))}
        </div>
      ))}

      <Legend />

      {profile.derived && (
        <div style={{ ...mono, fontSize: 9, color: A.textMute, letterSpacing: "0.12em", marginTop: 14, textAlign: "center", textTransform: "uppercase" }}>
          Scores derived from current 9-trait grades · authored advantage data will override
        </div>
      )}
    </div>
  );
};
