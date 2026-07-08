import { lazy } from "react";

import { ROUTES } from "@/shared/lib/paths";
import { createPreloadableLazy } from "@/shared/lib/preloadable-lazy";
import type { RouteConfig } from "@/shared/types/route-config";

const supplierServiceDetailRoute = createPreloadableLazy(() =>
  import("@/pages/SupplierServiceDetailPage").then((m) => ({
    default: m.SupplierServiceDetailPage,
  }))
);

/**
 * Supplier-related routes (suppliers, contracts, services, head offices).
 * Used by routes.config. Keeps route definitions colocated by domain.
 */
export const SUPPLIERS_ROUTES: RouteConfig[] = [
  {
    path: ROUTES.SUPPLIERS_CREATE,
    element: lazy(() =>
      import("@/pages/CreateSupplierPage").then((m) => ({
        default: m.CreateSupplierPage,
      }))
    ),
    releaseId: "suppliers",
  },
  {
    path: ROUTES.SUPPLIERS_DETAIL,
    element: lazy(() =>
      import("@/pages/SupplierDetailPage").then((m) => ({
        default: m.SupplierDetailPage,
      }))
    ),
    releaseId: "suppliers",
  },
  {
    path: ROUTES.SUPPLIER_CONTENT_BLOCK_DETAIL,
    element: lazy(() =>
      import("@/pages/SupplierContentBlockPage").then((m) => ({
        default: m.SupplierContentBlockPage,
      }))
    ),
    releaseId: "suppliers",
  },
  {
    path: ROUTES.SUPPLIER_CONTRACT_DETAIL,
    element: lazy(() =>
      import("@/pages/ContractConfigurationPage").then((m) => ({
        default: m.ContractConfigurationPage,
      }))
    ),
    releaseId: "suppliers",
  },
  {
    path: ROUTES.SUPPLIER_SERVICE_DETAIL,
    element: supplierServiceDetailRoute.element,
    preload: supplierServiceDetailRoute.preload,
    releaseId: "suppliers",
  },
  {
    path: ROUTES.SUPPLIER_EXTRA_DETAIL,
    element: lazy(() =>
      import("@/pages/SupplierExtraDetailPage").then((m) => ({
        default: m.SupplierExtraDetailPage,
      }))
    ),
    releaseId: "suppliers",
  },
  {
    path: ROUTES.SUPPLIER_HEAD_OFFICES_CREATE,
    element: lazy(() =>
      import("@/pages/CreateSupplierHeadOfficePage").then((m) => ({
        default: m.CreateSupplierHeadOfficePage,
      }))
    ),
    releaseId: "supplier-head-offices",
  },
  {
    path: ROUTES.SUPPLIER_HEAD_OFFICES_DETAIL,
    element: lazy(() =>
      import("@/pages/SupplierHeadOfficeDetailPage").then((m) => ({
        default: m.SupplierHeadOfficeDetailPage,
      }))
    ),
    releaseId: "supplier-head-offices",
  },
  {
    path: ROUTES.SUPPLIER_HEAD_OFFICE_PROMOTION_CREATE,
    element: lazy(() =>
      import("@/pages/PromotionConfigurationPage").then((m) => ({
        default: m.PromotionConfigurationPage,
      }))
    ),
    releaseId: "supplier-head-offices",
  },
  {
    path: ROUTES.SUPPLIER_HEAD_OFFICE_PROMOTION_DETAIL,
    element: lazy(() =>
      import("@/pages/PromotionConfigurationPage").then((m) => ({
        default: m.PromotionConfigurationPage,
      }))
    ),
    releaseId: "supplier-head-offices",
  },
];
