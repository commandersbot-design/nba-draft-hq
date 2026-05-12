import React from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import ScoutTab from "./ScoutTab";

/**
 * ScoutNotesHub — master-detail view for authoring Scout View notes across
 * every active prospect in one place.
 *
 * Left pane:  prospect list with tier badge + ceiling-call preview + a
 *             filter chip strip (All / Authored / Unauthored / by tier).
 *             Sort: rank (default) or last edited.
 *
 * Right pane: full ScoutTab editor (tags, tier call, per-tier notes,
 *             ceiling call, summary) for the selected prospect — same
 *             component that powers the player profile's Scout View tab,
 *             so any change here also shows on the profile and vice versa.
 *
 * Lets the scout author all 60 prospects' notes without navigating back
 * to Scout Desk → profile → tab for each one.
 */

const T = {
  bg:           "var(--prospera-bg)",
  surface:      "var(--prospera-card)",
  surface2:     "var(--prospera-surface-2)",
  border:       "var(--prospera-border)",
  borderSoft:   "var(--prospera-border-soft)",
  text:         "var(--prospera-text)",
  textDim:      "var(--prospera-text-dim)",
  textMute:     "var(--prospera-text-mute)",
  cyan:         "var(--prospera-cyan)",
  signal:       "var(--prospera-signal)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const TIER_META = {
  FL:  { label: "Floor",    color: T.textMute },
  LE:  { label: "Low End",  color: T.textDim  },
  MID: { label: "Middle",   color: T.cyan     },
  HE:  { label: "High End", color: "#F59E0B"  },
  C:   { label: "Ceiling",  color: T.signal   },
};

const FILTER_OPTIONS = [
  { key: "ALL",        label: "All" },
  { key: "AUTHORED",   label: "Authored" },
  { key: "UNAUTHORED", label: "Unauthored" },
  { key: "C",          label: "Ceiling" },
  { key: "HE",         label: "High End" },
  { key: "MID",        label: "Middle" },
  { key: "LE",         label: "Low End" },
  { key: "FL",         label: "Floor" },
];

const SORT_OPTIONS = [
  { key: "rank",     label: "Rank" },
  { key: "recent",   label: "Recently edited" },
  { key: "name",     label: "Name" },
];

function isAuthored(view) {
  if (!view) return false;
  return Boolean(
    view.tierRating ||
    view.overallCeilingCall?.trim() ||
    view.summary?.trim() ||
    Object.values(view.tierNotes || {}).some((n) => n && n.trim()),
  );
}

function TierBadge({ tier }) {
  if (!tier) {
    return <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", padding: "1px 6px", border: `1px dashed ${T.border}` }}>·</span>;
  }
  const meta = TIER_META[tier];
  return (
    <span style={{
      ...mono, fontSize: 9, letterSpacing: "0.12em", fontWeight: 700,
      color: meta.color, border: `1px solid ${meta.color}`,
      background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
      padding: "1px 7px", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{tier}</span>
  );
}

function ProspectListItem({ p, view, isSelected, onClick }) {
  const tier = view?.tierRating || "";
  const ceiling = view?.overallCeilingCall?.trim();
  const lastUpdated = view?.lastUpdated;
  const summaryPreview = view?.summary?.trim()?.slice(0, 80) || "";
  const authored = isAuthored(view);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: isSelected ? "var(--prospera-accent-bg)" : "transparent",
        border: "none",
        borderBottom: `1px solid ${T.borderSoft}`,
        borderLeft: `3px solid ${isSelected ? T.cyan : (authored ? T.textDim : "transparent")}`,
        padding: "10px 14px 10px 11px",
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        display: "block",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--prospera-accent-bg-soft)"; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 13, color: T.text, fontWeight: 500, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {p.name}
        </span>
        <TierBadge tier={tier} />
      </div>
      <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", display: "flex", gap: 6, alignItems: "center" }}>
        <span>{(p.pos || "—")}</span>
        <span>·</span>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.school?.split(" ")[0] || "—"}</span>
        {lastUpdated && (<>
          <span>·</span>
          <span style={{ color: T.textDim }}>edit {formatRelativeTime(lastUpdated)}</span>
        </>)}
      </div>
      {(ceiling || summaryPreview) && (
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {ceiling ? <span style={{ color: T.text }}>{ceiling}</span> : null}
          {ceiling && summaryPreview ? <span style={{ color: T.textMute }}> — </span> : null}
          {summaryPreview ? <span style={{ color: T.textMute }}>{summaryPreview}…</span> : null}
        </div>
      )}
    </button>
  );
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export default function ScoutNotesHub({ prospects = [] }) {
  const [allViews] = useLocalStorageState("prospera.terminal.scout-views", {});
  const [selectedId, setSelectedId] = useLocalStorageState("prospera.terminal.scout-notes-selected", "");
  const [filter, setFilter] = React.useState("ALL");
  const [sortKey, setSortKey] = React.useState("rank");
  const [query, setQuery] = React.useState("");

  // Coverage counts
  const counts = React.useMemo(() => {
    const c = { ALL: prospects.length, AUTHORED: 0, UNAUTHORED: 0, FL: 0, LE: 0, MID: 0, HE: 0, C: 0 };
    for (const p of prospects) {
      const v = allViews[p.id];
      const authored = isAuthored(v);
      if (authored) c.AUTHORED++; else c.UNAUTHORED++;
      const tier = v?.tierRating;
      if (tier && c[tier] != null) c[tier]++;
    }
    return c;
  }, [prospects, allViews]);

  // Filter + sort
  const visible = React.useMemo(() => {
    const lowered = query.trim().toLowerCase();
    let list = prospects.slice();
    if (filter !== "ALL") {
      list = list.filter((p) => {
        const v = allViews[p.id];
        if (filter === "AUTHORED") return isAuthored(v);
        if (filter === "UNAUTHORED") return !isAuthored(v);
        return v?.tierRating === filter;
      });
    }
    if (lowered) {
      list = list.filter((p) => {
        const hay = [p.name, p.school, p.pos, p.archetype].join(" ").toLowerCase();
        return hay.includes(lowered);
      });
    }
    if (sortKey === "name") {
      list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } else if (sortKey === "recent") {
      list.sort((a, b) => {
        const ta = new Date(allViews[a.id]?.lastUpdated || 0).getTime();
        const tb = new Date(allViews[b.id]?.lastUpdated || 0).getTime();
        return tb - ta;
      });
    } else {
      list.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }
    return list;
  }, [prospects, filter, sortKey, query, allViews]);

  // Pick a sensible default if nothing selected or selection is filtered out
  React.useEffect(() => {
    if (visible.length === 0) return;
    if (!selectedId || !visible.some((p) => p.id === selectedId)) {
      setSelectedId(visible[0].id);
    }
  }, [visible, selectedId, setSelectedId]);

  const selected = prospects.find((p) => p.id === selectedId) || null;

  return (
    <div style={{ padding: "20px 28px 60px", maxWidth: 1500, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 26, color: T.text, margin: "4px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Scout Notes
        </h1>
        <div style={{ fontSize: 12, color: T.textDim }}>
          Author Floor → Ceiling tier notes, tag assignments, ceiling calls, and summary writeups for every prospect in one place.
          Picks shared with the profile's Scout View tab and the Scout Desk inline pills.
        </div>
      </div>

      {/* Coverage strip */}
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap", alignItems: "baseline", ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        <span><span style={{ color: T.cyan }}>{counts.AUTHORED}</span> / {counts.ALL} authored</span>
        <span>·</span>
        <span><span style={{ color: T.signal }}>{counts.C}</span> ceiling</span>
        <span><span style={{ color: "#F59E0B" }}>{counts.HE}</span> high-end</span>
        <span><span style={{ color: T.cyan }}>{counts.MID}</span> middle</span>
        <span><span style={{ color: T.textDim }}>{counts.LE}</span> low-end</span>
        <span><span style={{ color: T.textMute }}>{counts.FL}</span> floor</span>
      </div>

      {/* Filter + sort + search toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prospects…"
          style={{
            flex: "0 1 240px",
            background: T.surface2,
            border: `1px solid ${T.border}`,
            color: T.text,
            padding: "6px 10px",
            fontSize: 12,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 0, border: `1px solid ${T.border}` }}>
          {FILTER_OPTIONS.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key];
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                style={{
                  ...mono, fontSize: 9, letterSpacing: "0.12em",
                  color: active ? T.cyan : T.textDim,
                  background: active ? "var(--prospera-accent-bg)" : "transparent",
                  border: "none",
                  borderRight: `1px solid ${T.border}`,
                  padding: "6px 10px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  fontWeight: active ? 700 : 500,
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}{count != null ? ` · ${count}` : ""}
              </button>
            );
          })}
        </div>
        <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: "auto" }}>
          Sort:
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          style={{
            ...mono, fontSize: 11, letterSpacing: "0.06em",
            color: T.text, background: T.surface2,
            border: `1px solid ${T.border}`, padding: "5px 8px",
            cursor: "pointer", outline: "none",
          }}
        >
          {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {/* Master-detail body */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }} className="prospera-scout-notes-grid">
        {/* Left: prospect list */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          maxHeight: "calc(100vh - 240px)",
          overflowY: "auto",
        }}>
          {visible.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.12em" }}>
              NO PROSPECTS MATCH THIS FILTER
            </div>
          )}
          {visible.map((p) => (
            <ProspectListItem
              key={p.id}
              p={p}
              view={allViews[p.id]}
              isSelected={p.id === selectedId}
              onClick={() => setSelectedId(p.id)}
            />
          ))}
        </div>

        {/* Right: editor */}
        <div style={{
          background: T.surface,
          border: `1px solid ${T.border}`,
          padding: "20px 22px",
          minHeight: 400,
        }}>
          {selected ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.borderSoft}` }}>
                <div>
                  <div style={{ fontSize: 22, color: T.text, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    {selected.name}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.12em", marginTop: 3, textTransform: "uppercase" }}>
                    {selected.pos || "—"} · {selected.cls || "—"} · {selected.school || "—"} · {selected.archetype || "—"}
                  </div>
                </div>
              </div>
              <ScoutTab p={selected} />
            </>
          ) : (
            <div style={{ padding: 40, textAlign: "center", ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.14em" }}>
              SELECT A PROSPECT FROM THE LIST
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
