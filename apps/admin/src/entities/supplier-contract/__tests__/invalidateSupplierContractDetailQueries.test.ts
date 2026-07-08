import { describe, expect, it } from "vitest";

import { isSupplierContractDetailQueryKey } from "../api/invalidateSupplierContractDetailQueries";

describe("isSupplierContractDetailQueryKey", () => {
  it("returns true for contract detail keys with null supplier id", () => {
    expect(
      isSupplierContractDetailQueryKey(
        ["supplier-contracts", null, "c-1"],
        "c-1"
      )
    ).toBe(true);
  });

  it("returns true for contract detail keys with a supplier id", () => {
    expect(
      isSupplierContractDetailQueryKey(
        ["supplier-contracts", "sup-1", "c-1"],
        "c-1"
      )
    ).toBe(true);
  });

  it("returns false for a different contract id", () => {
    expect(
      isSupplierContractDetailQueryKey(
        ["supplier-contracts", null, "c-1"],
        "c-2"
      )
    ).toBe(false);
  });

  it("returns false for supplier contract list key (length 2)", () => {
    expect(
      isSupplierContractDetailQueryKey(["supplier-contracts", "sup-1"], "c-1")
    ).toBe(false);
  });
});
