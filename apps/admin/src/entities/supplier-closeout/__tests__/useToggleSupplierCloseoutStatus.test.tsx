import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleSupplierCloseoutStatus } from "../api/useToggleSupplierCloseoutStatus";
import type { SupplierCloseout } from "../model/types";

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

vi.mock("@sol/ui", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockPatch = vi.mocked(api.patch);

const closeout: SupplierCloseout = {
  id: "cl-1",
  supplierId: "sup-1",
  serviceId: null,
  serviceOptionId: null,
  travelDateFrom: "2026-06-01",
  travelDateTo: "2026-06-30",
  reason: "Rain Season",
  status: "Active",
  isActive: true,
  version: 1,
};

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
    queryClient,
  };
}

describe("useToggleSupplierCloseoutStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls deactivate when the closeout is active", async () => {
    mockPatch.mockResolvedValueOnce({
      ...closeout,
      status: "Inactive",
      isActive: false,
      version: 2,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleSupplierCloseoutStatus(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        supplierId: "sup-1",
        closeoutId: "cl-1",
        isActive: true,
      });
    });

    expect(mockPatch).toHaveBeenCalledWith(
      "/catalog/closeouts/cl-1/deactivate"
    );
  });

  it("calls activate when the closeout is inactive", async () => {
    mockPatch.mockResolvedValueOnce({
      ...closeout,
      status: "Active",
      isActive: true,
      version: 2,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useToggleSupplierCloseoutStatus(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        supplierId: "sup-1",
        closeoutId: "cl-1",
        isActive: false,
      });
    });

    expect(mockPatch).toHaveBeenCalledWith("/catalog/closeouts/cl-1/activate");
  });

  it("updates supplier closeout list caches under the root key", async () => {
    mockPatch.mockResolvedValueOnce({
      ...closeout,
      status: "Inactive",
      isActive: false,
      version: 2,
    });

    const { wrapper, queryClient } = createWrapper();
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
    queryClient.setQueryData<SupplierCloseout[]>(
      ["supplier-closeouts", "sup-1"],
      [closeout]
    );

    const { result } = renderHook(() => useToggleSupplierCloseoutStatus(), {
      wrapper,
    });

    let updated: SupplierCloseout | undefined;
    await act(async () => {
      updated = await result.current.mutateAsync({
        supplierId: "sup-1",
        closeoutId: "cl-1",
        isActive: true,
      });
    });

    expect(updated?.isActive).toBe(false);

    const supplierListUpdate = setQueryDataSpy.mock.calls.find(
      ([queryKey, updater]) =>
        Array.isArray(queryKey) &&
        queryKey[0] === "supplier-closeouts" &&
        queryKey[1] === "sup-1" &&
        typeof updater === "function"
    )?.[1] as
      | ((previous: SupplierCloseout[] | undefined) => SupplierCloseout[])
      | undefined;

    expect(supplierListUpdate).toBeDefined();
    expect(supplierListUpdate?.([closeout])[0]).toMatchObject({
      id: "cl-1",
      status: "Inactive",
      isActive: false,
      version: 2,
    });
  });

  it("preserves service option scope fields when toggle response omits them", async () => {
    const optionCloseout: SupplierCloseout = {
      ...closeout,
      serviceId: "svc-1",
      serviceName: "Camp",
      serviceOptionId: "opt-1",
      serviceOptionName: "Game Package",
      status: "Inactive",
      isActive: false,
    };

    mockPatch.mockResolvedValueOnce({
      id: "cl-1",
      supplierId: "sup-1",
      travelDateFrom: "2026-06-01",
      travelDateTo: "2026-06-30",
      status: "Active",
      version: 2,
    });

    const { wrapper, queryClient } = createWrapper();
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
    queryClient.setQueryData<SupplierCloseout[]>(
      ["supplier-closeouts", "sup-1"],
      [optionCloseout]
    );

    const { result } = renderHook(() => useToggleSupplierCloseoutStatus(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        supplierId: "sup-1",
        closeoutId: "cl-1",
        isActive: false,
      });
    });

    const supplierListUpdate = setQueryDataSpy.mock.calls.find(
      ([queryKey, updater]) =>
        Array.isArray(queryKey) &&
        queryKey[0] === "supplier-closeouts" &&
        queryKey[1] === "sup-1" &&
        typeof updater === "function"
    )?.[1] as
      | ((previous: SupplierCloseout[] | undefined) => SupplierCloseout[])
      | undefined;

    expect(supplierListUpdate?.([optionCloseout])[0]).toMatchObject({
      id: "cl-1",
      serviceId: "svc-1",
      serviceName: "Camp",
      serviceOptionId: "opt-1",
      serviceOptionName: "Game Package",
      status: "Active",
      isActive: true,
      version: 2,
    });
  });
});
