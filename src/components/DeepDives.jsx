import React, { useMemo, useState } from "react";
import { Plus, X, Search, Download, Edit3, ChevronDown, ChevronRight, FileText, Clock } from "lucide-react";

const T = {
  bg: "#050A12",
  surface: "rgba(15, 23, 42, 0.6)",
  surface2: "rgba(10, 15, 28, 0.92)",
  border: "#1F2937",
  borderSoft: "rgba(31, 41, 55, 0.6)",
  text: "#E2E8F0",
  textDim: "#94A3B8",
  textMute: "#64748B",
  cyan: "#22D3EE",
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
    floor: "",
    observations: [],
    traitNotes: "",
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

## Ceiling
> Best-case NBA outcome. One paragraph.

## Floor
> Worst-case NBA outcome. One paragraph.

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
          background: "rgba(34, 211, 238, 0.06)",
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
          <FieldLabel hint="Best-case NBA outcome.">Ceiling</FieldLabel>
          <TextArea value={deepDive.ceiling} onChange={(v) => update({ ceiling: v })} rows={3} placeholder="If everything translates..." />
        </div>
        <div>
          <FieldLabel hint="Worst-case NBA outcome.">Floor</FieldLabel>
          <TextArea value={deepDive.floor} onChange={(v) => update({ floor: v })} rows={3} placeholder="If the swing skills don't develop..." />
        </div>
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
            style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", color: T.cyan, background: "rgba(34, 211, 238, 0.08)", border: `1px solid ${T.cyan}`, padding: "6px 12px", cursor: "pointer", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}
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
                background: isActive ? "rgba(34, 211, 238, 0.08)" : "transparent",
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
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34, 211, 238, 0.04)")}
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
