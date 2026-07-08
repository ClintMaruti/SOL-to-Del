import { describe, expect, it } from "vitest";

import type { RateFormSubmitData } from "../model/schema";
import { DEFAULT_CONTRACTED_RATE_PRIORITY } from "../model/schema";
import {
  buildCreateRatePayload,
  buildUpdateRatePayload,
} from "../model/useRateForm";

describe("buildCreateRatePayload", () => {
  it("passes through API enum literals and maps money to numbers for POST", () => {
    const data: RateFormSubmitData = {
      name: "Test Rate",
      chargeType: "Unit",
      timeUnit: "None",
      contractedRates: [
        {
          id: "cr-x",
          contractId: "c-x",
          rack: { currency: "USD", value: 10 },
          net: { currency: "USD", value: 8 },
          sell: { currency: "USD", value: 12 },
          priority: 2,
          bookingWindowFrom: "2025-12-01",
          bookingWindowTo: "2026-05-01",
          contractedRateDates: [
            {
              travelDates: [
                {
                  id: "td-1",
                  travelDateFrom: "2026-01-01",
                  travelDateTo: "2026-06-30",
                  weekdays: "MON,WED",
                },
              ],
            },
          ],
        },
      ],
    };

    const payload = buildCreateRatePayload(data, "c-x");

    expect(payload).toEqual({
      name: "Test Rate",
      chargeType: "Unit",
      timeUnit: "None",
      contractedRates: [
        {
          id: "cr-x",
          contractId: "c-x",
          rack: 10,
          net: 8,
          sell: 12,
          priority: 2,
          bookingWindowFrom: "2025-12-01",
          bookingWindowTo: "2026-05-01",
          contractedRateDates: [
            {
              id: "td-1",
              travelDateFrom: "2026-01-01",
              travelDateTo: "2026-06-30",
              weekdays: ["MON", "WED"],
            },
          ],
        },
      ],
    });
  });

  it("maps null sell to null in API payload", () => {
    const data: RateFormSubmitData = {
      name: "R",
      chargeType: "Person",
      timeUnit: "Night",
      contractedRates: [
        {
          id: "a",
          contractId: "b",
          rack: { currency: "USD", value: 1 },
          net: { currency: "USD", value: 1 },
          sell: { currency: "USD", value: null },
          priority: 1,
          bookingWindowFrom: "2026-01-01",
          bookingWindowTo: "2026-01-02",
          contractedRateDates: [
            {
              travelDates: [
                {
                  travelDateFrom: "2026-01-01",
                  travelDateTo: "2026-01-02",
                },
              ],
            },
          ],
        },
      ],
    };

    expect(
      buildCreateRatePayload(data, "b").contractedRates[0]?.sell
    ).toBeNull();
  });

  it("defaults missing priority to DEFAULT_CONTRACTED_RATE_PRIORITY for API payload", () => {
    const data = {
      name: "R",
      chargeType: "Person",
      timeUnit: "Night",
      contractedRates: [
        {
          id: "a",
          contractId: "b",
          rack: { currency: "USD", value: 1 },
          net: { currency: "USD", value: 1 },
          sell: { currency: "USD", value: null },
          bookingWindowFrom: "2026-01-01",
          bookingWindowTo: "2026-01-02",
          contractedRateDates: [
            {
              travelDates: [
                {
                  travelDateFrom: "2026-01-01",
                  travelDateTo: "2026-01-02",
                },
              ],
            },
          ],
        },
      ],
    } as RateFormSubmitData;

    expect(buildCreateRatePayload(data, "b").contractedRates[0]?.priority).toBe(
      DEFAULT_CONTRACTED_RATE_PRIORITY
    );
  });

  it("throws when net is null so API is never sent invalid money", () => {
    const data: RateFormSubmitData = {
      name: "R",
      chargeType: "Person",
      timeUnit: "Night",
      contractedRates: [
        {
          id: "a",
          contractId: "b",
          rack: { currency: "USD", value: 1 },
          net: { currency: "USD", value: null },
          sell: { currency: "USD", value: null },
          priority: 1,
          bookingWindowFrom: "2026-01-01",
          bookingWindowTo: "2026-01-02",
          contractedRateDates: [
            {
              travelDates: [
                {
                  travelDateFrom: "2026-01-01",
                  travelDateTo: "2026-01-02",
                },
              ],
            },
          ],
        },
      ],
    };

    expect(() => buildCreateRatePayload(data, "b")).toThrow(/net/);
  });
});

describe("buildUpdateRatePayload", () => {
  it("adds version from form data for PUT", () => {
    const data: RateFormSubmitData = {
      name: "R",
      chargeType: "Person",
      timeUnit: "Night",
      version: 3,
      contractedRates: [
        {
          id: "a",
          contractId: "b",
          rack: { currency: "USD", value: 1 },
          net: { currency: "USD", value: 1 },
          sell: { currency: "USD", value: 1 },
          priority: 1,
          bookingWindowFrom: "2026-01-01",
          bookingWindowTo: "2026-01-02",
          contractedRateDates: [
            {
              travelDates: [
                {
                  travelDateFrom: "2026-01-01",
                  travelDateTo: "2026-01-02",
                },
              ],
            },
          ],
        },
      ],
    };

    expect(buildUpdateRatePayload(data, "b").version).toBe(3);
    expect(buildUpdateRatePayload(data, "b")).toEqual({
      ...buildCreateRatePayload(data, "b"),
      version: 3,
    });
  });

  it("defaults version to 0 when missing", () => {
    const data: RateFormSubmitData = {
      name: "R",
      chargeType: "Person",
      timeUnit: "Night",
      contractedRates: [
        {
          id: "a",
          contractId: "b",
          rack: { currency: "USD", value: 1 },
          net: { currency: "USD", value: 1 },
          sell: { currency: "USD", value: null },
          priority: 1,
          bookingWindowFrom: "2026-01-01",
          bookingWindowTo: "2026-01-02",
          contractedRateDates: [
            {
              travelDates: [
                {
                  travelDateFrom: "2026-01-01",
                  travelDateTo: "2026-01-02",
                },
              ],
            },
          ],
        },
      ],
    };

    const updatePayload = buildUpdateRatePayload(data, "b");
    expect(updatePayload.version).toBe(0);
    expect(updatePayload.contractedRates[0]?.sell).toBeNull();
  });
});
