import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useIsMobile, useIsTablet } from "@/shared/hooks";
import { getNavPath } from "@/shared/lib/paths";
import { isReleaseEnabled, type ReleaseId } from "@/shared/lib/release-flags";
import { parseRoutePath } from "@/shared/lib/routing";
import { useUIStore } from "@/shared/stores";
import { MAIN_SIDEBAR_WIDTH } from "./MainSidebar";

import { pageNavItems } from "./pageSidebarUtils";

interface PageSidebarProps {
  className?: string;
}

export function PageSidebar({ className }: PageSidebarProps) {
  const { t } = useTranslation("admin");
  const { selectedPageSidebarItem, selectedMainSidebarItem } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { innerPageId } = useParams<{ innerPageId?: string }>();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Don't show page sidebar if no page is selected or if it doesn't have in-page menus
  const pageNav = selectedPageSidebarItem
    ? pageNavItems[selectedPageSidebarItem]
    : null;

  // Only show nav items that are released for the current environment
  const visibleItems = useMemo(() => {
    if (!pageNav) return [];
    return pageNav.items.filter((item) =>
      isReleaseEnabled(item.id as ReleaseId)
    );
  }, [pageNav]);

  // Get the selected item for current page (only from visible items)
  // Priority: 1) URL param, 2) match from current path, 3) first visible item
  const selectedItem = useMemo(() => {
    if (!pageNav || visibleItems.length === 0) return null;

    // 1. If innerPageId is provided in URL params and visible, use it
    if (innerPageId && visibleItems.some((item) => item.id === innerPageId)) {
      return innerPageId;
    }

    // 2. Try to match from current path (only if visible)
    const { innerPageId: pathInnerPageId } = parseRoutePath(location.pathname);
    if (
      pathInnerPageId &&
      visibleItems.some((item) => item.id === pathInnerPageId)
    ) {
      return pathInnerPageId;
    }

    // 3. Default to first visible item
    return visibleItems[0]?.id || null;
  }, [pageNav, visibleItems, innerPageId, location.pathname]);

  const handleItemClick = (itemId: string) => {
    if (selectedPageSidebarItem && selectedMainSidebarItem) {
      navigate(
        getNavPath(selectedMainSidebarItem, selectedPageSidebarItem, itemId)
      );
    }
  };

  if (!pageNav || visibleItems.length === 0) {
    return null;
  }

  // Calculate left position based on main sidebar state (must match MainSidebar w-12/w-64)
  // On mobile/tablet, main sidebar is hidden (overlay), so page sidebar starts at 0
  const mainSidebarWidth = isMobile || isTablet ? 0 : MAIN_SIDEBAR_WIDTH;

  return (
    <aside
      data-page-sidebar
      className={`
        fixed top-0
        w-[214px] bg-white border-r border-border
        z-30 transition-all duration-300 ease-in-out
        ${className || ""}
      `}
      style={{
        left: `${mainSidebarWidth}px`,
        height: "calc(100vh - var(--layout-reserved-footer-height, 0px))",
      }}
    >
      <div className="h-full overflow-y-auto">
        {/* Navigation Items */}
        <nav className="">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center gap-2 pl-3 pr-2 py-3 text-sm transition-colors
                  text-text-primary font-medium hover:bg-gray-100
                  ${isActive ? "bg-gray-100 border-r-2 border-brand-red" : "border-r-2 border-transparent"}
                `}
              >
                <Icon className="h-4 w-4 shrink-0 text-text-secondary" />
                <span className="flex-1 text-left">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
