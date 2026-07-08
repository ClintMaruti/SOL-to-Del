import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useServiceOptionRates } from "../api/useServiceOptionRates";
import type { ServiceOptionRateApiItem } from "../model/api-types";
import type { Rate } from "../model/types";

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

/** GET wire shape (`rateName`); mapped to {@link expectedMappedRates} by the hook. */
const mockRatesFromApi: ServiceOptionRateApiItem[] = [
  {
    id: "rate-1",
    serviceOptionId: "option-1",
    rateName: "Standard Rate",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    isActive: true,
    contractedRates: [],
  },
];

const expectedMappedRates: Rate[] = [
  {
    id: "rate-1",
    serviceOptionId: "option-1",
    name: "Standard Rate",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    isActive: true,
    contractedRates: [],
  },
];

describe("useServiceOptionRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch rates when serviceOptionId is provided", async () => {
    mockApi.get.mockResolvedValueOnce(mockRatesFromApi);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceOptionRates("option-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/services/options/option-1/rates"
    );
    expect(result.current.data).toEqual(expectedMappedRates);
  });

  it("should not fetch when serviceOptionId is null", async () => {
    const { wrapper } = createWrapper();
    renderHook(() => useServiceOptionRates(null), { wrapper });

    await waitFor(() => {});

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("should not fetch when serviceOptionId is a local draft (temp- prefix)", async () => {
    const { wrapper } = createWrapper();
    renderHook(
      () => useServiceOptionRates("temp-af31d7a2-55ef-44fa-8a91-e5100e8cdf81"),
      { wrapper }
    );

    await waitFor(() => {});

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("should store data under correct query key", async () => {
    mockApi.get.mockResolvedValueOnce(mockRatesFromApi);

    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useServiceOptionRates("option-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData(["service-option-rates", "option-1"])
    ).toEqual(expectedMappedRates);
  });

  it("should return loading state while fetching", async () => {
    mockApi.get.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockRatesFromApi), 100)
        )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceOptionRates("option-1"), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("should handle fetch error", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("Network error"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceOptionRates("option-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Network error");
  });
});
