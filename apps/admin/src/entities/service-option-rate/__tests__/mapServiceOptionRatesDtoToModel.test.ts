import { describe, expect, it } from "vitest";

import type { ServiceOptionRateApiItem } from "../model/api-types";
import {
  mapServiceOptionRateApiItemToRate,
  mapServiceOptionRatesDtoToModel,
} from "../model/mapServiceOptionRatesDtoToModel";

describe("mapServiceOptionRatesDtoToModel", () => {
  it("maps rateName, enums, and flat contracted rate dates", () => {
    const dto: ServiceOptionRateApiItem = {
      id: "r1",
      serviceOptionId: "so1",
      rateName: "API Rate",
      chargeType: "Person",
      timeUnit: "None",
      currency: "USD",
      isActive: true,
      version: 2,
      contractedRates: [
        {
          id: "cr1",
          contractId: "c1",
          rateId: "r1",
          rack: { currency: "USD", value: 100 },
          net: { currency: "USD", value: 80 },
          sell: { currency: "USD", value: 120 },
          priority: 1,
          bookingWindowFrom: "2024-12-01",
          bookingWindowTo: "2025-05-01",
          isActive: true,
          contractedRateDates: [
            {
              id: "crd-row-1",
              travelDateFrom: "2025-01-01",
              travelDateTo: "2025-06-30",
              weekdays: ["MON", "WED"],
            },
          ],
        },
      ],
    };

    const rate = mapServiceOptionRateApiItemToRate(dto);
    expect(rate.name).toBe("API Rate");
    expect(rate.chargeType).toBe("Person");
    expect(rate.timeUnit).toBe("None");
    expect(rate.contractedRates[0]?.bookingWindowFrom).toBe("2024-12-01");
    expect(rate.contractedRates[0]?.bookingWindowTo).toBe("2025-05-01");
    expect(
      rate.contractedRates[0]?.contractedRateDates[0]?.travelDates[0]
    ).toEqual({
      id: "crd-row-1",
      travelDateFrom: "2025-01-01",
      travelDateTo: "2025-06-30",
      weekdays: "MON,WED",
    });
  });

  it("defaults contracted rate rateId to parent rate id when omitted on wire", () => {
    const dto: ServiceOptionRateApiItem = {
      id: "parent-rate",
      serviceOptionId: "so1",
      rateName: "Bundled",
      chargeType: "Unit",
      timeUnit: "Day",
      currency: "EUR",
      contractedRates: [
        {
          id: "cr1",
          contractId: "c1",
          rack: { currency: "EUR", value: 1 },
          net: { currency: "EUR", value: 1 },
          sell: { currency: "EUR", value: 1 },
          priority: 1,
          bookingWindowFrom: "2025-06-01",
          bookingWindowTo: "2025-06-30",
          contractedRateDates: [
            {
              travelDateFrom: "2025-07-01",
              travelDateTo: "2025-07-31",
              weekdays: ["MON", "TUE"],
            },
          ],
        },
      ],
    };

    const rate = mapServiceOptionRateApiItemToRate(dto);
    expect(rate.contractedRates[0]?.rateId).toBe("parent-rate");
    expect(rate.currency).toBe("EUR");
    expect(
      rate.contractedRates[0]?.contractedRateDates[0]?.travelDates
    ).toHaveLength(1);
  });

  it("mapServiceOptionRatesDtoToModel maps a list", () => {
    const list: ServiceOptionRateApiItem[] = [
      {
        id: "a",
        serviceOptionId: "so",
        rateName: "A",
        chargeType: "Person",
        timeUnit: "Night",
        currency: "USD",
        isActive: true,
        contractedRates: [],
      },
    ];
    expect(mapServiceOptionRatesDtoToModel(list)).toHaveLength(1);
    expect(mapServiceOptionRatesDtoToModel(list)[0]?.name).toBe("A");
  });
});
