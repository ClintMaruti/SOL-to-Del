import { useMemo, useState } from "react";

import type { Promotion } from "@/entities/promotion";

export type PromotionsListSortField =
  | "name"
  | "bookingWindowFrom"
  | "bookingWindowTo"
  | "isActive";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: PromotionsListSortField | null;
  direction: SortDirection;
}

function compareByField(
  a: Promotion,
  b: Promotion,
  field: PromotionsListSortField,
  direction: SortDirection
) {
  let result = 0;

  switch (field) {
    case "name":
      result = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      break;
    case "bookingWindowFrom":
      result = a.bookingWindowFrom.localeCompare(b.bookingWindowFrom);
      break;
    case "bookingWindowTo":
      result = a.bookingWindowTo.localeCompare(b.bookingWindowTo);
      break;
    case "isActive":
      result = Number(b.isActive) - Number(a.isActive);
      break;
    default: {
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }

  if (result === 0) {
    return 0;
  }

  return direction === "asc" ? result : -result;
}

export function usePromotionsListSort(promotions: Promotion[]) {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });

  const toggleSort = (field: PromotionsListSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }

      return { field, direction: "asc" };
    });
  };

  const sortedPromotions = useMemo(() => {
    const list = [...promotions];

    if (!sortState.field) {
      return list;
    }

    return list.sort((a, b) =>
      compareByField(a, b, sortState.field!, sortState.direction)
    );
  }, [promotions, sortState]);

  return {
    sortState,
    toggleSort,
    sortedPromotions,
  };
}
