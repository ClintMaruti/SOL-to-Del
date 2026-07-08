import { useMemo, useState } from "react";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";

export type SupplierHeadOfficesListSortField =
  | "name"
  | "email"
  | "phoneNumber"
  | "suppliersCount"
  | "isActive";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SupplierHeadOfficesListSortField | null;
  direction: SortDirection;
}

export function useSupplierHeadOfficesListSort(
  supplierHeadOffices: SupplierHeadOffice[]
) {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });

  const toggleSort = (field: SupplierHeadOfficesListSortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        // Toggle direction if same field
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      // New field, start with ascending
      return { field, direction: "asc" };
    });
  };

  const sortedSupplierHeadOffices = useMemo(() => {
    if (!sortState.field) return supplierHeadOffices;

    return [...supplierHeadOffices].sort((a, b) => {
      const field = sortState.field!;
      const aValue: string | number | boolean = a[field] as
        | string
        | number
        | boolean;
      const bValue: string | number | boolean = b[field] as
        | string
        | number
        | boolean;

      if (aValue < bValue) return sortState.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [supplierHeadOffices, sortState]);

  return {
    sortState,
    toggleSort,
    sortedSupplierHeadOffices,
  };
}
