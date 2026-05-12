/**
 * library.ts — load + index the tag library, conflict-check helpers.
 *
 * Loads config/tagLibrary.json once (module singleton) and provides:
 *   - getTagLibrary(): full library
 *   - getTagById(id): one tag
 *   - getTagsByLayer(layer): tags filtered by layer, sorted by category
 *   - getConflictsFor(tagId, currentIds): which tags conflict with adding this id
 *   - groupTagsByCategory(layer): { categoryId → TagDef[] }
 */

import libraryRaw from "../../../config/tagLibrary.json";
import type { TagDef, TagLayer, TagLibrary, SkillCategory } from "./types";

const lib = libraryRaw as unknown as TagLibrary;

let _byId: Map<string, TagDef> | null = null;
let _byLayer: Map<TagLayer, TagDef[]> | null = null;
let _conflictsAdj: Map<string, Set<string>> | null = null;

function buildIndexes() {
  if (_byId) return;
  _byId = new Map();
  _byLayer = new Map([["skills", []], ["outlook", []], ["concerns", []]]);
  for (const t of lib.tags) {
    _byId.set(t.id, t);
    const arr = _byLayer.get(t.layer);
    if (arr) arr.push(t);
  }
  // Build adjacency for conflict lookup. Bidirectional.
  _conflictsAdj = new Map();
  const add = (a: string, b: string) => {
    if (!_conflictsAdj!.has(a)) _conflictsAdj!.set(a, new Set());
    _conflictsAdj!.get(a)!.add(b);
  };
  for (const [a, b] of lib.conflicts) {
    add(a, b);
    add(b, a);
  }
  // Also pick up per-tag conflicts (redundant but defensive)
  for (const t of lib.tags) {
    for (const c of t.conflicts ?? []) {
      add(t.id, c);
      add(c, t.id);
    }
  }
}

export function getTagLibrary(): TagLibrary {
  return lib;
}

export function getTagById(id: string): TagDef | null {
  buildIndexes();
  return _byId!.get(id) ?? null;
}

export function getTagsByLayer(layer: TagLayer): TagDef[] {
  buildIndexes();
  return _byLayer!.get(layer) ?? [];
}

/**
 * Returns tag ids in `currentIds` that conflict with adding `candidateId`.
 * Empty array = no conflicts; safe to add.
 */
export function getConflictsFor(candidateId: string, currentIds: string[]): string[] {
  buildIndexes();
  const conflicts = _conflictsAdj!.get(candidateId);
  if (!conflicts || conflicts.size === 0) return [];
  return currentIds.filter((id) => conflicts.has(id));
}

/** Pretty-grouped skills by category, in the library's categoryOrder. */
export function groupSkillsByCategory(): Array<{ category: SkillCategory; label: string; tags: TagDef[] }> {
  buildIndexes();
  const tags = _byLayer!.get("skills") ?? [];
  const order = lib.layers.skills.categoryOrder;
  const labels = lib.layers.skills.categoryLabels ?? {};
  const grouped: Record<string, TagDef[]> = {};
  for (const t of tags) {
    if (!t.category) continue;
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }
  return order
    .map((cat) => ({
      category: cat as SkillCategory,
      label: labels[cat] ?? cat,
      tags: grouped[cat] ?? [],
    }))
    .filter((g) => g.tags.length > 0);
}

/** Sort assigned tag ids by canonical order (layer → category → in-library order). */
export function sortTagIds(ids: string[]): string[] {
  buildIndexes();
  const byId = _byId!;
  const layerOrder = lib.layerOrder;
  const skillCategoryOrder = lib.layers.skills.categoryOrder;
  return ids
    .filter((id) => byId.has(id))
    .map((id) => byId.get(id)!)
    .sort((a, b) => {
      const layerDiff = layerOrder.indexOf(a.layer) - layerOrder.indexOf(b.layer);
      if (layerDiff !== 0) return layerDiff;
      if (a.layer === "skills" && b.layer === "skills" && a.category && b.category) {
        const catDiff = skillCategoryOrder.indexOf(a.category) - skillCategoryOrder.indexOf(b.category);
        if (catDiff !== 0) return catDiff;
      }
      // Fall back to library order
      return lib.tags.indexOf(a) - lib.tags.indexOf(b);
    })
    .map((t) => t.id);
}
