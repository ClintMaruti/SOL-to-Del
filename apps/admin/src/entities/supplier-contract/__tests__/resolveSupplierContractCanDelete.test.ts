import { describe, expect, it } from "vitest";

import type { SupplierContract } from "../model/types";
import { resolveSupplierContractCanDelete } from "../model/resolveSupplierContractCanDelete";

const baseContract = (): SupplierContract => ({
  id: "c1",
  name: "Test",
  link: null,
  validFrom: "2026-01-01",
  validTo: "2026-12-31",
  isActive: false,
});

describe("resolveSupplierContractCanDelete", () => {
  it("returns false when API explicitly denies delete", () => {
    expect(
      resolveSupplierContractCanDelete({
        ...baseContract(),
        canDelete: false,
      })
    ).toBe(false);
  });

  it("returns true when API explicitly allows delete and derived rules pass", () => {
    expect(
      resolveSupplierContractCanDelete({
        ...baseContract(),
        canDelete: true,
        policies: [],
      })
    ).toBe(true);
  });

  it("allows delete when flag is omitted and there are no policies", () => {
    expect(
      resolveSupplierContractCanDelete({
        ...baseContract(),
        policies: [],
      })
    ).toBe(true);
  });

  it("denies delete when flag is omitted but policies exist", () => {
    expect(
      resolveSupplierContractCanDelete({
        ...baseContract(),
        policies: [
          {
            id: "p1",
            policyName: "Std",
          },
        ],
      })
    ).toBe(false);
  });
});
