import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteSupplier } from "../api/useDeleteSupplier";

vi.mock("@sol/ui", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
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

describe("useDeleteSupplier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should delete supplier successfully", async () => {
    mockApi.delete.mockResolvedValueOnce(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteSupplier(), { wrapper });

    expect(result.current.isPending).toBe(false);

    act(() => {
      result.current.mutate("sup-1");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.delete).toHaveBeenCalledWith("/catalog/suppliers/sup-1");
    expect(mockApi.delete).toHaveBeenCalledTimes(1);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["suppliers"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["supplier-head-offices"],
    });
  });

  it("should handle 404 error", async () => {
    mockApi.delete.mockRejectedValueOnce(
      new ApiError("Resource not found", 404, "Not Found")
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteSupplier(), { wrapper });

    act(() => {
      result.current.mutate("non-existent-id");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiError);
  });
});
