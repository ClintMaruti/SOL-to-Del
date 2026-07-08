import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useClearURLSearchParam } from "./useClearURLSearchParam";
import { useDebouncedValue } from "./useDebouncedValue";

export interface UseDebouncedUrlSearchOptions {
  /** URL search param key. Defaults to "search". */
  paramKey?: string;
  /** Debounce delay in ms. Defaults to 300. */
  debounceMs?: number;
}

/**
 * Initializes search state from the URL, exposes local state for immediate input,
 * and a debounced value for side effects. Also clears the URL search param on mount
 * so reloading the page does not re‑apply the previous search.
 */
export function useDebouncedUrlSearch(options?: UseDebouncedUrlSearchOptions) {
  const { paramKey = "search", debounceMs = 300 } = options ?? {};
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQueryState] = useState(
    () => searchParams.get(paramKey) ?? ""
  );
  const debouncedQuery = useDebouncedValue(searchQuery, debounceMs);

  useClearURLSearchParam(options?.paramKey);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
  };
}
