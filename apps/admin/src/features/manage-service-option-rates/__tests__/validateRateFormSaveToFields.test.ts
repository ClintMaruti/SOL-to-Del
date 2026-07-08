import { describe, expect, it } from "vitest";

import { planOptionRateTravelDateRemoval } from "../model/travelDateRemoval";
import type { RateFormSubmitData } from "../model/schema";
import { validateRateFormSaveToFields } from "../model/schema";

function baseContractedRate(): RateFormSubmitData["contractedRates"][number] {
  return {
    id: "",
    contractId: "",
    rateId: "",
    priority: 1,
    rack: { currency: "USD", value: 100 },
    net: { currency: "USD", value: 80 },
    sell: { currency: "USD", value: null },
    bookingWindowFrom: "",
    bookingWindowTo: "",
    contractedRateDates: [
      {
        travelDates: [
          {
            travelDateFrom: "2025-01-01",
            travelDateTo: "2025-01-31",
            weekdays: "",
          },
        ],
      },
    ],
  };
}

function validForm(
  overrides?: Partial<RateFormSubmitData>
): RateFormSubmitData {
  return {
    name: "Safari Rate",
    chargeType: "Person",
    timeUnit: "Night",
    contractedRates: [baseContractedRate()],
    ...overrides,
  };
}

describe("validateRateFormSaveToFields", () => {
  it("returns empty object when form is valid", () => {
    expect(validateRateFormSaveToFields(validForm())).toEqual({});
  });

  it("returns empty object when travel dates match the selected contract validity boundaries", () => {
    expect(
      validateRateFormSaveToFields(validForm(), {
        validFrom: "2025-01-01",
        validTo: "2025-01-31",
      })
    ).toEqual({});
  });

  it("allows save with no contracted rates when rate header fields are valid", () => {
    expect(
      validateRateFormSaveToFields(validForm({ contractedRates: [] }))
    ).toEqual({});
  });

  it("accepts priority as string from HTML number inputs (coerced for save)", () => {
    const cr = {
      ...baseContractedRate(),
      priority:
        "1" as unknown as RateFormSubmitData["contractedRates"][number]["priority"],
    };
    const fields = validateRateFormSaveToFields(
      validForm({ contractedRates: [cr] })
    );
    expect(fields["contractedRates[0].priority"]).toBeUndefined();
  });

  it("treats sell null like API/domain shape as valid for save", () => {
    const cr = {
      ...baseContractedRate(),
      sell: null,
    } as unknown as RateFormSubmitData["contractedRates"][number];
    expect(
      validateRateFormSaveToFields(validForm({ contractedRates: [cr] }))
    ).toEqual({});
  });

  it("returns field error when name is empty", () => {
    const fields = validateRateFormSaveToFields(validForm({ name: "   " }));
    expect(fields.name).toBeDefined();
  });

  it("allows the same priority on multiple contracted rates when travel ranges do not overlap", () => {
    const a = baseContractedRate();
    a.priority = 2;
    a.contractedRateDates = [
      {
        travelDates: [
          {
            travelDateFrom: "2025-01-01",
            travelDateTo: "2025-01-31",
            weekdays: "",
          },
        ],
      },
    ];
    const b = { ...baseContractedRate(), id: "b", priority: 2 };
    b.contractedRateDates = [
      {
        travelDates: [
          {
            travelDateFrom: "2025-03-01",
            travelDateTo: "2025-03-31",
            weekdays: "",
          },
        ],
      },
    ];
    expect(
      validateRateFormSaveToFields(validForm({ contractedRates: [a, b] }))
    ).toEqual({});
  });

  it("flags invalid net", () => {
    const cr = baseContractedRate();
    cr.net = { currency: "USD", value: null };
    const fields = validateRateFormSaveToFields(
      validForm({ contractedRates: [cr] })
    );
    expect(fields["contractedRates[0].net.value"]).toContain("Net must be");
  });

  it("flags travel dates outside the selected contract validity range", () => {
    const fields = validateRateFormSaveToFields(validForm(), {
      validFrom: "2025-01-10",
      validTo: "2025-02-10",
    });

    expect(
      fields[
        "contractedRates[0].contractedRateDates[0].travelDates[0].travelDateFrom"
      ]
    ).toContain("contract validity");
  });

  it("flags overlapping travel ranges in one contracted rate", () => {
    const cr = baseContractedRate();
    cr.contractedRateDates = [
      {
        travelDates: [
          {
            travelDateFrom: "2025-06-01",
            travelDateTo: "2025-06-15",
            weekdays: "",
          },
          {
            travelDateFrom: "2025-06-10",
            travelDateTo: "2025-06-30",
            weekdays: "",
          },
        ],
      },
    ];
    const fields = validateRateFormSaveToFields(
      validForm({ contractedRates: [cr] })
    );
    expect(
      fields[
        "contractedRates[0].contractedRateDates[0].travelDates[0].travelDateFrom"
      ]
    ).toContain("overlap");
    expect(
      fields[
        "contractedRates[0].contractedRateDates[0].travelDates[1].travelDateFrom"
      ]
    ).toContain("overlap");
  });

  it("allows overlapping travel ranges across two contracted rates when priorities differ", () => {
    const cr0 = baseContractedRate();
    cr0.priority = 1;
    cr0.contractedRateDates = [
      {
        travelDates: [
          {
            travelDateFrom: "2025-06-01",
            travelDateTo: "2025-06-15",
            weekdays: "",
          },
        ],
      },
    ];
    const cr1 = baseContractedRate();
    cr1.id = "b";
    cr1.priority = 2;
    cr1.contractedRateDates = [
      {
        travelDates: [
          {
            travelDateFrom: "2025-06-10",
            travelDateTo: "2025-06-30",
            weekdays: "",
          },
        ],
      },
    ];
    expect(
      validateRateFormSaveToFields(validForm({ contractedRates: [cr0, cr1] }))
    ).toEqual({});
  });

  it("flags cross-row overlapping travel when both rows share the same priority", () => {
    const cr0 = baseContractedRate();
    cr0.priority = 3;
    cr0.contractedRateDates = [
      {
        travelDates: [
          {
            travelDateFrom: "2025-06-01",
            travelDateTo: "2025-06-15",
            weekdays: "",
          },
        ],
      },
    ];
    const cr1 = baseContractedRate();
    cr1.id = "b";
    cr1.priority = 3;
    cr1.contractedRateDates = [
      {
        travelDates: [
          {
            travelDateFrom: "2025-06-10",
            travelDateTo: "2025-06-30",
            weekdays: "",
          },
        ],
      },
    ];
    const fields = validateRateFormSaveToFields(
      validForm({ contractedRates: [cr0, cr1] })
    );
    expect(
      fields[
        "contractedRates[0].contractedRateDates[0].travelDates[0].travelDateFrom"
      ]
    ).toContain("overlap");
    expect(
      fields[
        "contractedRates[1].contractedRateDates[0].travelDates[0].travelDateFrom"
      ]
    ).toContain("overlap");
  });

  it("allows save after deleting one persisted travel-date bucket when another remains", () => {
    const cr = baseContractedRate();
    cr.contractedRateDates = [
      {
        travelDates: [
          {
            id: "crd-1",
            travelDateFrom: "2025-06-01",
            travelDateTo: "2025-06-15",
            weekdays: "",
          },
        ],
      },
      {
        travelDates: [
          {
            id: "crd-2",
            travelDateFrom: "2025-07-01",
            travelDateTo: "2025-07-15",
            weekdays: "",
          },
        ],
      },
    ];

    const removalPlan = planOptionRateTravelDateRemoval(
      cr.contractedRateDates,
      0,
      0
    );

    const fields = validateRateFormSaveToFields(
      validForm({
        contractedRates: [
          { ...cr, contractedRateDates: removalPlan.nextContractedRateDates },
        ],
      })
    );

    expect(removalPlan.removeWholeContractedRateDate).toBe(true);
    expect(fields).toEqual({});
    expect(
      fields["contractedRates[0].contractedRateDates[0].travelDates"]
    ).toBeUndefined();
  });
});
