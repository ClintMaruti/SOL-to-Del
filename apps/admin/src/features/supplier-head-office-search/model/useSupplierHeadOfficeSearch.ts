import { useMemo } from "react";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";
import { useDebouncedUrlSearch } from "@/shared/hooks";

export function useSupplierHeadOfficeSearch(
  supplierHeadOffices: SupplierHeadOffice[]
) {
  const { searchQuery, setSearchQuery, debouncedQuery } = useDebouncedUrlSearch(
    { paramKey: "search", debounceMs: 300 }
  );

  const filteredSupplierHeadOffices = useMemo(() => {
    const list = Array.isArray(supplierHeadOffices) ? supplierHeadOffices : [];
    const query = debouncedQuery.toLowerCase().trim();

    if (!query || query.length < 3) {
      return list;
    }

    return list.filter(
      (office) =>
        office.name.toLowerCase().includes(query) ||
        office.email?.toLowerCase().includes(query)
    );
  }, [supplierHeadOffices, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredSupplierHeadOffices,
    hasResults: filteredSupplierHeadOffices.length > 0,
  };
}
