import { describe, expect, it } from "vitest";

import type { RateRule } from "@/entities/service-option-rate-plan";

import {
  componentIndicesWithDuplicatePriorityPax,
  rateRulesConditionsOverlap,
  validateRateRuleForPlanSave,
} from "../rateRuleValidation";

function rule(
  id: string,
  conditions: RateRule["conditions"],
  components: RateRule["components"] = []
): RateRule {
  return {
    id,
    ratePlanId: "rp-1",
    name: id,
    isActive: true,
    version: 0,
    conditions,
    components,
  };
}

describe("rateRuleValidation", () => {
  it("rateRulesConditionsOverlap returns true when pax ranges overlap", () => {
    const a = rule("a", [
      { id: "1", condition: "Pax", option: "ADT", min: 1, max: 2 },
    ]);
    const b = rule("b", [
      { id: "2", condition: "Pax", option: "ADT", min: 2, max: 4 },
    ]);
    expect(rateRulesConditionsOverlap(a, b)).toBe(true);
  });

  it("rateRulesConditionsOverlap returns false when options differ", () => {
    const a = rule("a", [
      { id: "1", condition: "Pax", option: "ADT", min: 1, max: 2 },
    ]);
    const b = rule("b", [
      { id: "2", condition: "Pax", option: "CHD", min: 1, max: 2 },
    ]);
    expect(rateRulesConditionsOverlap(a, b)).toBe(false);
  });

  it("validateRateRuleForPlanSave adds overlap warning", () => {
    const r1 = rule("r1", [
      { id: "1", condition: "Nights", option: "Number", min: 1, max: 5 },
    ]);
    const r2 = rule("r2", [
      { id: "2", condition: "Nights", option: "Number", min: 3, max: 10 },
    ]);
    const result = validateRateRuleForPlanSave(r1, [r1, r2], {
      allowedPaxOptions: ["ADT"],
      allowedRateIds: new Set(),
    });
    expect(result.error).toBeNull();
    expect(result.warnings).toContain("rateRuleOverlapDetected");
  });

  it("componentIndicesWithDuplicatePriorityPax flags same priority+pax only", () => {
    const indices = componentIndicesWithDuplicatePriorityPax([
      {
        id: "c1",
        priority: 100,
        paxType: "ADT",
        rateId: null,
        modifier: null,
        type: "%",
        componentConditions: [],
        bookingWindowId: null,
        bookingWindowFrom: null,
        bookingWindowTo: null,
        bookingWindowFromDays: null,
        bookingWindowToDays: null,
        componentDates: [],
        residencies: [],
      },
      {
        id: "c2",
        priority: 100,
        paxType: "CHD",
        rateId: null,
        modifier: null,
        type: "%",
        componentConditions: [],
        bookingWindowId: null,
        bookingWindowFrom: null,
        bookingWindowTo: null,
        bookingWindowFromDays: null,
        bookingWindowToDays: null,
        componentDates: [],
        residencies: [],
      },
      {
        id: "c3",
        priority: 100,
        paxType: "ADT",
        rateId: null,
        modifier: null,
        type: "%",
        componentConditions: [],
        bookingWindowId: null,
        bookingWindowFrom: null,
        bookingWindowTo: null,
        bookingWindowFromDays: null,
        bookingWindowToDays: null,
        componentDates: [],
        residencies: [],
      },
    ]);
    expect(indices.has(0)).toBe(true);
    expect(indices.has(2)).toBe(true);
    expect(indices.has(1)).toBe(false);
  });
});
