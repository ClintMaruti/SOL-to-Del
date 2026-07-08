import { describe, expect, it } from "vitest";

import {
  validateRateRuleForSave,
  type RateRule,
} from "@/entities/service-option-rate-plan";

function baseComp(
  overrides?: Partial<RateRule["components"][0]>
): RateRule["components"][0] {
  return {
    id: "c1",
    priority: 1,
    paxType: "ADT",
    rateId: "rate-1",
    modifier: 10,
    type: "%",
    componentConditions: [],
    bookingWindowId: null,
    bookingWindowFrom: null,
    bookingWindowTo: null,
    bookingWindowFromDays: null,
    bookingWindowToDays: null,
    componentDates: [],
    residencies: [],
    ...overrides,
  };
}

function baseRule(overrides?: Partial<RateRule>): RateRule {
  return {
    id: "rr-1",
    ratePlanId: "rp-1",
    name: "Rule",
    isActive: true,
    version: 1,
    conditions: [],
    components: [baseComp()],
    ...overrides,
  };
}

describe("validateRateRuleForSave", () => {
  const allowed = ["ADT", "CHD"] as const;
  const allowedRateIds = new Set(["rate-1"]);

  it("returns no error when conditions are empty", () => {
    expect(
      validateRateRuleForSave(baseRule({ conditions: [] }), {
        allowedPaxOptions: [...allowed],
        allowedRateIds,
      })
    ).toEqual({ error: null, warnings: [] });
  });

  it("rejects when both min and max are empty for a numeric condition row", () => {
    const result = validateRateRuleForSave(
      baseRule({
        conditions: [
          { id: "x", condition: "Pax", option: "ADT", min: null, max: null },
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBe("rateRuleConditionBoundsRequired");
  });

  it("accepts max-only row", () => {
    const result = validateRateRuleForSave(
      baseRule({
        conditions: [
          { id: "x", condition: "Nights", option: "Number", min: null, max: 7 },
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBeNull();
  });

  it("accepts min-only row", () => {
    const result = validateRateRuleForSave(
      baseRule({
        conditions: [
          { id: "x", condition: "Nights", option: "Number", min: 5, max: null },
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBeNull();
  });

  it("rejects min greater than max", () => {
    const result = validateRateRuleForSave(
      baseRule({
        conditions: [
          { id: "x", condition: "Unit", option: "Number", min: 4, max: 2 },
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBe("rateRuleConditionInvalidRange");
  });

  it("rejects duplicate condition rows", () => {
    const row = {
      condition: "Pax" as const,
      option: "ADT" as const,
      min: 0,
      max: 1,
    };
    const result = validateRateRuleForSave(
      baseRule({
        conditions: [
          { ...row, id: "a" },
          { ...row, id: "b" },
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBe("rateRuleConditionDuplicateRow");
  });

  it("rejects same priority + same paxType (exact pair duplicate)", () => {
    const result = validateRateRuleForSave(
      baseRule({
        components: [
          baseComp({ id: "c1", priority: 1, paxType: "ADT" }),
          baseComp({ id: "c2", priority: 1, paxType: "ADT" }),
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBe("rateRuleDuplicateComponentPriority");
  });

  it("allows same priority when paxType differs", () => {
    const result = validateRateRuleForSave(
      baseRule({
        components: [
          baseComp({ id: "c1", priority: 1, paxType: "ADT" }),
          baseComp({ id: "c2", priority: 1, paxType: "CHD" }),
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBeNull();
  });

  it("identical components (all fields match) are caught by priority+paxType check", () => {
    // When all fields including priority and paxType are equal, the priority-paxType
    // check fires before the exact-duplicate check returns rateRuleDuplicateComponentPriority.
    const comp = baseComp({ id: "c1", priority: 3, paxType: "ADT" });
    const result = validateRateRuleForSave(
      baseRule({
        components: [comp, { ...comp, id: "c2" }],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBe("rateRuleDuplicateComponentPriority");
  });

  it("does not block non-identical components with same priority but different paxType", () => {
    const result = validateRateRuleForSave(
      baseRule({
        components: [
          baseComp({ id: "c1", priority: 5, paxType: "ADT", rateId: "rate-1" }),
          baseComp({ id: "c2", priority: 5, paxType: "CHD", rateId: "rate-1" }),
        ],
      }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBeNull();
  });

  it("accepts Free of charge (rateId null) with empty configured rates list", () => {
    const result = validateRateRuleForSave(
      baseRule({ components: [baseComp({ rateId: null })] }),
      { allowedPaxOptions: [...allowed], allowedRateIds: new Set() }
    );
    expect(result.error).toBeNull();
  });

  it("rejects rate id not in configured rates", () => {
    const result = validateRateRuleForSave(
      baseRule({ components: [baseComp({ rateId: "unknown-rate" })] }),
      { allowedPaxOptions: [...allowed], allowedRateIds }
    );
    expect(result.error).toBe("rateRuleComponentInvalidRate");
  });

  it("returns empty warnings array when no overlaps", () => {
    const result = validateRateRuleForSave(baseRule(), {
      allowedPaxOptions: [...allowed],
      allowedRateIds,
    });
    expect(result.warnings).toEqual([]);
  });
});
