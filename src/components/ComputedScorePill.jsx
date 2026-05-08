import React from "react";
import { getProspectScoresByName } from "../grading/precomputed";

/**
 * Compact inline pill that surfaces the new pipeline's computed display score
 * next to existing UI elements (typically beside the authored ScoreCell on
 * the Scout Desk row). Hover for the full breakdown.
 *
 * Renders nothing if the prospect isn't in the precomputed map (international
 * prospects without NCAA data, etc.). Pure presentational — reads from cache.
 */
export default function ComputedScorePill({ prospectName, size = "sm" }) {
  const scores = React.useMemo(() => {
    if (!prospectName) return null;
    return getProspectScoresByName(prospectName);
  }, [prospectName]);

  if (!scores || scores.summary.overallDisplay == null) return null;

  const display = Math.round(scores.summary.overallDisplay);
  const sigma = scores.summary.overallSigma;
  const fontSize = size === "sm" ? 10 : 11;
  const padding = size === "sm" ? "1px 6px" : "2px 8px";

  // Color graduate by display score
  const color = display >= 90 ? "var(--prospera-positive)"
              : display >= 75 ? "var(--prospera-cyan)"
              : display >= 55 ? "var(--prospera-text-dim)"
              : "var(--prospera-text-mute)";

  return (
    <span
      title={`Computed display: ${display} ± ${sigma ?? "?"}\nRaw: ${scores.overall.score?.toFixed(1)} ± ${scores.overall.scoreSigma}\nPercentile: ${scores.overall.display?.percentile.toFixed(1)}\nE[outcome]: ${scores.overall.breakdown.eOutcome ?? "?"}\nStar bonus: +${scores.overall.breakdown.starBonus}\nRed flags: ${scores.overall.breakdown.redFlagTotal}\nHeadline: ${scores.summary.headlineComp?.name ?? "—"}`}
      style={{
        fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
        fontSize,
        padding,
        marginLeft: 6,
        border: `1px solid ${color}`,
        color,
        letterSpacing: "0.06em",
        background: "transparent",
        verticalAlign: "middle",
      }}
    >
      C{display}
    </span>
  );
}
