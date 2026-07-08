import { describe, expect, it } from "vitest";

import { normalizeSupplierCloseout } from "../model/types";

describe("normalizeSupplierCloseout", () => {
  it("normalizes canonical backend status into isActive", () => {
    expect(
      normalizeSupplierCloseout({
        id: "cl-1",
        supplierId: "sup-1",
        travelDateFrom: "2026-06-01",
        travelDateTo: "2026-06-30",
        status: "Active",
      }).isActive
    ).toBe(true);

    expect(
      normalizeSupplierCloseout({
        id: "cl-2",
        supplierId: "sup-1",
        travelDateFrom: "2026-07-01",
        travelDateTo: "2026-07-31",
        status: "Inactive",
      }).isActive
    ).toBe(false);
  });

  it("tolerates legacy isActive when status is absent", () => {
    const result = normalizeSupplierCloseout({
      id: "cl-1",
      supplierId: "sup-1",
      travelDateFrom: "2026-06-01",
      travelDateTo: "2026-06-30",
      isActive: true,
    });

    expect(result.status).toBe("Active");
    expect(result.isActive).toBe(true);
  });

  it("marks service-level null option as ALL for display", () => {
    const result = normalizeSupplierCloseout({
      id: "cl-1",
      supplierId: "sup-1",
      serviceId: "svc-1",
      serviceName: "Camp",
      serviceOptionId: null,
      travelDateFrom: "2026-06-01",
      travelDateTo: "2026-06-30",
      status: "Inactive",
    });

    expect(result.serviceId).toBe("svc-1");
    expect(result.serviceOptionId).toBeNull();
    expect(result.serviceOptionName).toBe("ALL");
  });

  it("trims reason and converts empty reason to null", () => {
    expect(
      normalizeSupplierCloseout({
        id: "cl-1",
        supplierId: "sup-1",
        travelDateFrom: "2026-06-01",
        travelDateTo: "2026-06-30",
        reason: "  Maintenance  ",
      }).reason
    ).toBe("Maintenance");

    expect(
      normalizeSupplierCloseout({
        id: "cl-2",
        supplierId: "sup-1",
        travelDateFrom: "2026-06-01",
        travelDateTo: "2026-06-30",
        reason: "   ",
      }).reason
    ).toBeNull();
  });
});
