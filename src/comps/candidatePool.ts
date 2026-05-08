/**
 * candidatePool.ts — assembles the historical candidate pool for the comp engine.
 *
 * Reads historicalProspects.json + historicalAdvancedStats.json (both bundled),
 * combines them into the CompCandidate shape, returns an array. Cached as a
 * module singleton; tests can invoke clearCandidatePoolCache() between runs.
 *
 * Pure-ish: only reads bundled JSON. No network.
 */

import historicalsRaw from "../data/historicalProspects.json";
import historicalAdvancedRaw from "../data/historicalAdvancedStats.json";
import {
  featuresFromHistorical,
  type HistoricalProspectRecord,
  type HistoricalAdvancedRecord,
} from "../grading/featureExtractor";
import { getEraBucket, getPositionFamily } from "../grading/cohortStats";
import type { CompCandidate, NbaCareerOutcome } from "./compEngine";
import type { OutcomeTier } from "./calibration";

// =============================================================================
// CACHE
// =============================================================================

let _poolCache: CompCandidate[] | null = null;

export function loadCandidatePool(): CompCandidate[] {
  if (_poolCache) return _poolCache;
  _poolCache = build();
  return _poolCache;
}

export function clearCandidatePoolCache(): void {
  _poolCache = null;
}

// =============================================================================
// BUILD
// =============================================================================

interface RawHistoricalEntry extends HistoricalProspectRecord {
  draftSlot?: number | null;
  school?: string | null;
  archetypeFamily?: string | null;
  roleOutcome?: string | null;
}

interface RawAdvBlockExtended extends HistoricalAdvancedRecord {
  nbaAdv?: {
    bpm?: number | null;
    ws48?: number | null;
    vorp?: number | null;
    per?: number | null;
    allStarSelections?: number | null;
    /** Some entries store a comma-separated string ("LAL, MIA"); some store an array. */
    teams?: string[] | string | null;
    fromSeason?: string | null;
    toSeason?: string | null;
  } | null;
}

function normalizeTeams(t: string[] | string | null | undefined): string[] {
  if (t == null) return [];
  if (Array.isArray(t)) return t;
  return String(t).split(/\s*,\s*/).filter(Boolean);
}

function isOutcomeTier(s: string | null | undefined): s is OutcomeTier {
  return s === "Legend" || s === "Star" || s === "Hit" || s === "Swing" || s === "Bust";
}

function build(): CompCandidate[] {
  const historicals = historicalsRaw as RawHistoricalEntry[];
  // Cast through unknown — JSON shape varies (some entries have teams as string,
  // others as string[]). normalizeTeams handles both.
  const adv = historicalAdvancedRaw as unknown as Record<string, RawAdvBlockExtended>;
  const out: CompCandidate[] = [];

  for (const p of historicals) {
    const advBlock = adv[p.id];
    if (!advBlock?.cbbAdv) continue;
    const era = getEraBucket(p.draftYear);
    if (!era) continue;
    const features = featuresFromHistorical(p, advBlock);
    const positionFamily = getPositionFamily(p);
    const outcomeTier: OutcomeTier | null = isOutcomeTier(p.outcomeTier) ? p.outcomeTier : null;

    let nbaCareer: NbaCareerOutcome | null = null;
    if (advBlock.nbaAdv) {
      const n = advBlock.nbaAdv;
      nbaCareer = {
        bpm: n.bpm ?? null,
        ws48: n.ws48 ?? null,
        vorp: n.vorp ?? null,
        per: n.per ?? null,
        allStarSelections: n.allStarSelections ?? 0,
        teams: normalizeTeams(n.teams),
        fromSeason: n.fromSeason ?? null,
        toSeason: n.toSeason ?? null,
      };
    }

    out.push({
      id: p.id,
      name: p.name,
      draftYear: p.draftYear ?? 0,
      draftSlot: p.draftSlot ?? null,
      school: p.school ?? null,
      position: p.position ?? null,
      positionFamily,
      era,
      archetype: p.archetype ?? null,
      archetypeFamily: p.archetypeFamily ?? null,
      outcomeTier,
      roleOutcome: p.roleOutcome ?? null,
      features,
      nbaCareer,
    });
  }

  return out;
}
