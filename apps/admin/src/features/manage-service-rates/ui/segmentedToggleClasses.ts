/** Contiguous segmented control: one bordered group, no per-item outer radius. */
export const SEGMENTED_TOGGLE_GROUP_CLASS =
  "inline-flex overflow-hidden rounded-[6px] border border-border-tertiary";

export const SEGMENTED_TOGGLE_ITEM_CLASS =
  "h-9 shrink-0 rounded-none border-0 border-r border-border-tertiary bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-none " +
  "last:border-r-0 hover:bg-white hover:text-foreground data-[state=on]:bg-brand-red " +
  "data-[state=on]:text-white data-[state=on]:hover:bg-brand-red";
