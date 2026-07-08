import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateSupplierCloseout,
  type CreateSupplierCloseoutPayload,
} from "../api/useCreateSupplierCloseout";

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

const mockPost = vi.mocked(api.post);

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

const payload: CreateSupplierCloseoutPayload = {
  supplierId: "sup-1",
  travelDateFrom: "2026-06-01",
  travelDateTo: "2026-06-30",
  serviceId: "svc-1",
  serviceOptionId: null,
  reason: "Maintenance",
};

describe("useCreateSupplierCloseout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts to the supplier closeout endpoint with supplierId in the body", async () => {
    mockPost.mockResolvedValueOnce({
      id: "cl-1",
      ...payload,
      status: "Inactive",
      version: 1,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateSupplierCloseout(), {
      wrapper,
    });

    let created: Awaited<ReturnType<typeof result.current.mutateAsync>>;
    await act(async () => {
      created = await result.current.mutateAsync(payload);
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/catalog/suppliers/sup-1/closeouts",
      {
        supplierId: "sup-1",
        travelDateFrom: "2026-06-01",
        travelDateTo: "2026-06-30",
        serviceId: "svc-1",
        serviceOptionId: null,
        reason: "Maintenance",
      }
    );
    expect(created!.isActive).toBe(false);
  });

  it("invalidates supplier closeouts after creation", async () => {
    mockPost.mockResolvedValueOnce({
      id: "cl-1",
      ...payload,
      status: "Inactive",
      version: 1,
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateSupplierCloseout(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["supplier-closeouts", "sup-1"],
      });
    });
  });
});
