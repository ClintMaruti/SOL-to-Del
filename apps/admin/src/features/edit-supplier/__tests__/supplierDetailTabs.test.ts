import { describe, expect, it } from "vitest";

import { SUPPLIER_DETAIL_TABS } from "../model/types";

describe("SUPPLIER_DETAIL_TABS", () => {
  it("matches the supplier detail tab order", () => {
    expect(SUPPLIER_DETAIL_TABS.map((tab) => tab.value)).toEqual([
      "overview",
      "configuration",
      "contracts",
      "services",
      "extras",
      "content",
      "notes",
      "logs",
    ]);
  });

  it("does not include the old rates, discounts, and policies tabs", () => {
    expect(SUPPLIER_DETAIL_TABS.map((tab) => tab.value)).not.toEqual(
      expect.arrayContaining(["rates", "discounts", "policies"])
    );
  });
});
