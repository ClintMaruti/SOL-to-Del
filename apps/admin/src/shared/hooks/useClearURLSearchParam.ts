import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Reusable hook to clear a search param from the URL as soon as the page is loaded to prevent
 * the search query from being applied to the list after a page reload
 * @param paramKey - The key of the search param to clear
 * @returns void
 */
export function useClearURLSearchParam(paramKey: string = "search") {
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!searchParams.has(paramKey)) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(paramKey);
        return next;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams, paramKey]);
}
