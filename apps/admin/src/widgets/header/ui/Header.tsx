import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Button,
} from "@sol/ui";
import { Menu, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "@/entities/auth/model/auth-store";
import { useIsMobile, useIsTablet } from "@/shared/hooks";
import { getLogoutUrl } from "@/shared/lib/auth-config";
import { useUIStore } from "@/shared/stores";
import { MAIN_SIDEBAR_WIDTH } from "@/widgets/sidebar/ui/MainSidebar";
import { pageNavItems } from "@/widgets/sidebar/ui/pageSidebarUtils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { t } = useTranslation("admin");
  const { toggleSidebar, selectedPageSidebarItem } = useUIStore();
  const { user } = useAuthStore();

  const handleLogout = () => {
    window.location.href = getLogoutUrl("/admin");
  };
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Check if page sidebar should be visible (has navigation items for selected page)
  const hasPageSidebar =
    selectedPageSidebarItem && pageNavItems[selectedPageSidebarItem];

  const mainSidebarWidth = isMobile || isTablet ? 0 : MAIN_SIDEBAR_WIDTH;
  const pageSidebarWidth = hasPageSidebar ? 214 : 0;
  const totalSidebarWidth = mainSidebarWidth + pageSidebarWidth;

  return (
    <header
      className={`fixed top-0 right-0 z-50 h-16 bg-white border-b border-border/50 flex items-center justify-between px-6 transition-all duration-300 ease-in-out ${className || ""}`}
      style={{ left: `${totalSidebarWidth}px` }}
    >
      <div className="flex items-center gap-4">
        {(isMobile || isTablet) && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label={t("aria.toggleSidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:border-transparent hover:bg-gray-100 data-[state=open]:bg-gray-200 transition-colors h-auto min-h-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label={t("aria.userMenu")}
            >
              <div
                className="size-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 transition-colors group-hover:bg-gray-200 group-data-[state=open]:bg-gray-50"
                aria-hidden
              >
                <User className="size-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-start text-left min-w-0">
                <span className="text-sm font-semibold text-foreground leading-tight truncate max-w-[180px]">
                  {user?.email?.split("@")[0] || t("labels.userFallback")}
                </span>
                <span className="text-xs text-muted-foreground leading-tight truncate max-w-[180px]">
                  {user?.email || ""}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="min-w-40 rounded-lg border border-border bg-white p-1.5 shadow-lg"
          >
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="cursor-pointer rounded-md px-3 py-2.5 text-sm font-medium focus:bg-destructive/10 focus:text-destructive"
            >
              <span>{t("buttons.logOut")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
