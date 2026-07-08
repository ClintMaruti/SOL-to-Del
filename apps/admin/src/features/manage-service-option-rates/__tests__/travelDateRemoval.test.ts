import { describe, expect, it } from "vitest";

import type { ContractedRateDate } from "@/entities/service-option-rate";

import { planOptionRateTravelDateRemoval } from "../model/travelDateRemoval";

function buildTravelDate(
  travelDateFrom: string,
  travelDateTo: string
): ContractedRateDate["travelDates"][number] {
  return {
    id: `${travelDateFrom}-${travelDateTo}`,
    travelDateFrom,
    travelDateTo,
    weekdays: "",
  };
}

describe("planOptionRateTravelDateRemoval", () => {
  it("removes the whole contracted-rate-date bucket when deleting its only travel row", () => {
    const contractedRateDates: ContractedRateDate[] = [
      {
        travelDates: [buildTravelDate("2025-06-01", "2025-06-15")],
      },
      {
        travelDates: [buildTravelDate("2025-07-01", "2025-07-15")],
      },
    ];

    const result = planOptionRateTravelDateRemoval(contractedRateDates, 0, 0);

    expect(result.removeWholeContractedRateDate).toBe(true);
    expect(result.nextContractedRateDates).toEqual([
      {
        travelDates: [buildTravelDate("2025-07-01", "2025-07-15")],
      },
    ]);
  });

  it("keeps the contracted-rate-date bucket when other travel rows remain in it", () => {
    const contractedRateDates: ContractedRateDate[] = [
      {
        travelDates: [
          buildTravelDate("2025-06-01", "2025-06-15"),
          buildTravelDate("2025-06-16", "2025-06-30"),
        ],
      },
    ];

    const result = planOptionRateTravelDateRemoval(contractedRateDates, 0, 0);

    expect(result.removeWholeContractedRateDate).toBe(false);
    expect(result.nextContractedRateDates).toEqual([
      {
        travelDates: [buildTravelDate("2025-06-16", "2025-06-30")],
      },
    ]);
  });
});
