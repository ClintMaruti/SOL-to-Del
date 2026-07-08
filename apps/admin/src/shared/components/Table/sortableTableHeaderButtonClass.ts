/**
 * Ghost `Button` in sortable `<TableHead>` cells: default ghost styles add a hover/focus
 * box; supplier detail tables (services, extras) suppress that for a text-only header.
 * Padding comes from `<TableHead>` (Figma: spacing/4 left, spacing/2 right); keep `px-0`
 * so label + sort icon align to the cell inset without extra button padding.
 */
export const SORTABLE_TABLE_HEAD_BUTTON_CLASS =
  "h-auto min-h-0 px-0 py-0 gap-2 text-text-secondary hover:text-text-primary font-medium border-transparent hover:border-transparent hover:bg-transparent focus-visible:border-transparent focus-visible:outline-none";
