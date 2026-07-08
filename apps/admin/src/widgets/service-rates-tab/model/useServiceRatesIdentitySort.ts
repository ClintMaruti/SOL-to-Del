import { useMemo, useState } from "react";

import type { ServiceRate } from "@/entities/service-rate";

export type ServiceRatesIdentitySortField = "name" | "chargeType";

export type SortDirection = "asc" | "desc";

export interface ServiceRatesIdentitySortState {
  field: ServiceRatesIdentitySortField | null;
  direction: SortDirection;
}

function compareSortValues(
  aValue: string,
  bValue: string,
  direction: SortDirection
): number {
  if (aValue < bValue) return direction === "asc" ? -1 : 1;
  if (aValue > bValue) return direction === "asc" ? 1 : -1;
  return 0;
}

export function useServiceRatesIdentitySort(rates: ServiceRate[]) {
  const [sortState, setSortState] = useState<ServiceRatesIdentitySortState>({
    field: null,
    direction: "asc",
  });

  const handleSort = (key: string, direction: SortDirection) => {
    setSortState({
      field: key as ServiceRatesIdentitySortField,
      direction,
    });
  };

  const toggleSort = (field: ServiceRatesIdentitySortField) => {
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

  const sortedRates = useMemo(() => {
    if (!sortState.field) return rates;

    const sorted = [...rates];
    sorted.sort((a, b) => {
      const aValue = sortState.field === "name" ? a.name : a.chargeType;
      const bValue = sortState.field === "name" ? b.name : b.chargeType;
      return compareSortValues(aValue, bValue, sortState.direction);
    });
    return sorted;
  }, [rates, sortState]);

  return { sortState, handleSort, toggleSort, sortedRates };
}
