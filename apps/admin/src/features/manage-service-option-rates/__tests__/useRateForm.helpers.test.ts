import { QueryClient, QueryClientProvider } from "@sol/api-client";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import type { ServiceOptionRate } from "@/entities/service-option-rate";

import {
  buildResetValueAfterUpdate,
  rateFormValuesEqualForReset,
  useRateForm,
} from "../model/useRateForm";
import type { RateFormSubmitData } from "../model/schema";

function buildRateFormValue(): RateFormSubmitData {
  return {
    name: "Standard Rate",
    chargeType: "Person",
    timeUnit: "Night",
    version: 3,
    contractedRates: [
      {
        id: "cr-1",
        contractId: "contract-1",
        rateId: "rate-1",
        rack: { currency: "USD", value: 250 },
        net: { currency: "USD", value: 200 },
        sell: { currency: "USD", value: 280 },
        priority: 1,
        bookingWindowFrom: "2025-01-01",
        bookingWindowTo: "2025-05-31",
        contractedRateDates: [
          {
            travelDates: [
              {
                id: "crd-1",
                travelDateFrom: "2025-06-01",
                travelDateTo: "2025-06-15",
                weekdays: "MON,TUE",
              },
              {
                travelDateFrom: "2025-07-01",
                travelDateTo: "2025-07-15",
                weekdays: "WED,THU",
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildServerBucketedRateFormValue(): RateFormSubmitData {
  const groupedValue = buildRateFormValue();

  return {
    ...groupedValue,
    contractedRates: [
      {
        ...groupedValue.contractedRates[0],
        contractedRateDates: [
          {
            travelDates: [
              groupedValue.contractedRates[0].contractedRateDates[0]
                .travelDates[0],
            ],
          },
          {
            travelDates: [
              groupedValue.contractedRates[0].contractedRateDates[0]
                .travelDates[1],
            ],
          },
        ],
      },
    ],
  };
}

describe("useRateForm helpers", () => {
  it("keeps locally added travel dates visible when parent rerenders with server-style travel-date buckets", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    const initialData = buildRateFormValue();
    const { result, rerender } = renderHook(
      ({ currentInitialData }: { currentInitialData: RateFormSubmitData }) =>
        useRateForm(currentInitialData, "option-1", "rate-1", "contract-1"),
      {
        initialProps: { currentInitialData: initialData },
        wrapper,
      }
    );

    act(() => {
      result.current.form.insertFieldValue(
        "contractedRates[0].contractedRateDates[0].travelDates",
        2,
        {
          travelDateFrom: "2025-08-01",
          travelDateTo: "2025-08-15",
          weekdays: "FRI",
        }
      );
    });

    const serverGroupedInitialData: RateFormSubmitData = {
      ...buildServerBucketedRateFormValue(),
      version: 4,
      contractedRates: [
        {
          ...buildServerBucketedRateFormValue().contractedRates[0],
          contractedRateDates: [
            ...buildServerBucketedRateFormValue().contractedRates[0]
              .contractedRateDates,
            {
              travelDates: [
                {
                  id: "crd-3",
                  travelDateFrom: "2025-08-01",
                  travelDateTo: "2025-08-15",
                  weekdays: "FRI",
                },
              ],
            },
          ],
        },
      ],
    };

    rerender({ currentInitialData: serverGroupedInitialData });

    expect(
      (result.current.form.state.values as RateFormSubmitData)
        .contractedRates[0].contractedRateDates
    ).toEqual([
      {
        travelDates: [
          {
            id: "crd-1",
            travelDateFrom: "2025-06-01",
            travelDateTo: "2025-06-15",
            weekdays: "MON,TUE",
          },
          {
            travelDateFrom: "2025-07-01",
            travelDateTo: "2025-07-15",
            weekdays: "WED,THU",
          },
          {
            travelDateFrom: "2025-08-01",
            travelDateTo: "2025-08-15",
            weekdays: "FRI",
          },
        ],
      },
    ]);
  });

  it("keeps locally removed travel dates hidden when parent rerenders with the previous server grouping", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      );
    const serverBucketedInitialData = buildServerBucketedRateFormValue();
    const groupedFormValue = buildRateFormValue();
    const { result, rerender } = renderHook(
      ({ currentInitialData }: { currentInitialData: RateFormSubmitData }) =>
        useRateForm(currentInitialData, "option-1", "rate-1", "contract-1"),
      {
        initialProps: { currentInitialData: serverBucketedInitialData },
        wrapper,
      }
    );

    act(() => {
      result.current.reset(groupedFormValue);
    });

    act(() => {
      void result.current.form.removeFieldValue(
        "contractedRates[0].contractedRateDates[0].travelDates",
        0
      );
    });

    rerender({ currentInitialData: serverBucketedInitialData });

    expect(
      (result.current.form.state.values as RateFormSubmitData)
        .contractedRates[0].contractedRateDates
    ).toEqual([
      {
        travelDates: [
          {
            travelDateFrom: "2025-07-01",
            travelDateTo: "2025-07-15",
            weekdays: "WED,THU",
          },
        ],
      },
    ]);
  });

  it("treats equivalent travel dates as equal even when grouped into different contractedRateDates buckets", () => {
    const currentValue = buildRateFormValue();
    const groupedValue = buildRateFormValue();
    const nextValue: RateFormSubmitData = {
      ...groupedValue,
      contractedRates: [
        {
          ...groupedValue.contractedRates[0],
          contractedRateDates: [
            {
              travelDates: [
                groupedValue.contractedRates[0].contractedRateDates[0]
                  .travelDates[0],
              ],
            },
            {
              travelDates: [
                groupedValue.contractedRates[0].contractedRateDates[0]
                  .travelDates[1],
              ],
            },
          ],
        },
      ],
    };

    expect(rateFormValuesEqualForReset(currentValue, nextValue)).toBe(true);
  });

  it("preserves the submitted travel-date grouping while applying server version and ids", () => {
    const submittedValue = buildRateFormValue();
    const savedRate: ServiceOptionRate = {
      id: "rate-1",
      serviceOptionId: "option-1",
      name: "Standard Rate",
      chargeType: "Person",
      timeUnit: "Night",
      currency: "USD",
      version: 4,
      contractedRates: [
        {
          id: "cr-1",
          contractId: "contract-1",
          rateId: "rate-1",
          rack: { currency: "USD", value: 250 },
          net: { currency: "USD", value: 200 },
          sell: { currency: "USD", value: 280 },
          priority: 1,
          bookingWindowFrom: "2025-01-01",
          bookingWindowTo: "2025-05-31",
          contractedRateDates: [
            {
              travelDates: [
                {
                  id: "crd-1",
                  travelDateFrom: "2025-06-01",
                  travelDateTo: "2025-06-15",
                  weekdays: "MON,TUE",
                },
              ],
            },
            {
              travelDates: [
                {
                  id: "crd-2",
                  travelDateFrom: "2025-07-01",
                  travelDateTo: "2025-07-15",
                  weekdays: "WED,THU",
                },
              ],
            },
          ],
        },
      ],
    };

    expect(buildResetValueAfterUpdate(submittedValue, savedRate)).toEqual({
      ...submittedValue,
      version: 4,
      contractedRates: [
        {
          ...submittedValue.contractedRates[0],
          contractedRateDates: [
            {
              travelDates: [
                {
                  id: "crd-1",
                  travelDateFrom: "2025-06-01",
                  travelDateTo: "2025-06-15",
                  weekdays: "MON,TUE",
                },
                {
                  id: "crd-2",
                  travelDateFrom: "2025-07-01",
                  travelDateTo: "2025-07-15",
                  weekdays: "WED,THU",
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
