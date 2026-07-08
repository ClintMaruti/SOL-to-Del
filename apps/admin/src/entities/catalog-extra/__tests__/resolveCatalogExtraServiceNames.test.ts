import { describe, expect, it } from "vitest";

import type { CatalogExtra } from "../model/types";
import { resolveCatalogExtraServiceNames } from "../lib/resolveCatalogExtraServiceNames";

describe("resolveCatalogExtraServiceNames", () => {
  it("fills serviceName from map when API omits it (supplier extras list)", () => {
    const extras: CatalogExtra[] = [
      {
        id: "019d8ad3-992b-72ce-9e45-470e6e58e4d0",
        title: "Dinner",
        serviceId: "019d4817-8e30-718d-ba9f-643b8f91449f",
        description: "Some",
        isActive: true,
        serviceName: "",
      },
    ];
    const map = new Map<string, string>([
      ["019d4817-8e30-718d-ba9f-643b8f91449f", "Safari Lodge"],
    ]);

    expect(resolveCatalogExtraServiceNames(extras, map)).toEqual([
      {
        ...extras[0],
        serviceName: "Safari Lodge",
      },
    ]);
  });

  it("keeps API serviceName when already set", () => {
    const extras: CatalogExtra[] = [
      {
        id: "1",
        title: "X",
        serviceId: "s1",
        serviceName: "From API",
        description: null,
        isActive: true,
      },
    ];
    const map = new Map([["s1", "From Map"]]);

    expect(resolveCatalogExtraServiceNames(extras, map)[0].serviceName).toBe(
      "From API"
    );
  });
});
