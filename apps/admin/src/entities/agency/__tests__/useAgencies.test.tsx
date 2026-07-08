import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencies } from "../api/useAgencies";
import type { Agency } from "../model/types";
import { createAgency } from "../testing/factories";

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
        retry: false, // Disable retries for testing
        gcTime: 0, // Disable cache for testing
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useAgencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Fetch", () => {
    it("should fetch agencies successfully", async () => {
      const mockAgencies: Agency[] = [
        createAgency("agency-1", "Kilimanjaro Experts", {
          agentsCount: 5,
          isActive: true,
          sourceMarketId: "FIT",
          agencyGroupId: "AAConsultants",
          assignedSafariPlannerName: "Erik Karlsson",
        }),
        createAgency("agency-2", "Serengeti Adventures", {
          agentsCount: 7,
          isActive: true,
          sourceMarketId: "UK",
          agencyGroupId: "AngamaSpecial",
          assignedSafariPlannerName: "Amelia Earhart",
        }),
      ];

      mockApi.get.mockResolvedValueOnce(mockAgencies);

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data to load
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify data
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].id).toBe("agency-1");
      expect(result.current.data![0].name).toBe("Kilimanjaro Experts");
      expect(result.current.data![1].id).toBe("agency-2");
      expect(result.current.data![1].name).toBe("Serengeti Adventures");

      // Verify api was called with correct endpoint
      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agencies");
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("should handle empty agencies array", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it("should return agencies with all fields populated", async () => {
      const mockAgency = createAgency("agency-1", "Test Agency", {
        email: "test@agency.com",
        number: "+255 123 456 789",
        agentsCount: 10,
        isActive: false,
        sourceMarketId: "AF",
        agencyGroupId: "CPSRack",
        assignedSafariPlannerName: "Sofia Rodriguez",
      });

      mockApi.get.mockResolvedValueOnce([mockAgency]);

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const agency = result.current.data![0];
      expect(agency.email).toBe("test@agency.com");
      expect(agency.number).toBe("+255 123 456 789");
      expect(agency.agentsCount).toBe(10);
      expect(agency.isActive).toBe(false);
      expect(agency.sourceMarketId).toBe("AF");
      expect(agency.agencyGroupIds).toEqual(["CPSRack"]);
      expect(agency.assignedSafariPlannerName).toBe("Sofia Rodriguez");
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

      const { result } = renderHook(() => useAgencies(), {
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

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Request failed: Not Found");
      expect(result.current.data).toBeUndefined();
    });

    it("should handle HTTP 500 error", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Internal Server Error", 500, "Server Error")
      );

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Internal Server Error");
    });

    it("should handle unauthorized error", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Unauthorized", 401, "Unauthorized")
      );

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Unauthorized");
    });
  });

  describe("Loading State", () => {
    it("should handle loading state correctly", async () => {
      let resolvePromise: (value: Agency[]) => void;
      const promise = new Promise<Agency[]>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.get.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      // Resolve the promise
      resolvePromise!([]);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });

    it("should transition from loading to success", async () => {
      const mockAgencies: Agency[] = [createAgency("agency-1", "Test Agency")];

      mockApi.get.mockResolvedValueOnce(mockAgencies);

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      // After loading
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("should transition from loading to error", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // After error
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe("Query Key", () => {
    it("should use 'agencies' as query key", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify api was called with the correct endpoint
      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agencies");
    });
  });

  describe("agencyGroupIds filter", () => {
    it("should call filtered endpoint when an agency group id is provided", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgencies("group-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith(
        "/catalog/agencies?agencyGroupIds=group-1"
      );
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("should call filtered endpoint with multiple agency group ids", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgencies(["group-2", "group-1"]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith(
        "/catalog/agencies?agencyGroupIds=group-1&agencyGroupIds=group-2"
      );
    });

    it("should call unfiltered endpoint when agencyGroupIds is null", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgencies(null), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agencies");
    });

    it("should call unfiltered endpoint when agencyGroupIds is undefined", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useAgencies(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/agencies");
    });

    it("should use separate query keys for different agency group filters", async () => {
      mockApi.get.mockResolvedValue([]);

      const wrapper = createWrapper();

      const { result: resultWithFilter } = renderHook(
        () => useAgencies("group-1"),
        { wrapper }
      );
      await waitFor(() =>
        expect(resultWithFilter.current.isSuccess).toBe(true)
      );

      const { result: resultNoFilter } = renderHook(() => useAgencies(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(resultNoFilter.current.isSuccess).toBe(true));

      const calls = mockApi.get.mock.calls.map((c) => c[0]);
      expect(calls).toContain("/catalog/agencies?agencyGroupIds=group-1");
      expect(calls).toContain("/catalog/agencies");
    });

    it("should return only agencies belonging to the provided group", async () => {
      const groupId = "group-1";
      const mockGroupAgencies: Agency[] = [
        createAgency("agency-10", "Safari Pros", {
          agencyGroupId: groupId,
          isActive: true,
        }),
        createAgency("agency-11", "Bush Explorers", {
          agencyGroupId: groupId,
          isActive: true,
        }),
      ];

      mockApi.get.mockResolvedValueOnce(mockGroupAgencies);

      const { result } = renderHook(() => useAgencies(groupId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      result.current.data!.forEach((agency) => {
        expect(agency.agencyGroupIds).toContain(groupId);
      });
    });

    it("should return empty array when no agencies belong to the provided group", async () => {
      mockApi.get.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAgencies("empty-group"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });
  });
});
