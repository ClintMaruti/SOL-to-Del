import { useMemo, useState } from "react";

import type { DocumentTemplateListItem } from "@/entities/document-template";
import type { SortDirection } from "@/shared/components/Table";

export type DocumentTemplatesSortKey = "title" | null;

export function useDocumentTemplatesListSort(
  items: DocumentTemplateListItem[]
) {
  const [sortKey, setSortKey] = useState<DocumentTemplatesSortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const onSort = (key: Exclude<DocumentTemplatesSortKey, null>) => {
    setSortDirection((currentDirection) =>
      sortKey === key && currentDirection === "asc" ? "desc" : "asc"
    );
    setSortKey(key);
  };

  const sortedItems = useMemo(() => {
    if (!sortKey) {
      return items;
    }

    return items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        const comparison = left.item.title.localeCompare(right.item.title);

        if (comparison !== 0) {
          return sortDirection === "desc" ? -comparison : comparison;
        }

        return left.index - right.index;
      })
      .map(({ item }) => item);
  }, [items, sortDirection, sortKey]);

  return {
    onSort,
    sortDirection,
    sortKey,
    sortedItems,
  };
}
