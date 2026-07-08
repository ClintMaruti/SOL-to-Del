import { useEffect, useState } from "react";
import { BREAKPOINTS } from "../lib/constants";

/**
 * Hook to detect if viewport matches a media query
 * @param query - Media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }

    // Legacy browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Hook to check if viewport is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
}

/**
 * Hook to check if viewport is tablet (768px - 1024px)
 */
export function useIsTablet(): boolean {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
  return !isMobile && !isDesktop;
}

/**
 * Hook to check if viewport is desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
}
