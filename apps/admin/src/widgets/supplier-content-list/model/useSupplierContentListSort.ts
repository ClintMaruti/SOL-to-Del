import { useMemo, useState } from "react";

import type { SupplierContentBlockListItem } from "@/entities/supplier-content-block";
import type { SortDirection } from "@/shared/components/Table";

export type SupplierContentSortKey = "title" | "bodyPreview" | null;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useSupplierContentListSort(
  items: SupplierContentBlockListItem[]
) {
  const [sortKey, setSortKey] = useState<SupplierContentSortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const onSort = (
    key: SupplierContentSortKey | null,
    direction: SortDirection
  ) => {
    setSortKey(key as SupplierContentSortKey);
    setSortDirection(direction);
  };

  const sortedItems = useMemo(() => {
    if (!sortKey) {
      return items;
    }
    const sorted = [...items].sort((a, b) => {
      if (sortKey === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortKey === "bodyPreview") {
        return stripHtml(a.bodyPreview).localeCompare(stripHtml(b.bodyPreview));
      }
      return 0;
    });
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [items, sortDirection, sortKey]);

  return {
    sortKey,
    sortDirection,
    onSort,
    sortedItems,
  };
}
