import PROSPECT_HEADSHOTS from "../data/prospectHeadshots.json";

/**
 * Shared prospect headshot resolver. Used by every card / row / hero that
 * needs to display a prospect's photo so name-variant mismatches (the
 * "Jr." suffix, accents, punctuation) resolve consistently across the app.
 *
 * The underlying prospectHeadshots.json is keyed by the canonical prospect
 * name from prospects.json. Founder-authored content sometimes uses display
 * variations of those names — e.g. "Darius Acuff Jr." even though the
 * canonical record is "Darius Acuff" — so a pure exact-name lookup misses.
 *
 * Resolution strategy:
 *   1. Try the exact name first (cheapest, intentional).
 *   2. Fall back to a slug match — lowercase + strip non-alphanumeric.
 *      Handles "Jr." / "Sr." / "III." suffixes, hyphens, periods,
 *      apostrophes ("De'Aaron Fox" → "deaaronfox"), and accents (after
 *      a Unicode normalization pass).
 *
 * Returns the URL or null. Callers should fall back to initials when null.
 */

function slugify(name) {
  if (!name) return "";
  // Strip diacritics so "López" → "lopez", "Vučević" → "vucevic".
  // The ̀-ͯ range is the Unicode "combining marks" block left
  // behind by NFKD decomposition.
  let s = String(name).normalize("NFKD").replace(/[̀-ͯ]/g, "");
  // Strip common name suffixes (Jr / Sr / II / III / IV / V) BEFORE
  // slugging so display variants like "Darius Acuff Jr." match the
  // canonical "Darius Acuff" record. Tolerates the trailing period
  // and surrounding punctuation that often comes with the suffix.
  s = s.replace(/[\s,.]+(jr|sr|ii|iii|iv|v)\.?\s*$/i, "");
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Slug → entry, computed once at module load.
const BY_SLUG = (() => {
  const out = {};
  for (const [name, entry] of Object.entries(PROSPECT_HEADSHOTS)) {
    out[slugify(name)] = entry;
  }
  return out;
})();

/**
 * Resolve a headshot URL for a prospect name. Returns null when there's
 * no match (caller should render an initials fallback).
 */
export function resolveHeadshotUrl(name) {
  if (!name) return null;
  // Direct hit first — most paths land here.
  const direct = PROSPECT_HEADSHOTS[name];
  if (direct?.headshotUrl) return direct.headshotUrl;
  // Slug fallback handles "Jr." variants + accent / punctuation mismatches.
  const slug = slugify(name);
  if (!slug) return null;
  const fallback = BY_SLUG[slug];
  return fallback?.headshotUrl || null;
}

/**
 * For diagnostics — returns the slug-indexed map size. Handy when verifying
 * the headshot file loaded correctly during development.
 */
export function headshotCoverageCount() {
  return Object.keys(BY_SLUG).length;
}
