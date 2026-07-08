import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateServiceOptionRate } from "../api/useUpdateServiceOptionRate";
import type { UpdateRatePayload } from "../api/useUpdateServiceOptionRate";
import type { ServiceOptionRateApiItem } from "../model/api-types";
import type { Rate, ServiceOptionRate } from "../model/types";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock("@sol/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/ui")>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn() },
  };
});

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const SERVICE_OPTION_ID = "option-1";
const RATE_ID = "rate-existing-1";

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

const validPayload: UpdateRatePayload = {
  name: "Updated Rate",
  chargeType: "Person",
  timeUnit: "Night",
  version: 2,
  contractedRates: [
    {
      id: "cr-1",
      contractId: "contract-1",
      rack: 300,
      net: 240,
      sell: 340,
      priority: 1,
      bookingWindowFrom: "2025-01-01",
      bookingWindowTo: "2025-05-31",
      contractedRateDates: [
        {
          id: "crd-1",
          travelDateFrom: "2025-06-01",
          travelDateTo: "2025-10-31",
          weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
        },
      ],
    },
  ],
};

const mockUpdatedRate: Rate = {
  id: RATE_ID,
  serviceOptionId: SERVICE_OPTION_ID,
  name: validPayload.name,
  chargeType: "Person",
  timeUnit: "Night",
  currency: "USD",
  isActive: true,
  version: 2,
  contractedRates: [],
};

const expectedCachedUpdatedRate: ServiceOptionRate = {
  ...mockUpdatedRate,
  contractedRates: [
    {
      id: "cr-1",
      contractId: "contract-1",
      rateId: RATE_ID,
      rack: { currency: "USD", value: 300 },
      net: { currency: "USD", value: 240 },
      sell: { currency: "USD", value: 340 },
      priority: 1,
      bookingWindowFrom: "2025-01-01",
      bookingWindowTo: "2025-05-31",
      contractedRateDates: [
        {
          travelDates: [
            {
              id: "crd-1",
              travelDateFrom: "2025-06-01",
              travelDateTo: "2025-10-31",
              weekdays: "MON,TUE,WED,THU,FRI",
            },
          ],
        },
      ],
    },
  ],
};

const mockUpdatedRateApiDto: ServiceOptionRateApiItem = {
  id: mockUpdatedRate.id,
  serviceOptionId: mockUpdatedRate.serviceOptionId,
  rateName: validPayload.name,
  chargeType: "Person",
  timeUnit: "Night",
  currency: "USD",
  isActive: mockUpdatedRate.isActive,
  version: mockUpdatedRate.version,
  contractedRates: [],
};

describe("useUpdateServiceOptionRate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful Mutations", () => {
    it("should update a rate successfully", async () => {
      mockApi.put.mockResolvedValueOnce(mockUpdatedRateApiDto);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useUpdateServiceOptionRate(SERVICE_OPTION_ID, RATE_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.put).toHaveBeenCalledWith(
        `/catalog/services/options/rates/${RATE_ID}`,
        validPayload
      );
      expect(result.current.data).toEqual(expectedCachedUpdatedRate);
    });

    it("should update a rate with no contracted rates", async () => {
      const payloadWithoutRates: UpdateRatePayload = {
        ...validPayload,
        contractedRates: [],
      };

      mockApi.put.mockResolvedValueOnce({
        ...mockUpdatedRateApiDto,
        contractedRates: [],
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useUpdateServiceOptionRate(SERVICE_OPTION_ID, RATE_ID),
        { wrapper }
      );

      result.current.mutate(payloadWithoutRates);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.put).toHaveBeenCalledWith(
        `/catalog/services/options/rates/${RATE_ID}`,
        expect.objectContaining({ contractedRates: [] })
      );
      expect(result.current.data).toEqual({
        ...mockUpdatedRate,
        contractedRates: [],
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle 400 validation error", async () => {
      mockApi.put.mockRejectedValueOnce(
        new ApiError("Rate name is required", 400, "Bad Request")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useUpdateServiceOptionRate(SERVICE_OPTION_ID, RATE_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Rate name is required");
    });

    it("should handle 404 rate not found", async () => {
      mockApi.put.mockRejectedValueOnce(
        new ApiError("Resource not found", 404, "Not Found")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () =>
          useUpdateServiceOptionRate(SERVICE_OPTION_ID, "non-existent-rate"),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Resource not found");
    });
  });

  describe("Loading States", () => {
    it("should set isPending while mutation is in progress", async () => {
      let resolvePromise: (value: ServiceOptionRateApiItem) => void;
      const promise = new Promise<ServiceOptionRateApiItem>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.put.mockReturnValueOnce(promise);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useUpdateServiceOptionRate(SERVICE_OPTION_ID, RATE_ID),
        { wrapper }
      );

      expect(result.current.isPending).toBe(false);

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePromise!(mockUpdatedRateApiDto);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe("Query cache update", () => {
    it("should merge PUT response into service-option-rates list cache", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const listKey = ["service-option-rates", SERVICE_OPTION_ID] as const;
      const otherRate: ServiceOptionRate = {
        id: "rate-other",
        serviceOptionId: SERVICE_OPTION_ID,
        name: "Other",
        chargeType: "Unit",
        timeUnit: "Day",
        currency: "USD",
        isActive: true,
        version: 1,
        contractedRates: [],
      };
      const staleTarget: ServiceOptionRate = {
        ...mockUpdatedRate,
        name: "Stale name",
        version: 1,
      };
      queryClient.setQueryData<ServiceOptionRate[]>(listKey, [
        otherRate,
        staleTarget,
      ]);

      mockApi.put.mockResolvedValueOnce(mockUpdatedRateApiDto);

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(
        () => useUpdateServiceOptionRate(SERVICE_OPTION_ID, RATE_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const cached = queryClient.getQueryData<ServiceOptionRate[]>(listKey);
      expect(cached).toHaveLength(2);
      expect(cached?.[0]).toEqual(otherRate);
      expect(cached?.[1]).toEqual(expectedCachedUpdatedRate);
    });

    it("should preserve edited contracted rates in cache when PUT response omits nested rows", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const listKey = ["service-option-rates", SERVICE_OPTION_ID] as const;
      queryClient.setQueryData<ServiceOptionRate[]>(listKey, [
        {
          ...mockUpdatedRate,
          contractedRates: [
            {
              id: "cr-1",
              contractId: "contract-1",
              rateId: RATE_ID,
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
        },
      ]);

      mockApi.put.mockResolvedValueOnce(mockUpdatedRateApiDto);

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(
        () => useUpdateServiceOptionRate(SERVICE_OPTION_ID, RATE_ID),
        { wrapper }
      );

      result.current.mutate({
        ...validPayload,
        contractedRates: [
          {
            ...validPayload.contractedRates[0],
            contractedRateDates: [
              {
                id: "crd-2",
                travelDateFrom: "2025-07-01",
                travelDateTo: "2025-07-15",
                weekdays: ["WED", "THU"],
              },
            ],
          },
        ],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(
        queryClient.getQueryData<ServiceOptionRate[]>(listKey)?.[0]
      ).toMatchObject({
        contractedRates: [
          {
            contractedRateDates: [
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
      });
    });
  });

  describe("Cache reconciliation", () => {
    it("should not invalidate service-option-rates after update (PUT is authoritative)", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      mockApi.put.mockResolvedValueOnce(mockUpdatedRateApiDto);

      const { result } = renderHook(
        () => useUpdateServiceOptionRate(SERVICE_OPTION_ID, RATE_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });
});
