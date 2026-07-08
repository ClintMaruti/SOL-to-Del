import { describe, expect, it } from "vitest";

import { normalizeCatalogExtraListItem } from "../lib/normalizeCatalogExtraListItem";

describe("normalizeCatalogExtraListItem", () => {
  it("maps BE linkedServices summary into linkedServicesOptions", () => {
    const row = normalizeCatalogExtraListItem({
      id: "e1",
      supplierId: "sup-1",
      title: "Lunch",
      linkedServices: [
        { id: "s1", name: "Camp", isActive: true },
        { id: "s2", name: "Drive", isActive: true },
      ],
      description: null,
      isActive: true,
    });

    expect(row.linkedServicesOptions).toEqual([
      {
        serviceId: "s1",
        serviceName: "Camp",
        serviceOptionId: null,
        serviceOptionName: null,
      },
      {
        serviceId: "s2",
        serviceName: "Drive",
        serviceOptionId: null,
        serviceOptionName: null,
      },
    ]);
  });
});
