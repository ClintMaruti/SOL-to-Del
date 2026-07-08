import { describe, expect, it } from "vitest";

import type { ContractedRateAggregateApiDto } from "../api-types";
import { mapContractedRatesDtoToModel } from "../mapContractedRateDtoToModel";

const aggregateFromApi: ContractedRateAggregateApiDto = {
  id: "019e72df-0b68-7ce2-87a4-e7389737047c",
  contractId: "019e72d4-e8c3-7438-b2bf-af949420e3ae",
  seasonName: "Summer",
  priority: 100,
  bookingWindowFrom: null,
  bookingWindowTo: null,
  version: 1559,
  options: [
    {
      id: "019e72df-0b69-7703-a6c9-24d48e48f13c",
      serviceOptionId: "019e72dc-80e8-7b9d-858e-e213d0d4b20a",
      rateId: "019e72db-910c-7792-840a-847646513369",
      net: { currency: "USD", value: 1 },
      rack: { currency: "USD", value: 4 },
      sell: { currency: "USD", value: 7 },
      version: 1559,
    },
    {
      id: "019e72df-0b69-7e35-b6ca-1eb660c507c1",
      serviceOptionId: "019e72dc-b879-7945-8c53-969f25c78f2b",
      rateId: "019e72db-910c-7792-840a-847646513369",
      net: { currency: "USD", value: 3 },
      rack: { currency: "USD", value: 6 },
      sell: { currency: "USD", value: 9 },
      version: 1559,
    },
    {
      id: "019e72df-0b69-7e65-a865-1deec075b4c2",
      serviceOptionId: "019e72dc-9c65-7a43-894b-01b4da2f0c8d",
      rateId: "019e72db-ad35-72ab-8f77-2e713e934e96",
      net: { currency: "USD", value: 2 },
      rack: { currency: "USD", value: 5 },
      sell: { currency: "USD", value: 8 },
      version: 1559,
    },
  ],
  dates: [
    {
      id: "019e72df-0b69-7927-afe0-d83cc042546b",
      travelDateFrom: "2026-05-10",
      travelDateTo: "2026-05-16",
      weekdays: ["MON", "TUE", "WED"],
    },
    {
      id: "019e72df-0b69-7ed9-a439-0ada8471ae72",
      travelDateFrom: "2026-05-17",
      travelDateTo: "2026-05-23",
      weekdays: ["THU", "FRI", "SAT"],
    },
  ],
};

describe("mapContractedRatesDtoToModel", () => {
  it("flattens nested options into UI rows with prices and shared dates", () => {
    const rows = mapContractedRatesDtoToModel([aggregateFromApi]);

    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.contractedRateId === aggregateFromApi.id)).toBe(
      true
    );
    expect(rows.every((r) => r.seasonName === "Summer")).toBe(true);
    expect(rows.every((r) => r.priority === 100)).toBe(true);
    expect(rows.every((r) => r.dates.length === 2)).toBe(true);
    expect(rows[0]?.dates).toHaveLength(2);
    expect(rows[0]?.net?.value).toBe(1);
    expect(rows[1]?.net?.value).toBe(3);
    expect(rows[2]?.rateId).toBe("019e72db-ad35-72ab-8f77-2e713e934e96");
  });

  it("copies parent booking window onto date rows for UI", () => {
    const withBooking: ContractedRateAggregateApiDto = {
      ...aggregateFromApi,
      bookingWindowFrom: "2026-05-06",
      bookingWindowTo: "2026-05-13",
    };

    const rows = mapContractedRatesDtoToModel([withBooking]);
    expect(rows[0]?.dates[0]?.bookingWindowFrom).toBe("2026-05-06");
    expect(rows[0]?.dates[0]?.bookingWindowTo).toBe("2026-05-13");
  });
});
