import { describe, expect, it } from "vitest";

import { contractValidityFromCatalog } from "../contract-validity-from-catalog";

describe("contractValidityFromCatalog", () => {
  const contracts = [
    { id: "c1", name: "A", validFrom: "2026-01-01", validTo: "2026-12-31" },
  ];

  it("returns validity for matching contract id", () => {
    expect(contractValidityFromCatalog(contracts, "c1")).toEqual({
      validFrom: "2026-01-01",
      validTo: "2026-12-31",
    });
  });

  it("returns empty strings when contract is not found", () => {
    expect(contractValidityFromCatalog(contracts, "missing")).toEqual({
      validFrom: "",
      validTo: "",
    });
  });
});
