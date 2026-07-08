import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteAgency } from "../api/useDeleteAgency";

// Mock the api module from @sol/api-client
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

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe("useDeleteAgency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Deletion", () => {
    it("should delete agency successfully", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      // Should not be pending initially
      expect(result.current.isPending).toBe(false);

      // Trigger mutation
      act(() => {
        result.current.mutate("agency-1");
      });

      // Wait for success
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify api was called with correct endpoint
      expect(mockApi.delete).toHaveBeenCalledWith("/catalog/agencies/agency-1");
      expect(mockApi.delete).toHaveBeenCalledTimes(1);

      // Verify agencies query was invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["agencies"] });
    });

    it("should delete agency with different IDs", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      act(() => {
        result.current.mutate("agency-123");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.delete).toHaveBeenCalledWith(
        "/catalog/agencies/agency-123"
      );
    });

    it("should return null on successful deletion", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      act(() => {
        result.current.mutate("agency-1");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeNull();
    });

    it("should call onSuccess callback when provided", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      const onSuccess = vi.fn();

      act(() => {
        result.current.mutate("agency-1", { onSuccess });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      act(() => {
        result.current.mutate("agency-1");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
    });

    it("should handle HTTP 404 error", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError("Agency not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      act(() => {
        result.current.mutate("non-existent-agency");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Agency not found");
    });

    it("should handle HTTP 500 error", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError("Internal Server Error", 500, "Server Error")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      act(() => {
        result.current.mutate("agency-1");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal Server Error");
    });

    it("should call onError callback when provided", async () => {
      const error = new Error("Delete failed");
      mockApi.delete.mockRejectedValueOnce(error);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      const onError = vi.fn();

      act(() => {
        result.current.mutate("agency-1", { onError });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(onError).toHaveBeenCalledWith(
        error,
        "agency-1",
        undefined, // context
        expect.anything() // mutation object
      );
    });

    it("should not invalidate queries on error", async () => {
      mockApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      act(() => {
        result.current.mutate("agency-1");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // invalidateQueries should not be called on error
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending State", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.delete.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate("agency-1");
      });

      // Wait for pending state to be true
      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!();

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Multiple Mutations", () => {
    it("should handle sequential deletions", async () => {
      mockApi.delete.mockResolvedValue(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      // First deletion
      act(() => {
        result.current.mutate("agency-1");
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Second deletion
      act(() => {
        result.current.mutate("agency-2");
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.delete).toHaveBeenCalledTimes(2);
      expect(mockApi.delete).toHaveBeenNthCalledWith(
        1,
        "/catalog/agencies/agency-1"
      );
      expect(mockApi.delete).toHaveBeenNthCalledWith(
        2,
        "/catalog/agencies/agency-2"
      );
    });
  });

  describe("Reset State", () => {
    it("should reset mutation state", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgency(), { wrapper });

      act(() => {
        result.current.mutate("agency-1");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isPending).toBe(false);
        expect(result.current.data).toBeUndefined();
      });
    });
  });
});
