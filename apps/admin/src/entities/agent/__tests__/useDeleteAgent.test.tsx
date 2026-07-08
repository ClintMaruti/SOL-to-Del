import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteAgent } from "../api/useDeleteAgent";

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

describe("useDeleteAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Deletion", () => {
    it("should delete agent successfully", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate("agent-1");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.delete).toHaveBeenCalledWith("/catalog/agents/agent-1");
      expect(mockApi.delete).toHaveBeenCalledTimes(1);

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["agents"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["agencies"] });
    });

    it("should return null on success", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("agent-1");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeNull();
    });

    it("should handle deleting different agents", async () => {
      mockApi.delete
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("agent-1");
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      act(() => {
        result.current.mutate("agent-2");
      });
      await waitFor(() =>
        expect(mockApi.delete).toHaveBeenCalledWith("/catalog/agents/agent-2")
      );

      expect(mockApi.delete).toHaveBeenCalledTimes(2);
      expect(mockApi.delete).toHaveBeenNthCalledWith(
        1,
        "/catalog/agents/agent-1"
      );
      expect(mockApi.delete).toHaveBeenNthCalledWith(
        2,
        "/catalog/agents/agent-2"
      );
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
      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("agent-1");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
    });

    it("should handle HTTP 404 error", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError("Agent not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("non-existent-agent");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Agent not found");
    });

    it("should handle HTTP 500 error", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError("Internal Server Error", 500, "Server Error")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("agent-1");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal Server Error");
    });

    it("should not invalidate queries on error", async () => {
      mockApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("agent-1");
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending State", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: (value: undefined) => void;
      const promise = new Promise<undefined>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.delete.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate("agent-1");
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!(undefined);

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Query Invalidation", () => {
    it("should invalidate agents query on success", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("agent-1");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["agents"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["agencies"] });
      expect(invalidateSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("API Endpoint", () => {
    it("should call correct DELETE endpoint with agent ID", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgent(), { wrapper });

      act(() => {
        result.current.mutate("agent-123");
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.delete).toHaveBeenCalledWith("/catalog/agents/agent-123");
    });
  });
});
