/**
 * stylistic.ts — Module 4: user-authored stylistic comp schema + CRUD.
 *
 * Stylistic comps are eye-test / tape-based comps the user authors directly.
 * They live in a SEPARATE namespace from the statistical engine output and
 * never feed back into the model — preserving the model's independent signal.
 *
 * Storage: caller-supplied (typically localStorage). This module provides:
 *   - Schema types (StylisticComp, StylisticCompStore)
 *   - Pure CRUD on a store object (add/update/delete/list)
 *   - Validation for inbound user data
 *
 * The store shape is { [prospectId]: StylisticComp[] }, mirroring the
 * existing deepDives store shape in ScoutingTerminal.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ComparisonType = "ceiling" | "floor" | "archetype-match" | "player-comp";
export type StylisticConfidence = "low" | "medium" | "high";

export interface StylisticComp {
  /** Stable client-generated ID. */
  id: string;
  /** Active class prospect ID (e.g., "ajdybantsa"). */
  prospectId: string;
  /** NBA / historical player name being compared to. Free-form string. */
  comparedTo: string;
  comparisonType: ComparisonType;
  confidence: StylisticConfidence;
  /** Free-form scout reasoning. */
  notes: string;
  /** Optional reference to a historical's id in candidatePool, when match exists. */
  candidateId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Storage shape: prospectId → list of stylistic comps. */
export type StylisticCompStore = Record<string, StylisticComp[]>;

// =============================================================================
// VALIDATION
// =============================================================================

const VALID_TYPES: readonly ComparisonType[] = ["ceiling", "floor", "archetype-match", "player-comp"];
const VALID_CONFIDENCES: readonly StylisticConfidence[] = ["low", "medium", "high"];

export interface ValidationError { field: string; message: string; }

export function validateStylisticComp(input: Partial<StylisticComp>): ValidationError[] {
  const errs: ValidationError[] = [];
  if (!input.prospectId || typeof input.prospectId !== "string" || input.prospectId.trim() === "") {
    errs.push({ field: "prospectId", message: "required, non-empty string" });
  }
  if (!input.comparedTo || typeof input.comparedTo !== "string" || input.comparedTo.trim() === "") {
    errs.push({ field: "comparedTo", message: "required, non-empty string" });
  }
  if (!input.comparisonType || !VALID_TYPES.includes(input.comparisonType)) {
    errs.push({ field: "comparisonType", message: `must be one of ${VALID_TYPES.join(", ")}` });
  }
  if (!input.confidence || !VALID_CONFIDENCES.includes(input.confidence)) {
    errs.push({ field: "confidence", message: `must be one of ${VALID_CONFIDENCES.join(", ")}` });
  }
  if (input.notes != null && typeof input.notes !== "string") {
    errs.push({ field: "notes", message: "must be a string" });
  }
  return errs;
}

// =============================================================================
// CRUD — pure, returns a NEW store object on every mutation
// =============================================================================

/** Generate a stable-enough ID — uuid would be cleaner but we don't want a dep. */
function makeId(): string {
  return `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface AddCompInput {
  prospectId: string;
  comparedTo: string;
  comparisonType: ComparisonType;
  confidence: StylisticConfidence;
  notes?: string;
  candidateId?: string | null;
}

/** Add a new stylistic comp. Throws if validation fails. */
export function addStylisticComp(
  store: StylisticCompStore,
  input: AddCompInput,
): StylisticCompStore {
  const errs = validateStylisticComp(input);
  if (errs.length > 0) {
    throw new Error(`addStylisticComp: ${errs.map((e) => `${e.field}: ${e.message}`).join("; ")}`);
  }
  const now = new Date().toISOString();
  const comp: StylisticComp = {
    id: makeId(),
    prospectId: input.prospectId,
    comparedTo: input.comparedTo.trim(),
    comparisonType: input.comparisonType,
    confidence: input.confidence,
    notes: (input.notes ?? "").trim(),
    candidateId: input.candidateId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const existing = store[input.prospectId] ?? [];
  return {
    ...store,
    [input.prospectId]: [...existing, comp],
  };
}

/** Update an existing comp by id. Returns store unchanged if id not found. */
export function updateStylisticComp(
  store: StylisticCompStore,
  id: string,
  patch: Partial<Omit<StylisticComp, "id" | "prospectId" | "createdAt">>,
): StylisticCompStore {
  for (const [pid, comps] of Object.entries(store)) {
    const idx = comps.findIndex((c) => c.id === id);
    if (idx < 0) continue;
    const merged: StylisticComp = {
      ...comps[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    const errs = validateStylisticComp(merged);
    if (errs.length > 0) {
      throw new Error(`updateStylisticComp: ${errs.map((e) => `${e.field}: ${e.message}`).join("; ")}`);
    }
    const next = comps.slice();
    next[idx] = merged;
    return { ...store, [pid]: next };
  }
  return store;
}

/** Delete a comp by id. Returns store unchanged if not found. */
export function deleteStylisticComp(store: StylisticCompStore, id: string): StylisticCompStore {
  for (const [pid, comps] of Object.entries(store)) {
    const next = comps.filter((c) => c.id !== id);
    if (next.length !== comps.length) {
      if (next.length === 0) {
        const out = { ...store };
        delete out[pid];
        return out;
      }
      return { ...store, [pid]: next };
    }
  }
  return store;
}

/** List all comps for a prospect, sorted newest-first. */
export function listStylisticCompsFor(store: StylisticCompStore, prospectId: string): StylisticComp[] {
  const comps = store[prospectId] ?? [];
  return [...comps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** All comps across all prospects, flattened. */
export function allStylisticComps(store: StylisticCompStore): StylisticComp[] {
  const out: StylisticComp[] = [];
  for (const pid of Object.keys(store)) out.push(...store[pid]);
  return out;
}

/** Filter helper: comps of a particular type for a prospect. */
export function compsByType(
  store: StylisticCompStore,
  prospectId: string,
  type: ComparisonType,
): StylisticComp[] {
  return listStylisticCompsFor(store, prospectId).filter((c) => c.comparisonType === type);
}
