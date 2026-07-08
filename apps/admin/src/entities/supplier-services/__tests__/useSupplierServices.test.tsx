import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierServices } from "../api/useSupplierServices";
import type { SupplierService } from "../types";

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

const mockServices: SupplierService[] = [
  {
    id: "service-1",
    supplierId: "sup-1",
    name: "Camp",
    serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
    type: "accommodation",
    isActive: true,
    tags: "",
    options: [],
    rates: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

describe("useSupplierServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch supplier services when supplierId is provided", async () => {
    mockApi.get.mockResolvedValueOnce(mockServices);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSupplierServices("sup-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/suppliers/sup-1/services"
    );
    expect(result.current.data).toEqual(mockServices);
  });

  it("should not fetch when supplierId is null", async () => {
    const { wrapper } = createWrapper();
    renderHook(() => useSupplierServices(null), { wrapper });

    await waitFor(() => {});

    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("should store data under correct query key", async () => {
    mockApi.get.mockResolvedValueOnce(mockServices);

    const { wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useSupplierServices("sup-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["supplier-services", "sup-1"])).toEqual(
      mockServices
    );
  });

  it("should handle fetch error", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("Network error"));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSupplierServices("sup-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Network error");
  });
});
