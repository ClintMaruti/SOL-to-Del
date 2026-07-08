import {
  BringToFront,
  Building,
  Building2,
  FileText,
  MapPin,
  Package,
  Percent,
  Users,
} from "lucide-react";
import { lazy } from "react";

import { ROUTES } from "@/shared/lib/paths";

/**
 * Single source of truth for database/destinations sub-pages.
 * Used by: routes.config, pageSidebarUtils, release-flags.
 * Adding a new sub-page = one entry here + page component.
 */
export const DESTINATIONS_SUB_PAGES = [
  {
    id: "destinations",
    path: ROUTES.DESTINATIONS,
    releaseId: "destinations" as const,
    labelKey: "sidebar.destination",
    icon: MapPin,
    page: lazy(() =>
      import("@/pages/DestinationsPage").then((m) => ({
        default: m.DestinationsPage,
      }))
    ),
  },
  {
    id: "agency-groups",
    path: ROUTES.AGENCY_GROUPS,
    releaseId: "agency-groups" as const,
    labelKey: "sidebar.agencyGroups",
    icon: BringToFront,
    page: lazy(() =>
      import("@/pages/AgencyGroupsPage").then((m) => ({
        default: m.AgencyGroupsPage,
      }))
    ),
  },
  {
    id: "agencies",
    path: ROUTES.AGENCIES,
    releaseId: "agencies" as const,
    labelKey: "sidebar.agencies",
    icon: Building2,
    page: lazy(() =>
      import("@/pages/AgenciesPage").then((m) => ({
        default: m.AgenciesPage,
      }))
    ),
  },
  {
    id: "agents",
    path: ROUTES.AGENTS,
    releaseId: "agents" as const,
    labelKey: "sidebar.agents",
    icon: Users,
    page: lazy(() =>
      import("@/pages/AgentsPage").then((m) => ({
        default: m.AgentsPage,
      }))
    ),
  },
  {
    id: "supplier-head-offices",
    path: ROUTES.SUPPLIER_HEAD_OFFICES,
    releaseId: "supplier-head-offices" as const,
    labelKey: "sidebar.headOffices",
    icon: Building,
    page: lazy(() =>
      import("@/pages/SupplierHeadOfficePage").then((m) => ({
        default: m.SupplierHeadOfficePage,
      }))
    ),
  },
  {
    id: "suppliers",
    path: ROUTES.SUPPLIERS,
    releaseId: "suppliers" as const,
    labelKey: "sidebar.suppliers",
    icon: Package,
    page: lazy(() =>
      import("@/pages/SuppliersPage").then((m) => ({
        default: m.SuppliersPage,
      }))
    ),
  },
  {
    id: "margin-rules",
    path: ROUTES.MARGIN_RULES,
    releaseId: "margin-rules" as const,
    labelKey: "sidebar.marginRules",
    icon: Percent,
    page: lazy(() =>
      import("@/pages/MarginRulesPage").then((m) => ({
        default: m.MarginRulesPage,
      }))
    ),
  },
  {
    id: "content",
    path: ROUTES.DATABASE_CONTENT,
    releaseId: "content" as const,
    labelKey: "sidebar.content",
    icon: FileText,
    page: lazy(() =>
      import("@/pages/ContentPage").then((m) => ({
        default: m.ContentPage,
      }))
    ),
  },
] as const;

export type DestinationsSubPageId =
  (typeof DESTINATIONS_SUB_PAGES)[number]["id"];
export type DestinationsReleaseId =
  (typeof DESTINATIONS_SUB_PAGES)[number]["releaseId"];
