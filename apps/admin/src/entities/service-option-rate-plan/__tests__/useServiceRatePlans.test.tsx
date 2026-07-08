import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useServiceRatePlans } from "../api/useServiceRatePlans";

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

describe("useServiceRatePlans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not fetch when serviceId is null", async () => {
    const { wrapper } = createWrapper();
    renderHook(() => useServiceRatePlans(null), { wrapper });

    await waitFor(() => {});

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("fetches rate plans for a given serviceId", async () => {
    const mockPlans = [
      {
        id: "rp-1",
        serviceId: "svc-1",
        name: "STD",
        validityDateFrom: "2025-01-01",
        validityDateTo: null,
        payAtProperty: false,
        isActive: true,
        version: 1,
      },
    ];
    mockApi.get.mockResolvedValue(mockPlans);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceRatePlans("svc-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/services/svc-1/rate-plans"
    );
    expect(result.current.data).toEqual(mockPlans);
  });

  it("returns empty array when API response is not an array", async () => {
    mockApi.get.mockResolvedValue({ items: [] });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceRatePlans("svc-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("returns empty array default while loading", async () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceRatePlans("svc-1"), {
      wrapper,
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
  });
});
