import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { parseRoutePath } from "@/shared/lib/routing";
import { useUIStore } from "@/shared/stores";

/**
 * Hook to sync URL changes with sidebar state
 * Updates sidebar selection based on current route
 */
export function useRouteSync() {
  const location = useLocation();
  const {
    setSelectedMainSidebarItem,
    setSelectedPageSidebarItem,
    selectedMainSidebarItem,
    selectedPageSidebarItem,
  } = useUIStore();

  useEffect(() => {
    const segments = parseRoutePath(location.pathname);

    // Update main sidebar item if it changed
    if (
      segments.mainItemId &&
      segments.mainItemId !== selectedMainSidebarItem
    ) {
      setSelectedMainSidebarItem(segments.mainItemId);
    }

    // Update page sidebar item if it changed
    // Only set if we have a childId (which indicates a page sidebar should be shown)
    if (segments.childId) {
      // Set the childId as the selectedPageSidebarItem
      // This matches the structure where selectedPageSidebarItem is the child item ID
      if (segments.childId !== selectedPageSidebarItem) {
        setSelectedPageSidebarItem(segments.childId);
      }
    } else {
      // If no childId, clear the page sidebar selection
      if (selectedPageSidebarItem !== null) {
        setSelectedPageSidebarItem(null);
      }
    }
  }, [
    location.pathname,
    selectedMainSidebarItem,
    selectedPageSidebarItem,
    setSelectedMainSidebarItem,
    setSelectedPageSidebarItem,
  ]);
}
