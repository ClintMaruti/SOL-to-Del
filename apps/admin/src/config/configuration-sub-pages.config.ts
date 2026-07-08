import { Settings, TrendingUp, Users } from "lucide-react";
import { lazy } from "react";

import { ROUTES } from "@/shared/lib/paths";

/**
 * Configuration → settings sub-pages (Future Uplift, placeholders).
 * Used by routes.config and pageSidebarUtils.
 */
export const CONFIGURATION_SUB_PAGES = [
  {
    id: "future-uplift",
    path: ROUTES.CONFIGURATION_SETTINGS_FUTURE_UPLIFT,
    labelKey: "sidebar.futureUplift",
    icon: TrendingUp,
    page: lazy(() =>
      import("@/pages/FutureUpliftPage").then((m) => ({
        default: m.FutureUpliftPage,
      }))
    ),
  },
  {
    id: "system-settings",
    path: ROUTES.CONFIGURATION_SETTINGS_SYSTEM,
    labelKey: "sidebar.systemSettings",
    icon: Settings,
    page: lazy(() =>
      import("@/pages/ConfigurationPlaceholderPage").then((m) => ({
        default: m.ConfigurationPlaceholderPage,
      }))
    ),
  },
  {
    id: "user-management",
    path: ROUTES.CONFIGURATION_SETTINGS_USERS,
    labelKey: "sidebar.userManagement",
    icon: Users,
    page: lazy(() =>
      import("@/pages/ConfigurationPlaceholderPage").then((m) => ({
        default: m.ConfigurationPlaceholderPage,
      }))
    ),
  },
] as const;

export type ConfigurationSubPageId =
  (typeof CONFIGURATION_SUB_PAGES)[number]["id"];
