import React, { lazy } from "react";
import { Navigate } from "react-router-dom";

import { AGENCIES_ROUTES } from "@/config/agencies-routes.config";
import { CONTENT_ROUTES } from "@/config/content-routes.config";
import { CONFIGURATION_SUB_PAGES } from "@/config/configuration-sub-pages.config";
import { DESTINATIONS_SUB_PAGES } from "@/config/destinations-sub-pages.config";
import { SUPPLIERS_ROUTES } from "@/config/suppliers-routes.config";
import { ROUTES } from "@/shared/lib/paths";
import type { RouteConfig } from "@/shared/types/route-config";

/** Destinations list page routes generated from config */
const destinationsListRoutes: RouteConfig[] = DESTINATIONS_SUB_PAGES.map(
  (s) => ({
    path: s.path,
    element: s.page,
    releaseId: s.releaseId,
  })
);

const configurationListRoutes: RouteConfig[] = CONFIGURATION_SUB_PAGES.map(
  (s) => ({
    path: s.path,
    element: s.page,
  })
);

export const routes: RouteConfig[] = [
  {
    path: ROUTES.LOGIN,
    element: lazy(() =>
      import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
    ),
    public: true,
    layout: false,
  },
  {
    path: ROUTES.HOME,
    element: React.createElement(Navigate, {
      to: ROUTES.DESTINATIONS,
      replace: true,
    }),
  },
  {
    path: ROUTES.DATABASE,
    element: lazy(() =>
      import("@/pages/DatabasePage").then((m) => ({ default: m.DatabasePage }))
    ),
  },
  {
    path: ROUTES.DATABASE_DESTINATIONS,
    element: lazy(() =>
      import("@/pages/DestinationsPage").then((m) => ({
        default: m.DestinationsPage,
      }))
    ),
    releaseId: "destinations",
  },
  ...destinationsListRoutes,
  ...configurationListRoutes,
  ...AGENCIES_ROUTES,
  ...SUPPLIERS_ROUTES,
  {
    path: ROUTES.DATABASE_DESTINATIONS_INNER,
    element: lazy(() =>
      import("@/pages/DestinationsPage").then((m) => ({
        default: m.DestinationsPage,
      }))
    ),
  },
  {
    path: ROUTES.DATABASE_SERVICE_TYPES,
    element: lazy(() =>
      import("@/pages/ServiceTypesPage").then((m) => ({
        default: m.ServiceTypesPage,
      }))
    ),
  },
  {
    path: ROUTES.DATABASE_RATE_TYPES,
    element: lazy(() =>
      import("@/pages/RateTypesPage").then((m) => ({
        default: m.RateTypesPage,
      }))
    ),
  },
  {
    path: ROUTES.DATABASE_SOURCE_MARKET,
    element: lazy(() =>
      import("@/pages/SourceMarketPage").then((m) => ({
        default: m.SourceMarketPage,
      }))
    ),
  },
  {
    path: ROUTES.DATABASE_DOCUMENTS,
    element: lazy(() =>
      import("@/pages/DocumentsPage").then((m) => ({
        default: m.DocumentsPage,
      }))
    ),
  },
  ...CONTENT_ROUTES,
  {
    path: ROUTES.DATABASE_LOG,
    element: lazy(() =>
      import("@/pages/LogPage").then((m) => ({
        default: m.LogPage,
      }))
    ),
  },
  {
    path: ROUTES.ITINERARY_ITINERARIES,
    element: React.createElement(Navigate, {
      to: ROUTES.ITINERARY_ITINERARIES_LIST,
      replace: true,
    }),
  },
  {
    path: ROUTES.ITINERARY_ITINERARIES_INNER,
    element: lazy(() =>
      import("@/pages/ItinerariesPage").then((m) => ({
        default: m.ItinerariesPage,
      }))
    ),
  },
  {
    path: ROUTES.ITINERARY_DETAIL,
    element: lazy(() =>
      import("@/pages/ItineraryDetailPage").then((m) => ({
        default: m.ItineraryDetailPage,
      }))
    ),
  },
  {
    path: "*",
    element: lazy(() =>
      import("@/pages/NotFoundPage").then((m) => ({
        default: m.NotFoundPage,
      }))
    ),
  },
];
