import { useMemo, useState } from "react";

import type { SupplierService } from "@/entities/supplier-services";

export type SupplierServicesListSortField = "type" | "serviceName" | "isActive";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SupplierServicesListSortField | null;
  direction: SortDirection;
}

function compareSortValues(
  aValue: string | boolean,
  bValue: string | boolean,
  direction: SortDirection
): number {
  if (aValue < bValue) return direction === "asc" ? -1 : 1;
  if (aValue > bValue) return direction === "asc" ? 1 : -1;
  return 0;
}

function sortValueForField(
  service: SupplierService,
  field: SupplierServicesListSortField
): string | boolean {
  switch (field) {
    case "serviceName":
      return service.serviceName ?? service.name;
    case "type":
      return service.type;
    case "isActive":
      return service.isActive;
    default: {
      const _exhaustive: never = field;
      return _exhaustive;
    }
  }
}

export function useSupplierServicesListSort(services: SupplierService[]) {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });

  const toggleSort = (field: SupplierServicesListSortField) => {
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

  const handleSort = (key: string, direction: SortDirection) => {
    setSortState({
      field: key as SupplierServicesListSortField,
      direction,
    });
  };

  const sortedServices = useMemo(() => {
    if (!sortState.field) return services;

    return [...services].sort((a, b) => {
      const field = sortState.field!;
      const aValue = sortValueForField(a, field);
      const bValue = sortValueForField(b, field);
      return compareSortValues(aValue, bValue, sortState.direction);
    });
  }, [services, sortState]);

  return {
    sortState,
    toggleSort,
    handleSort,
    sortedServices,
  };
}
