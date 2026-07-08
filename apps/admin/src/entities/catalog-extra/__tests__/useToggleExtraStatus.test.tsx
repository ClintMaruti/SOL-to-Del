import { api, QueryClient, QueryClientProvider } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CatalogExtra, CatalogExtraDetail } from "../model/types";
import { useToggleExtraStatus } from "../api/useToggleExtraStatus";

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
const mockPut = vi.mocked(api.put);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 60_000 },
      mutations: { retry: false },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe("useToggleExtraStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("GETs detail then PUTs /catalog/extras/:id when toggling active", async () => {
    const detail: CatalogExtraDetail = {
      id: "extra-1",
      supplierId: "sup-1",
      title: "Lunch",
      serviceId: "s1",
      serviceName: "Camp",
      description: null,
      isActive: false,
      version: 1,
      notes: null,
      contractedExtra: null,
    };

    const updated: CatalogExtraDetail = {
      ...detail,
      isActive: true,
      version: 2,
    };

    mockGet.mockResolvedValueOnce(detail);
    mockPut.mockResolvedValueOnce(updated);

    const { wrapper, queryClient } = createWrapper();
    const initialRow: CatalogExtra = {
      id: "extra-1",
      title: "Lunch",
      serviceId: "s1",
      serviceName: "Camp",
      description: null,
      isActive: false,
    };
    queryClient.setQueryData<CatalogExtra[]>(
      ["catalog-extras", "supplier", "sup-1"],
      [initialRow]
    );
    queryClient.setQueryData<CatalogExtra[]>(
      ["catalog-extras", "service", "s1"],
      [initialRow]
    );

    const { result } = renderHook(() => useToggleExtraStatus(), { wrapper });

    act(() => {
      result.current.mutate({
        extraId: "extra-1",
        supplierId: "sup-1",
        serviceId: "s1",
        activate: true,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith("/catalog/extras/extra-1");
    expect(mockPut).toHaveBeenCalledWith(
      "/catalog/extras/extra-1",
      expect.objectContaining({
        isActive: true,
        version: 1,
      })
    );

    expect(
      queryClient.getQueryData<CatalogExtra[]>([
        "catalog-extras",
        "supplier",
        "sup-1",
      ])
    ).toEqual([
      {
        id: "extra-1",
        title: "Lunch",
        serviceId: "s1",
        serviceName: "Camp",
        description: null,
        isActive: true,
      },
    ]);
  });

  it("PUTs isActive false when deactivating", async () => {
    const detail: CatalogExtraDetail = {
      id: "extra-1",
      supplierId: "sup-1",
      title: "Lunch",
      serviceId: "s1",
      serviceName: "Camp",
      description: null,
      isActive: true,
      version: 1,
      notes: null,
      contractedExtra: null,
    };

    const updated: CatalogExtraDetail = {
      ...detail,
      isActive: false,
      version: 2,
    };

    mockGet.mockResolvedValueOnce(detail);
    mockPut.mockResolvedValueOnce(updated);

    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useToggleExtraStatus(), { wrapper });

    act(() => {
      result.current.mutate({
        extraId: "extra-1",
        supplierId: "sup-1",
        serviceId: "s1",
        activate: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPut).toHaveBeenCalledWith(
      "/catalog/extras/extra-1",
      expect.objectContaining({ isActive: false })
    );
  });
});
