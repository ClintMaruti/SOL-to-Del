import { api, QueryClient, QueryClientProvider } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCatalogExtra } from "../api/useCatalogExtra";

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
      queries: { retry: false, gcTime: 60_000 },
    },
  });
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("useCatalogExtra", () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it("fetches GET /catalog/extras/:id when extraId is set", async () => {
    mockGet.mockResolvedValueOnce({
      id: "extra-1",
      supplierId: "sup-1",
      supplierName: "Camp Supplier",
      title: "Lunch",
      description: null,
      isActive: true,
      notes: null,
      version: 1,
      serviceExtras: [
        {
          id: "se-1",
          serviceId: "s1",
          serviceName: "Camp",
          serviceOptionId: null,
          serviceOptionTitle: null,
          validFrom: "2025-06-01",
          validTo: null,
          version: 1,
        },
      ],
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCatalogExtra("extra-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/catalog/extras/extra-1");
    expect(result.current.data).toMatchObject({
      id: "extra-1",
      supplierId: "sup-1",
      title: "Lunch",
      serviceIds: ["s1"],
      serviceId: "s1",
      serviceName: "Camp",
      version: 1,
    });
    expect(result.current.data?.serviceExtras).toHaveLength(1);
    expect(result.current.data?.contractedExtra).toBeUndefined();
  });

  it("does not fetch when extraId is null", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCatalogExtra(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGet).not.toHaveBeenCalled();
  });
});
