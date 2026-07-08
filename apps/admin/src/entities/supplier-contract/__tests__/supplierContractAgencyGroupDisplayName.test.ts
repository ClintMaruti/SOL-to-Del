import { describe, expect, it } from "vitest";

import { getSupplierContractAgencyGroupDisplayName } from "../model/types";

describe("getSupplierContractAgencyGroupDisplayName", () => {
  it("uses agencyGroupName from the contract response before agencyGroupId", () => {
    expect(
      getSupplierContractAgencyGroupDisplayName({
        agencyGroupId: "019cbe03-2b86-7940-9244-b600074cd0b0",
        agencyGroupName: "Elewana Lodges & Camps",
      })
    ).toBe("Elewana Lodges & Camps");
  });

  it("falls back to ANY only when the contract has no agency group name or id", () => {
    expect(
      getSupplierContractAgencyGroupDisplayName({
        agencyGroupId: null,
        agencyGroupName: null,
      })
    ).toBe("ANY");
  });
});
