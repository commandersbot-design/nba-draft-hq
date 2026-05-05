import React, { useState, useMemo } from "react";
import { Search, Download, RefreshCw, X, ArrowDown, Plus } from "lucide-react";

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

export const MockDraftPage = ({ prospects = [], picks, setPicks, onOpenProfile }) => {
  const [query, setQuery] = useState("");
  const [showRound2, setShowRound2] = useState(false);

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

  const exportText = () => {
    const lines = ["PROSPERA MOCK DRAFT", "==================="];
    let lastRound = "";
    picks.forEach((id, idx) => {
      const round = roundLabel(idx);
      if (round !== lastRound) {
        lines.push("");
        lines.push(`-- ${round.toUpperCase()} --`);
        lastRound = round;
      }
      const p = id ? prospects.find((x) => x.id === id) : null;
      if (p) {
        lines.push(`${String(idx + 1).padStart(2, "0")}. ${p.name} · ${p.school || "—"} · ${p.pos || "—"} · ${p.score?.toFixed(1) || "—"}`);
      } else {
        lines.push(`${String(idx + 1).padStart(2, "0")}. (empty)`);
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
            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 60px 28px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  background: p ? "rgba(34, 211, 238, 0.04)" : T.surface,
                  borderTop: `1px solid ${isRound2 ? T.borderSoft : T.border}`,
                  borderRight: `1px solid ${isRound2 ? T.borderSoft : T.border}`,
                  borderBottom: `1px solid ${isRound2 ? T.borderSoft : T.border}`,
                  borderLeft: `2px solid ${isLottery ? T.cyan : isRound2 ? T.borderSoft : T.border}`,
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
                        {p.school?.toUpperCase() || "—"} · {p.pos || "—"} · #{p.rank}
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
