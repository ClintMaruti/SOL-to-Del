import { describe, expect, it } from "vitest";

import type { CatalogExtraDetail } from "@/entities/catalog-extra";

import {
  editExtraSubmitSchema,
  extraDetailToFormValues,
  extraDetailToFormValuesAfterPut,
  isContractedExtraConfigured,
} from "../schema";

describe("extraDetailToFormValues", () => {
  it("uses empty contracted defaults when API omits contractedExtra block", () => {
    const detail: CatalogExtraDetail = {
      id: "019d6f02-e952-7bc4-b34e-fc04d8bda113",
      title: "EXT1",
      serviceId: "019d6747-982b-7986-b70c-79ab3a36c63b",
      serviceName: "SS1",
      description: "EXTD",
      isActive: false,
      notes: null,
      version: 850,
    };
    const values = extraDetailToFormValues(detail);
    expect(values.title).toBe("EXT1");
    expect(values.serviceIds).toEqual([detail.serviceId]);
    expect(values.notes.text).toBe("");
    expect(values.contracted.contractId).toBe("");
    expect(values.contracted.travelDates).toHaveLength(1);
  });

  it("uses empty contracted defaults when contractedExtra is a placeholder without server id", () => {
    const detail: CatalogExtraDetail = {
      id: "e-partial",
      title: "T",
      serviceId: "s1",
      serviceName: "Sn",
      description: null,
      isActive: true,
      version: 1,
      notes: null,
      contractedExtra: {} as CatalogExtraDetail["contractedExtra"],
    };
    const values = extraDetailToFormValues(detail);
    expect(values.contracted.contractId).toBe("");
    expect(values.contracted.contractedExtraId).toBeNull();
  });

  it("does not map contractedExtra on initial GET-style detail (user selects contract first)", () => {
    const detail: CatalogExtraDetail = {
      id: "e1",
      title: "T",
      serviceId: "s1",
      serviceName: "Sn",
      description: null,
      isActive: true,
      version: 3,
      notes: { id: "n1", text: "Hello", version: 2 },
      contractedExtra: {
        id: "ce1",
        contractId: "c1",
        extraType: "Mandatory",
        chargeType: "Unit",
        timeUnit: "Day",
        travelFrom: "2025-02-01",
        travelTo: "2025-03-01",
        net: { amount: 10, currency: "USD" },
        rack: null,
        sell: { amount: 12, currency: "USD" },
        version: 5,
      },
    };
    const values = extraDetailToFormValues(detail);
    expect(values.notes).toEqual({
      id: "n1",
      text: "Hello",
      version: 2,
    });
    expect(values.contracted.contractedExtraId).toBeNull();
    expect(values.contracted.contractId).toBe("");
  });

  it("maps contractedExtra after PUT when the API returns a row", () => {
    const detail: CatalogExtraDetail = {
      id: "e1",
      title: "T",
      serviceId: "s1",
      serviceName: "Sn",
      description: null,
      isActive: true,
      version: 3,
      notes: { id: "n1", text: "Hello", version: 2 },
      contractedExtra: {
        id: "ce1",
        contractId: "c1",
        extraType: "Mandatory",
        chargeType: "Unit",
        timeUnit: "Day",
        travelFrom: "2025-02-01",
        travelTo: "2025-03-01",
        net: { amount: 10, currency: "USD" },
        rack: null,
        sell: { amount: 12, currency: "USD" },
        version: 5,
      },
    };
    const values = extraDetailToFormValuesAfterPut(detail);
    expect(values.contracted.contractedExtraId).toBe("ce1");
    expect(values.contracted.contractId).toBe("c1");
    expect(values.contracted.extraRequirement).toBe("mandatory");
  });
});

describe("editExtraSubmitSchema", () => {
  function basePayload() {
    const values = extraDetailToFormValues({
      id: "e1",
      title: "Extra A",
      serviceId: "service-1",
      serviceName: "Service",
      description: "Desc",
      isActive: true,
      notes: null,
      version: 1,
    });

    return {
      ...values,
      title: "Extra A",
      serviceIds: ["service-1"],
    };
  }

  it("allows submit without contracted extra configuration", () => {
    const result = editExtraSubmitSchema.safeParse(basePayload());
    expect(result.success).toBe(true);
  });

  it("allows submit when only contracted defaults differ but no contract is selected", () => {
    const payload = basePayload();
    payload.contracted.timeUnit = "day";

    const result = editExtraSubmitSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("requires contract fields once a contract is selected", () => {
    const payload = basePayload();
    payload.contracted.contractId = "contract-1";
    payload.contracted.validFrom = "";
    payload.contracted.validTo = "";

    const result = editExtraSubmitSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("contracted.validFrom");
      expect(paths).toContain("contracted.validTo");
    }
  });
});

describe("isContractedExtraConfigured", () => {
  it("returns false for untouched defaults", () => {
    const values = extraDetailToFormValues({
      id: "e1",
      title: "Extra A",
      serviceId: "service-1",
      serviceName: "Service",
      description: "Desc",
      isActive: true,
      notes: null,
      version: 1,
    });
    expect(isContractedExtraConfigured(values.contracted)).toBe(false);
  });

  it("returns true when a contract is selected", () => {
    const values = extraDetailToFormValues({
      id: "e1",
      title: "Extra A",
      serviceId: "service-1",
      serviceName: "Service",
      description: "Desc",
      isActive: true,
      notes: null,
      version: 1,
    });
    values.contracted.contractId = "contract-1";
    expect(isContractedExtraConfigured(values.contracted)).toBe(true);
  });

  it("returns false when only timeUnit differs from defaults without a contract", () => {
    const values = extraDetailToFormValues({
      id: "e1",
      title: "Extra A",
      serviceId: "service-1",
      serviceName: "Service",
      description: "Desc",
      isActive: true,
      notes: null,
      version: 1,
    });
    values.contracted.timeUnit = "day";
    expect(isContractedExtraConfigured(values.contracted)).toBe(false);
  });
});
