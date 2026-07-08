import { useCallback, useMemo, useState } from "react";

import type {
  MarginRuleSortBy,
  MarginRulesListQueryInput,
} from "@/entities/margin-rule";
import { useDebouncedValue } from "@/shared/hooks";

import {
  EMPTY_MARGIN_RULES_FILTERS,
  MARGIN_RULES_FILTER_KEYS,
  type MarginRulesFilterKey,
  type MarginRulesFilters,
} from "./types";

function isActiveFilterValue(
  key: MarginRulesFilterKey,
  filters: MarginRulesFilters
): boolean {
  const value = filters[key];

  if (key === "marginPercent") {
    return typeof value === "string" && value.trim().length > 0;
  }

  return value != null && value !== "";
}

function normalizeFilters(filters: MarginRulesFilters): MarginRulesFilters {
  const marginPercent = filters.marginPercent.trim();

  if (!filters.supplierId) {
    return {
      ...filters,
      serviceId: null,
      optionId: null,
      marginPercent,
    };
  }

  if (!filters.serviceId) {
    return {
      ...filters,
      optionId: null,
      marginPercent,
    };
  }

  return {
    ...filters,
    marginPercent,
  };
}

function upsertFilterOrder(
  currentOrder: MarginRulesFilterKey[],
  key: MarginRulesFilterKey,
  nextFilters: MarginRulesFilters
) {
  const withoutKey = currentOrder.filter((item) => item !== key);

  return isActiveFilterValue(key, nextFilters)
    ? [...withoutKey, key]
    : withoutKey;
}

function pruneFilterOrder(
  currentOrder: MarginRulesFilterKey[],
  filters: MarginRulesFilters
) {
  return currentOrder.filter((key) => isActiveFilterValue(key, filters));
}

function setFilterValue(
  filters: MarginRulesFilters,
  key: MarginRulesFilterKey,
  value: string | null
) {
  const nextFilters: MarginRulesFilters = {
    ...filters,
    [key]: key === "marginPercent" ? (value ?? "") : value,
  };

  if (key === "supplierId" && filters.supplierId !== value) {
    nextFilters.serviceId = null;
    nextFilters.optionId = null;
  }

  if (key === "serviceId" && filters.serviceId !== value) {
    nextFilters.optionId = null;
  }

  return normalizeFilters(nextFilters);
}

function syncFilterOrders(
  key: MarginRulesFilterKey,
  nextFilters: MarginRulesFilters,
  currentOrder: MarginRulesFilterKey[]
) {
  let nextOrder = upsertFilterOrder(currentOrder, key, nextFilters);

  if (key === "supplierId") {
    nextOrder = nextOrder.filter(
      (item) => item !== "serviceId" && item !== "optionId"
    );
  }

  if (key === "serviceId") {
    nextOrder = nextOrder.filter((item) => item !== "optionId");
  }

  return pruneFilterOrder(nextOrder, nextFilters);
}

export function useMarginRulesListControls() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [draftFilters, setDraftFilters] = useState<MarginRulesFilters>(
    EMPTY_MARGIN_RULES_FILTERS
  );
  const [appliedFilters, setAppliedFilters] = useState<MarginRulesFilters>(
    EMPTY_MARGIN_RULES_FILTERS
  );
  const [draftFilterOrder, setDraftFilterOrder] = useState<
    MarginRulesFilterKey[]
  >([]);
  const [appliedFilterOrder, setAppliedFilterOrder] = useState<
    MarginRulesFilterKey[]
  >([]);
  const [sortBy, setSortBy] = useState<MarginRuleSortBy>("agencyGroupName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hideExpired, setHideExpired] = useState(false);
  const [showHiddenChips, setShowHiddenChips] = useState(false);

  const appliedSearch = useMemo(() => {
    const value = debouncedSearchQuery.trim();
    return value.length >= 3 ? value : null;
  }, [debouncedSearchQuery]);

  const updateDraftFilter = useCallback(
    (key: MarginRulesFilterKey, value: string | null) => {
      setDraftFilters((currentFilters) => {
        const nextFilters = setFilterValue(currentFilters, key, value);

        setDraftFilterOrder((currentOrder) => {
          return syncFilterOrders(key, nextFilters, currentOrder);
        });

        return nextFilters;
      });
    },
    []
  );

  const clearDraftFilter = useCallback(
    (key: MarginRulesFilterKey) => {
      updateDraftFilter(key, null);
    },
    [updateDraftFilter]
  );

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setAppliedFilterOrder(pruneFilterOrder(draftFilterOrder, draftFilters));
  }, [draftFilterOrder, draftFilters]);

  const resetFilters = useCallback(() => {
    setDraftFilters(EMPTY_MARGIN_RULES_FILTERS);
    setAppliedFilters(EMPTY_MARGIN_RULES_FILTERS);
    setDraftFilterOrder([]);
    setAppliedFilterOrder([]);
    setShowHiddenChips(false);
  }, []);

  const removeAppliedFilter = useCallback(
    (key: MarginRulesFilterKey) => {
      setAppliedFilters((currentApplied) => {
        const nextApplied = setFilterValue(currentApplied, key, null);
        const nextAppliedOrder = pruneFilterOrder(
          appliedFilterOrder.filter((item) => item !== key),
          nextApplied
        );

        setAppliedFilterOrder(nextAppliedOrder);
        setDraftFilters(nextApplied);
        setDraftFilterOrder(
          pruneFilterOrder(
            draftFilterOrder.filter((item) => item !== key),
            nextApplied
          )
        );

        return nextApplied;
      });
    },
    [appliedFilterOrder, draftFilterOrder]
  );

  const updateAppliedFilter = useCallback(
    (key: MarginRulesFilterKey, value: string | null) => {
      setAppliedFilters((currentApplied) => {
        const nextApplied = setFilterValue(currentApplied, key, value);
        const nextAppliedOrder = syncFilterOrders(
          key,
          nextApplied,
          appliedFilterOrder
        );
        const nextDraftOrder = syncFilterOrders(
          key,
          nextApplied,
          draftFilterOrder
        );

        setAppliedFilterOrder(nextAppliedOrder);
        setDraftFilters(nextApplied);
        setDraftFilterOrder(nextDraftOrder);

        return nextApplied;
      });
    },
    [appliedFilterOrder, draftFilterOrder]
  );

  const clearAllAppliedFilters = useCallback(() => {
    setAppliedFilters(EMPTY_MARGIN_RULES_FILTERS);
    setDraftFilters(EMPTY_MARGIN_RULES_FILTERS);
    setAppliedFilterOrder([]);
    setDraftFilterOrder([]);
    setShowHiddenChips(false);
  }, []);

  const toggleSort = useCallback(
    (nextSortBy: MarginRuleSortBy) => {
      if (nextSortBy === sortBy) {
        setSortDirection((currentDirection) =>
          currentDirection === "asc" ? "desc" : "asc"
        );
        return;
      }

      setSortBy(nextSortBy);
      setSortDirection("asc");
    },
    [sortBy]
  );

  const queryInput = useMemo<MarginRulesListQueryInput>(
    () => ({
      search: appliedSearch,
      sortBy,
      sortDirection,
      hideExpired,
      agencyGroupId: appliedFilters.agencyGroupId,
      serviceTypeId: appliedFilters.serviceTypeId,
      supplierId: appliedFilters.supplierId,
      serviceId: appliedFilters.serviceId,
      optionId: appliedFilters.optionId,
      validFrom: appliedFilters.validFrom,
      validTo: appliedFilters.validTo,
      marginPercent: appliedFilters.marginPercent || null,
    }),
    [appliedFilters, appliedSearch, hideExpired, sortBy, sortDirection]
  );

  const hasAppliedFilters = appliedFilterOrder.some((key) =>
    isActiveFilterValue(key, appliedFilters)
  );

  return {
    searchQuery,
    setSearchQuery,
    appliedSearch,
    draftFilters,
    appliedFilters,
    draftFilterOrder,
    appliedFilterOrder,
    sortBy,
    sortDirection,
    hideExpired,
    setHideExpired,
    showHiddenChips,
    setShowHiddenChips,
    updateDraftFilter,
    clearDraftFilter,
    applyFilters,
    resetFilters,
    removeAppliedFilter,
    updateAppliedFilter,
    clearAllAppliedFilters,
    toggleSort,
    queryInput,
    hasAppliedFilters,
  };
}

export { MARGIN_RULES_FILTER_KEYS };
