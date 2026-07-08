import navDatabaseLayersUrl from "@sol/ui/assets/NavDatabaseLayers.svg";
import navDatabaseVectorUrl from "@sol/ui/assets/NavDatabaseVector.svg";
import navItineraryUrl from "@sol/ui/assets/NavItinerary.svg";
import navSettingsUrl from "@sol/ui/assets/NavSettings.svg";
import solLogoUrl from "@sol/ui/assets/SolLogo.svg";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { CONFIGURATION_SUB_PAGES } from "@/config/configuration-sub-pages.config";
import { useIsMobile, useIsTablet } from "@/shared/hooks";
import { getNavPath } from "@/shared/lib/paths";
import { useUIStore } from "@/shared/stores";

export const MAIN_SIDEBAR_WIDTH = 88;

function DatabaseIcon() {
  return (
    <div className="relative size-8 overflow-clip shrink-0">
      <div className="absolute inset-[33.54%_3.53%_1.64%_3.66%]">
        <img
          alt=""
          className="absolute inset-0 block size-full max-w-none"
          src={navDatabaseLayersUrl}
        />
      </div>
      <div className="absolute inset-[0_1.87%_0_2.01%]">
        <img
          alt=""
          className="absolute inset-0 block size-full max-w-none"
          src={navDatabaseVectorUrl}
        />
      </div>
    </div>
  );
}

function ItineraryIcon() {
  return (
    <div className="relative size-8 overflow-clip shrink-0">
      <div className="absolute inset-[3.13%_3.12%_3.12%_3.12%]">
        <img
          alt=""
          className="absolute inset-0 block size-full max-w-none"
          src={navItineraryUrl}
        />
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <div className="relative size-8 overflow-clip shrink-0">
      <div className="absolute inset-[3.13%_3.13%_3.13%_3.12%]">
        <img
          alt=""
          className="absolute inset-0 block size-full max-w-none"
          src={navSettingsUrl}
        />
      </div>
    </div>
  );
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  pageSidebarKey: string;
  navigateTo: () => string;
}

export function MainSidebar({ className }: { className?: string }) {
  const { t } = useTranslation("admin");
  const {
    selectedMainSidebarItem,
    setSelectedMainSidebarItem,
    setSelectedPageSidebarItem,
    sidebarOpen,
    setSidebarOpen,
  } = useUIStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const isOverlay = isMobile || isTablet;
  const isVisible = isOverlay ? sidebarOpen : true;

  const topItems: NavItem[] = [
    {
      id: "database",
      label: t("sidebar.database"),
      icon: DatabaseIcon,
      pageSidebarKey: "destinations",
      navigateTo: () => getNavPath("database", "destinations", "destinations"),
    },
    {
      id: "itinerary",
      label: t("sidebar.itinerary"),
      icon: ItineraryIcon,
      pageSidebarKey: "itineraries",
      navigateTo: () => getNavPath("itinerary", "itineraries", "itineraries"),
    },
  ];

  const settingsItem: NavItem = {
    id: "configuration",
    label: t("sidebar.configurationSettings"),
    icon: SettingsIcon,
    pageSidebarKey: "settings",
    navigateTo: () => {
      const first = CONFIGURATION_SUB_PAGES[0];
      return first
        ? getNavPath("configuration", "settings", first.id)
        : "/admin";
    },
  };

  const handleClick = (item: NavItem) => {
    if (isOverlay) setSidebarOpen(false);
    setSelectedMainSidebarItem(item.id);
    setSelectedPageSidebarItem(item.pageSidebarKey);
    navigate(item.navigateTo());
  };

  if (!isVisible) return null;

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = selectedMainSidebarItem === item.id;
    return (
      <button
        key={item.id}
        onClick={() => handleClick(item)}
        className={`
          flex flex-col items-center gap-2 p-2 rounded-md
          cursor-pointer transition-colors w-[72px]
          ${isActive ? "bg-[#e5e7eb]" : "hover:bg-[#f3f4f6]"}
        `}
        aria-label={item.label}
      >
        <Icon />
        <span className="text-[12px] font-semibold leading-[14px] text-center text-[#171717] w-full">
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <>
      {isOverlay && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        data-main-sidebar
        className={`
          fixed top-0 left-0 z-40
          bg-[#f9fafb] border-r border-[#e5e7eb]
          flex flex-col
          ${isOverlay && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
          transition-transform duration-300 ease-in-out
          ${className || ""}
        `}
        style={{
          width: `${MAIN_SIDEBAR_WIDTH}px`,
          height: "calc(100vh - var(--layout-reserved-footer-height, 0px))",
        }}
      >
        {/* Header: logo + SOL */}
        <div className="flex flex-col items-center gap-2 bg-[#f9fafb] border-b border-[#e5e7eb] p-2 shrink-0">
          <div className="relative h-[29px] w-8 shrink-0 overflow-hidden">
            <img
              alt="SOL"
              className="absolute inset-0 block size-full max-w-none"
              src={solLogoUrl}
            />
          </div>
          <span className="text-[14px] font-bold leading-5 text-[#931115] text-center">
            SOL
          </span>
        </div>

        {/* Nav items */}
        <div className="flex flex-col items-center justify-between flex-1 px-2 py-4">
          <div className="flex flex-col gap-2 w-full">
            {topItems.map(renderItem)}
          </div>
          {renderItem(settingsItem)}
        </div>
      </aside>
    </>
  );
}
