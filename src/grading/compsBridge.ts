/**
 * compsBridge.ts — translates the new comp engine output (CompEngineResult)
 * into the legacy { highEnd, realistic, cautionary } shape that
 * ScoutingTerminal's ComparablesTab + ComparableCard already render.
 *
 * Lets us swap the data source under the existing UI without rewriting
 * the card/pinning/hiding/overrides surface. The user's existing
 * compOverrides flow continues to work.
 *
 * Pure function. Reads from the precomputed scores cache.
 */

import { getProspectScoresByName } from "./precomputed";
import type { Comp } from "../comps/compEngine";

// =============================================================================
// LEGACY SHAPE (matches what ComparableCard expects)
// =============================================================================

export interface LegacyHistorical {
  id: string;
  name: string;
  draftYear: number;
  draftSlot: number | null;
  school: string | null;
  position: string | null;
  height?: string | null;
  age?: number | null;
  archetype?: string | null;
  outcomeTier?: string | null;
  roleOutcome?: string | null;
  // permissive — extra fields don't hurt
  [k: string]: unknown;
}

export interface LegacyCompEntry {
  historical: LegacyHistorical;
  score: number;
  reasons: string[];
  pinned: boolean;
}

export interface LegacyCompGroups {
  highEnd: LegacyCompEntry[];
  realistic: LegacyCompEntry[];
  cautionary: LegacyCompEntry[];
}

export interface CompOverrideMap {
  [historicalId: string]: "highEnd" | "realistic" | "cautionary" | "hidden" | null;
}

// =============================================================================
// MAPPING
// =============================================================================

/** New-engine outcome tiers → legacy bucket. */
function tierToBucket(tier: string | null | undefined): keyof LegacyCompGroups | null {
  if (tier === "Legend" || tier === "Star") return "highEnd";
  if (tier === "Hit") return "realistic";
  if (tier === "Swing" || tier === "Bust") return "cautionary";
  return null;
}

/** Translate a new-engine Comp to the legacy entry shape. */
function compToLegacyEntry(c: Comp, pinned: boolean = false): LegacyCompEntry {
  const reasons: string[] = [];
  // Top-3 matching features as reasons
  for (const m of c.topMatches.slice(0, 3)) {
    reasons.push(`same ${m.feature} (${m.diff.toFixed(2)}σ apart)`);
  }
  if (c.largestDivergence) {
    const d = c.largestDivergence;
    const direction = d.pZ > d.cZ ? "higher" : "lower";
    reasons.push(`but prospect ${direction} on ${d.feature} (${Math.abs(d.pZ - d.cZ).toFixed(2)}σ gap)`);
  }
  return {
    historical: {
      id: c.candidate.id,
      name: c.candidate.name,
      draftYear: c.candidate.draftYear,
      draftSlot: c.candidate.draftSlot,
      school: c.candidate.school,
      position: c.candidate.position,
      archetype: c.candidate.archetype ?? undefined,
      outcomeTier: c.candidate.outcomeTier ?? undefined,
      roleOutcome: c.candidate.roleOutcome ?? undefined,
    },
    // Round similarity to whole-number scale matching the legacy display
    score: c.similarity != null ? Math.round(c.similarity) : 0,
    reasons,
    pinned,
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Build legacy-shape comp groups for a prospect by name. Falls back to empty
 * groups if the prospect isn't in the precomputed map.
 *
 * Applies the user's compOverrides (pin/hide/move) on top of the new engine's
 * output, matching the legacy semantics so the existing UI flow doesn't change.
 */
export function buildLegacyCompGroups(
  prospectName: string,
  overrides: CompOverrideMap = {},
  options: {
    realistic?: number;
    cautionary?: number;
    /**
     * If false, manually-pinned comps that aren't in the engine's top-K won't
     * be injected as stubs. The pin's "move" / "hide" semantics still apply
     * to comps that ARE in engine output. Default true (legacy behavior).
     *
     * Use false for the clean ladder where stale pins shouldn't pollute the
     * engine read; true for the Refine-Comps section that does surgical edits.
     */
    injectExtraPins?: boolean;
  } = {},
): LegacyCompGroups {
  const realCount = options.realistic ?? 4;
  const cautionCount = options.cautionary ?? 2;
  const injectExtraPins = options.injectExtraPins !== false;

  const scores = getProspectScoresByName(prospectName);
  if (!scores) return { highEnd: [], realistic: [], cautionary: [] };

  // Pull all comps from the new engine
  const comps: Comp[] = [];
  if (scores.comps.headline) comps.push(scores.comps.headline);
  if (scores.comps.shadow) comps.push(scores.comps.shadow);
  comps.push(...scores.comps.body);

  // Distribute into legacy buckets, respecting user overrides
  const buckets: LegacyCompGroups = { highEnd: [], realistic: [], cautionary: [] };
  const seen = new Set<string>();

  for (const c of comps) {
    const id = c.candidate.id;
    if (seen.has(id)) continue;
    const override = overrides[id];
    if (override === "hidden") { seen.add(id); continue; }
    const target = (override === "highEnd" || override === "realistic" || override === "cautionary")
      ? override
      : tierToBucket(c.candidate.outcomeTier ?? null);
    if (!target) continue;
    buckets[target].push(compToLegacyEntry(c, !!override));
    seen.add(id);
  }

  // Pinned overrides for prospects NOT in the new engine's top-K still get
  // injected — same as legacy behavior. We can't synthesize a similarity
  // score for them; assign 50.
  if (!injectExtraPins) {
    // Clean-ladder mode: skip injection so stale pins don't pollute the
    // engine read. (Move / hide for engine-known comps still applied above.)
  } else for (const [id, target] of Object.entries(overrides)) {
    if (seen.has(id)) continue;
    if (target === "hidden" || target == null) continue;
    if (!["highEnd", "realistic", "cautionary"].includes(target)) continue;
    // Look up the historical from the engine's full candidate pool. We don't
    // have direct access here, but the user's pin metadata already includes
    // tier, so we can construct a stub. The card render will read from the
    // historical record by id via HISTORICAL_PROSPECTS.
    buckets[target].push({
      historical: { id, name: id, draftYear: 0, draftSlot: null, school: null, position: null },
      score: 50,
      reasons: ["manually pinned"],
      pinned: true,
    });
  }

  // Pinned float to top, then by score desc
  for (const k of Object.keys(buckets) as (keyof LegacyCompGroups)[]) {
    buckets[k].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.score - a.score;
    });
  }

  // Apply count caps similar to legacy
  buckets.highEnd = buckets.highEnd.slice(0, 4);
  buckets.realistic = buckets.realistic.slice(0, realCount);
  buckets.cautionary = buckets.cautionary.slice(0, cautionCount);

  return buckets;
}

// =============================================================================
// FLAT TOP-N (for Constellation Map and other scatter/list surfaces)
// =============================================================================

/**
 * Returns a flat top-N list of comps for a prospect, sorted by similarity.
 * Used by surfaces (e.g. Constellation Map) that need a fixed number of
 * comps for visualization rather than tier-bucketed groupings.
 *
 * Falls back to empty array when prospect isn't in precomputed map.
 */
export function getTopComps(prospectName: string, limit: number = 20): LegacyCompEntry[] {
  const scores = getProspectScoresByName(prospectName);
  if (!scores) return [];
  // Use the engine's full top-K NN list (not just headline/shadow/body)
  const all: Comp[] = scores.comps.topK ?? [];
  return all
    .map((c) => compToLegacyEntry(c, false))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
