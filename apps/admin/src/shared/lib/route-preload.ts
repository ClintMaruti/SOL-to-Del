import { matchPath } from "react-router-dom";

import { routes } from "@/config/routes.config";
import type { RouteConfig } from "@/shared/types/route-config";

export type RoutePreload = NonNullable<RouteConfig["preload"]>;

export function findRoutePreload(
  pathname: string,
  routeList: readonly RouteConfig[] = routes
): RoutePreload | null {
  for (const route of routeList) {
    if (route.preload && matchPath({ path: route.path, end: true }, pathname)) {
      return route.preload;
    }

    if (route.children) {
      const childPreload = findRoutePreload(pathname, route.children);
      if (childPreload) {
        return childPreload;
      }
    }
  }

  return null;
}

export async function preloadRoute(pathname: string): Promise<void> {
  const preload = findRoutePreload(pathname);
  if (preload) {
    await preload();
  }
}
