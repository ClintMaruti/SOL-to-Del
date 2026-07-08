import { useMemo, useState } from "react";

import type { CatalogExtra } from "@/entities/catalog-extra";

export type SortDirection = "asc" | "desc";

export type ExtrasSortField = "title" | "description" | "isActive";

export interface ExtrasSortState {
  field: ExtrasSortField | null;
  direction: SortDirection;
}

function compareExtras(
  a: CatalogExtra,
  b: CatalogExtra,
  field: ExtrasSortField,
  direction: SortDirection
): number {
  let aVal: string | number;
  let bVal: string | number;

  switch (field) {
    case "title": {
      const at = a.title ?? "";
      const bt = b.title ?? "";
      aVal = at.toLowerCase();
      bVal = bt.toLowerCase();
      break;
    }
    case "description": {
      const ad = a.description ?? "";
      const bd = b.description ?? "";
      aVal = ad.toLowerCase();
      bVal = bd.toLowerCase();
      break;
    }
    case "isActive":
      aVal = a.isActive ? 1 : 0;
      bVal = b.isActive ? 1 : 0;
      break;
    default:
      return 0;
  }

  if (aVal < bVal) return direction === "asc" ? -1 : 1;
  if (aVal > bVal) return direction === "asc" ? 1 : -1;
  return 0;
}

export function useExtrasListSort(extras: CatalogExtra[]) {
  const [sortState, setSortState] = useState<ExtrasSortState>({
    field: null,
    direction: "asc",
  });

  const handleSort = (field: ExtrasSortField, direction: SortDirection) => {
    setSortState({ field, direction });
  };

  const sortedExtras = useMemo(() => {
    if (!sortState.field) return extras;

    return [...extras].sort((a, b) =>
      compareExtras(a, b, sortState.field!, sortState.direction)
    );
  }, [extras, sortState]);

  return { sortState, handleSort, sortedExtras };
}
