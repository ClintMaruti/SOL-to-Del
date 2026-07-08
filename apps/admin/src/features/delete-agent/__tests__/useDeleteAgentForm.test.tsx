import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Agent } from "@/entities/agent/model/types";
import { createAgent } from "@/entities/agent/testing/factories";

import { useDeleteAgentForm } from "../model/useDeleteAgentForm";

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

describe("useDeleteAgentForm", () => {
  let testAgent: Agent;

  beforeEach(() => {
    vi.clearAllMocks();
    testAgent = createAgent("agent-1", "Test", "Agent");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should return initial state with no error and not pending", () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.handleDelete).toBe("function");
      expect(typeof result.current.resetError).toBe("function");
    });
  });

  describe("Successful Deletion", () => {
    it("should call delete API with agent id", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(mockApi.delete).toHaveBeenCalledWith("/catalog/agents/agent-1");
    });

    it("should call onSuccess callback after successful deletion", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);
      const onSuccess = vi.fn();

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent, onSuccess }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));

      expect(result.current.error).toBeNull();
    });

    it("should not have error after successful deletion", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should set error on API failure", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError("Failed to delete agent", 500, "Server Error")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      expect(result.current.error?.message).toBe("Failed to delete agent");
    });

    it("should not call onSuccess on error", async () => {
      mockApi.delete.mockRejectedValueOnce(new Error("Delete failed"));
      const onSuccess = vi.fn();

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent, onSuccess }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should wrap non-Error objects in an Error", async () => {
      mockApi.delete.mockRejectedValueOnce("string error");

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to delete agent");
    });

    it("should clear error before retrying deletion", async () => {
      mockApi.delete
        .mockRejectedValueOnce(new Error("First failure"))
        .mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      // First attempt - fails
      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      // Second attempt - should clear error first then succeed
      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).toBeNull());
    });
  });

  describe("Null Agent", () => {
    it("should not call delete API when agent is null", () => {
      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteAgentForm({ agent: null }), {
        wrapper,
      });

      act(() => {
        result.current.handleDelete();
      });

      expect(mockApi.delete).not.toHaveBeenCalled();
    });

    it("should not call onSuccess when agent is null", () => {
      const onSuccess = vi.fn();

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: null, onSuccess }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Pending State", () => {
    it("should track pending state during deletion", async () => {
      let resolvePromise: (value: undefined) => void;
      const promise = new Promise<undefined>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.delete.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!(undefined);

      await waitFor(() => expect(result.current.isPending).toBe(false));
    });
  });

  describe("Reset Error", () => {
    it("should reset error when resetError is called", async () => {
      mockApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const { wrapper } = createWrapper();
      const { result } = renderHook(
        () => useDeleteAgentForm({ agent: testAgent }),
        { wrapper }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
