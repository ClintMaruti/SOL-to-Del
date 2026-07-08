import { describe, expect, it } from "vitest";

import { createSupplierCloseoutSubmitSchema } from "../model/schema";

const baseInput = {
  scope: "supplier" as const,
  travelDateFrom: "2026-06-01",
  travelDateTo: "2026-06-30",
  serviceId: "",
  serviceOptionId: "",
  reason: "",
};

describe("createSupplierCloseoutSubmitSchema", () => {
  const schema = createSupplierCloseoutSubmitSchema();

  it("submits supplier scope with null service and option", () => {
    const result = schema.parse({
      ...baseInput,
      reason: "  Rain Season  ",
    });

    expect(result).toEqual({
      travelDateFrom: "2026-06-01",
      travelDateTo: "2026-06-30",
      serviceId: null,
      serviceOptionId: null,
      reason: "Rain Season",
    });
  });

  it("converts empty reason to null", () => {
    const result = schema.parse({
      ...baseInput,
      reason: "   ",
    });

    expect(result.reason).toBeNull();
  });

  it("allows same-day inclusive closeouts", () => {
    const result = schema.parse({
      ...baseInput,
      travelDateFrom: "2026-06-01",
      travelDateTo: "2026-06-01",
    });

    expect(result.travelDateFrom).toBe("2026-06-01");
    expect(result.travelDateTo).toBe("2026-06-01");
  });

  it("blocks From after To", () => {
    expect(() =>
      schema.parse({
        ...baseInput,
        travelDateFrom: "2026-07-01",
        travelDateTo: "2026-06-01",
      })
    ).toThrow();
  });

  it("requires service for service scope", () => {
    expect(() =>
      schema.parse({
        ...baseInput,
        scope: "service",
      })
    ).toThrow();
  });

  it("submits service scope with ALL options as null", () => {
    const result = schema.parse({
      ...baseInput,
      scope: "service",
      serviceId: "svc-1",
      serviceOptionId: "",
    });

    expect(result.serviceId).toBe("svc-1");
    expect(result.serviceOptionId).toBeNull();
  });

  it("submits selected option id for option scope", () => {
    const result = schema.parse({
      ...baseInput,
      scope: "service",
      serviceId: "svc-1",
      serviceOptionId: "opt-1",
    });

    expect(result.serviceId).toBe("svc-1");
    expect(result.serviceOptionId).toBe("opt-1");
  });
});
