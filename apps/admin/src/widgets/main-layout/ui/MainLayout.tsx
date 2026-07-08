import type { ReactNode } from "react";

import { useIsMobile, useIsTablet } from "@/shared/hooks";
import { useUIStore } from "@/shared/stores";
import { Header } from "@/widgets/header";
import { Sidebar } from "@/widgets/sidebar";
import { MAIN_SIDEBAR_WIDTH } from "@/widgets/sidebar/ui/MainSidebar";
import { hasPageSidebar } from "@/widgets/sidebar/ui/pageSidebarUtils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { selectedPageSidebarItem } = useUIStore();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const mainSidebarWidth = isMobile || isTablet ? 0 : MAIN_SIDEBAR_WIDTH;
  const pageSidebarWidth = hasPageSidebar(selectedPageSidebarItem) ? 214 : 0;
  const totalSidebarWidth = mainSidebarWidth + pageSidebarWidth;

  // Show header on all viewports
  const showHeader = true;
  // Shell uses h-dvh + overflow-hidden so route content can fill height without body scroll;
  // main scrolls when a page is taller than the viewport.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showHeader && <Header />}
      <Sidebar />
      <main
        className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-accent pb-[var(--layout-reserved-footer-height,0px)] pt-16 transition-all duration-300 ease-in-out"
        style={{
          marginLeft: `${totalSidebarWidth}px`,
        }}
      >
        {children}
      </main>
    </div>
  );
}
