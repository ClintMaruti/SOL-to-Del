import { useState, useCallback } from "react";

export function useDestinationTree(
  initialExpandedIds: Set<string> = new Set()
) {
  const [expandedIds, setExpandedIds] =
    useState<Set<string>>(initialExpandedIds);

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const expandNode = useCallback((id: string) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  const collapseNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedIds(new Set(ids));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const isExpanded = useCallback(
    (id: string) => expandedIds.has(id),
    [expandedIds]
  );

  return {
    expandedIds,
    toggleNode,
    expandNode,
    collapseNode,
    expandAll,
    collapseAll,
    isExpanded,
  };
}
