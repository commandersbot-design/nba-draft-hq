/**
 * archetypeLookup.ts — load + index archetypeCatalog.json so axisScores can
 * pull a prospect's 9-axis anchor profile by archetype name.
 *
 * Pure functions + an explicit cache singleton. No mutation of catalog data.
 */

import archetypeCatalogRaw from "../data/archetypeCatalog.json";
import type { AxisKey } from "./axisScores";

// =============================================================================
// TYPES
// =============================================================================

export type ArchetypeTier = "Star" | "Role" | "Specialist" | "Unique";
export type ArchetypePositionFamily = "Guard" | "Wing" | "Forward" | "Big";

export interface ArchetypeAnchor {
  key: string;
  name: string;
  tier: ArchetypeTier;
  positionFamily: ArchetypePositionFamily;
  exemplars: string[];
  /** All 9 axis values, 0-100. */
  anchorScores: Record<AxisKey, number>;
  notes?: string;
}

export interface ArchetypeCatalog {
  schema: string;
  archetypes: ArchetypeAnchor[];
  byName: Map<string, ArchetypeAnchor>;
  byKey: Map<string, ArchetypeAnchor>;
}

// =============================================================================
// CACHE
// =============================================================================

let _catalogCache: ArchetypeCatalog | null = null;

export function loadArchetypeCatalog(): ArchetypeCatalog {
  if (_catalogCache) return _catalogCache;
  const raw = archetypeCatalogRaw as RawCatalogFile;
  const archetypes: ArchetypeAnchor[] = [];
  for (const entry of raw.archetypes ?? []) {
    // Skip section markers (e.g., the {"_section": "..."} comment object we added)
    if (!entry.name || !entry.key || !entry.anchorScores) continue;
    const anchors = entry.anchorScores as Record<string, number>;
    // Validate all 9 axes present
    const requiredAxes: AxisKey[] = [
      "initiate", "extend", "close", "space", "connect",
      "contain", "disrupt", "switch", "transition",
    ];
    const missing = requiredAxes.filter((a) => anchors[a] == null);
    if (missing.length > 0) {
      throw new Error(
        `archetypeCatalog: "${entry.name}" missing axis anchors: ${missing.join(", ")}`,
      );
    }
    archetypes.push({
      key: entry.key,
      name: entry.name,
      tier: entry.tier as ArchetypeTier,
      positionFamily: entry.positionFamily as ArchetypePositionFamily,
      exemplars: entry.exemplars ?? [],
      anchorScores: anchors as Record<AxisKey, number>,
      notes: entry.notes,
    });
  }
  _catalogCache = {
    schema: raw.schema ?? "anchor-scores-v1",
    archetypes,
    byName: new Map(archetypes.map((a) => [a.name, a])),
    byKey: new Map(archetypes.map((a) => [a.key, a])),
  };
  return _catalogCache;
}

export function clearArchetypeCache(): void {
  _catalogCache = null;
}

// =============================================================================
// LOOKUPS
// =============================================================================

/**
 * Returns the per-axis anchor map (0-100 per axis) for an archetype name, or
 * null if the archetype isn't in the catalog. Caller passes null for the
 * archetype-anchor input to axisScores, which gracefully redistributes weight.
 */
export function getArchetypeAnchors(
  archetypeName: string | null | undefined,
  catalog?: ArchetypeCatalog,
): Record<AxisKey, number> | null {
  if (!archetypeName) return null;
  const c = catalog ?? loadArchetypeCatalog();
  const arch = c.byName.get(archetypeName);
  return arch ? arch.anchorScores : null;
}

export function getArchetype(
  archetypeName: string | null | undefined,
  catalog?: ArchetypeCatalog,
): ArchetypeAnchor | null {
  if (!archetypeName) return null;
  const c = catalog ?? loadArchetypeCatalog();
  return c.byName.get(archetypeName) ?? null;
}

// =============================================================================
// RAW JSON SHAPE
// =============================================================================

interface RawCatalogEntry {
  key?: string;
  name?: string;
  tier?: string;
  positionFamily?: string;
  exemplars?: string[];
  anchorScores?: Record<string, number>;
  notes?: string;
  _section?: string;  // marker entries we skip
}

interface RawCatalogFile {
  schema?: string;
  archetypes?: RawCatalogEntry[];
}
