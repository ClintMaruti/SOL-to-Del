import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateServiceOptionRate,
  type CreateRatePayload,
} from "../api/useCreateServiceOptionRate";
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

const validPayload: CreateRatePayload = {
  name: "Standard Rate",
  chargeType: "Person",
  timeUnit: "Night",
  contractedRates: [
    {
      id: "cr-1",
      contractId: "contract-1",
      rack: 250,
      net: 200,
      sell: 280,
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

const mockCreatedRate: Rate = {
  id: "rate-new",
  serviceOptionId: SERVICE_OPTION_ID,
  name: validPayload.name,
  chargeType: "Person",
  timeUnit: "Night",
  currency: "USD",
  isActive: true,
  version: 1,
  contractedRates: [],
};

/** Catalog POST response shape (mapped to {@link mockCreatedRate} in the hook). */
const mockCreatedRateApiDto: ServiceOptionRateApiItem = {
  id: mockCreatedRate.id,
  serviceOptionId: mockCreatedRate.serviceOptionId,
  rateName: validPayload.name,
  chargeType: "Person",
  timeUnit: "Night",
  currency: "USD",
  isActive: mockCreatedRate.isActive,
  version: mockCreatedRate.version,
  contractedRates: [],
};

describe("useCreateServiceOptionRate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful Mutations", () => {
    it("should create a rate successfully", async () => {
      mockApi.post.mockResolvedValueOnce(mockCreatedRateApiDto);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateServiceOptionRate(SERVICE_OPTION_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/catalog/services/options/${SERVICE_OPTION_ID}/rates`,
        validPayload
      );
      expect(result.current.data).toEqual(mockCreatedRate);
    });

    it("should create a rate with no contracted rates", async () => {
      const payloadWithoutRates: CreateRatePayload = {
        ...validPayload,
        contractedRates: [],
      };

      mockApi.post.mockResolvedValueOnce({
        ...mockCreatedRateApiDto,
        contractedRates: [],
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateServiceOptionRate(SERVICE_OPTION_ID),
        { wrapper }
      );

      result.current.mutate(payloadWithoutRates);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/catalog/services/options/${SERVICE_OPTION_ID}/rates`,
        expect.objectContaining({ contractedRates: [] })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle 400 validation error", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Rate name is required", 400, "Bad Request")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateServiceOptionRate(SERVICE_OPTION_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Rate name is required");
    });

    it("should handle 404 service option not found", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Resource not found", 404, "Not Found")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateServiceOptionRate("non-existent-id"),
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

      mockApi.post.mockReturnValueOnce(promise);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(
        () => useCreateServiceOptionRate(SERVICE_OPTION_ID),
        { wrapper }
      );

      expect(result.current.isPending).toBe(false);

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePromise!(mockCreatedRateApiDto);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe("Query cache update", () => {
    it("should append created rate to service-option-rates list before refetch", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const listKey = ["service-option-rates", SERVICE_OPTION_ID] as const;
      const existing: ServiceOptionRate = {
        id: "rate-existing",
        serviceOptionId: SERVICE_OPTION_ID,
        name: "Existing",
        chargeType: "Person",
        timeUnit: "Night",
        currency: "USD",
        isActive: true,
        version: 1,
        contractedRates: [],
      };
      queryClient.setQueryData<ServiceOptionRate[]>(listKey, [existing]);

      mockApi.post.mockResolvedValueOnce(mockCreatedRateApiDto);

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(
        () => useCreateServiceOptionRate(SERVICE_OPTION_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const cached = queryClient.getQueryData<ServiceOptionRate[]>(listKey);
      expect(cached).toHaveLength(2);
      expect(cached?.[0]).toEqual(existing);
      expect(cached?.[1]).toEqual(mockCreatedRate);
    });

    it("should not duplicate when cache already contains created rate id", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const listKey = ["service-option-rates", SERVICE_OPTION_ID] as const;
      queryClient.setQueryData<ServiceOptionRate[]>(listKey, [mockCreatedRate]);

      mockApi.post.mockResolvedValueOnce(mockCreatedRateApiDto);

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(
        () => useCreateServiceOptionRate(SERVICE_OPTION_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(
        queryClient.getQueryData<ServiceOptionRate[]>(listKey)
      ).toHaveLength(1);
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate service-option-rates query on success", async () => {
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

      mockApi.post.mockResolvedValueOnce(mockCreatedRateApiDto);

      const { result } = renderHook(
        () => useCreateServiceOptionRate(SERVICE_OPTION_ID),
        { wrapper }
      );

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["service-option-rates", SERVICE_OPTION_ID],
      });
    });
  });
});
