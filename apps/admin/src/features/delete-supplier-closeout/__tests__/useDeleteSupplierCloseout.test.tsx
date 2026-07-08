import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteSupplierCloseout } from "../api/useDeleteSupplierCloseout";

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

const mockDelete = vi.mocked(api.delete);

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

describe("useDeleteSupplierCloseout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes by closeout id outside the supplier route", async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteSupplierCloseout(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        supplierId: "sup-1",
        closeoutId: "cl-1",
      });
    });

    expect(mockDelete).toHaveBeenCalledWith("/catalog/closeouts/cl-1");
  });

  it("invalidates supplier closeouts after deletion", async () => {
    mockDelete.mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteSupplierCloseout(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        supplierId: "sup-1",
        closeoutId: "cl-1",
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["supplier-closeouts", "sup-1"],
      });
    });
  });
});
