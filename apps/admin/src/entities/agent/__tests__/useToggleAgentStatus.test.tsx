import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleAgentStatus } from "../api/useToggleAgentStatus";
import type { Agent } from "../model/types";
import { createAgent } from "../testing/factories";

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

describe("useToggleAgentStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Toggle", () => {
    it("should activate agent successfully", async () => {
      const updatedAgent = createAgent("agent-1", "Test", "Agent", {
        isActive: true,
      });

      mockApi.patch.mockResolvedValueOnce(updatedAgent);

      const { wrapper, queryClient } = createWrapper();
      const initialAgents = [
        createAgent("agent-1", "Test", "Agent", { isActive: false }),
      ];
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: true });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agents/agent-1/activate"
      );
      expect(mockApi.patch).toHaveBeenCalledTimes(1);

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["agents"],
        expect.any(Function)
      );
      const updater = setQueryDataSpy.mock.calls[0]?.[1] as (
        prev: Agent[] | undefined
      ) => Agent[];
      expect(updater(initialAgents)).toEqual([updatedAgent]);
    });

    it("should return updated agent on success", async () => {
      const updatedAgent = createAgent("agent-1", "Test", "Agent", {
        isActive: false,
      });

      mockApi.patch.mockResolvedValueOnce(updatedAgent);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: false });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedAgent);
      expect(result.current.data?.isActive).toBe(false);
    });

    it("should deactivate agent", async () => {
      const updatedAgent = createAgent("agent-1", "Test", "Agent", {
        isActive: false,
      });

      mockApi.patch.mockResolvedValueOnce(updatedAgent);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: false });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agents/agent-1/deactivate"
      );
    });

    it("should handle different agents with activate/deactivate", async () => {
      const agent1 = createAgent("agent-1", "Agent", "One", {
        isActive: true,
      });
      const agent2 = createAgent("agent-2", "Agent", "Two", {
        isActive: false,
      });

      mockApi.patch.mockResolvedValueOnce(agent1).mockResolvedValueOnce(agent2);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: true });
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.id).toBe("agent-1");

      act(() => {
        result.current.mutate({ agentId: "agent-2", activate: false });
      });
      await waitFor(() => expect(result.current.data?.id).toBe("agent-2"));

      expect(mockApi.patch).toHaveBeenCalledTimes(2);
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        1,
        "/catalog/agents/agent-1/activate"
      );
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        2,
        "/catalog/agents/agent-2/deactivate"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: true });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
    });

    it("should handle HTTP 404 error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Agent not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({
          agentId: "non-existent-agent",
          activate: true,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Agent not found");
    });

    it("should handle HTTP 500 error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Internal Server Error", 500, "Server Error")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: false });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal Server Error");
    });

    it("should not update query cache on error", async () => {
      mockApi.patch.mockRejectedValueOnce(new Error("Toggle failed"));

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: true });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(setQueryDataSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending State", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: (value: Agent) => void;
      const promise = new Promise<Agent>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.patch.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: true });
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      const updatedAgent = createAgent("agent-1", "Test", "Agent");
      resolvePromise!(updatedAgent);

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Query cache update", () => {
    it("should update agents query cache with returned agent on success", async () => {
      const updatedAgent = createAgent("agent-1", "Test", "Agent", {
        isActive: true,
      });
      mockApi.patch.mockResolvedValueOnce(updatedAgent);

      const { wrapper, queryClient } = createWrapper();
      const initialAgents = [
        createAgent("agent-1", "Test", "Agent", { isActive: false }),
        createAgent("agent-2", "Other", "Agent"),
      ];
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-1", activate: true });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["agents"],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["agent", "agent-1"],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledTimes(2);
      const listUpdater = setQueryDataSpy.mock.calls.find(
        (c) => Array.isArray(c[0]) && c[0][0] === "agents" && c[0].length === 1
      )?.[1] as (prev: Agent[] | undefined) => Agent[];
      const nextData = listUpdater(initialAgents);
      expect(nextData).toHaveLength(2);
      expect(nextData[0]).toEqual(updatedAgent);
      expect(nextData[1]).toEqual(initialAgents[1]);
    });
  });

  describe("API Endpoint", () => {
    it("should call activate endpoint when activate is true", async () => {
      const updatedAgent = createAgent("agent-123", "Test", "Agent");
      mockApi.patch.mockResolvedValueOnce(updatedAgent);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-123", activate: true });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agents/agent-123/activate"
      );
    });

    it("should call deactivate endpoint when activate is false", async () => {
      const updatedAgent = createAgent("agent-123", "Test", "Agent", {
        isActive: false,
      });
      mockApi.patch.mockResolvedValueOnce(updatedAgent);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgentStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agentId: "agent-123", activate: false });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agents/agent-123/deactivate"
      );
    });
  });
});
