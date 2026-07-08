import { lazy } from "react";

import { ROUTES } from "@/shared/lib/paths";
import type { RouteConfig } from "@/shared/types/route-config";

/**
 * Agency-related routes (agency groups, agencies, agents).
 * Used by routes.config. Keeps route definitions colocated by domain.
 */
export const AGENCIES_ROUTES: RouteConfig[] = [
  {
    path: ROUTES.AGENCY_GROUPS_CREATE,
    element: lazy(() =>
      import("@/pages/CreateNewAgencyGroupPage").then((m) => ({
        default: m.CreateNewAgencyGroupPage,
      }))
    ),
    releaseId: "agency-groups",
  },
  {
    path: ROUTES.AGENCY_GROUPS_DETAIL,
    element: lazy(() =>
      import("@/pages/AgencyGroupDetailPage").then((m) => ({
        default: m.AgencyGroupDetailPage,
      }))
    ),
    releaseId: "agency-groups",
  },
  {
    path: ROUTES.AGENCIES_CREATE,
    element: lazy(() =>
      import("@/pages/CreateNewAgencyPage").then((m) => ({
        default: m.CreateNewAgencyPage,
      }))
    ),
    releaseId: "agencies",
  },
  {
    path: ROUTES.AGENCIES_DETAIL,
    element: lazy(() =>
      import("@/pages/AgencyDetailPage").then((m) => ({
        default: m.AgencyDetailPage,
      }))
    ),
    releaseId: "agencies",
  },
  {
    path: ROUTES.AGENTS_CREATE,
    element: lazy(() =>
      import("@/pages/CreateNewAgentPage").then((m) => ({
        default: m.CreateNewAgentPage,
      }))
    ),
    releaseId: "agents",
  },
  {
    path: ROUTES.AGENTS_DETAIL,
    element: lazy(() =>
      import("@/pages/AgentDetailPage").then((m) => ({
        default: m.AgentDetailPage,
      }))
    ),
    releaseId: "agents",
  },
];
