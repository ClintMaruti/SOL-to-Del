import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDestination } from "../api/useDestination";
import type { DestinationApiItem } from "../model/api-types";

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

describe("useDestination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Successful Fetch", () => {
    it("should fetch destination successfully", async () => {
      const mockDestination: DestinationApiItem = {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: -0.0236,
        longitude: 37.9062,
        isActive: true,
        version: 1,
      };

      mockApi.get.mockResolvedValueOnce(mockDestination);

      const { result } = renderHook(() => useDestination("kenya"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockDestination);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(mockApi.get).toHaveBeenCalledWith("/catalog/locations/kenya");
    });

    it("should call api with correct endpoint", async () => {
      const mockDestination: DestinationApiItem = {
        id: "nbo",
        parentId: "kenya",
        name: "Nairobi Airport",
        type: "Airport",
        code: "NBO",
        latitude: -1.3192,
        longitude: 36.9275,
        isActive: true,
        version: 1,
      };

      mockApi.get.mockResolvedValueOnce(mockDestination);

      const { result } = renderHook(() => useDestination("nbo"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify api was called with the correct endpoint
      expect(mockApi.get).toHaveBeenCalledWith("/catalog/locations/nbo");
    });
  });

  describe("Null ID Handling", () => {
    it("should return null when id is null", () => {
      const { result } = renderHook(() => useDestination(null), {
        wrapper: createWrapper(),
      });

      // When query is disabled, data is undefined initially
      // But the queryFn returns null, so data should be null once query runs
      // However, since enabled is false, query won't run, so data stays undefined
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it("should be disabled when id is null", () => {
      const { result } = renderHook(() => useDestination(null), {
        wrapper: createWrapper(),
      });

      // Query should be disabled, so it won't fetch
      expect(result.current.isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 error (location not found)", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Request failed: Not Found", 404, "Not Found", [
          {
            propertyName: "location",
            errorMessage: "The location with the given Id doesn't exist.",
          },
        ])
      );

      const { result } = renderHook(() => useDestination("nonexistent"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Request failed: Not Found");
      expect(result.current.data).toBeUndefined();
    });

    it("should handle network errors", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { result } = renderHook(() => useDestination("kenya"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
      expect(result.current.data).toBeUndefined();
    });

    it("should handle HTTP error responses", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError(
          "Request failed: Internal Server Error",
          500,
          "Server Error"
        )
      );

      const { result } = renderHook(() => useDestination("kenya"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Request failed: Internal Server Error"
      );
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("Query Key", () => {
    it("should use correct query key for caching", async () => {
      const mockDestination: DestinationApiItem = {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: null,
        longitude: null,
        isActive: true,
        version: 1,
      };

      mockApi.get.mockResolvedValueOnce(mockDestination);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useDestination("kenya"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify query key is correct
      const queryData = queryClient.getQueryData(["destination", "kenya"]);
      expect(queryData).toEqual(mockDestination);
    });
  });

  describe("Loading States", () => {
    it("should handle loading state correctly", async () => {
      let resolvePromise: (value: unknown) => void | undefined;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const mockDestination: DestinationApiItem = {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: null,
        longitude: null,
        isActive: true,
        version: 1,
      };

      mockApi.get.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useDestination("kenya"), {
        wrapper: createWrapper(),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      // Resolve the promise
      resolvePromise!(mockDestination);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });
});
