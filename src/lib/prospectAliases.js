// Prospect alias resolution for the news ingestion pipeline.
//
// Use case: raw news headlines arrive ("Dybantsa drops 30 in Dallas",
// "AJ practiced today", "Boozer + Peterson confirmed for Spurs workout"),
// and we need to map each headline to the prospect IDs it mentions so
// matching items end up in src/data/prospectNews.json.
//
// API:
//   matchProspectsByText(text, prospects)
//     → returns array of { aliasRecord, prospect } for every prospect mentioned
//
//   getAliasRecordForProspect(prospect)
//     → returns the alias record (active/tickerPriority/searchAliases/etc.)
//       for a given runtime prospect, or null if no alias exists
//
//   isActive(prospect)
//     → true if the prospect should be ingested + rendered. Prospects without
//       an alias entry default to active=true so we don't accidentally drop
//       new additions before their alias row is added.
//
// All matching is case-insensitive and respects word boundaries (so "Brown"
// in the alias for Mikel Brown won't match "Brownsville Texas Tech").

import PROSPECT_ALIASES from "../data/prospectAliases.json";

const ENTRIES = PROSPECT_ALIASES.entries || [];

// Pre-compute a slug for each entry so we can match against runtime prospects
// (which only carry display name, not the kebab-case CSV id).
function nameSlug(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

const ENTRY_BY_SLUG = (() => {
  const m = new Map();
  for (const e of ENTRIES) m.set(nameSlug(e.name), e);
  return m;
})();

export function getAliasRecordForProspect(prospect) {
  if (!prospect?.name) return null;
  return ENTRY_BY_SLUG.get(nameSlug(prospect.name)) || null;
}

export function isActive(prospect) {
  const rec = getAliasRecordForProspect(prospect);
  if (!rec) return true; // no alias yet → assume active until we add the row
  return rec.active !== false;
}

export function getTickerPriority(prospect) {
  const rec = getAliasRecordForProspect(prospect);
  return rec?.tickerPriority || "normal";
}

// Pre-compile a regex per alias variant. Variants are sorted longest-first so
// "AJ Dybantsa" wins over "Dybantsa" when both match a headline (we want the
// most specific match to count as the primary attribution).
const COMPILED_ALIASES = (() => {
  const rows = [];
  for (const e of ENTRIES) {
    if (e.active === false) continue;
    const variants = (e.searchAliases || []).slice().sort((a, b) => b.length - a.length);
    for (const variant of variants) {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Word-boundary on both sides except when the alias contains punctuation
      // (e.g., "K.J. Lewis" — leading/trailing word boundaries don't apply).
      const regex = new RegExp(`(?:^|\\W)${escaped}(?=\\W|$)`, "i");
      rows.push({ alias: e, variant, regex });
    }
  }
  return rows;
})();

// Scan a headline / blurb. Returns matches in the order the aliases appear in
// the text. The same prospect can only match once (deduped by slug).
export function matchProspectsByText(text, prospects = []) {
  if (!text) return [];
  const seen = new Set();
  const results = [];
  for (const row of COMPILED_ALIASES) {
    if (seen.has(row.alias.id)) continue;
    if (!row.regex.test(text)) continue;
    seen.add(row.alias.id);
    const slug = nameSlug(row.alias.name);
    const prospect = prospects.find((p) => nameSlug(p.name) === slug) || null;
    results.push({ aliasRecord: row.alias, prospect, aliasMatched: row.variant });
  }
  return results;
}

// One-shot ingestion helper: take a raw external news item with text +
// timestamp, and produce a feed-ready entry (or array of entries if multiple
// prospects are mentioned).
//
// Input shape:
//   { headline, kind?, timestamp, sourceUrl?, severity? }
// Returns:
//   [{ id, prospectId, kind, headline, timestamp, sourceUrl, severity }] for
//   each prospect mentioned. The caller can write these directly into
//   src/data/prospectNews.json (de-duped by id).
export function ingestRawNewsItem(rawItem, prospects = []) {
  const matches = matchProspectsByText(rawItem.headline, prospects);
  if (matches.length === 0) return [];
  const ts = rawItem.timestamp ? new Date(rawItem.timestamp).getTime() : Date.now();
  const dateStr = new Date(ts).toISOString().slice(0, 10);
  return matches
    .filter((m) => m.prospect && isActive(m.prospect))
    .map((m, idx) => ({
      id: `n-${dateStr}-${m.aliasRecord.id}-${ts.toString(36).slice(-4)}-${idx}`,
      prospectId: m.prospect.id,
      kind: rawItem.kind || "news",
      headline: rawItem.headline,
      timestamp: new Date(ts).toISOString(),
      sourceUrl: rawItem.sourceUrl || "",
      severity: rawItem.severity || null,
    }));
}

export { nameSlug as _nameSlugForTesting };
