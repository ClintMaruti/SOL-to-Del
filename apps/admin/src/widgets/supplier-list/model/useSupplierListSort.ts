import { useMemo, useState } from "react";

import type { Supplier } from "@/entities/suppliers/model/types";

export type SortField =
  | "name"
  | "code"
  | "headOfficeName"
  | "locationName"
  | "email"
  | "phone"
  | "isActive";

export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

export interface UseSupplierListSortOptions {
  getHeadOfficeName?: (supplier: Supplier) => string;
  getLocation?: (supplier: Supplier) => string;
}

export function useSupplierListSort(
  suppliers: Supplier[],
  options?: UseSupplierListSortOptions
) {
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });

  const toggleSort = (field: SortField) => {
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

  const sortedSuppliers = useMemo(() => {
    if (!sortState.field) return suppliers;

    const { getHeadOfficeName, getLocation } = options ?? {};

    return [...suppliers].sort((a, b) => {
      const field = sortState.field!;
      let aValue: string | number;
      let bValue: string | number;

      switch (field) {
        case "name":
        case "email":
          aValue = (a[field] ?? "").toString().toLowerCase();
          bValue = (b[field] ?? "").toString().toLowerCase();
          break;
        case "code":
        case "phone":
          aValue = (a[field] ?? "").toString().toLowerCase();
          bValue = (b[field] ?? "").toString().toLowerCase();
          break;
        case "headOfficeName":
          aValue = (getHeadOfficeName?.(a) ?? a[field] ?? "")
            .toString()
            .toLowerCase();
          bValue = (getHeadOfficeName?.(b) ?? b[field] ?? "")
            .toString()
            .toLowerCase();
          break;
        case "locationName":
          aValue = (getLocation?.(a) ?? a[field] ?? "")
            .toString()
            .toLowerCase();
          bValue = (getLocation?.(b) ?? b[field] ?? "")
            .toString()
            .toLowerCase();
          break;
        case "isActive":
          // Ascending: active (true) first
          aValue = a.isActive ? 0 : 1;
          bValue = b.isActive ? 0 : 1;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortState.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [suppliers, sortState, options]);

  return {
    sortState,
    toggleSort,
    sortedSuppliers,
  };
}
