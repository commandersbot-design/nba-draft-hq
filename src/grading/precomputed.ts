/**
 * precomputed.ts — batch-score all active prospects on first call, cache result.
 *
 * The React app calls `getAllProspectScores()` once on mount (typically inside
 * a useMemo at the root component). The function lazily builds a Map<id,
 * ProspectScores> by running the full scoring pipeline against every active
 * prospect in prospects.json.
 *
 * Subsequent calls return the same Map reference. The cache is invalidatable
 * (clearProspectScoresCache) for tests and recalibration scenarios.
 *
 * Cost on a 60-prospect class: ~1-2 seconds. Acceptable for app boot. The
 * function runs synchronously — caller blocks on it. If we ever need to
 * unblock initial render, swap to a Web Worker.
 */

import {
  type ProspectScores,
  scoreActiveProspect,
} from "./scoringPipeline";
import { loadCandidatePool } from "../comps/candidatePool";
import { loadCohortStats } from "./cohortStats";
import prospectsRaw from "../data/prospects.json";
import profileStatsRaw from "../data/profileStats.json";
import advancedExtrasRaw from "../data/prospectAdvancedExtras.json";
import type {
  ActiveProspectRecord,
  ProfileStatsRecord,
  AdvancedExtrasRecord,
} from "./featureExtractor";

// =============================================================================
// CACHE
// =============================================================================

let _scoresCache: Map<string, ProspectScores> | null = null;

/** Lookup-friendly slug used by the bundled JSON files (lowercased alphanumeric). */
export function slugKey(name: string): string {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Score every prospect in prospects.json. Returns Map<lookupKey, ProspectScores>.
 * Each prospect is registered under MULTIPLE keys for flexible lookup:
 *   - prospect.id       (e.g., "ajdybantsa")
 *   - slug(prospect.name) (e.g., "ajdybantsa")
 *
 * Note: ScoutingTerminal.jsx has its own inline PROSPECTS_ALL with sequential
 * "p1", "p2" IDs that don't match prospects.json. Callers from that surface
 * should look up by name slug instead.
 *
 * Idempotent — first call computes; subsequent calls return cached Map.
 */
export function getAllProspectScores(): Map<string, ProspectScores> {
  if (_scoresCache) return _scoresCache;

  const cohortStats = loadCohortStats();
  const pool = loadCandidatePool();
  const prospects = prospectsRaw as ActiveProspectRecord[];
  const profileStats = profileStatsRaw as Record<string, ProfileStatsRecord>;
  const advancedExtras = advancedExtrasRaw as Record<string, AdvancedExtrasRecord>;

  const out = new Map<string, ProspectScores>();
  for (const p of prospects) {
    if (!p.id) continue;
    const key = slugKey(p.name);
    const ps = profileStats[key] ?? null;
    const ex = advancedExtras[key] ?? null;
    const scores = scoreActiveProspect({
      prospect: p,
      profileStats: ps,
      advancedExtras: ex,
      candidatePool: pool,
      cohortStats,
    });
    if (scores) {
      // Register under both id and name-slug so callers from either data
      // source (prospects.json ids vs inline PROSPECTS_ALL p1/p2 ids) can
      // look up successfully via slug.
      out.set(p.id, scores);
      if (key !== p.id) out.set(key, scores);
    }
  }

  _scoresCache = out;
  return out;
}

/** Clear cache — for tests or after recalibration. */
export function clearProspectScoresCache(): void {
  _scoresCache = null;
}

/** Convenience: get scores for one prospect by id. */
export function getProspectScores(prospectId: string): ProspectScores | null {
  return getAllProspectScores().get(prospectId) ?? null;
}

/** Convenience: get scores by prospect name (handles inline-PROSPECTS_ALL → JSON-id mismatch). */
export function getProspectScoresByName(name: string): ProspectScores | null {
  return getAllProspectScores().get(slugKey(name)) ?? null;
}
