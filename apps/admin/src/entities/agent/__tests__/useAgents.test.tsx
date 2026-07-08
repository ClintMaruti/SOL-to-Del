import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgents } from "../api/useAgents";
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
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAgents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Fetch", () => {
    it("should fetch agents successfully", async () => {
      const mockAgents: Agent[] = [
        createAgent("agent-1", "Gugu", "Mbatha-Raw", {
          isActive: false,
          agencyName: "Kilimanjaro Experts",
          assignedSafariPlannerId: "sp-1",
          assignedSafariPlannerName: "Erik Karlsson",
        }),
        createAgent("agent-2", "Jomo", "Kenyatta", {
          isActive: true,
          agencyName: "Serengeti Adventures",
          assignedSafariPlannerId: "sp-2",
          assignedSafariPlannerName: "Amelia Earhart",
        }),
      ];

      mockApi.get.mockResolvedValueOnce(mockAgents);

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].id).toBe("agent-1");
      expect(result.current.data![0].firstName).toBe("Gugu");
      expect(result.current.data![0].lastName).toBe("Mbatha-Raw");
      expect(result.current.data![1].id).toBe("agent-2");
      expect(result.current.data![1].firstName).toBe("Jomo");
      expect(result.current.data![1].lastName).toBe("Kenyatta");

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agents");
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("should handle empty agents array", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it("should return agents with all fields populated", async () => {
      const mockAgent = createAgent("agent-1", "Test", "Agent", {
        primaryEmail: "test@agent.com",
        phoneNumber: "+1 23-555-901-2345",
        isActive: false,
        agencyName: "Okavango Explorers",
        assignedSafariPlannerId: "sp-3",
        assignedSafariPlannerName: "Sofia Rodriguez",
      });

      mockApi.get.mockResolvedValueOnce([mockAgent]);

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const agent = result.current.data![0];
      expect(agent.primaryEmail).toBe("test@agent.com");
      expect(agent.phoneNumber).toBe("+1 23-555-901-2345");
      expect(agent.isActive).toBe(false);
      expect(agent.agencyName).toBe("Okavango Explorers");
      expect(agent.assignedSafariPlannerName).toBe("Sofia Rodriguez");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
      expect(result.current.data).toBeUndefined();
    });

    it("should handle HTTP 404 error", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Request failed: Not Found", 404, "Not Found")
      );

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Request failed: Not Found");
      expect(result.current.data).toBeUndefined();
    });

    it("should handle HTTP 500 error", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Internal Server Error", 500, "Server Error")
      );

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal Server Error");
    });

    it("should handle unauthorized error", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Unauthorized", 401, "Unauthorized")
      );

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Unauthorized");
    });
  });

  describe("Loading State", () => {
    it("should handle loading state correctly", async () => {
      let resolvePromise: (value: Agent[]) => void;
      const promise = new Promise<Agent[]>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.get.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      resolvePromise!([]);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });

    it("should transition from loading to success", async () => {
      const mockAgents: Agent[] = [createAgent("agent-1", "Test", "Agent")];

      mockApi.get.mockResolvedValueOnce(mockAgents);

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("should transition from loading to error", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe("Query Key", () => {
    it("should use 'agents' as query key", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agents");
    });
  });

  describe("agencyId filter", () => {
    it("should call filtered endpoint when agencyId is provided", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgents("agency-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith(
        "/catalog/agents?agencyId=agency-1"
      );
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("should call unfiltered endpoint when agencyId is null", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgents(null), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agents");
    });

    it("should call unfiltered endpoint when agencyId is undefined", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgents(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agents");
    });

    it("should use separate query keys for different agencyId values", async () => {
      mockApi.get.mockResolvedValue([]);

      const { result: resultWithFilter } = renderHook(
        () => useAgents("agency-1"),
        { wrapper: createWrapper() }
      );
      await waitFor(() =>
        expect(resultWithFilter.current.isSuccess).toBe(true)
      );

      const { result: resultNoFilter } = renderHook(() => useAgents(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(resultNoFilter.current.isSuccess).toBe(true));

      const calls = mockApi.get.mock.calls.map((c) => c[0]);
      expect(calls).toContain("/catalog/agents?agencyId=agency-1");
      expect(calls).toContain("/catalog/agents");
    });

    it("should return only agents belonging to the provided agency", async () => {
      const agencyId = "agency-1";
      const mockAgencyAgents: Agent[] = [
        createAgent("agent-10", "Safari", "Pro", {
          agencyName: "Kilimanjaro Experts",
          isActive: true,
        }),
        createAgent("agent-11", "Bush", "Explorer", {
          agencyName: "Kilimanjaro Experts",
          isActive: true,
        }),
      ];

      mockApi.get.mockResolvedValueOnce(mockAgencyAgents);

      const { result } = renderHook(() => useAgents(agencyId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      result.current.data!.forEach((agent) => {
        expect(agent.agencyName).toBe("Kilimanjaro Experts");
      });
    });

    it("should return empty array when API returns null for the agency", async () => {
      mockApi.get.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAgents("empty-agency"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });
});
