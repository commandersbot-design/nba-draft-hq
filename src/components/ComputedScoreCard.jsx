import React from "react";
import { getProspectScores, getProspectScoresByName } from "../grading/precomputed";
import AuthoredCompsLadder from "./AuthoredCompsLadder";

// Match the existing PROSPERA token system used elsewhere in the app
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
  positive:     "var(--prospera-positive)",
  warn:         "var(--prospera-warn)",
  danger:       "var(--prospera-danger)",
};

const mono = {
  fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
};

const TRAIT_LABELS = {
  AdvantageCreation:    "Advantage Creation",
  DecisionMaking:       "Decision Making",
  PassingCreation:      "Passing Creation",
  ShootingGravity:      "Shooting Gravity",
  OffBallValue:         "Off-Ball Value",
  ProcessingSpeed:      "Processing Speed",
  Scalability:          "Scalability",
  DefensiveVersatility: "Defensive Versatility",
};

const GRADE_COLORS = {
  "A+": T.positive,
  "A":  T.positive,
  "B":  T.cyan,
  "C":  T.warn,
  "D":  T.danger,
};

function GradePill({ grade }) {
  if (!grade) {
    return (
      <span style={{ ...mono, fontSize: 10, padding: "2px 8px", border: `1px dashed ${T.border}`, color: T.textMute, letterSpacing: "0.12em" }}>
        N/A
      </span>
    );
  }
  const color = GRADE_COLORS[grade] || T.textMute;
  return (
    <span style={{
      ...mono,
      fontSize: 11,
      padding: "2px 9px",
      border: `1px solid ${color}`,
      color,
      letterSpacing: "0.12em",
      fontWeight: 700,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
    }}>
      {grade}
    </span>
  );
}

function TraitBar({ traitKey, score, scoreZ, grade, dataMode }) {
  const label = TRAIT_LABELS[traitKey] || traitKey;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const color = GRADE_COLORS[grade] || T.textDim;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: T.text }}>{label}</span>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {score != null && (
            <span style={{ ...mono, fontSize: 11, color: T.textDim }}>
              {Math.round(score)}
              {scoreZ != null && (
                <span style={{ color: T.textMute, marginLeft: 6 }}>
                  {scoreZ >= 0 ? "+" : ""}{scoreZ.toFixed(2)}σ
                </span>
              )}
            </span>
          )}
          <GradePill grade={grade} />
        </div>
      </div>
      <div style={{ height: 6, background: T.surface2, border: `1px solid ${T.borderSoft}`, position: "relative" }}>
        {score != null && (
          <div style={{
            position: "absolute", top: 0, left: 0, height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color} 100%)`,
            opacity: 0.85,
          }} />
        )}
        {/* 50-marker */}
        <div style={{ position: "absolute", top: 0, left: "50%", height: "100%", width: 1, background: T.border, opacity: 0.6 }} />
      </div>
      {dataMode && dataMode !== "full" && (
        <div style={{ ...mono, fontSize: 9, color: T.textMute, marginTop: 3, letterSpacing: "0.08em" }}>
          dataMode: {dataMode}
        </div>
      )}
    </div>
  );
}

function CompCell({ label, comp }) {
  if (!comp) {
    return (
      <div style={{ padding: 12, border: `1px dashed ${T.border}`, ...mono, fontSize: 11, color: T.textMute, textAlign: "center" }}>
        no {label.toLowerCase()} comp
      </div>
    );
  }
  const tierColor = comp.tier === "Legend" ? "#A855F7"
                  : comp.tier === "Star"   ? T.cyan
                  : comp.tier === "Hit"    ? T.positive
                  : comp.tier === "Swing"  ? T.warn
                  : comp.tier === "Bust"   ? T.danger
                  : T.textMute;
  return (
    <div style={{ padding: 12, border: `1px solid ${T.border}`, background: T.surface }}>
      <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, color: T.text, fontWeight: 600 }}>{comp.name}</div>
      <div style={{ fontSize: 12, color: T.textDim, marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}>
        {comp.year && <span>{comp.year}</span>}
        {comp.tier && (
          <span style={{ ...mono, fontSize: 10, color: tierColor, border: `1px solid ${tierColor}`, padding: "1px 7px", letterSpacing: "0.1em" }}>
            {comp.tier.toUpperCase()}
          </span>
        )}
        {comp.similarity != null && (
          <span style={{ ...mono, fontSize: 10, color: T.textMute }}>{comp.similarity.toFixed(0)}% sim</span>
        )}
      </div>
    </div>
  );
}

export default function ComputedScoreCard({ prospectId, prospectName }) {
  // Try by id first; fall back to name slug. Two-key lookup handles the
  // inline-PROSPECTS_ALL vs prospects.json id mismatch.
  const scores = React.useMemo(() => {
    return getProspectScores(prospectId) ?? (prospectName ? getProspectScoresByName(prospectName) : null);
  }, [prospectId, prospectName]);

  if (!scores) {
    return (
      <div style={{ padding: "32px 28px", textAlign: "center", ...mono, fontSize: 12, color: T.textMute, letterSpacing: "0.1em" }}>
        NO COMPUTED SCORE AVAILABLE FOR THIS PROSPECT.
      </div>
    );
  }

  const display = scores.summary.overallDisplay;
  const sigma = scores.summary.overallSigma;
  const rawScore = scores.overall.score;
  const rawSigma = scores.overall.scoreSigma;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* HEADER: Display score + raw + dataMode */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 6 }}>
            Computed Overall · Percentile-rescaled
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 56, color: T.cyan, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {display != null ? Math.round(display) : "—"}
            </span>
            {sigma != null && (
              <span style={{ ...mono, fontSize: 16, color: T.textDim }}>± {sigma}</span>
            )}
          </div>
          <div style={{ ...mono, fontSize: 11, color: T.textMute, marginTop: 6, letterSpacing: "0.08em" }}>
            raw: {rawScore != null ? rawScore.toFixed(1) : "—"}
            {rawSigma != null && ` ± ${rawSigma}`}
            {scores.overall.display && (
              <> · p{scores.overall.display.percentile.toFixed(1)} of historical pool</>
            )}
            {" · dataMode: "}{scores.summary.dataMode}
          </div>
        </div>
        {scores.summary.spotlightTrait && (
          <div style={{ padding: 12, border: `1px solid ${T.border}`, minWidth: 200 }}>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 6 }}>
              Spotlight Trait
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: T.text }}>{TRAIT_LABELS[scores.summary.spotlightTrait.trait] || scores.summary.spotlightTrait.trait}</span>
              <GradePill grade={scores.summary.spotlightTrait.grade} />
            </div>
          </div>
        )}
      </div>

      {/* OVERALL BREAKDOWN */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 16, marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 10 }}>
          Score Breakdown
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          <div>
            <div style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.1em" }}>E[outcome]</div>
            <div style={{ fontSize: 18, color: T.text }}>{scores.overall.breakdown.eOutcome ?? "—"}</div>
          </div>
          <div>
            <div style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.1em" }}>Star bonus</div>
            <div style={{ fontSize: 18, color: scores.overall.breakdown.starBonus > 0 ? T.positive : T.textDim }}>
              {scores.overall.breakdown.starBonus > 0 ? "+" : ""}{scores.overall.breakdown.starBonus}
            </div>
          </div>
          <div>
            <div style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.1em" }}>Red flags</div>
            <div style={{ fontSize: 18, color: scores.overall.breakdown.redFlagTotal < 0 ? T.danger : T.textDim }}>
              {scores.overall.breakdown.redFlagTotal}
            </div>
          </div>
          <div>
            <div style={{ ...mono, fontSize: 10, color: T.textMute, letterSpacing: "0.1em" }}>NN sample</div>
            <div style={{ fontSize: 18, color: T.text }}>{scores.overall.breakdown.nnUsed}</div>
          </div>
        </div>
        {scores.overall.breakdown.redFlags.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.borderSoft}` }}>
            {scores.overall.breakdown.redFlags.map((f, i) => (
              <div key={i} style={{ ...mono, fontSize: 11, color: T.danger, marginBottom: 4 }}>
                ⚠ {f.name} ({f.deduction}) — <span style={{ color: T.textDim }}>{f.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TRAIT BARS */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 18, marginBottom: 24 }}>
        <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 14 }}>
          Trait Grades · 8-trait projection from 9-axis pipeline
        </div>
        {Object.keys(TRAIT_LABELS).map((traitKey) => {
          const t = scores.traits[traitKey];
          const g = scores.traitGrades[traitKey];
          return (
            <TraitBar
              key={traitKey}
              traitKey={traitKey}
              score={t?.score}
              scoreZ={t?.scoreZ}
              grade={g?.grade}
              dataMode={t?.dataMode}
            />
          );
        })}
      </div>

      {/* AUTHORED LADDER — user's eye-test read, primary view when present */}
      <AuthoredCompsLadder prospectName={scores.prospectName} />

      {/* STATISTICAL COMPS — engine output */}
      <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 10 }}>
        Statistical Comp Engine
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <CompCell label="Headline" comp={scores.summary.headlineComp} />
        <CompCell label="Shadow (cautionary)" comp={scores.summary.shadowComp} />
      </div>
      {scores.comps.body && scores.comps.body.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 9, letterSpacing: "0.16em", color: T.textMute, textTransform: "uppercase", marginBottom: 8 }}>
            Body Comps
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
            {scores.comps.body.map((c) => (
              <CompCell key={c.candidate.id} label={c.role} comp={{
                name: c.candidate.name,
                tier: c.candidate.outcomeTier,
                year: c.candidate.draftYear || null,
                similarity: c.similarity,
              }} />
            ))}
          </div>
        </div>
      )}

      {/* TIER RATIONING + ELEVATION */}
      <div style={{ background: T.surface2, border: `1px solid ${T.borderSoft}`, padding: 12, ...mono, fontSize: 11, color: T.textDim }}>
        <div style={{ marginBottom: 6, color: T.textMute, letterSpacing: "0.1em", fontSize: 9, textTransform: "uppercase" }}>Tier Rationing</div>
        {scores.comps.rationing.reason}
      </div>
    </div>
  );
}
