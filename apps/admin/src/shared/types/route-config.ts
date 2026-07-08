import type React from "react";

import type { ReleaseId } from "@/shared/lib/release-flags";

export interface RouteConfig {
  path: string;
  element:
    | React.ReactNode
    | React.ComponentType
    | React.LazyExoticComponent<React.ComponentType>;
  /** Optional route chunk preload used by the initial boot gate. */
  preload?: () => Promise<unknown>;
  releaseId?: ReleaseId;
  breadcrumbName?: string;
  children?: RouteConfig[];
  /** When true, route is public (e.g. login) - no ProtectedRoute wrapper. */
  public?: boolean;
  /** When false, skip MainLayout (e.g. login page). Default true for protected routes. */
  layout?: boolean;
}
