import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type {
  ItinerariesListQueryInput,
  ItinerarySortField,
} from "@/entities/itinerary";
import { useDebouncedValue } from "@/shared/hooks";

import type {
  ItinerariesDraftFilters,
  ItinerariesFilterChipKey,
} from "./types";

const SORT_FIELDS: readonly ItinerarySortField[] = [
  "reference",
  "title",
  "travelDateFrom",
  "status",
  "paymentStatus",
  "total",
  "balance",
  "updatedAt",
] as const;

function parseSort(raw: string | null): ItinerarySortField | null {
  if (!raw) {
    return null;
  }
  return SORT_FIELDS.includes(raw as ItinerarySortField)
    ? (raw as ItinerarySortField)
    : null;
}

export function useItinerariesListUrlQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? ""
  );
  const urlSearch = searchParams.get("search") ?? "";

  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) {
          next.set("search", trimmed);
        } else {
          next.delete("search");
        }
        return next;
      },
      { replace: true }
    );
  }, [debouncedSearch, setSearchParams]);

  const queryInput = useMemo((): ItinerariesListQueryInput => {
    const s = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    return {
      search: s && s.length > 0 ? s : undefined,
      hideCompleted:
        searchParams.get("hideCompleted") === "true" ? true : undefined,
      sort: parseSort(searchParams.get("sort")),
      order: searchParams.get("order") === "desc" ? "desc" : "asc",
      agencyId: searchParams.get("agencyId"),
      bookedById: searchParams.get("bookedById"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      destinationId: searchParams.get("destinationId"),
      createdOnFrom: searchParams.get("createdOnFrom"),
      createdOnTo: searchParams.get("createdOnTo"),
      statuses: status ? [status] : null,
      paymentStatus: searchParams.get("paymentStatus"),
    };
  }, [searchParams]);

  const toggleSort = useCallback(
    (field: ItinerarySortField) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const cur = prev.get("sort");
          const ord = prev.get("order") === "desc" ? "desc" : "asc";
          if (cur === field) {
            next.set("order", ord === "asc" ? "desc" : "asc");
          } else {
            next.set("sort", field);
            next.set("order", "asc");
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setHideCompleted = useCallback(
    (checked: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (checked) {
            next.set("hideCompleted", "true");
          } else {
            next.delete("hideCompleted");
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const removeFilterKey = useCallback(
    (key: ItinerariesFilterChipKey) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(key);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const applyDraftFilters = useCallback(
    (draft: ItinerariesDraftFilters) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const entries: [ItinerariesFilterChipKey, string | null][] = [
            ["agencyId", draft.agencyId],
            ["bookedById", draft.agentId],
            ["dateFrom", draft.dateFrom],
            ["dateTo", draft.dateTo],
            ["destinationId", draft.destinationId],
            ["createdOnFrom", draft.createdOnFrom],
            ["createdOnTo", draft.createdOnTo],
            ["status", draft.status],
            ["paymentStatus", draft.paymentStatus],
          ];
          for (const [k, v] of entries) {
            if (v) {
              next.set(k, v);
            } else {
              next.delete(k);
            }
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearAllFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("agencyId");
        next.delete("bookedById");
        next.delete("dateFrom");
        next.delete("dateTo");
        next.delete("destinationId");
        next.delete("createdOnFrom");
        next.delete("createdOnTo");
        next.delete("status");
        next.delete("paymentStatus");
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const draftFromUrl = useMemo((): ItinerariesDraftFilters => {
    return {
      agencyId: searchParams.get("agencyId"),
      agentId: searchParams.get("bookedById"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      destinationId: searchParams.get("destinationId"),
      createdOnFrom: searchParams.get("createdOnFrom"),
      createdOnTo: searchParams.get("createdOnTo"),
      status: searchParams.get("status"),
      paymentStatus: searchParams.get("paymentStatus"),
    };
  }, [searchParams]);

  return {
    searchInput,
    setSearchInput,
    queryInput,
    toggleSort,
    setHideCompleted,
    removeFilterKey,
    applyDraftFilters,
    clearAllFilters,
    draftFromUrl,
  };
}
