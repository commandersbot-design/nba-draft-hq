import React, { useMemo, useState } from "react";
import { Plus, X, Search, Download, Edit3, ChevronDown, ChevronRight, FileText, Clock } from "lucide-react";

// PROSPERA · Signal Orange identity — see ScoutingTerminal T tokens for
// the canonical reference. cyan key holds the new orange accent so existing
// references inherit it; signal token retains the original cyan for
// "click here / interactive" cues only.
const T = {
  bg: "#050A12",
  surface: "rgba(15, 23, 42, 0.6)",
  surface2: "rgba(10, 15, 28, 0.92)",
  border: "#1F2937",
  borderSoft: "rgba(31, 41, 55, 0.6)",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMute: "#64748B",
  cyan: "#F97316",
  accentBright: "#FB923C",
  accentBg: "rgba(249, 115, 22, 0.08)",
  signal: "#22D3EE",
  blue: "#3B82F6",
  warn: "#F59E0B",
  danger: "#EF4444",
  positive: "#10B981",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const STATUSES = [
  { value: "WATCH", label: "Watch", color: T.textDim, hint: "On the list, deep dive not started" },
  { value: "ACTIVE", label: "Active", color: T.cyan, hint: "Actively writing / tracking" },
  { value: "ARCHIVED", label: "Archived", color: T.textMute, hint: "Finalized" },
];

const BUY_SELL = [
  { value: "BUY", label: "Buy", color: T.positive, hint: "Favorable view, taking the over" },
  { value: "HOLD", label: "Hold", color: T.warn, hint: "Neutral, watching" },
  { value: "SELL", label: "Sell", color: T.danger, hint: "Unfavorable view, taking the under" },
];

const CONFIDENCE = [
  { value: "LOW", label: "Low", color: T.textMute },
  { value: "MEDIUM", label: "Medium", color: T.warn },
  { value: "HIGH", label: "High", color: T.cyan },
];

// ---------- TAXONOMY ----------
const TRAIT_KEYS = [
  { key: "Advantage Creation",     short: "AC",  hint: "Self-creation, downhill drives, pull-up gravity" },
  { key: "Decision Making",        short: "DM",  hint: "Reads, shot selection, mistakes" },
  { key: "Passing Creation",       short: "PC",  hint: "Vision, advantage passing, drive-and-kick" },
  { key: "Shooting Gravity",       short: "SG",  hint: "Three-level threat, spacing impact" },
  { key: "Off-Ball Value",         short: "OB",  hint: "Cuts, screen actions, off-ball gravity" },
  { key: "Processing Speed",       short: "PS",  hint: "Speed of reads, defensive recognition" },
  { key: "Scalability",            short: "SC",  hint: "Maintains effectiveness in increased role" },
  { key: "Defensive Versatility",  short: "DV",  hint: "POA defense, switching, scheme range" },
];

const RISK_KEYS = [
  { key: "Shooting",                hint: "Shot translation concern" },
  { key: "Physical Translation",    hint: "Frame, athleticism vs. NBA bigs" },
  { key: "Creation Translation",    hint: "Will the on-ball game survive at higher level" },
  { key: "Defensive Role",          hint: "Where they fit on D" },
  { key: "Processing",              hint: "Speed of reads under pressure" },
  { key: "Age / Upside",            hint: "Older prospect with limited runway" },
  { key: "Motor / Consistency",     hint: "Effort, focus night-to-night" },
  { key: "Medical",                 hint: "Injury history / red flags" },
];

const RISK_LEVELS = [
  { value: 0, label: "Clean" },
  { value: 1, label: "Watch" },
  { value: 2, label: "Real Risk" },
  { value: 3, label: "Critical" },
];

const OUTCOME_TIERS = [
  { value: "",        label: "—" },
  { value: "Legend",  label: "Legend" },
  { value: "Star",    label: "Star" },
  { value: "Hit",     label: "Hit" },
  { value: "Swing",   label: "Swing" },
  { value: "Bust",    label: "Bust" },
];

const OUTCOME_TIER_COLORS = {
  Legend: "#A855F7", // purple — generational
  Star:   T.cyan,    // cyan — All-Star track
  Hit:    T.positive, // green — solid starter
  Swing:  T.warn,    // amber — boom/bust
  Bust:   T.danger,  // red — washed
};

const POSITIONS = ["PG", "SG", "SF", "PF", "C"];

// ---------- TEMPLATE ----------
// A blank deep dive uses these defaults so the form has a consistent shape
// and the markdown template stays in sync.
function emptyDeepDive(prospectId) {
  return {
    prospectId,
    status: "WATCH",
    buyHoldSell: "HOLD",
    confidence: "MEDIUM",
    personalComp: "",
    story: "",
    strengths: [],
    weaknesses: [],
    swingFactors: [],
    ceiling: "",
    ceilingTier: "",
    floor: "",
    floorTier: "",
    observations: [],
    traitNotes: "",
    traitOverrides: {},      // { "Advantage Creation": 8, ... } — overrides traits9 (1-10 scale)
    riskOverrides: {},       // { "Shooting": 1, ... } — overrides risks (0-3 scale)
    measurements: {          // verified combine-style measurements (optional)
      height: "",
      weight: "",
      wingspan: "",
      standingReach: "",
      maxVertical: "",
      bodyFat: "",
      laneAgility: "",
      threeQuarterSprint: "",
    },
    defendsPositions: [],    // ["PG", "SG"] — multi-select
    attacksAt: "",           // single position the player primarily attacks at
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

const TEMPLATE_MARKDOWN = `# Deep Dive · {{Player Name}}

**Position:** {{Position}}
**School / Team:** {{School}}
**Class / Age:** {{Class — Age}}
**Date:** {{YYYY-MM-DD}}
**Status:** WATCH / ACTIVE / ARCHIVED
**Buy · Hold · Sell:** BUY / HOLD / SELL
**Confidence:** LOW / MEDIUM / HIGH

---

## Personal Comp
> NBA player(s) this prospect resembles + 1-2 sentence reasoning. Aim for tape-based comp, not just position.

## The Story
> 2-3 paragraph write-up. Lead with what makes them interesting; explain the bet; close with the watch-out.

## Strengths
- ...
- ...
- ...

## Weaknesses
- ...
- ...

## Swing Factors
- ...
- ...

## Ceiling — Tier: Legend / Star / Hit / Swing / Bust
> Best-case NBA outcome. One paragraph.

## Floor — Tier: Star / Hit / Swing / Bust
> Worst-case NBA outcome. One paragraph.

## Trait Adjustments (optional, 1-10 scale)
- Advantage Creation: ___
- Decision Making: ___
- Passing Creation: ___
- Shooting Gravity: ___
- Off-Ball Value: ___
- Processing Speed: ___
- Scalability: ___
- Defensive Versatility: ___

## Risk Flags (optional, 0=Clean / 1=Watch / 2=Real Risk / 3=Critical)
- Shooting: ___
- Physical Translation: ___
- Creation Translation: ___
- Defensive Role: ___
- Processing: ___
- Age / Upside: ___
- Motor / Consistency: ___
- Medical: ___

## Verified Measurements (optional)
- Height: ___ Weight: ___ Wingspan: ___
- Standing reach: ___ Max vertical: ___
- Body fat %: ___ Lane agility: ___ ¾ sprint: ___

## Position Fit (optional)
- Defends: PG / SG / SF / PF / C  (circle all that apply)
- Attacks at: PG / SG / SF / PF / C

## Recent Observations
- {{YYYY-MM-DD}} vs {{Opponent}} — what stood out
- {{YYYY-MM-DD}} vs {{Opponent}} — ...

## Trait Notes (free-form)
> Anything you want to flag about specific traits, scoring overrides, or context the system can't capture.
`;

// ---------- SUB-COMPONENTS ----------

function PillSelector({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.hint}
          style={{
            ...mono,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: value === opt.value ? T.bg : opt.color,
            background: value === opt.value ? opt.color : "transparent",
            border: `1px solid ${opt.color}`,
            padding: "4px 9px",
            cursor: "pointer",
            fontWeight: value === opt.value ? 700 : 400,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", fontWeight: 600 }}>
        {children}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 3, lineHeight: 1.5 }}>{hint}</div>
      )}
    </div>
  );
}

function TextArea({ value, onChange, rows = 4, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "rgba(10, 15, 28, 0.7)",
        border: `1px solid ${T.border}`,
        color: T.text,
        padding: "10px 12px",
        fontSize: 13,
        fontFamily: "inherit",
        lineHeight: 1.55,
        resize: "vertical",
        outline: "none",
        boxSizing: "border-box",
      }}
      onFocus={(e) => (e.target.style.borderColor = T.cyan)}
      onBlur={(e) => (e.target.style.borderColor = T.border)}
    />
  );
}

function BulletList({ items, onChange, placeholder }) {
  const setItem = (i, val) => onChange(items.map((it, idx) => (idx === i ? val : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ ...mono, fontSize: 11, color: T.textMute, paddingTop: 8, minWidth: 16 }}>·</span>
          <input
            value={item}
            onChange={(e) => setItem(i, e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              background: "rgba(10, 15, 28, 0.7)",
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: "6px 10px",
              fontSize: 13,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 4, display: "flex" }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          ...mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          color: T.textDim,
          background: "transparent",
          border: `1px dashed ${T.border}`,
          padding: "5px 10px",
          cursor: "pointer",
          textTransform: "uppercase",
          width: "fit-content",
        }}
      >
        + Add bullet
      </button>
    </div>
  );
}

function ObservationsList({ observations, onChange }) {
  const remove = (i) => onChange(observations.filter((_, idx) => idx !== i));
  const add = () => onChange([{ date: new Date().toISOString().slice(0, 10), note: "", opponent: "" }, ...observations]);
  const setEntry = (i, key, val) => onChange(observations.map((o, idx) => (idx === i ? { ...o, [key]: val } : o)));
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        type="button"
        onClick={add}
        style={{
          ...mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          color: T.cyan,
          background: "rgba(249, 115, 22, 0.06)",
          border: `1px solid ${T.cyan}`,
          padding: "5px 10px",
          cursor: "pointer",
          textTransform: "uppercase",
          width: "fit-content",
        }}
      >
        + Add observation
      </button>
      {observations.map((obs, i) => (
        <div key={i} style={{
          padding: 10,
          background: "rgba(10, 15, 28, 0.5)",
          borderTop: `1px solid ${T.borderSoft}`,
          borderRight: `1px solid ${T.borderSoft}`,
          borderBottom: `1px solid ${T.borderSoft}`,
          borderLeft: `2px solid ${T.cyan}`,
          display: "grid",
          gap: 6,
          position: "relative",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 8, alignItems: "center" }}>
            <input
              type="date"
              value={obs.date || ""}
              onChange={(e) => setEntry(i, "date", e.target.value)}
              style={{
                ...mono,
                fontSize: 11,
                background: T.surface2,
                border: `1px solid ${T.border}`,
                color: T.text,
                padding: "4px 6px",
              }}
            />
            <input
              value={obs.opponent || ""}
              onChange={(e) => setEntry(i, "opponent", e.target.value)}
              placeholder="vs Opponent / setting"
              style={{
                background: T.surface2,
                border: `1px solid ${T.border}`,
                color: T.text,
                padding: "4px 8px",
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 2, display: "flex" }}
            >
              <X size={11} />
            </button>
          </div>
          <textarea
            value={obs.note || ""}
            onChange={(e) => setEntry(i, "note", e.target.value)}
            placeholder="What stood out — pull-up jumper, decision-making, defensive engagement, etc."
            rows={2}
            style={{
              background: T.surface2,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: "6px 8px",
              fontSize: 12,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>
      ))}
    </div>
  );
}

function TraitOverrideRow({ traitKey, short, hint, systemValue, value, onChange }) {
  const display = value != null ? value : null;
  const sys = systemValue != null ? systemValue : null;
  const delta = display != null && sys != null ? display - sys : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 56px 1fr 56px", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
      <div>
        <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{traitKey}</div>
        <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.08em", marginTop: 2 }}>{short} · {hint}</div>
      </div>
      <div style={{ ...mono, fontSize: 11, color: T.textMute, textAlign: "center" }}>
        {sys != null ? `Sys ${sys}` : "Sys —"}
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={display ?? sys ?? 5}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: T.cyan }}
      />
      <div style={{ ...mono, fontSize: 12, color: display != null ? T.cyan : T.textMute, textAlign: "right", fontWeight: 600 }}>
        {display != null ? `${display}/10` : "—"}
        {delta != null && delta !== 0 && (
          <div style={{ ...mono, fontSize: 9, color: delta > 0 ? T.cyan : T.warn, marginTop: 1 }}>
            {delta > 0 ? "+" : ""}{delta}
          </div>
        )}
      </div>
    </div>
  );
}

function RiskOverrideRow({ riskKey, hint, systemValue, value, onChange }) {
  const display = value != null ? value : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 60px 1fr 110px", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.borderSoft}` }}>
      <div>
        <div style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{riskKey}</div>
        <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.08em", marginTop: 2 }}>{hint}</div>
      </div>
      <div style={{ ...mono, fontSize: 11, color: T.textMute, textAlign: "center" }}>
        {systemValue != null ? `Sys ${systemValue}` : "—"}
      </div>
      <select
        value={display ?? systemValue ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          ...mono,
          fontSize: 11,
          letterSpacing: "0.06em",
          color: display && display >= 2 ? T.warn : display === 1 ? T.cyan : T.text,
          background: T.surface2,
          border: `1px solid ${T.border}`,
          padding: "4px 8px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        {RISK_LEVELS.map((lvl) => (
          <option key={lvl.value} value={lvl.value}>
            {lvl.value} · {lvl.label}
          </option>
        ))}
      </select>
      <div style={{ ...mono, fontSize: 11, color: display && display >= 2 ? T.warn : display === 1 ? T.cyan : T.textMute, textAlign: "right" }}>
        {display != null ? RISK_LEVELS.find((l) => l.value === display)?.label : "—"}
      </div>
    </div>
  );
}

function MeasurementsGrid({ measurements, onChange }) {
  const fields = [
    { key: "height",            label: "Height",       placeholder: '6-9' },
    { key: "weight",            label: "Weight (lb)",  placeholder: "210" },
    { key: "wingspan",          label: "Wingspan",     placeholder: "7-0" },
    { key: "standingReach",     label: "Stand reach",  placeholder: "8-11" },
    { key: "maxVertical",       label: "Max vert (in)", placeholder: "39" },
    { key: "bodyFat",           label: "Body fat %",   placeholder: "5.2" },
    { key: "laneAgility",       label: "Lane agility (s)", placeholder: "10.8" },
    { key: "threeQuarterSprint",label: "¾ sprint (s)", placeholder: "3.18" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }} className="prospera-meta-strip">
      {fields.map((f) => (
        <div key={f.key}>
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", marginBottom: 4, textTransform: "uppercase" }}>{f.label}</div>
          <input
            value={measurements[f.key] || ""}
            onChange={(e) => onChange({ ...measurements, [f.key]: e.target.value })}
            placeholder={f.placeholder}
            style={{
              width: "100%",
              background: T.surface2,
              border: `1px solid ${T.border}`,
              color: T.text,
              padding: "6px 8px",
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
              ...mono,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function PositionFit({ defendsPositions, attacksAt, onDefendChange, onAttackChange }) {
  const toggleDefend = (pos) => {
    if (defendsPositions.includes(pos)) onDefendChange(defendsPositions.filter((p) => p !== pos));
    else onDefendChange([...defendsPositions, pos]);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="prospera-eval-grid">
      <div>
        <FieldLabel hint="Tap every position they can guard at the next level (multi-select).">
          Defends
        </FieldLabel>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {POSITIONS.map((pos) => {
            const active = defendsPositions.includes(pos);
            return (
              <button
                key={pos}
                type="button"
                onClick={() => toggleDefend(pos)}
                style={{
                  ...mono,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  color: active ? T.bg : T.cyan,
                  background: active ? T.cyan : "transparent",
                  border: `1px solid ${T.cyan}`,
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {pos}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <FieldLabel hint="Where the offense actually flows through them.">Primary attack position</FieldLabel>
        <select
          value={attacksAt || ""}
          onChange={(e) => onAttackChange(e.target.value)}
          style={{
            ...mono,
            fontSize: 12,
            color: attacksAt ? T.cyan : T.textMute,
            background: T.surface2,
            border: `1px solid ${T.border}`,
            padding: "8px 10px",
            cursor: "pointer",
            minWidth: 140,
          }}
        >
          <option value="">—</option>
          {POSITIONS.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
        </select>
      </div>
    </div>
  );
}

// ---------- DEEP DIVE FORM ----------
function DeepDiveForm({ prospect, deepDive, onChange, onClose, onDelete }) {
  const update = (patch) => {
    onChange({
      ...deepDive,
      ...patch,
      lastUpdated: new Date().toISOString(),
    });
  };

  const setStrengths = (items) => update({ strengths: items });
  const setWeaknesses = (items) => update({ weaknesses: items });
  const setSwings = (items) => update({ swingFactors: items });
  const setObservations = (items) => update({ observations: items });

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: "20px 22px", display: "grid", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase" }}>Deep Dive</div>
          <div style={{ fontSize: 22, color: T.text, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}>
            {prospect?.name || "—"}
          </div>
          <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: "0.12em", marginTop: 4, textTransform: "uppercase" }}>
            {prospect?.school || "—"} · {prospect?.pos || "—"} · {prospect?.cls || "—"} · #{prospect?.rank ?? "—"}
          </div>
          <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 8, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={10} /> Last updated {new Date(deepDive.lastUpdated).toLocaleString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onDelete}
            style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", color: T.danger, background: "transparent", border: `1px solid ${T.danger}`, padding: "5px 10px", cursor: "pointer", textTransform: "uppercase" }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", color: T.textDim, background: "transparent", border: `1px solid ${T.border}`, padding: "5px 10px", cursor: "pointer", textTransform: "uppercase" }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Status pills */}
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <FieldLabel>Status</FieldLabel>
          <PillSelector value={deepDive.status} onChange={(v) => update({ status: v })} options={STATUSES} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="prospera-eval-grid">
          <div>
            <FieldLabel>Buy · Hold · Sell</FieldLabel>
            <PillSelector value={deepDive.buyHoldSell} onChange={(v) => update({ buyHoldSell: v })} options={BUY_SELL} />
          </div>
          <div>
            <FieldLabel>Confidence</FieldLabel>
            <PillSelector value={deepDive.confidence} onChange={(v) => update({ confidence: v })} options={CONFIDENCE} />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel hint="NBA player(s) this prospect resembles. Tape-based, not just position. 1-2 sentences on why.">
          Personal Comp
        </FieldLabel>
        <TextArea value={deepDive.personalComp} onChange={(v) => update({ personalComp: v })} rows={2} placeholder="e.g. Mikal Bridges with more on-ball juice — same defensive instincts and switchability, but the dribble package and pull-up are a step ahead at this stage." />
      </div>

      <div>
        <FieldLabel hint="2-3 paragraph write-up. Lead with what makes them interesting; explain the bet; close with the watch-out.">
          The Story
        </FieldLabel>
        <TextArea value={deepDive.story} onChange={(v) => update({ story: v })} rows={6} placeholder="Open the dossier..." />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }} className="prospera-eval-grid">
        <div>
          <FieldLabel>Strengths</FieldLabel>
          <BulletList items={deepDive.strengths} onChange={setStrengths} placeholder="What translates" />
        </div>
        <div>
          <FieldLabel>Weaknesses</FieldLabel>
          <BulletList items={deepDive.weaknesses} onChange={setWeaknesses} placeholder="What concerns you" />
        </div>
        <div>
          <FieldLabel>Swing Factors</FieldLabel>
          <BulletList items={deepDive.swingFactors} onChange={setSwings} placeholder="What determines ceiling" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="prospera-eval-grid">
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
            <FieldLabel hint="Best-case NBA outcome.">Ceiling</FieldLabel>
            <select
              value={deepDive.ceilingTier || ""}
              onChange={(e) => update({ ceilingTier: e.target.value })}
              title="Ceiling outcome tier"
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.08em",
                color: deepDive.ceilingTier ? T.cyan : T.textMute,
                background: T.surface2,
                border: `1px solid ${deepDive.ceilingTier ? T.cyan : T.border}`,
                padding: "3px 6px",
                cursor: "pointer",
                marginBottom: 4,
              }}
            >
              {OUTCOME_TIERS.map((t) => (
                <option key={t.value} value={t.value}>Tier · {t.label}</option>
              ))}
            </select>
          </div>
          <TextArea value={deepDive.ceiling} onChange={(v) => update({ ceiling: v })} rows={3} placeholder="If everything translates..." />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
            <FieldLabel hint="Worst-case NBA outcome.">Floor</FieldLabel>
            <select
              value={deepDive.floorTier || ""}
              onChange={(e) => update({ floorTier: e.target.value })}
              title="Floor outcome tier"
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.08em",
                color: deepDive.floorTier ? T.warn : T.textMute,
                background: T.surface2,
                border: `1px solid ${deepDive.floorTier ? T.warn : T.border}`,
                padding: "3px 6px",
                cursor: "pointer",
                marginBottom: 4,
              }}
            >
              {OUTCOME_TIERS.map((t) => (
                <option key={t.value} value={t.value}>Tier · {t.label}</option>
              ))}
            </select>
          </div>
          <TextArea value={deepDive.floor} onChange={(v) => update({ floor: v })} rows={3} placeholder="If the swing skills don't develop..." />
        </div>
      </div>

      {/* Trait Adjustments */}
      <div>
        <FieldLabel hint="Override the system's trait scores (1-10). Leave at system value to defer. Drag the slider only when you have a real read.">
          Trait Adjustments
        </FieldLabel>
        <div style={{ background: "rgba(10, 15, 28, 0.4)", border: `1px solid ${T.borderSoft}`, padding: "8px 14px" }}>
          {TRAIT_KEYS.map((t) => (
            <TraitOverrideRow
              key={t.key}
              traitKey={t.key}
              short={t.short}
              hint={t.hint}
              systemValue={prospect?.traits9?.[t.key] ?? prospect?.traits?.[t.key] ?? null}
              value={deepDive.traitOverrides?.[t.key]}
              onChange={(val) => update({ traitOverrides: { ...(deepDive.traitOverrides || {}), [t.key]: val } })}
            />
          ))}
          {Object.keys(deepDive.traitOverrides || {}).length > 0 && (
            <button
              type="button"
              onClick={() => update({ traitOverrides: {} })}
              style={{ ...mono, fontSize: 9, letterSpacing: "0.12em", color: T.textMute, background: "transparent", border: `1px dashed ${T.border}`, padding: "4px 8px", cursor: "pointer", textTransform: "uppercase", marginTop: 10 }}
            >
              Reset all overrides
            </button>
          )}
        </div>
      </div>

      {/* Risk Flags */}
      <div>
        <FieldLabel hint="Mark the dimensions where this player has translation risk. 0=Clean / 1=Watch / 2=Real Risk / 3=Critical.">
          Risk Flags
        </FieldLabel>
        <div style={{ background: "rgba(10, 15, 28, 0.4)", border: `1px solid ${T.borderSoft}`, padding: "8px 14px" }}>
          {RISK_KEYS.map((r) => (
            <RiskOverrideRow
              key={r.key}
              riskKey={r.key}
              hint={r.hint}
              systemValue={prospect?.risks?.[r.key] ?? null}
              value={deepDive.riskOverrides?.[r.key]}
              onChange={(val) => update({ riskOverrides: { ...(deepDive.riskOverrides || {}), [r.key]: val } })}
            />
          ))}
        </div>
      </div>

      {/* Verified Measurements */}
      <div>
        <FieldLabel hint="Combine / pro-day measurements you trust. Leave blank if unverified — the system has its own listed numbers.">
          Verified Measurements
        </FieldLabel>
        <MeasurementsGrid
          measurements={deepDive.measurements || {}}
          onChange={(m) => update({ measurements: m })}
        />
      </div>

      {/* Position Fit */}
      <div>
        <FieldLabel hint="Where they actually fit at the next level — both ends of the floor.">
          Position Fit
        </FieldLabel>
        <PositionFit
          defendsPositions={deepDive.defendsPositions || []}
          attacksAt={deepDive.attacksAt || ""}
          onDefendChange={(arr) => update({ defendsPositions: arr })}
          onAttackChange={(pos) => update({ attacksAt: pos })}
        />
      </div>

      <div>
        <FieldLabel hint="Game-by-game observations. Build a timeline as you watch.">Recent Observations</FieldLabel>
        <ObservationsList observations={deepDive.observations} onChange={setObservations} />
      </div>

      <div>
        <FieldLabel hint="Anything about specific traits, scoring overrides, or context the system can't capture.">
          Trait Notes
        </FieldLabel>
        <TextArea value={deepDive.traitNotes} onChange={(v) => update({ traitNotes: v })} rows={3} placeholder="e.g. Confidence rating feels two ticks low — he's already taking and making big-moment shots..." />
      </div>
    </div>
  );
}

// ---------- LIST CARD ----------
function DeepDiveCard({ prospect, deepDive, onClick }) {
  const status = STATUSES.find((s) => s.value === deepDive.status);
  const stance = BUY_SELL.find((s) => s.value === deepDive.buyHoldSell);
  const conf = CONFIDENCE.find((c) => c.value === deepDive.confidence);
  const ceilingColor = deepDive.ceilingTier ? OUTCOME_TIER_COLORS[deepDive.ceilingTier] : null;
  const floorColor = deepDive.floorTier ? OUTCOME_TIER_COLORS[deepDive.floorTier] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${status?.color || T.textMute}`,
        padding: "12px 14px",
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        gap: 12,
        alignItems: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          background: T.surface2,
          border: `1px solid ${T.border}`,
          ...mono,
          fontSize: 12,
          color: T.cyan,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        #{String(prospect?.rank ?? "—").padStart(2, "0")}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, color: T.text, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {prospect?.name || "Unknown"}
        </div>
        <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 3, textTransform: "uppercase" }}>
          {prospect?.school || "—"} · {prospect?.pos || "—"}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {status && (
            <span style={{ ...mono, fontSize: 8, letterSpacing: "0.14em", color: status.color, border: `1px solid ${status.color}`, padding: "2px 6px", textTransform: "uppercase" }}>
              {status.label}
            </span>
          )}
          {stance && (
            <span style={{ ...mono, fontSize: 8, letterSpacing: "0.14em", color: stance.color, border: `1px solid ${stance.color}`, padding: "2px 6px", textTransform: "uppercase" }}>
              {stance.label}
            </span>
          )}
          {conf && (
            <span style={{ ...mono, fontSize: 8, letterSpacing: "0.14em", color: conf.color, border: `1px solid ${conf.color}`, padding: "2px 6px", textTransform: "uppercase" }}>
              Conf · {conf.label}
            </span>
          )}
          {(ceilingColor || floorColor) && (
            <span
              title={`Ceiling: ${deepDive.ceilingTier || "—"} · Floor: ${deepDive.floorTier || "—"}`}
              style={{
                ...mono,
                fontSize: 8,
                letterSpacing: "0.14em",
                color: T.textDim,
                border: `1px solid ${T.borderSoft}`,
                padding: "2px 6px",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {ceilingColor ? (
                <span style={{ color: ceilingColor, fontWeight: 600 }}>↑ {deepDive.ceilingTier}</span>
              ) : (
                <span style={{ color: T.textMute }}>↑ —</span>
              )}
              <span style={{ color: T.textMute }}>/</span>
              {floorColor ? (
                <span style={{ color: floorColor, fontWeight: 600 }}>↓ {deepDive.floorTier}</span>
              ) : (
                <span style={{ color: T.textMute }}>↓ —</span>
              )}
            </span>
          )}
        </div>
      </div>
      <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", textAlign: "right", textTransform: "uppercase" }}>
        {new Date(deepDive.lastUpdated).toLocaleDateString()}
      </div>
    </button>
  );
}

// ---------- TEMPLATE PANEL ----------
function TemplatePanel({ open, onClose }) {
  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_MARKDOWN], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospera-deep-dive-template.md";
    a.click();
    URL.revokeObjectURL(url);
  };
  if (!open) return null;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase" }}>
            Offline Template
          </div>
          <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginTop: 2 }}>Markdown deep-dive scaffold</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={downloadTemplate}
            style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", color: T.cyan, background: "transparent", border: `1px solid ${T.cyan}`, padding: "5px 10px", cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}
          >
            <Download size={11} /> Download .md
          </button>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 2, display: "flex" }}>
            <X size={12} />
          </button>
        </div>
      </div>
      <pre style={{
        ...mono,
        fontSize: 11,
        color: T.textDim,
        background: T.surface2,
        border: `1px solid ${T.borderSoft}`,
        padding: "12px 14px",
        margin: 0,
        whiteSpace: "pre-wrap",
        lineHeight: 1.6,
        maxHeight: 360,
        overflowY: "auto",
      }}>
{TEMPLATE_MARKDOWN}
      </pre>
      <div style={{ fontSize: 11, color: T.textDim, marginTop: 10, lineHeight: 1.5 }}>
        Use this as a daily writing scaffold. Fill it out offline (Notion / Obsidian / a plain editor), then paste each section into the form here when you're ready to publish. Goal: 1-3 dossiers per day → site updates as soon as you save.
      </div>
    </div>
  );
}

// ---------- MAIN PAGE ----------
export const DeepDivesPage = ({ prospects = [], deepDives = {}, setDeepDives, onOpenProfile }) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const prospectsById = useMemo(() => Object.fromEntries(prospects.map((p) => [p.id, p])), [prospects]);

  const filteredEntries = useMemo(() => {
    return Object.values(deepDives)
      .filter((dd) => statusFilter === "ALL" || dd.status === statusFilter)
      .filter((dd) => {
        const p = prospectsById[dd.prospectId];
        if (!p) return false;
        if (!query.trim()) return true;
        return p.name.toLowerCase().includes(query.toLowerCase()) || (p.school || "").toLowerCase().includes(query.toLowerCase());
      })
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }, [deepDives, statusFilter, query, prospectsById]);

  const counts = useMemo(() => {
    const c = { ALL: 0, WATCH: 0, ACTIVE: 0, ARCHIVED: 0 };
    for (const dd of Object.values(deepDives)) {
      c.ALL++;
      c[dd.status] = (c[dd.status] || 0) + 1;
    }
    return c;
  }, [deepDives]);

  const updateOne = (id, patch) => {
    setDeepDives((curr) => ({ ...curr, [id]: { ...curr[id], ...patch } }));
  };
  const removeOne = (id) => {
    setDeepDives((curr) => {
      const next = { ...curr };
      delete next[id];
      return next;
    });
    setEditingId(null);
  };
  const addOne = (prospectId) => {
    setDeepDives((curr) => ({ ...curr, [prospectId]: emptyDeepDive(prospectId) }));
    setShowPicker(false);
    setEditingId(prospectId);
  };

  const editing = editingId ? deepDives[editingId] : null;
  const editingProspect = editingId ? prospectsById[editingId] : null;

  // Pickable prospects (those without a deep dive yet, sorted by rank)
  const pickable = useMemo(() => {
    return prospects
      .filter((p) => !deepDives[p.id])
      .sort((a, b) => a.rank - b.rank);
  }, [prospects, deepDives]);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase" }}>Workspace</div>
          <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Deep Dives
          </h1>
          <div style={{ fontSize: 13, color: T.textDim }}>
            {counts.ALL} authored · personal scout reports, daily updates, NBA comps, recent observations
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowTemplate((v) => !v)}
            style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", color: showTemplate ? T.cyan : T.textDim, background: "transparent", border: `1px solid ${showTemplate ? T.cyan : T.border}`, padding: "6px 12px", cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}
          >
            <FileText size={11} /> Template
          </button>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", color: T.cyan, background: "rgba(249, 115, 22, 0.08)", border: `1px solid ${T.cyan}`, padding: "6px 12px", cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={11} /> New Deep Dive
          </button>
        </div>
      </div>

      <TemplatePanel open={showTemplate} onClose={() => setShowTemplate(false)} />

      {/* Status filter chips */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {["ALL", "WATCH", "ACTIVE", "ARCHIVED"].map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: isActive ? T.cyan : T.textDim,
                background: isActive ? "rgba(249, 115, 22, 0.08)" : "transparent",
                border: `1px solid ${isActive ? T.cyan : T.border}`,
                padding: "5px 9px",
                cursor: "pointer",
              }}
            >
              {s === "ALL" ? `All · ${counts.ALL}` : `${s} · ${counts[s] || 0}`}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: T.surface, border: `1px solid ${T.border}`, padding: "8px 12px", marginBottom: 14 }}>
        <Search size={13} color={T.textMute} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search deep dives by name or school…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: T.text, fontSize: 13 }}
        />
      </div>

      {/* Picker modal */}
      {showPicker && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 10, 18, 0.85)",
          zIndex: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }} onClick={() => setShowPicker(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: T.surface2, border: `1px solid ${T.border}`, width: "min(560px, 100%)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase" }}>Pick a prospect</div>
                <div style={{ fontSize: 14, color: T.text, fontWeight: 600, marginTop: 2 }}>Start a new deep dive</div>
              </div>
              <button type="button" onClick={() => setShowPicker(false)} style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 2, display: "flex" }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {pickable.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.12em" }}>
                  ALL PROSPECTS ALREADY HAVE A DEEP DIVE
                </div>
              ) : (
                pickable.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addOne(p.id)}
                    style={{
                      width: "100%",
                      display: "grid",
                      gridTemplateColumns: "48px 1fr 80px",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 14px",
                      background: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${T.borderSoft}`,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249, 115, 22, 0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ ...mono, fontSize: 12, color: T.cyan }}>#{String(p.rank).padStart(2, "0")}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2 }}>
                        {p.school || "—"} · {p.pos || "—"}
                      </div>
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: "0.1em", textAlign: "right" }}>
                      Add
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      {editing && editingProspect && (
        <div style={{ marginBottom: 18 }}>
          <DeepDiveForm
            prospect={editingProspect}
            deepDive={editing}
            onChange={(next) => updateOne(editingId, next)}
            onClose={() => setEditingId(null)}
            onDelete={() => removeOne(editingId)}
          />
        </div>
      )}

      {/* List */}
      {filteredEntries.length === 0 ? (
        <div style={{ background: T.surface, border: `1px dashed ${T.border}`, padding: 32, textAlign: "center", ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {counts.ALL === 0 ? "No deep dives yet · click + New Deep Dive to start" : "No matches for current filter"}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filteredEntries.map((dd) => (
            <DeepDiveCard
              key={dd.prospectId}
              prospect={prospectsById[dd.prospectId]}
              deepDive={dd}
              onClick={() => setEditingId(dd.prospectId)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
