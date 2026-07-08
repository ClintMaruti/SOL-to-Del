import { describe, expect, it } from "vitest";

import {
  mapApiRateRuleToFormModel,
  mapFormRateRuleToCreatePayload,
  mapFormRateRuleToUpdatePayload,
  type ApiRateRule,
  type RateRule,
} from "@/entities/service-option-rate-plan";

function createRule(overrides?: Partial<RateRule>): RateRule {
  return {
    id: "tmp-rate-rule-1",
    ratePlanId: "rp-1",
    name: "Rule 1",
    isActive: true,
    version: 3,
    conditions: [
      {
        id: "tmp-condition-1",
        condition: "Pax",
        option: "ADT",
        min: 1,
        max: 2,
      },
      {
        id: "tmp-condition-2",
        condition: "Unit",
        option: "Number",
        min: 1,
        max: 1,
      },
    ],
    components: [
      {
        id: "tmp-component-1",
        priority: 100,
        paxType: "ADT",
        rateId: "rate-single",
        modifier: 10,
        type: "%",
        componentConditions: [
          {
            id: "tmp-component-condition-1",
            ageFrom: 18,
            ageTo: 65,
            paxFrom: 1,
            paxTo: 2,
            unitFrom: 1,
            unitTo: 1,
            nightFrom: 1,
            nightTo: 3,
          },
        ],
        bookingWindowId: "tmp-bw-1",
        bookingWindowFrom: "2026-02-01",
        bookingWindowTo: "2026-02-15",
        bookingWindowFromDays: null,
        bookingWindowToDays: null,
        componentDates: [
          {
            id: "tmp-component-date-1",
            travelDateFrom: "2026-03-01",
            travelDateTo: "2026-03-05",
          },
        ],
        residencies: ["1fcf3ba1-72cb-4d80-92fd-671b4b947093"],
      },
    ],
    ...overrides,
  };
}

describe("rateRuleMappers", () => {
  it("maps form rule to create payload with enum/value conversion", () => {
    const payload = mapFormRateRuleToCreatePayload(createRule());

    expect(payload.conditions[0]).toEqual({
      id: null,
      type: "Pax",
      option: "Adult",
      min: 1,
      max: 2,
    });
    expect(payload.conditions[1]).toEqual({
      id: null,
      type: "Units",
      option: "Number",
      min: 1,
      max: 1,
    });
    expect(payload.components[0].rateId).toBe("rate-single");
    expect(payload.components[0].residencies).toEqual([
      {
        id: null,
        residencyId: "1fcf3ba1-72cb-4d80-92fd-671b4b947093",
      },
    ]);
  });

  it("maps max-only condition to implicit min 0 for API", () => {
    const payload = mapFormRateRuleToCreatePayload(
      createRule({
        conditions: [
          {
            id: "tmp-condition-1",
            condition: "Nights",
            option: "Number",
            min: null,
            max: 7,
          },
        ],
      })
    );

    expect(payload.conditions[0]).toEqual({
      id: null,
      type: "Nights",
      option: "Number",
      min: 0,
      max: 7,
    });
  });

  it("maps min-only condition with open max as null max for API", () => {
    const payload = mapFormRateRuleToCreatePayload(
      createRule({
        conditions: [
          {
            id: "tmp-condition-1",
            condition: "Nights",
            option: "Number",
            min: 5,
            max: null,
          },
        ],
      })
    );

    expect(payload.conditions[0]).toEqual({
      id: null,
      type: "Nights",
      option: "Number",
      min: 5,
      max: null,
    });
  });

  it("sends bookingWindow null when travel dates exist but booking window bounds are empty", () => {
    const payload = mapFormRateRuleToCreatePayload(
      createRule({
        components: [
          {
            id: "tmp-component-1",
            priority: 100,
            paxType: "CHD",
            rateId: "rate-single",
            modifier: 10,
            type: "%",
            componentConditions: [],
            bookingWindowId: null,
            bookingWindowFrom: null,
            bookingWindowTo: null,
            bookingWindowFromDays: null,
            bookingWindowToDays: null,
            componentDates: [
              {
                id: "tmp-component-date-1",
                travelDateFrom: "2025-04-01",
                travelDateTo: "2025-04-30",
              },
            ],
            residencies: [],
          },
        ],
      })
    );

    expect(payload.components[0].travelDates).toHaveLength(1);
    expect(payload.components[0].bookingWindow).toBeNull();
  });

  it("maps FOC to null rateId on API payload", () => {
    const payload = mapFormRateRuleToCreatePayload(
      createRule({
        components: [
          {
            id: "tmp-component-1",
            priority: 100,
            paxType: "ADT",
            rateId: null,
            modifier: 5,
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
        ],
      })
    );

    expect(payload.components[0].rateId).toBeNull();
  });

  it("maps form rule to update payload and keeps persisted ids", () => {
    const persisted = createRule({
      id: "rule-1",
      conditions: [
        {
          id: "cond-1",
          condition: "Pax",
          option: "CHD",
          min: 0,
          max: 1,
        },
      ],
      components: [
        {
          id: "comp-1",
          priority: 5,
          paxType: "CHD",
          rateId: "rate-sharing",
          modifier: 20,
          type: "Fixed Amount",
          componentConditions: [],
          bookingWindowId: null,
          bookingWindowFrom: null,
          bookingWindowTo: null,
          bookingWindowFromDays: null,
          bookingWindowToDays: null,
          componentDates: [],
          residencies: [],
        },
      ],
    });
    const payload = mapFormRateRuleToUpdatePayload(persisted);

    expect(payload.rateRuleId).toBe("rule-1");
    expect(payload.version).toBe(3);
    expect(payload.ratePlanId).toBe("rp-1");
    expect(payload.conditions[0].id).toBe("cond-1");
    expect(payload.components[0].id).toBe("comp-1");
    expect(payload.components[0].rateId).toBe("rate-sharing");
    expect(payload.components[0].modifierType).toBe("FixedAmount");
  });

  it("maps API rule to form model", () => {
    const apiRule: ApiRateRule = {
      id: "rule-1",
      ratePlanId: "rp-1",
      name: "Persisted",
      isActive: true,
      version: 7,
      conditions: [
        {
          id: "cond-1",
          rateRuleId: "rule-1",
          conditionType: "Units",
          option: "Number",
          minValue: 1,
          maxValue: 2,
          version: 1,
        },
      ],
      components: [
        {
          id: "comp-1",
          rateRuleId: "rule-1",
          priority: 1,
          paxType: "Adult",
          rateId: "rate-1",
          modifierValue: 10,
          modifierType: "Percent",
          isActive: true,
          version: 1,
          ageFrom: 10,
          ageTo: 20,
          paxIndexFrom: 1,
          paxIndexTo: 2,
          nightIndexFrom: 1,
          nightIndexTo: 3,
          unitIndexFrom: 1,
          unitIndexTo: 1,
          travelDates: [
            {
              id: "td-1",
              rateComponentId: "comp-1",
              from: "2026-03-01",
              to: "2026-03-05",
              version: 1,
            },
          ],
          bookingWindow: {
            id: "bw-1",
            rateComponentId: "comp-1",
            from: "2026-02-01",
            to: "2026-02-20",
            version: 1,
          },
          residencies: [
            {
              id: "resrow-1",
              rateComponentId: "comp-1",
              residencyId: "1fcf3ba1-72cb-4d80-92fd-671b4b947093",
              version: 1,
            },
          ],
        },
      ],
    };

    const mapped = mapApiRateRuleToFormModel(apiRule);

    expect(mapped.id).toBe("rule-1");
    expect(mapped.conditions[0].condition).toBe("Unit");
    expect(mapped.components[0].paxType).toBe("ADT");
    expect(mapped.components[0].rateId).toBe("rate-1");
    expect(mapped.components[0].componentConditions[0].paxFrom).toBe(1);
    expect(mapped.components[0].residencies).toEqual([
      "1fcf3ba1-72cb-4d80-92fd-671b4b947093",
    ]);
    expect(mapped.components[0].bookingWindowId).toBe("bw-1");
    expect(mapped.components[0].bookingWindowFrom).toBe("2026-02-01");
    expect(mapped.components[0].bookingWindowTo).toBe("2026-02-20");
    expect(mapped.components[0].componentDates[0]).toEqual({
      id: "td-1",
      travelDateFrom: "2026-03-01",
      travelDateTo: "2026-03-05",
    });
  });

  it("maps GET response that uses type/min/max instead of conditionType/minValue/maxValue", () => {
    const apiRule: ApiRateRule = {
      id: "rule-1",
      ratePlanId: "rp-1",
      name: "Rate Rule",
      isActive: true,
      version: 1,
      conditions: [
        {
          id: "cond-1",
          rateRuleId: "rule-1",
          type: "Pax",
          option: "Adult",
          min: 18,
          max: 99,
          version: 1,
        },
      ],
      components: [
        {
          id: "comp-1",
          rateRuleId: "rule-1",
          priority: 100,
          paxType: "Adult",
          rateId: "rate-1",
          modifierValue: 20,
          modifierType: "Percent",
          isActive: true,
          version: 1,
          ageFrom: null,
          ageTo: null,
          paxIndexFrom: null,
          paxIndexTo: null,
          nightIndexFrom: null,
          nightIndexTo: null,
          unitIndexFrom: null,
          unitIndexTo: null,
          travelDates: [],
          bookingWindow: null,
          residencies: [],
        },
      ],
    };

    const mapped = mapApiRateRuleToFormModel(apiRule);

    expect(mapped.conditions[0].condition).toBe("Pax");
    expect(mapped.conditions[0].option).toBe("ADT");
    expect(mapped.conditions[0].min).toBe(18);
    expect(mapped.conditions[0].max).toBe(99);
    expect(mapped.components[0].componentConditions).toEqual([]);
  });

  it("maps API FOC (null rateId) to form model", () => {
    const apiRule: ApiRateRule = {
      id: "rule-1",
      ratePlanId: "rp-1",
      name: "Rate Rule",
      isActive: true,
      version: 1,
      conditions: [],
      components: [
        {
          id: "comp-1",
          rateRuleId: "rule-1",
          priority: 100,
          paxType: "Adult",
          rateId: null,
          modifierValue: 0,
          modifierType: "Percent",
          isActive: true,
          version: 1,
          ageFrom: null,
          ageTo: null,
          paxIndexFrom: null,
          paxIndexTo: null,
          nightIndexFrom: null,
          nightIndexTo: null,
          unitIndexFrom: null,
          unitIndexTo: null,
          travelDates: [],
          bookingWindow: null,
          residencies: [],
        },
      ],
    };

    const mapped = mapApiRateRuleToFormModel(apiRule);

    expect(mapped.components[0].rateId).toBeNull();
    expect(mapped.components[0].componentConditions).toEqual([]);
  });
});
