import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteSupplierService } from "../api/useDeleteSupplierService";

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

const mockApi = api as unknown as { delete: ReturnType<typeof vi.fn> };

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

describe("useDeleteSupplierService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful deletion", () => {
    it("should delete supplier service successfully", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteSupplierService(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({ serviceId: "service-1", supplierId: "sup-1" });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.delete).toHaveBeenCalledWith(
        "/catalog/services/service-1"
      );
      expect(mockApi.delete).toHaveBeenCalledTimes(1);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["supplier-services", "sup-1"],
      });
    });

    it("should return null on successful deletion", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteSupplierService(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ serviceId: "service-1", supplierId: "sup-1" });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeNull();
    });
  });

  describe("Error handling", () => {
    it("should handle network errors", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteSupplierService(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ serviceId: "service-1", supplierId: "sup-1" });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
    });

    it("should not invalidate queries on error", async () => {
      mockApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteSupplierService(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ serviceId: "service-1", supplierId: "sup-1" });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending state", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.delete.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteSupplierService(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({ serviceId: "service-1", supplierId: "sup-1" });
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!();

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });
});
