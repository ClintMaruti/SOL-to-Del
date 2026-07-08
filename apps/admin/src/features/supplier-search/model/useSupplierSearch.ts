import { useMemo } from "react";

import type { Supplier } from "@/entities/suppliers/model/types";
import { useDebouncedUrlSearch } from "@/shared/hooks";

export function useSupplierSearch(suppliers: Supplier[]) {
  const { searchQuery, setSearchQuery, debouncedQuery } = useDebouncedUrlSearch(
    { paramKey: "search", debounceMs: 300 }
  );

  const filteredSuppliers = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();

    if (!query || query.length < 3) {
      return suppliers;
    }

    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(query) ||
        (supplier.code ?? "").toLowerCase().includes(query) ||
        (supplier.email ?? "").toLowerCase().includes(query) ||
        (supplier.phone ?? "").toLowerCase().includes(query)
    );
  }, [suppliers, debouncedQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredSuppliers,
    hasResults: filteredSuppliers.length > 0,
  };
}
