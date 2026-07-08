import type { RatePlan, RateRule } from "@/entities/service-option-rate-plan";
import { describe, expect, it } from "vitest";

import {
  buildDuplicateRatePlanName,
  cloneRateRulesForRatePlanDuplicate,
  createDuplicateRatePlanDraft,
} from "../duplicateRatePlanDraft";

const source: RatePlan = {
  id: "rp-1",
  serviceId: "svc-1",
  name: "STD",
  validityDateFrom: "2025-01-01",
  validityDateTo: "2025-12-31",
  payAtProperty: true,
  isActive: true,
  version: 3,
};

const sourceRule: RateRule = {
  id: "rule-1",
  ratePlanId: "rp-1",
  name: "Weekend",
  isActive: true,
  version: 2,
  conditions: [
    {
      id: "cond-1",
      condition: "Pax",
      option: "ADT",
      min: 1,
      max: 2,
    },
  ],
  components: [
    {
      id: "comp-1",
      priority: 100,
      paxType: null,
      rateId: null,
      modifier: null,
      type: "%",
      componentConditions: [],
      bookingWindowId: "bw-1",
      bookingWindowFrom: null,
      bookingWindowTo: null,
      bookingWindowFromDays: null,
      bookingWindowToDays: null,
      componentDates: [],
      residencies: [],
    },
  ],
};

describe("duplicateRatePlanDraft", () => {
  it("buildDuplicateRatePlanName appends (copy) suffix", () => {
    expect(buildDuplicateRatePlanName("STD")).toBe("STD (copy)");
  });

  it("createDuplicateRatePlanDraft returns tmp id and copied header fields", () => {
    const { ratePlan, initialValues, initialRateRules } =
      createDuplicateRatePlanDraft(source);

    expect(ratePlan.id).toMatch(/^tmp-rate-plan-/);
    expect(ratePlan.serviceId).toBe("svc-1");
    expect(initialValues.name).toBe("STD (copy)");
    expect(initialValues.validityDateFrom).toBe("2025-01-01");
    expect(initialValues.validityDateTo).toBe("2025-12-31");
    expect(initialValues.payAtProperty).toBe(true);
    expect(initialValues.isActive).toBe(false);
    expect(initialValues.version).toBe(0);
    expect(initialRateRules).toEqual([]);
  });

  it("cloneRateRulesForRatePlanDuplicate remaps ids and ratePlanId", () => {
    const { ratePlan } = createDuplicateRatePlanDraft(source);
    const cloned = cloneRateRulesForRatePlanDuplicate(
      [sourceRule],
      ratePlan.id
    );

    expect(cloned).toHaveLength(1);
    expect(cloned[0].id).toMatch(/^tmp-rate-rule-/);
    expect(cloned[0].ratePlanId).toBe(ratePlan.id);
    expect(cloned[0].name).toBe("Weekend");
    expect(cloned[0].version).toBe(0);
    expect(cloned[0].conditions[0].id).toMatch(/^tmp-condition-/);
    expect(cloned[0].components[0].id).toMatch(/^tmp-component-/);
  });

  it("createDuplicateRatePlanDraft clones child rate rules", () => {
    const { initialRateRules } = createDuplicateRatePlanDraft(source, [
      sourceRule,
    ]);

    expect(initialRateRules).toHaveLength(1);
    expect(initialRateRules[0].id).toMatch(/^tmp-rate-rule-/);
    expect(initialRateRules[0].name).toBe("Weekend");
  });
});
