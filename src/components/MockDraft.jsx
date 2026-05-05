import React, { useState, useMemo } from "react";
import { Search, Download, RefreshCw, X, ArrowDown, Plus, Dices } from "lucide-react";
import DRAFT_CONTEXT from "../data/nbaDraftContext2026.json";

const TEAMS = DRAFT_CONTEXT.teams;
const NEEDS = DRAFT_CONTEXT.needs;
const DEFAULT_ORDER = DRAFT_CONTEXT.defaultOrder;
const TEAM_OPTIONS = Object.keys(TEAMS).sort();

// ---------- LOTTERY ----------
// Real NBA lottery odds (post-2019 anti-tank reform): bottom 3 teams each at
// 14% for #1, then sliding scale down to 0.5% for the 14th-worst team.
// Picks 1-4 are drawn weighted; picks 5-14 fall to remaining lottery teams in
// reverse-standings order. Picks 15-30 stay locked to standings.
const LOTTERY_ODDS = [14.0, 14.0, 14.0, 12.5, 10.5, 9.0, 7.5, 6.0, 4.5, 3.0, 2.0, 1.5, 1.0, 0.5];
const LOTTERY_DRAW_COUNT = 4; // top-4 picks are drawn from weighted odds

function weightedDraw(teams, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  let r = Math.random() * total;
  for (let i = 0; i < teams.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return teams.length - 1;
}

function simulateLottery(standingsOrder) {
  // standingsOrder: array of 14 team abbreviations, worst-record first.
  const teams = [...standingsOrder];
  const weights = [...LOTTERY_ODDS];
  const drawn = [];
  for (let i = 0; i < LOTTERY_DRAW_COUNT && teams.length > 0; i++) {
    const idx = weightedDraw(teams, weights);
    drawn.push(teams[idx]);
    teams.splice(idx, 1);
    weights.splice(idx, 1);
  }
  // Remaining teams fill picks 5-14 in their pre-lottery standings order
  return [...drawn, ...teams];
}

function describeLotteryShift(team, standingsOrder, lotteryOrder) {
  const standingsIdx = standingsOrder.indexOf(team);
  const lotteryIdx = lotteryOrder.indexOf(team);
  if (standingsIdx < 0 || lotteryIdx < 0) return null;
  const shift = standingsIdx - lotteryIdx;
  if (shift > 0) return { team, from: standingsIdx + 1, to: lotteryIdx + 1, dir: "up", shift };
  if (shift < 0) return { team, from: standingsIdx + 1, to: lotteryIdx + 1, dir: "down", shift: -shift };
  return { team, from: standingsIdx + 1, to: lotteryIdx + 1, dir: "flat", shift: 0 };
}

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
  warn: "#F59E0B",
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
  const [lotteryResult, setLotteryResult] = useState(null);

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

  const runLottery = () => {
    // Take the current top-14 team slots as the "pre-lottery standings order"
    const standingsOrder = teamSlots.slice(0, 14).filter(Boolean);
    if (standingsOrder.length < 14) {
      setLotteryResult({ error: "Need 14 teams in slots 1-14 to run the lottery. Click LOAD 2026 ORDER to populate." });
      return;
    }
    const lotteryOrder = simulateLottery(standingsOrder);
    setTeamSlots((curr) => {
      const next = [...curr];
      for (let i = 0; i < 14; i++) next[i] = lotteryOrder[i];
      return next;
    });
    // Build a result summary: notable jumps + #1 pick winner
    const movers = lotteryOrder
      .map((team) => describeLotteryShift(team, standingsOrder, lotteryOrder))
      .filter((m) => m && Math.abs(m.shift) >= 1);
    setLotteryResult({
      winner: lotteryOrder[0],
      lotteryOrder,
      standingsOrder,
      movers,
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
        lines.push(`${String(idx + 1).padStart(2, "0")}.${teamLabel} ${p.name} · ${p.school || "—"} · ${p.pos || "—"} · ${p.score?.toFixed(1) || "—"}`);
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
          <button type="button" onClick={runLottery} style={pillBtn(T.warn)}>
            <Dices size={11} /> RUN LOTTERY
          </button>
          <button type="button" onClick={exportText} style={pillBtn(T.cyan)} disabled={filledCount === 0}>
            <Download size={11} /> EXPORT
          </button>
          <button type="button" onClick={reset} style={pillBtn(T.textMute)}>
            <RefreshCw size={11} /> RESET
          </button>
        </div>
      </div>

      {lotteryResult && (
        <div style={{
          marginBottom: 16,
          padding: "12px 14px",
          background: lotteryResult.error ? "rgba(216, 90, 48, 0.08)" : "rgba(245, 158, 11, 0.08)",
          border: `1px solid ${lotteryResult.error ? "#D85A30" : T.warn}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            {lotteryResult.error ? (
              <>
                <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: "#D85A30", textTransform: "uppercase", marginBottom: 4 }}>
                  Lottery error
                </div>
                <div style={{ fontSize: 12, color: T.textDim }}>{lotteryResult.error}</div>
              </>
            ) : (
              <>
                <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.warn, textTransform: "uppercase", marginBottom: 4 }}>
                  Lottery Results · {TEAMS[lotteryResult.winner]?.name || lotteryResult.winner} wins #1
                </div>
                <div style={{ fontSize: 11, color: T.textDim, lineHeight: 1.6 }}>
                  {lotteryResult.movers.length === 0 ? (
                    <span>Standings held — no movement.</span>
                  ) : (
                    lotteryResult.movers.slice(0, 6).map((m, i) => (
                      <span key={m.team}>
                        {i > 0 && " · "}
                        <span style={{ color: m.dir === "up" ? T.cyan : T.textMute, ...mono, letterSpacing: "0.05em" }}>
                          {m.team}
                        </span>
                        {" "}
                        <span style={{ color: m.dir === "up" ? T.cyan : T.textDim }}>
                          {m.from}→{m.to}
                          {m.dir === "up" ? " ↑" : m.dir === "down" ? " ↓" : ""}
                        </span>
                      </span>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setLotteryResult(null)}
            style={{ background: "transparent", border: "none", color: T.textMute, cursor: "pointer", padding: 2 }}
          >
            <X size={12} />
          </button>
        </div>
      )}

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
                    if (nextEmptySlot >= 0) e.currentTarget.style.background = "rgba(34, 211, 238, 0.04)";
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
                  <div style={{ ...mono, fontSize: 12, color: T.cyan, fontWeight: 600, textAlign: "right" }}>{p.score?.toFixed(1) || "—"}</div>
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
            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 110px 1fr 60px 28px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  background: p ? "rgba(34, 211, 238, 0.04)" : T.surface,
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
                  {teamNeeds.length > 0 && (
                    <div style={{ ...mono, fontSize: 8, color: T.textMute, letterSpacing: "0.1em", marginTop: 4, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {teamNeeds.slice(0, 2).join(" · ")}
                    </div>
                  )}
                </div>

                {p ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <button
                        type="button"
                        onClick={() => onOpenProfile?.(p.id)}
                        style={{ background: "transparent", border: "none", color: T.text, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", width: "100%" }}
                      >
                        {p.name}
                      </button>
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
                  {p?.score?.toFixed(1) ?? "—"}
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
