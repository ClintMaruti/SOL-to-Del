import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDestinations } from "../api/useDestinations";

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

describe("useDestinations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch and transform destinations successfully", async () => {
    const mockApiData = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: -0.0236,
        longitude: 37.9062,
        isActive: true,
        version: 1,
      },
      {
        id: "southern-kenya",
        parentId: "kenya",
        name: "Southern Kenya",
        type: "Region",
        code: "SKE",
        latitude: -1.2921,
        longitude: 36.8219,
        isActive: true,
        version: 1,
      },
    ];

    mockApi.get.mockResolvedValueOnce(mockApiData);

    const { result } = renderHook(() => useDestinations(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify data is transformed correctly
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].id).toBe("kenya");
    expect(result.current.data![0].name).toBe("Kenya");
    expect(result.current.data![0].type).toBe("Country");
    expect(result.current.data![0].status).toBe("Active");
    expect(result.current.data![0].coordinates).toEqual({
      lat: -0.0236,
      lng: 37.9062,
    });
    expect(result.current.data![0].children).toHaveLength(1);
    expect(result.current.data![0].children![0].id).toBe("southern-kenya");
    expect(result.current.data![0].children![0].type).toBe("Region");

    // Verify api was called with correct endpoint
    expect(mockApi.get).toHaveBeenCalledWith("/catalog/locations");
    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it("should handle network errors", async () => {
    mockApi.get.mockRejectedValueOnce(
      new ApiError(
        "Network error: Unable to reach the server",
        0,
        "Network Error"
      )
    );

    const { result } = renderHook(() => useDestinations(), {
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
      new ApiError("Request failed: Not Found", 404, "Not Found")
    );

    const { result } = renderHook(() => useDestinations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Request failed: Not Found");
    expect(result.current.data).toBeUndefined();
  });

  it("should handle API error response (success: false)", async () => {
    mockApi.get.mockRejectedValueOnce(
      new ApiError("Invalid request parameters", 200, "OK")
    );

    const { result } = renderHook(() => useDestinations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Invalid request parameters");
    expect(result.current.data).toBeUndefined();
  });

  it("should handle API error response with null error message", async () => {
    mockApi.get.mockRejectedValueOnce(
      new ApiError("Request failed", 200, "OK")
    );

    const { result } = renderHook(() => useDestinations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Request failed");
  });

  it("should transform empty array correctly", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useDestinations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("should handle destinations without coordinates", async () => {
    const mockApiData = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: null,
        longitude: null,
        isActive: true,
        version: 1,
      },
    ];

    mockApi.get.mockResolvedValueOnce(mockApiData);

    const { result } = renderHook(() => useDestinations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].coordinates).toBeUndefined();
    expect(result.current.data![0].code).toBe("KEN");
    expect(result.current.data![0].type).toBe("Country");
    expect(result.current.data![0].status).toBe("Active");
  });

  it("should call api with correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useDestinations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify api was called with the correct endpoint
    expect(mockApi.get).toHaveBeenCalledWith("/catalog/locations");
  });

  it("should handle loading state correctly", async () => {
    let resolvePromise: (value: unknown) => void | undefined;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockApi.get.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useDestinations(), {
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
});
