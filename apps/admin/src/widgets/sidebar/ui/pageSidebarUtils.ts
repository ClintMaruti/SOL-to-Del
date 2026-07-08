import { CONFIGURATION_SUB_PAGES } from "@/config/configuration-sub-pages.config";
import { DESTINATIONS_SUB_PAGES } from "@/config/destinations-sub-pages.config";

export interface PageNavItem {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** Build page nav from destinations config. Single source of truth. */
const destinationsPageNavItems: PageNavItem[] = DESTINATIONS_SUB_PAGES.map(
  (s) => ({
    id: s.id,
    labelKey: s.labelKey,
    icon: s.icon,
  })
);

const configurationPageNavItems: PageNavItem[] = CONFIGURATION_SUB_PAGES.map(
  (s) => ({
    id: s.id,
    labelKey: s.labelKey,
    icon: s.icon,
  })
);

// Page-specific navigation items based on selected page (from main sidebar children)
export const pageNavItems: Record<
  string,
  { titleKey: string; items: PageNavItem[] }
> = {
  destinations: {
    titleKey: "sidebar.database",
    items: destinationsPageNavItems,
  },
  settings: {
    titleKey: "sidebar.configuration",
    items: configurationPageNavItems,
  },
};

// Helper function to check if a page sidebar should be shown for a given page sidebar item
export function hasPageSidebar(pageSidebarItem: string | null): boolean {
  return (
    pageSidebarItem !== null && pageNavItems[pageSidebarItem] !== undefined
  );
}
