/**
 * proseParser.ts — Module 1e: turns scout prose into axis-tagged ProseTag[].
 *
 * Two input paths, both supported:
 *
 *   (1) STRUCTURED TAGS (preferred): when the user authored their prose using
 *       the library picker, the prospect record carries a structured
 *       proseTags array with library item IDs. We translate those directly
 *       to axis-weighted ProseTag entries — no fuzzy matching needed.
 *
 *   (2) FREE-FORM PROSE: the prospect.summary.strengths/weaknesses/swingFactors
 *       are arrays of scout-authored strings. We do a substring match of
 *       library item text against each prose string. Crude but works for
 *       prose that was assembled from the library picker (the common case).
 *
 * Free-form matching has limitations — fully bespoke prose won't match the
 * library and will produce no ProseTag entries. That's OK; axisScores
 * gracefully degrades when prose is absent (redistributes weight to anchor +
 * stats per the spec's rule 5).
 *
 * Pure functions: no I/O. Caller passes the library + category map explicitly
 * so tests can inject fixtures.
 */

import type { AnyAxisKey } from "./axisScores";
import type { ProseTag } from "./axisScores";
import type { PositionFamily } from "./cohortStats";
import scoutTraitLibraryRaw from "../data/scoutTraitLibrary.json";
import categoryToAxisMapRaw from "../../config/categoryToAxisMap.json";

// =============================================================================
// TYPES
// =============================================================================

export type ItemPolarity = "positive" | "negative" | "swing";
export type TagPolarity  = "pos" | "neg" | "swing";

export interface ScoutLibraryItem {
  id: string;
  category: string;
  polarity: ItemPolarity;
  text: string;
  positions: string[];   // ["G", "W", "F", "B", "ALL"]
}

export interface ScoutLibrary {
  items: ScoutLibraryItem[];
  /** Lookup: itemId → item. Built once. */
  byId: Map<string, ScoutLibraryItem>;
  /** Lookup: lowercased text → item. For substring matching. */
  byLowercaseText: Map<string, ScoutLibraryItem>;
}

export interface CategoryAxisMapEntry {
  axisWeights: Partial<Record<AnyAxisKey, number>>;
  feedsRiskFlag: boolean;
}

export type CategoryToAxisMap = Record<string, CategoryAxisMapEntry>;

/** Structured input — used when the user picks library items via the editor. */
export interface StructuredProseTagInput {
  libraryId?: string;
  /** Direct axis specification (skips library lookup). */
  axis?: AnyAxisKey;
  polarity: ItemPolarity | TagPolarity;
  /** 0..1 — intensity multiplier. Default 1.0. */
  weight?: number;
}

export interface ProspectProseInput {
  strengths?: string[];
  weaknesses?: string[];
  swingFactors?: string[];
  /** When provided, takes precedence over fuzzy matching of strengths/weaknesses. */
  proseTags?: StructuredProseTagInput[];
  /** Optional — narrows library matching to position-relevant items. */
  positionFamily?: PositionFamily;
}

export interface ParseProsetagsResult {
  tags: ProseTag[];
  /** Risk-flag mentions (category="risk"). Consumed by overall-grade red flags. */
  riskFlagItems: ScoutLibraryItem[];
  /** Library items that matched at least one prose string. For UI inspection. */
  matchedItems: ScoutLibraryItem[];
  notes: string[];
}

// =============================================================================
// LIBRARY LOADING
// =============================================================================

let _libraryCache: ScoutLibrary | null = null;

export function loadScoutLibrary(): ScoutLibrary {
  if (_libraryCache) return _libraryCache;
  const raw = scoutTraitLibraryRaw as RawLibraryFile;
  const items: ScoutLibraryItem[] = (raw.items ?? []).map((it) => ({
    id: it.id,
    category: it.category,
    polarity: it.polarity as ItemPolarity,
    text: it.text,
    positions: it.positions ?? ["ALL"],
  }));
  _libraryCache = {
    items,
    byId: new Map(items.map((i) => [i.id, i])),
    byLowercaseText: new Map(items.map((i) => [i.text.toLowerCase(), i])),
  };
  return _libraryCache;
}

export function clearLibraryCache(): void { _libraryCache = null; }

let _categoryMapCache: CategoryToAxisMap | null = null;

export function loadCategoryAxisMap(): CategoryToAxisMap {
  if (_categoryMapCache) return _categoryMapCache;
  const raw = categoryToAxisMapRaw as RawCategoryMapFile;
  const out: CategoryToAxisMap = {};
  for (const [cat, entry] of Object.entries(raw.categories ?? {})) {
    out[cat] = {
      axisWeights: (entry.axisWeights ?? {}) as Partial<Record<AnyAxisKey, number>>,
      feedsRiskFlag: entry.feedsRiskFlag === true,
    };
  }
  _categoryMapCache = out;
  return _categoryMapCache;
}

export function clearCategoryMapCache(): void { _categoryMapCache = null; }

// =============================================================================
// MATCHING
// =============================================================================

/** Convert ItemPolarity → TagPolarity (positive→pos, etc). */
function normalizePolarity(p: ItemPolarity | TagPolarity): TagPolarity {
  if (p === "positive") return "pos";
  if (p === "negative") return "neg";
  if (p === "pos" || p === "neg" || p === "swing") return p;
  return "swing"; // default
}

/** Filter library items relevant for a positionFamily. ALL items pass for any family. */
function isPositionRelevant(item: ScoutLibraryItem, posFam: PositionFamily | undefined): boolean {
  if (!posFam) return true;
  if (item.positions.includes("ALL")) return true;
  // Map our 3 families to the library's 4 codes
  const codes = posFam === "guard" ? ["G"] : posFam === "wing" ? ["W"] : ["F", "B"];
  return codes.some((c) => item.positions.includes(c));
}

/**
 * Fuzzy substring match: does any library item's text appear within `prose`?
 * Returns ALL matching items; multi-match is allowed (a single sentence can
 * trigger multiple library items).
 *
 * The match is case-insensitive substring. To avoid false positives on common
 * short words (e.g., "passing"), we require the library item text to be
 * at least MIN_MATCH_LEN characters AND fully present as a contiguous substring.
 */
const MIN_MATCH_LEN = 12;

export function matchProseToLibrary(
  prose: string,
  library: ScoutLibrary,
  posFam?: PositionFamily,
): ScoutLibraryItem[] {
  if (!prose || prose.length < MIN_MATCH_LEN) return [];
  const lower = prose.toLowerCase();
  const matches: ScoutLibraryItem[] = [];
  for (const item of library.items) {
    if (item.text.length < MIN_MATCH_LEN) continue;
    if (!isPositionRelevant(item, posFam)) continue;
    if (lower.includes(item.text.toLowerCase())) {
      matches.push(item);
    }
  }
  return matches;
}

// =============================================================================
// CORE
// =============================================================================

/**
 * Parse a prospect's prose into axis-tagged ProseTag entries.
 *
 * @param input         strengths/weaknesses/swingFactors arrays + optional structured tags
 * @param library       loaded scout trait library (or pass loadScoutLibrary())
 * @param categoryMap   loaded category→axis map (or pass loadCategoryAxisMap())
 * @returns             ProseTag[] for axisScores, plus risk-flag items for overall-grade
 */
export function parseProsetags(
  input: ProspectProseInput,
  library?: ScoutLibrary,
  categoryMap?: CategoryToAxisMap,
): ParseProsetagsResult {
  const lib = library ?? loadScoutLibrary();
  const map = categoryMap ?? loadCategoryAxisMap();
  const tags: ProseTag[] = [];
  const riskFlagItems: ScoutLibraryItem[] = [];
  const matchedItems: ScoutLibraryItem[] = [];
  const notes: string[] = [];

  // -------- PATH 1: structured proseTags (preferred) --------
  if (input.proseTags && input.proseTags.length > 0) {
    notes.push(`structured input: ${input.proseTags.length} tags`);
    for (const stag of input.proseTags) {
      const polarity = normalizePolarity(stag.polarity);
      const weight = typeof stag.weight === "number" ? stag.weight : 1.0;

      // Direct axis specification — skip library lookup
      if (stag.axis) {
        tags.push({ axis: stag.axis, polarity, weight });
        continue;
      }
      // Library ID → category → axes
      if (stag.libraryId) {
        const item = lib.byId.get(stag.libraryId);
        if (!item) {
          notes.push(`unknown library id: ${stag.libraryId}`);
          continue;
        }
        matchedItems.push(item);
        if (item.category === "risk") {
          riskFlagItems.push(item);
          continue;
        }
        const catEntry = map[item.category];
        if (!catEntry) {
          notes.push(`category "${item.category}" not in axis map`);
          continue;
        }
        if (catEntry.feedsRiskFlag) {
          riskFlagItems.push(item);
          continue;
        }
        for (const [axis, axisWeight] of Object.entries(catEntry.axisWeights) as [AnyAxisKey, number][]) {
          tags.push({ axis, polarity, weight: weight * axisWeight });
        }
      }
    }
    return { tags, riskFlagItems, matchedItems, notes };
  }

  // -------- PATH 2: free-form prose, fuzzy substring match --------
  notes.push("no structured tags — falling back to fuzzy library match");
  const proseEntries: { text: string; polarity: ItemPolarity }[] = [
    ...(input.strengths ?? []).map((t) => ({ text: t, polarity: "positive" as const })),
    ...(input.weaknesses ?? []).map((t) => ({ text: t, polarity: "negative" as const })),
    ...(input.swingFactors ?? []).map((t) => ({ text: t, polarity: "swing" as const })),
  ];

  for (const entry of proseEntries) {
    const matches = matchProseToLibrary(entry.text, lib, input.positionFamily);
    for (const item of matches) {
      // Use the LIBRARY ITEM's polarity if it differs from the prose section,
      // since a "strength" string could quote a library item that's classified
      // negative (e.g., "lacks the burst" used in a strengths section is rare
      // but possible). We trust the library tagging.
      const effectivePolarity = normalizePolarity(item.polarity);
      matchedItems.push(item);

      if (item.category === "risk") {
        riskFlagItems.push(item);
        continue;
      }
      const catEntry = map[item.category];
      if (!catEntry) {
        notes.push(`category "${item.category}" not in axis map`);
        continue;
      }
      if (catEntry.feedsRiskFlag) {
        riskFlagItems.push(item);
        continue;
      }
      for (const [axis, axisWeight] of Object.entries(catEntry.axisWeights) as [AnyAxisKey, number][]) {
        tags.push({ axis, polarity: effectivePolarity, weight: axisWeight });
      }
    }
  }
  if (matchedItems.length === 0) {
    notes.push("no library matches found in free-form prose");
  } else {
    notes.push(`matched ${matchedItems.length} library items across ${proseEntries.length} prose strings`);
  }

  return { tags, riskFlagItems, matchedItems, notes };
}

// =============================================================================
// RAW JSON SHAPES
// =============================================================================

interface RawLibraryItem {
  id: string;
  category: string;
  polarity: string;
  text: string;
  positions?: string[];
}
interface RawLibraryFile {
  items?: RawLibraryItem[];
}

interface RawCategoryMapEntry {
  axisWeights?: Record<string, number>;
  feedsRiskFlag?: boolean;
}
interface RawCategoryMapFile {
  categories?: Record<string, RawCategoryMapEntry>;
}
