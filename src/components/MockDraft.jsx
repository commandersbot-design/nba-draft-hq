import React, { useState, useMemo } from "react";
import { Search, Download, RefreshCw, X, ArrowDown, Plus } from "lucide-react";
import DRAFT_CONTEXT from "../data/nbaDraftContext2026.json";
import { useCustomWeights, ScoreCell } from "./CustomWeights";
import ScoutTierBadge from "./ScoutTierBadge";

const TEAMS = DRAFT_CONTEXT.teams;
const NEEDS = DRAFT_CONTEXT.needs;
const DEFAULT_ORDER = DRAFT_CONTEXT.defaultOrder;
const TEAM_OPTIONS = Object.keys(TEAMS).sort();

// PROSPERA · Signal Orange tokens — single source: src/styles/tokens.css.
const T = {
  bg:         "var(--prospera-bg)",
  surface:    "var(--prospera-surface-translucent)",
  surface2:   "var(--prospera-surface-2-translucent)",
  border:     "var(--prospera-border)",
  borderSoft: "var(--prospera-border-soft)",
  text:       "var(--prospera-text)",
  textDim:    "var(--prospera-text-dim)",
  textMute:   "var(--prospera-text-mute)",
  cyan:       "var(--prospera-cyan)",
  accentBg:   "var(--prospera-accent-bg)",
  signal:     "var(--prospera-signal)",
  warn:       "var(--prospera-warn)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const ROUND_1_PICKS = 30;
const ROUND_2_PICKS = 30;
const TOTAL_PICKS = ROUND_1_PICKS + ROUND_2_PICKS;

function pickLabel(slotIndex) {
  // slotIndex 0..59 → "Pick 1" .. "Pick 60"
  return `Pick ${slotIndex + 1}`;
}

function roundLabel(slotIndex) {
  if (slotIndex < ROUND_1_PICKS) {
    if (slotIndex < 14) return "Lottery";
    return "Round 1";
  }
  return "Round 2";
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const MockDraftPage = ({ prospects = [], picks, setPicks, teamSlots, setTeamSlots, onOpenProfile }) => {
  const [query, setQuery] = useState("");
  const [showRound2, setShowRound2] = useState(false);
  const { displayScore, active: weightsActive } = useCustomWeights();

  // Available prospects = those not already drafted
  const draftedIds = useMemo(() => new Set(picks.filter(Boolean)), [picks]);
  const lowered = query.trim().toLowerCase();
  const available = useMemo(() => {
    return prospects
      .filter((p) => !draftedIds.has(p.id))
      .filter((p) => {
        if (!lowered) return true;
        const haystack = [p.name, p.school, p.pos, p.archetype, p.country].join(" ").toLowerCase();
        return haystack.includes(lowered);
      });
  }, [prospects, draftedIds, lowered]);

  const nextEmptySlot = picks.findIndex((p) => !p);

  const setSlot = (index, prospectId) => {
    setPicks((curr) => {
      const next = [...curr];
      // If prospect is already in another slot, swap them
      const existingIndex = next.indexOf(prospectId);
      if (existingIndex >= 0) next[existingIndex] = null;
      next[index] = prospectId;
      return next;
    });
  };

  const clearSlot = (index) => {
    setPicks((curr) => {
      const next = [...curr];
      next[index] = null;
      return next;
    });
  };

  const autoFill = () => {
    setPicks((curr) => {
      const next = Array(TOTAL_PICKS).fill(null);
      const sorted = [...prospects].sort((a, b) => a.rank - b.rank);
      sorted.slice(0, TOTAL_PICKS).forEach((p, i) => {
        next[i] = p.id;
      });
      return next;
    });
  };

  const reset = () => setPicks(Array(TOTAL_PICKS).fill(null));

  const resetTeamOrder = () => {
    const next = Array(TOTAL_PICKS).fill(null);
    DEFAULT_ORDER.forEach((entry) => {
      if (entry.pick - 1 < TOTAL_PICKS) next[entry.pick - 1] = entry.team;
    });
    setTeamSlots(next);
  };

  const setTeamForSlot = (slotIndex, team) => {
    setTeamSlots((curr) => {
      const next = [...curr];
      next[slotIndex] = team || null;
      return next;
    });
  };

  const exportText = () => {
    const lines = ["PROSPERA MOCK DRAFT · 2026", "=========================="];
    let lastRound = "";
    picks.forEach((id, idx) => {
      const round = roundLabel(idx);
      if (round !== lastRound) {
        lines.push("");
        lines.push(`-- ${round.toUpperCase()} --`);
        lastRound = round;
      }
      const team = teamSlots[idx];
      const teamLabel = team ? ` (${TEAMS[team]?.name || team})` : "";
      const p = id ? prospects.find((x) => x.id === id) : null;
      if (p) {
        const scoreStr = weightsActive && displayScore(p) != null ? displayScore(p).toFixed(1) : "—";
        lines.push(`${String(idx + 1).padStart(2, "0")}.${teamLabel} ${p.name} · ${p.school || "—"} · ${p.pos || "—"} · ${scoreStr}`);
      } else {
        lines.push(`${String(idx + 1).padStart(2, "0")}.${teamLabel} (empty)`);
      }
    });
    downloadText(`prospera-mock-draft-${new Date().toISOString().slice(0, 10)}.txt`, lines.join("\n"));
  };

  const filledCount = picks.filter(Boolean).length;
  const slotsToShow = showRound2 ? picks.length : ROUND_1_PICKS;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.18em", color: T.textMute, textTransform: "uppercase" }}>Workspace</div>
          <h1 style={{ fontSize: 32, color: T.text, margin: "6px 0 4px", fontWeight: 700, letterSpacing: "-0.02em" }}>Mock Draft</h1>
          <div style={{ fontSize: 13, color: T.textDim }}>
            {filledCount} of {TOTAL_PICKS} picks filled · click a prospect on the left to assign to the next open slot
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={autoFill} style={pillBtn(T.cyan)}>
            <ArrowDown size={11} /> AUTO-FILL FROM BIG BOARD
          </button>
          <button type="button" onClick={resetTeamOrder} style={pillBtn(T.textDim)}>
            <RefreshCw size={11} /> LOAD 2026 ORDER
          </button>
          <button type="button" onClick={exportText} style={pillBtn(T.cyan)} disabled={filledCount === 0}>
            <Download size={11} /> EXPORT
          </button>
          <button type="button" onClick={reset} style={pillBtn(T.textMute)}>
            <RefreshCw size={11} /> RESET
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16, alignItems: "start" }} className="prospera-eval-grid">
        {/* Available prospects */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={13} color={T.textMute} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search undrafted prospects…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: T.text,
                fontSize: 13,
              }}
            />
            <span style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.12em" }}>
              {available.length} LEFT
            </span>
          </div>
          <div style={{ maxHeight: 720, overflowY: "auto" }}>
            {available.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.12em" }}>
                ALL PROSPECTS ASSIGNED
              </div>
            ) : (
              available.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (nextEmptySlot >= 0) setSlot(nextEmptySlot, p.id);
                  }}
                  disabled={nextEmptySlot < 0}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "44px 1fr 56px 22px",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${T.borderSoft}`,
                    cursor: nextEmptySlot < 0 ? "not-allowed" : "pointer",
                    textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (nextEmptySlot >= 0) e.currentTarget.style.background = "var(--prospera-accent-bg-soft)";
                  }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ ...mono, fontSize: 12, color: T.cyan }}>#{String(p.rank).padStart(2, "0")}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                    <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2 }}>
                      {p.school?.split(" ")[0] || "—"} · {p.pos || "—"}
                    </div>
                  </div>
                  <div style={{ ...mono, fontSize: 12, color: T.cyan, fontWeight: 600, textAlign: "right" }}><ScoreCell prospect={p} /></div>
                  <Plus size={13} color={nextEmptySlot < 0 ? T.textMute : T.textDim} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Draft slots */}
        <div style={{ display: "grid", gap: 6 }}>
          {Array.from({ length: slotsToShow }, (_, i) => i).map((idx) => {
            const id = picks[idx];
            const p = id ? prospects.find((x) => x.id === id) : null;
            const isLottery = idx < 14;
            const isRound2 = idx >= ROUND_1_PICKS;
            const team = teamSlots[idx];
            const teamMeta = team ? TEAMS[team] : null;
            const teamNeeds = team ? NEEDS[team] || [] : [];
            const accent = teamMeta?.color || (isLottery ? T.cyan : T.border);
            // "via X" trade provenance — show only when the slot's team still
            // matches the default for this pick (i.e., user hasn't reassigned).
            const defaultEntry = DEFAULT_ORDER[idx];
            const viaTeam = (defaultEntry && defaultEntry.team === team && defaultEntry.viaTeam) ? defaultEntry.viaTeam : null;
            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 110px 1fr 60px 28px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  background: p ? "var(--prospera-accent-bg-soft)" : T.surface,
                  borderTop: `1px solid ${isRound2 ? T.borderSoft : T.border}`,
                  borderRight: `1px solid ${isRound2 ? T.borderSoft : T.border}`,
                  borderBottom: `1px solid ${isRound2 ? T.borderSoft : T.border}`,
                  borderLeft: `3px solid ${accent}`,
                }}
              >
                <div style={{ ...mono, fontSize: 11, color: T.textDim, letterSpacing: "0.12em" }}>
                  <div style={{ fontSize: 14, color: isLottery ? T.cyan : T.text, fontWeight: 600 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontSize: 8, color: T.textMute, letterSpacing: "0.16em", marginTop: 2 }}>
                    {isRound2 ? "R2" : isLottery ? "LOTTO" : "R1"}
                  </div>
                </div>

                {/* Team selector + needs */}
                <div style={{ minWidth: 0 }}>
                  <select
                    value={team || ""}
                    onChange={(e) => setTeamForSlot(idx, e.target.value)}
                    style={{
                      ...mono,
                      fontSize: 11,
                      letterSpacing: "0.06em",
                      color: team ? T.text : T.textMute,
                      background: T.surface2,
                      border: `1px solid ${T.border}`,
                      padding: "3px 4px",
                      width: "100%",
                      maxWidth: 100,
                      cursor: "pointer",
                    }}
                  >
                    <option value="">—</option>
                    {TEAM_OPTIONS.map((abbr) => (
                      <option key={abbr} value={abbr}>{abbr}</option>
                    ))}
                  </select>
                  {viaTeam && (
                    <div
                      title={`Trade provenance: pick acquired from ${TEAMS[viaTeam]?.name || viaTeam}`}
                      style={{ ...mono, fontSize: 8, color: T.textDim, letterSpacing: "0.12em", marginTop: 3, textTransform: "uppercase" }}
                    >
                      via {viaTeam}
                    </div>
                  )}
                  {teamNeeds.length > 0 && (
                    <div style={{ ...mono, fontSize: 8, color: T.textMute, letterSpacing: "0.1em", marginTop: 4, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {teamNeeds.slice(0, 2).join(" · ")}
                    </div>
                  )}
                </div>

                {p ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <button
                          type="button"
                          onClick={() => onOpenProfile?.(p.id)}
                          style={{ background: "transparent", border: "none", color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", minWidth: 0, flex: "0 1 auto" }}
                        >
                          {p.name}
                        </button>
                        {/* User's Scout View tier-call surfaced on the pick row — renders only when set. */}
                        <ScoutTierBadge prospectId={p.id} />
                      </div>
                      <div style={{ ...mono, fontSize: 9, color: T.textMute, letterSpacing: "0.1em", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.school?.toUpperCase() || "—"} · {p.pos || "—"} · {(p.archetype || "—")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...mono, fontSize: 11, color: T.textMute, letterSpacing: "0.12em" }}>
                    EMPTY · CLICK A PROSPECT
                  </div>
                )}
                <div style={{ ...mono, fontSize: 12, color: p ? T.cyan : T.textMute, fontWeight: 600, textAlign: "right" }}>
                  {p ? <ScoreCell prospect={p} /> : "—"}
                </div>
                <button
                  type="button"
                  onClick={() => clearSlot(idx)}
                  disabled={!p}
                  title="Clear this pick"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: p ? T.textMute : "transparent",
                    cursor: p ? "pointer" : "default",
                    padding: 2,
                    display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {!showRound2 && (
            <button
              type="button"
              onClick={() => setShowRound2(true)}
              style={{
                ...mono,
                fontSize: 10,
                letterSpacing: "0.14em",
                color: T.textDim,
                background: "transparent",
                border: `1px dashed ${T.border}`,
                padding: "10px 14px",
                cursor: "pointer",
                marginTop: 4,
                textTransform: "uppercase",
              }}
            >
              + Show Round 2 ({ROUND_2_PICKS} more picks)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function pillBtn(color) {
  return {
    ...mono,
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color,
    background: "transparent",
    border: `1px solid ${color}`,
    padding: "6px 10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };
}
