/**
 * Tag library types — mirrors the structure of config/tagLibrary.json.
 *
 * Three layers, manually assigned per prospect:
 *  - skills:   neutral cyan badges, 27 tags across 7 categories
 *  - outlook:  gold badges, 6 tags, restrictive assignment
 *  - concerns: red badges, 4 tags, risk flags
 */

export type TagLayer = "skills" | "outlook" | "concerns";

export type SkillCategory =
  | "scoring" | "creation" | "free-throw" | "off-ball" | "passing" | "defense" | "physical";

/** A single tag definition from the library. */
export interface TagDef {
  id: string;
  name: string;
  layer: TagLayer;
  category?: SkillCategory;            // present on skills-layer tags
  icon: string;                         // semantic lucide-react name (UI maps it)
  description: string;
  usageGuide?: string;                  // outlook-only: how restrictively to assign
  conflicts?: string[];                 // tag ids that should not co-fire
}

/** Per-layer presentation config. */
export interface LayerDef {
  label: string;
  tone: "neutral" | "gold" | "risk";
  color: string;                        // CSS var or color string
  background: string;
  categoryOrder: string[];
  categoryLabels?: Record<string, string>;
  usageRule?: string;
}

/** Top-level shape of tagLibrary.json. */
export interface TagLibrary {
  schema: "tag-library-v1";
  layerOrder: TagLayer[];
  layers: Record<TagLayer, LayerDef>;
  conflicts: [string, string][];        // pairs of conflicting tag ids
  tags: TagDef[];
}

/** Per-player assignment record (localStorage value). */
export interface PlayerTagAssignment {
  /** Tag ids the player carries. Order is insertion order. */
  tagIds: string[];
  /** Last-edit timestamp (ISO). */
  lastUpdated: string;
}

/** localStorage shape: prospectId → assignment. */
export type PlayerTagsMap = Record<string, PlayerTagAssignment>;
