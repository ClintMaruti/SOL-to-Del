import { lazy } from "react";

import { ROUTES } from "@/shared/lib/paths";
import type { RouteConfig } from "@/shared/types/route-config";

export const CONTENT_ROUTES: RouteConfig[] = [
  {
    path: ROUTES.DATABASE_CONTENT_BLOCK_CREATE,
    element: lazy(() =>
      import("@/pages/ContentBlockDetailPage").then((m) => ({
        default: m.ContentBlockDetailPage,
      }))
    ),
  },
  {
    path: ROUTES.DATABASE_CONTENT_BLOCK_DETAIL,
    element: lazy(() =>
      import("@/pages/ContentBlockDetailPage").then((m) => ({
        default: m.ContentBlockDetailPage,
      }))
    ),
  },
  {
    path: ROUTES.DATABASE_DOCUMENT_TEMPLATE_DETAIL,
    element: lazy(() =>
      import("@/pages/DocumentTemplateDetailPage").then((m) => ({
        default: m.DocumentTemplateDetailPage,
      }))
    ),
  },
];
