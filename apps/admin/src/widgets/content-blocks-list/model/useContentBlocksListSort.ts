import { useMemo, useState } from "react";

import type { ContentBlockListItem } from "@/entities/content-block/model/types";
import type { SortDirection } from "@/shared/components/Table";

export type ContentBlocksSortKey = "title" | "body" | null;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function useContentBlocksListSort(items: ContentBlockListItem[]) {
  const [sortKey, setSortKey] = useState<ContentBlocksSortKey>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const onSort = (
    key: ContentBlocksSortKey | null,
    direction: SortDirection
  ) => {
    setSortKey(key as ContentBlocksSortKey);
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
      if (sortKey === "body") {
        return stripHtml(a.body).localeCompare(stripHtml(b.body));
      }
      return 0;
    });
    return sortDirection === "desc" ? sorted.reverse() : sorted;
  }, [items, sortKey, sortDirection]);

  return {
    sortKey,
    sortDirection,
    onSort,
    sortedItems,
  };
}
