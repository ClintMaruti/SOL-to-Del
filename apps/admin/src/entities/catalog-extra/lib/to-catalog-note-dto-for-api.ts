import type { CatalogNoteDto } from "../model/types";

/** Placeholder id for new note rows (matches catalog extra PUT pattern). */
export const CATALOG_NOTE_NIL_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Builds `{ id, text, version }` for catalog NoteDto on POST/PUT.
 * Empty text → `null` (backend clears or skips note creation).
 */
export function toCatalogNoteDtoForApi(
  existing: CatalogNoteDto | null | undefined,
  textRaw: string
): CatalogNoteDto | null {
  const text = textRaw.trim();
  if (!text) {
    return null;
  }
  if (!existing?.id) {
    return { id: CATALOG_NOTE_NIL_ID, text, version: 0 };
  }
  return { id: existing.id, text, version: existing.version };
}
