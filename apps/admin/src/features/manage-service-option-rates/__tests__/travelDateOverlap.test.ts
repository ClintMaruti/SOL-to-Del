import { describe, expect, it } from "vitest";

import type { ContractedRate } from "@/entities/service-option-rate";
import { computeContractedRateErrors } from "@/widgets/service-option-rates-section/lib/validateContractedRates";

import {
  getOverlappingContractedRateTravelKeys,
  getOverlappingTravelKeysAcrossContractedRates,
} from "../model/travelDateOverlap";

function baseContractedRate(
  overrides: Partial<ContractedRate> & {
    contractedRateDates: ContractedRate["contractedRateDates"];
  }
): ContractedRate {
  return {
    id: "",
    contractId: "",
    priority: 1,
    rack: { currency: "USD", value: 100 },
    net: { currency: "USD", value: 80 },
    sell: null,
    bookingWindowFrom: "",
    bookingWindowTo: "",
    ...overrides,
    contractedRateDates: overrides.contractedRateDates,
  };
}

describe("getOverlappingContractedRateTravelKeys", () => {
  it("returns empty set when a single complete range exists", () => {
    const cr = baseContractedRate({
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-01-10",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingContractedRateTravelKeys(cr)).toEqual(new Set());
  });

  it("returns empty set for adjacent non-overlapping ranges", () => {
    const cr = baseContractedRate({
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-01-10",
              weekdays: "",
            },
            {
              travelDateFrom: "2025-01-11",
              travelDateTo: "2025-01-20",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingContractedRateTravelKeys(cr)).toEqual(new Set());
  });

  it("flags both rows when ranges share a boundary day (inclusive)", () => {
    const cr = baseContractedRate({
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-01-10",
              weekdays: "",
            },
            {
              travelDateFrom: "2025-01-10",
              travelDateTo: "2025-01-20",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingContractedRateTravelKeys(cr)).toEqual(
      new Set(["0:0", "0:1"])
    );
  });

  it("detects overlap across two contractedRateDate buckets", () => {
    const cr = baseContractedRate({
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-01",
              travelDateTo: "2025-06-15",
              weekdays: "",
            },
          ],
        },
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-10",
              travelDateTo: "2025-06-30",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingContractedRateTravelKeys(cr)).toEqual(
      new Set(["0:0", "1:0"])
    );
  });

  it("excludes incomplete rows from overlap detection", () => {
    const cr = baseContractedRate({
      contractedRateDates: [
        {
          travelDates: [
            { travelDateFrom: "", travelDateTo: "", weekdays: "" },
            {
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-01-31",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingContractedRateTravelKeys(cr)).toEqual(new Set());
  });
});

describe("getOverlappingTravelKeysAcrossContractedRates", () => {
  it("returns empty when two contracted rates have non-overlapping ranges", () => {
    const a = baseContractedRate({
      priority: 1,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-01-10",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const b = baseContractedRate({
      id: "b",
      priority: 2,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-01-11",
              travelDateTo: "2025-01-20",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingTravelKeysAcrossContractedRates([a, b])).toEqual(
      new Set()
    );
  });

  it("does not flag cross-row overlap when priorities differ", () => {
    const a = baseContractedRate({
      priority: 1,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-01",
              travelDateTo: "2025-06-15",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const b = baseContractedRate({
      id: "b",
      priority: 2,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-10",
              travelDateTo: "2025-06-30",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingTravelKeysAcrossContractedRates([a, b])).toEqual(
      new Set()
    );
  });

  it("does not flag inclusive boundary overlap across rows when priorities differ", () => {
    const a = baseContractedRate({
      priority: 1,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-03-01",
              travelDateTo: "2025-03-10",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const b = baseContractedRate({
      id: "b",
      priority: 2,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-03-10",
              travelDateTo: "2025-03-20",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingTravelKeysAcrossContractedRates([a, b])).toEqual(
      new Set()
    );
  });

  it("flags both contracted rates when cross-row ranges overlap and priorities match", () => {
    const a = baseContractedRate({
      priority: 3,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-01",
              travelDateTo: "2025-06-15",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const b = baseContractedRate({
      id: "b",
      priority: 3,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-10",
              travelDateTo: "2025-06-30",
              weekdays: "",
            },
          ],
        },
      ],
    });
    expect(getOverlappingTravelKeysAcrossContractedRates([a, b])).toEqual(
      new Set(["0:0:0", "1:0:0"])
    );
  });
});

describe("computeContractedRateErrors travel overlap", () => {
  it("marks overlapping rows in dateResults", () => {
    const cr = baseContractedRate({
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-01-15",
              weekdays: "",
            },
            {
              travelDateFrom: "2025-01-10",
              travelDateTo: "2025-01-20",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const [result] = computeContractedRateErrors([cr]);
    expect(result.dateResults[0]?.travelDateErrors).toEqual([true, true]);
    expect(result.hasTravelOverlapError).toBe(true);
  });

  it("incomplete row still fails base rules but is not flagged for overlap alone", () => {
    const cr = baseContractedRate({
      contractedRateDates: [
        {
          travelDates: [
            { travelDateFrom: "", travelDateTo: "", weekdays: "" },
            {
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-01-31",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const [result] = computeContractedRateErrors([cr]);
    expect(result.dateResults[0]?.travelDateErrors).toEqual([true, false]);
    expect(result.hasTravelOverlapError).toBe(false);
  });

  it("marks rows outside contract validity in dateResults", () => {
    const cr = baseContractedRate({
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
    });
    const [result] = computeContractedRateErrors([cr], {
      validFrom: "2025-01-10",
      validTo: "2025-02-10",
    });
    expect(result.dateResults[0]?.travelDateErrors).toEqual([true]);
    expect(result.dateResults[0]?.travelDateContractValidityErrors).toEqual([
      true,
    ]);
    expect(result.hasTravelContractValidityError).toBe(true);
    expect(result.hasTravelOverlapError).toBe(false);
  });

  it("marks travel cells on both rows when cross-row overlap and same priority", () => {
    const a = baseContractedRate({
      priority: 3,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-01",
              travelDateTo: "2025-06-15",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const b = baseContractedRate({
      id: "b",
      priority: 3,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-10",
              travelDateTo: "2025-06-30",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const [first, second] = computeContractedRateErrors([a, b]);
    expect(first.dateResults[0]?.travelDateErrors).toEqual([true]);
    expect(second.dateResults[0]?.travelDateErrors).toEqual([true]);
    expect(first.hasTravelOverlapError).toBe(true);
    expect(second.hasTravelOverlapError).toBe(true);
  });

  it("does not mark travel errors cross-row when priorities differ", () => {
    const a = baseContractedRate({
      priority: 1,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-01",
              travelDateTo: "2025-06-15",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const b = baseContractedRate({
      id: "b",
      priority: 2,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-10",
              travelDateTo: "2025-06-30",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const [first, second] = computeContractedRateErrors([a, b]);
    expect(first.dateResults[0]?.travelDateErrors).toEqual([false]);
    expect(second.dateResults[0]?.travelDateErrors).toEqual([false]);
    expect(first.hasTravelOverlapError).toBe(false);
    expect(second.hasTravelOverlapError).toBe(false);
  });

  it("duplicate priority without overlapping travel has no priority error and no travel overlap flag", () => {
    const a = baseContractedRate({
      priority: 10,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-06-01",
              travelDateTo: "2025-06-15",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const b = baseContractedRate({
      id: "b",
      priority: 10,
      contractedRateDates: [
        {
          travelDates: [
            {
              travelDateFrom: "2025-08-01",
              travelDateTo: "2025-08-31",
              weekdays: "",
            },
          ],
        },
      ],
    });
    const [first, second] = computeContractedRateErrors([a, b]);
    expect(first.hasPriorityError).toBe(false);
    expect(second.hasPriorityError).toBe(false);
    expect(first.hasTravelOverlapError).toBe(false);
    expect(second.hasTravelOverlapError).toBe(false);
    expect(first.dateResults[0]?.travelDateErrors).toEqual([false]);
    expect(second.dateResults[0]?.travelDateErrors).toEqual([false]);
  });
});
