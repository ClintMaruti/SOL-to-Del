import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierCloseouts } from "../api/useSupplierCloseouts";

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

const mockGet = vi.mocked(api.get);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("useSupplierCloseouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads supplier closeouts from the supplier endpoint", async () => {
    mockGet.mockResolvedValueOnce([
      {
        id: "cl-1",
        supplierId: "sup-1",
        serviceId: null,
        serviceOptionId: null,
        travelDateFrom: "2026-06-01",
        travelDateTo: "2026-06-30",
        reason: "Rain Season",
        status: "Active",
      },
    ]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSupplierCloseouts("sup-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/catalog/suppliers/sup-1/closeouts");
    expect(result.current.data?.[0]).toMatchObject({
      id: "cl-1",
      supplierId: "sup-1",
      isActive: true,
      status: "Active",
    });
  });

  it("passes optional serviceId as query string", async () => {
    mockGet.mockResolvedValueOnce([]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useSupplierCloseouts("sup-1", "svc-1"),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith(
      "/catalog/suppliers/sup-1/closeouts?serviceId=svc-1"
    );
  });
});
