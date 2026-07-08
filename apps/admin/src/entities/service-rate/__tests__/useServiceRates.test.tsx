import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useServiceRates } from "../api/useServiceRates";
import type { ServiceRateApiItem } from "../model/api-types";
import type { ServiceRate } from "../model/types";

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

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const mockRatesFromApi: ServiceRateApiItem[] = [
  {
    id: "rate-1",
    serviceId: "service-1",
    rateName: "Standard Rate",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
  },
];

const expectedMappedRates: ServiceRate[] = [
  {
    id: "rate-1",
    serviceId: "service-1",
    name: "Standard Rate",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
  },
];

describe("useServiceRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch rates when serviceId is provided", async () => {
    mockApi.get.mockResolvedValueOnce(mockRatesFromApi);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceRates("service-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/services/service-1/rates"
    );
    expect(result.current.data).toEqual(expectedMappedRates);
  });

  it("should not fetch when serviceId is null", async () => {
    const { wrapper } = createWrapper();
    renderHook(() => useServiceRates(null), { wrapper });

    await waitFor(() => {});

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("should store data under correct query key", async () => {
    mockApi.get.mockResolvedValueOnce(mockRatesFromApi);

    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useServiceRates("service-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData(["service-rates", "service-1"] as const)
    ).toEqual(expectedMappedRates);
  });
});
