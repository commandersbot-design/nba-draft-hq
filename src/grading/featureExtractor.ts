/**
 * featureExtractor.ts — pure functions that turn any prospect record (active
 * or historical) into the canonical 16-feature FeatureVector consumed by
 * cohortStats.zScore and axisScores.computeAxisScore.
 *
 * Both extraction paths return the SAME shape (FeatureVector) so downstream
 * scoring is single-path and pool-agnostic. Missing fields come back as null
 * — never zero, never imputed. Callers determine dataMode based on
 * presence/absence; this module never lies about coverage.
 */

import {
  type FeatureVector,
  type FeatureKey,
  FEATURE_KEYS,
  heightToInches,
  toPctScale,
} from "./cohortStats";

// =============================================================================
// SHARED HELPERS
// =============================================================================

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function emptyVector(): FeatureVector {
  const out: FeatureVector = {};
  for (const k of FEATURE_KEYS) out[k] = null;
  return out;
}

// =============================================================================
// HISTORICAL PROSPECT
// =============================================================================

/** Shape of a single entry from historicalProspects.json. */
export interface HistoricalProspectRecord {
  id: string;
  name: string;
  draftYear?: number | null;
  position?: string | null;
  positionFamily?: string | null;
  archetype?: string | null;
  archetypeFamily?: string | null;
  height?: string | null;
  age?: number | null;
  trueShooting?: string | number | null;
  bpm?: number | null;
  outcomeTier?: string | null;
}

/** Shape of one entry from historicalAdvancedStats.json (cbbAdv slice). */
export interface HistoricalCbbAdvBlock {
  bpm?: number | null;
  obpm?: number | null;
  dbpm?: number | null;
  per?: number | null;
  usgPct?: number | null;
  astPct?: number | null;
  tovPct?: number | null;
  stlPct?: number | null;
  blkPct?: number | null;
  orbPct?: number | null;
  drbPct?: number | null;
  trbPct?: number | null;
  tsPct?: number | null;
  efgPct?: number | null;
  threePAr?: number | null;
}

export interface HistoricalAdvancedRecord {
  cbbAdv?: HistoricalCbbAdvBlock | null;
  nbaAdv?: unknown;
  source?: string;
}

/**
 * Extract the FeatureVector from a historical prospect record + its advanced
 * stats sidecar. Pulls preferentially from cbbAdv; falls back to top-level
 * historical fields when cbbAdv lacks a column.
 */
export function featuresFromHistorical(
  prospect: HistoricalProspectRecord,
  adv: HistoricalAdvancedRecord | null | undefined,
): FeatureVector {
  const cbb = adv?.cbbAdv ?? {};
  const f = emptyVector();
  f.tsPct    = toPctScale(cbb.tsPct ?? prospect.trueShooting ?? null);
  f.efgPct   = toPctScale(cbb.efgPct ?? null);
  f.usgPct   = toNum(cbb.usgPct);
  f.astPct   = toNum(cbb.astPct);
  f.tovPct   = toNum(cbb.tovPct);
  f.stlPct   = toNum(cbb.stlPct);
  f.blkPct   = toNum(cbb.blkPct);
  f.orbPct   = toNum(cbb.orbPct);
  f.drbPct   = toNum(cbb.drbPct);
  f.bpm      = toNum(cbb.bpm ?? prospect.bpm);
  f.obpm     = toNum(cbb.obpm);
  f.dbpm     = toNum(cbb.dbpm);
  f.per      = toNum(cbb.per);
  f.threePAr = toNum(cbb.threePAr);
  f.age      = toNum(prospect.age);
  f.heightIn = heightToInches(prospect.height ?? null);
  return f;
}

// =============================================================================
// ACTIVE PROSPECT
// =============================================================================

/** Shape of one entry from prospects.json relevant to feature extraction. */
export interface ActiveProspectRecord {
  id: string;
  name: string;
  height?: string | null;
  weight?: string | null;
  wingspan?: string | null;
  age?: number | null;
  position?: string | null;
  archetype?: string | null;
  archetypeFamily?: string | null;
  // Used as last-resort fallbacks when sidecar files are absent
  scores?: { overallComposite?: number | null; offense?: number | null; defense?: number | null };
}

/** Shape of profileStats.json[id].stats.advanced. */
export interface ProfileStatsAdvanced {
  trueShooting?: string | number | null;
  efgPct?: string | number | null;
  usage?: string | number | null;
  assistRate?: string | number | null;
  turnoverRate?: string | number | null;
  bpm?: number | null;
  reboundRate?: string | number | null;
}

export interface ProfileStatsRecord {
  stats?: { advanced?: ProfileStatsAdvanced };
}

/** Shape of prospectAdvancedExtras.json[slug]. */
export interface AdvancedExtrasRecord {
  stlPct?: number | null;
  blkPct?: number | null;
  obpm?: number | null;
  dbpm?: number | null;
  per?: number | null;
  orbPct?: number | null;
  drbPct?: number | null;
  threePAr?: number | null;
  ftr?: number | null;
  pfr?: number | null;
  tsPct?: number | null;
  efgPct?: number | null;
}

/**
 * Extract the FeatureVector for an active 2026 prospect. Combines three sources:
 *   - prospects.json record (height, age)
 *   - profileStats.json[id].stats.advanced (BPM, USG, AST/TOV rates, TS%)
 *   - prospectAdvancedExtras.json[slug] (STL%, BLK%, ORB%, DRB%, OBPM, DBPM, PER, 3PAr)
 *
 * Pass null for any source that's unavailable for this prospect.
 */
export function featuresFromActive(
  prospect: ActiveProspectRecord,
  profileStats: ProfileStatsRecord | null | undefined,
  advancedExtras: AdvancedExtrasRecord | null | undefined,
): FeatureVector {
  const adv  = profileStats?.stats?.advanced ?? {};
  const xtra = advancedExtras ?? {};
  const f = emptyVector();
  f.tsPct    = toPctScale(xtra.tsPct ?? adv.trueShooting ?? null);
  f.efgPct   = toPctScale(xtra.efgPct ?? adv.efgPct ?? null);
  f.usgPct   = toPctScale(adv.usage ?? null);
  f.astPct   = toPctScale(adv.assistRate ?? null);
  f.tovPct   = toPctScale(adv.turnoverRate ?? null);
  f.stlPct   = toNum(xtra.stlPct);
  f.blkPct   = toNum(xtra.blkPct);
  f.orbPct   = toNum(xtra.orbPct);
  f.drbPct   = toNum(xtra.drbPct);
  f.bpm      = toNum(adv.bpm);
  f.obpm     = toNum(xtra.obpm);
  f.dbpm     = toNum(xtra.dbpm);
  f.per      = toNum(xtra.per);
  f.threePAr = toNum(xtra.threePAr);
  f.age      = toNum(prospect.age);
  f.heightIn = heightToInches(prospect.height ?? null);
  return f;
}

// =============================================================================
// COVERAGE DIAGNOSTICS
// =============================================================================

/** Count present features in a vector — feeds dataMode + UI coverage chip. */
export function coverageCount(features: FeatureVector): number {
  let n = 0;
  for (const k of FEATURE_KEYS) {
    const v = features[k];
    if (v != null && Number.isFinite(v)) n++;
  }
  return n;
}

/** List of present feature keys — useful for UI explanation. */
export function presentFeatures(features: FeatureVector): FeatureKey[] {
  const out: FeatureKey[] = [];
  for (const k of FEATURE_KEYS) {
    const v = features[k];
    if (v != null && Number.isFinite(v)) out.push(k);
  }
  return out;
}

/**
 * Boolean gate used by the comp engine to decide between full statistical
 * comp matching vs scout_anchored fallback mode. Returns true iff the
 * feature vector has the minimum spine to support distance-based matching.
 *
 * Required core (4 universal fields): TS%, USG%, BPM, height. These are
 * present on every prospect with a basic NCAA box-score profile. The full
 * 16-feature distance calc still gracefully handles missing optional
 * features (OBPM, DBPM, age, etc.) — they just drop out of the distance.
 *
 * Originally required 7 fields including age + OBPM/DBPM. Relaxed to 4
 * because (a) age coverage is incomplete in the active class data, and
 * (b) the comp engine's MIN_SHARED=8 gate in similarity.ts already
 * enforces "enough features overlap to compute distance" — duplicating
 * that here over-rejected.
 */
export function hasMinimumQuantitativeSpine(features: FeatureVector): boolean {
  const required: FeatureKey[] = ["tsPct", "usgPct", "bpm", "heightIn"];
  for (const k of required) {
    const v = features[k];
    if (v == null || !Number.isFinite(v)) return false;
  }
  return true;
}
