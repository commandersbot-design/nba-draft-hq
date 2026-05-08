/**
 * deltaReport.ts — diff a prospect's statistical comps (Module 2 output) against
 * their stylistic comps (Module 4 user-authored).
 *
 * The point: surface AGREEMENT (model says X, user says X — high confidence)
 * and DISAGREEMENT (model says X, user says Y — investigation prompt). The
 * disagreement set is the artifact that drives scout reflection.
 *
 * Pure function. Does NOT modify the model — the user comp store is read-only
 * here. Only used for visualization / audit.
 */

import type { Comp, CompEngineResult } from "./compEngine";
import type { StylisticComp } from "./stylistic";

// =============================================================================
// TYPES
// =============================================================================

/**
 * A pair of (statistical comp, stylistic comp) where both refer to the same
 * NBA player. This is the "agreement" case.
 */
export interface CompAgreement {
  comparedTo: string;
  statistical: Comp;
  stylistic: StylisticComp;
}

/** A statistical comp the user did NOT independently identify. */
export interface ModelOnlyComp {
  comp: Comp;
  reason: string;
}

/** A user comp the model did NOT independently identify. */
export interface UserOnlyComp {
  comp: StylisticComp;
  reason: string;
}

export interface CompDeltaReport {
  prospectId: string;
  prospectName: string;
  /** Comps both surfaces produced (matched by name). */
  agreements: CompAgreement[];
  /** Comps the model produced that the user didn't author. */
  modelOnly: ModelOnlyComp[];
  /** Comps the user authored that the model didn't surface. */
  userOnly: UserOnlyComp[];
  /** Summary stats. */
  summary: {
    totalStatistical: number;
    totalStylistic: number;
    agreementCount: number;
    /** Percentage of statistical comps the user also authored. */
    agreementRate: number;
  };
  notes: string[];
}

// =============================================================================
// HELPERS
// =============================================================================

/** Normalize a player name for matching: lowercase, alpha-only. */
function nameKey(s: string): string {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function flattenStatisticalComps(result: CompEngineResult): Comp[] {
  const out: Comp[] = [];
  if (result.headline) out.push(result.headline);
  if (result.shadow) out.push(result.shadow);
  out.push(...result.body);
  return out;
}

// =============================================================================
// CORE
// =============================================================================

/**
 * Diff statistical and stylistic comps for one prospect.
 *
 * @param statisticalResult  Module 2 output for this prospect (or null if not run)
 * @param stylisticComps     User-authored comps for this prospect
 */
export function buildDeltaReport(
  prospectId: string,
  prospectName: string,
  statisticalResult: CompEngineResult | null,
  stylisticComps: StylisticComp[],
): CompDeltaReport {
  const notes: string[] = [];
  const stat: Comp[] = statisticalResult ? flattenStatisticalComps(statisticalResult) : [];
  const styles = stylisticComps;

  // Build name-keyed lookups
  const statByName = new Map<string, Comp>();
  for (const c of stat) statByName.set(nameKey(c.candidate.name), c);
  const styleByName = new Map<string, StylisticComp>();
  for (const sc of styles) styleByName.set(nameKey(sc.comparedTo), sc);

  // Find agreements (intersection)
  const agreements: CompAgreement[] = [];
  for (const [key, sc] of styleByName) {
    const sm = statByName.get(key);
    if (sm) {
      agreements.push({
        comparedTo: sc.comparedTo,
        statistical: sm,
        stylistic: sc,
      });
    }
  }

  // Model-only: in stat but not styles
  const modelOnly: ModelOnlyComp[] = [];
  for (const c of stat) {
    const key = nameKey(c.candidate.name);
    if (!styleByName.has(key)) {
      modelOnly.push({
        comp: c,
        reason: "Surfaced by statistical engine but not authored by user — possible blind spot in either direction",
      });
    }
  }

  // User-only: in styles but not stat
  const userOnly: UserOnlyComp[] = [];
  for (const sc of styles) {
    const key = nameKey(sc.comparedTo);
    if (!statByName.has(key)) {
      userOnly.push({
        comp: sc,
        reason: "User-authored comp not in statistical top-K — model sees a different fingerprint",
      });
    }
  }

  const summary = {
    totalStatistical: stat.length,
    totalStylistic: styles.length,
    agreementCount: agreements.length,
    agreementRate: stat.length > 0 ? agreements.length / stat.length : 0,
  };

  if (stat.length === 0 && styles.length === 0) notes.push("no comps from either surface");
  else if (stat.length === 0) notes.push("statistical engine produced no comps (data-mode blocked or scout_anchored?)");
  else if (styles.length === 0) notes.push("user has not authored any stylistic comps yet");

  return {
    prospectId,
    prospectName,
    agreements,
    modelOnly,
    userOnly,
    summary,
    notes,
  };
}

// =============================================================================
// AGGREGATE — build delta reports across an entire class
// =============================================================================

export interface ClassDeltaSummary {
  /** Per-prospect reports. */
  reports: CompDeltaReport[];
  /** Aggregate: average agreement rate across class. */
  averageAgreementRate: number;
  /** Prospects where user disagreed strongly (≥ 2 user-only comps). */
  highDisagreementProspects: string[];
  /** Prospects with no user comps yet — surface as "needs scout review." */
  needsReview: string[];
}

export function buildClassDeltaSummary(reports: CompDeltaReport[]): ClassDeltaSummary {
  if (reports.length === 0) {
    return { reports, averageAgreementRate: 0, highDisagreementProspects: [], needsReview: [] };
  }
  const avgAgreement = reports.reduce((s, r) => s + r.summary.agreementRate, 0) / reports.length;
  const highDisagreement = reports
    .filter((r) => r.userOnly.length >= 2)
    .map((r) => r.prospectName);
  const needsReview = reports
    .filter((r) => r.summary.totalStylistic === 0)
    .map((r) => r.prospectName);
  return {
    reports,
    averageAgreementRate: avgAgreement,
    highDisagreementProspects: highDisagreement,
    needsReview,
  };
}
