import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useRatePlans } from "../api/useRatePlans";

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

describe("useRatePlans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch rate plans successfully", async () => {
    const mockData = [
      {
        id: "rp-1",
        name: "STD",
        validityDateFrom: "2025-10-01",
        validityDateTo: "2025-10-31",
        payAtProperty: true,
        isActive: false,
      },
      {
        id: "rp-2",
        name: "RACK",
        validityDateFrom: "2025-11-01",
        validityDateTo: "2025-12-31",
        payAtProperty: false,
        isActive: true,
      },
    ];

    mockApi.get.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useRatePlans("contract-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].id).toBe("rp-1");
    expect(result.current.data![0].name).toBe("STD");
    expect(result.current.data![0].payAtProperty).toBe(true);
    expect(result.current.data![1].name).toBe("RACK");
    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/contracts/contract-1/rate-plans"
    );
    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it("should call the correct endpoint with the given contractId", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useRatePlans("contract-99"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/contracts/contract-99/rate-plans"
    );
  });

  it("should return an empty array when the response is empty", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useRatePlans("contract-2"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("should handle network errors", async () => {
    mockApi.get.mockRejectedValueOnce(
      new ApiError(
        "Network error: Unable to reach the server",
        0,
        "Network Error"
      )
    );

    const { result } = renderHook(() => useRatePlans("contract-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(
      "Network error: Unable to reach the server"
    );
    expect(result.current.data).toBeUndefined();
  });

  it("should handle 404 HTTP error", async () => {
    mockApi.get.mockRejectedValueOnce(
      new ApiError("Request failed: Not Found", 404, "Not Found")
    );

    const { result } = renderHook(() => useRatePlans("contract-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Request failed: Not Found");
    expect(result.current.data).toBeUndefined();
  });

  it("should not fetch when contractId is empty", () => {
    const { result } = renderHook(() => useRatePlans(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});
