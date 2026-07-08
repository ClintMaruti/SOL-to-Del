import { describe, expect, it } from "vitest";

import { SUPPLIERS_ROUTES } from "@/config/suppliers-routes.config";
import { ROUTES } from "@/shared/lib/paths";
import { findRoutePreload } from "@/shared/lib/route-preload";

describe("findRoutePreload", () => {
  it("returns the supplier service detail preload for matching paths", () => {
    const supplierServiceRoute = SUPPLIERS_ROUTES.find(
      (route) => route.path === ROUTES.SUPPLIER_SERVICE_DETAIL
    );

    const preload = findRoutePreload(
      "/database/destinations/suppliers/sup-1/services/service-1"
    );

    expect(preload).toBe(supplierServiceRoute?.preload);
  });

  it("returns null for routes without an initial preload", () => {
    expect(findRoutePreload("/database/destinations/suppliers")).toBeNull();
  });
});
