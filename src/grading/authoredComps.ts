/**
 * authoredComps.ts — loader for user-authored stylistic comps.
 *
 * Reads src/data/authoredComps.json — a per-prospect 5-rung outcome ladder
 * (Floor → Ceiling) with player names + role tier labels. The UI uses these
 * as the user's eye-test read, surfaced ABOVE the statistical comp engine
 * output.
 *
 * Pure functions + module-level cache. Lookup keyed by name slug for
 * compatibility with the inline-PROSPECTS_ALL vs prospects.json id mismatch.
 */

import authoredCompsRaw from "../data/authoredComps.json";

// =============================================================================
// TYPES
// =============================================================================

export type LadderLevel = "floor" | "lowEnd" | "middle" | "highEnd" | "ceiling";
export const LADDER_LEVELS: readonly LadderLevel[] = ["floor", "lowEnd", "middle", "highEnd", "ceiling"] as const;

export const LADDER_LABELS: Record<LadderLevel, string> = {
  floor:   "Floor",
  lowEnd:  "Low-End",
  middle:  "Middle",
  highEnd: "High-End",
  ceiling: "Ceiling",
};

export interface AuthoredCompEntry {
  /** NBA player name (or "Player lite" suffix to indicate diminished version). */
  name: string;
  /** Role tier label — Bench / Role Player / Starter / Star / Superstar / Hall of Famer / etc. */
  tier: string;
}

export interface AuthoredCompLadder {
  prospectName: string;
  ladder: Partial<Record<LadderLevel, AuthoredCompEntry | null>>;
}

// =============================================================================
// LOADER
// =============================================================================

interface RawAuthoredFile {
  comps?: Record<string, AuthoredCompLadder>;
}

let _cache: Record<string, AuthoredCompLadder> | null = null;

function load(): Record<string, AuthoredCompLadder> {
  if (_cache) return _cache;
  const raw = authoredCompsRaw as RawAuthoredFile;
  _cache = raw.comps ?? {};
  return _cache;
}

export function clearAuthoredCompsCache(): void { _cache = null; }

/** Slug used by the lookup. Matches getProspectScoresByName's slug rule. */
function slugKey(name: string): string {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// =============================================================================
// PUBLIC API
// =============================================================================

/** Get the authored ladder for a prospect by name. Null when no ladder exists. */
export function getAuthoredCompLadder(prospectName: string): AuthoredCompLadder | null {
  const all = load();
  return all[slugKey(prospectName)] ?? null;
}

/** Returns all prospects who have authored ladders — for diagnostics / coverage reports. */
export function listAuthoredProspects(): string[] {
  const all = load();
  return Object.values(all).map((l) => l.prospectName);
}

/** Boolean: does this prospect have an authored ladder? */
export function hasAuthoredLadder(prospectName: string): boolean {
  const all = load();
  return Boolean(all[slugKey(prospectName)]);
}

/**
 * Returns the rungs of a ladder in canonical Floor → Ceiling order, dropping
 * any null/missing rungs. Rendered top-to-bottom by the UI as Ceiling → Floor.
 */
export function getLadderRungs(
  ladder: AuthoredCompLadder,
): Array<{ level: LadderLevel; entry: AuthoredCompEntry }> {
  const out: Array<{ level: LadderLevel; entry: AuthoredCompEntry }> = [];
  for (const level of LADDER_LEVELS) {
    const e = ladder.ladder[level];
    if (e && e.name) out.push({ level, entry: e });
  }
  return out;
}

/** Color hint for a tier label — used by the UI to color rungs by outcome quality. */
export function tierColor(tier: string): string {
  const lower = tier.toLowerCase();
  if (lower.includes("hall of fame")) return "#A855F7";
  if (lower.includes("superstar"))    return "#EC4899";
  if (lower.includes("star"))         return "var(--prospera-cyan)";
  if (lower.includes("starter"))      return "#10B981";
  if (lower.includes("role player"))  return "var(--prospera-text-dim)";
  if (lower.includes("bench"))        return "var(--prospera-text-mute)";
  return "var(--prospera-text-dim)";
}
