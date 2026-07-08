import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyGroups } from "../api/useAgencyGroups";

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

describe("useAgencyGroups", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch agency groups successfully", async () => {
    const mockData = [
      {
        id: "ag-1",
        name: "AAConsultants",
        description: "Internal group",
        numberOfAgencies: 1,
        isActive: true,
      },
      {
        id: "ag-2",
        name: "AngamaSpecial",
        description: null,
        numberOfAgencies: 6,
        isActive: true,
      },
    ];

    mockApi.get.mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useAgencyGroups(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].id).toBe("ag-1");
    expect(result.current.data![0].name).toBe("AAConsultants");
    expect(result.current.data![0].numberOfAgencies).toBe(1);
    expect(result.current.data![1].name).toBe("AngamaSpecial");
    expect(mockApi.get).toHaveBeenCalledWith("/catalog/agency-groups");
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

    const { result } = renderHook(() => useAgencyGroups(), {
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

    const { result } = renderHook(() => useAgencyGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Request failed: Not Found");
    expect(result.current.data).toBeUndefined();
  });

  it("should transform empty array correctly", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useAgencyGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("should call api with correct endpoint", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useAgencyGroups(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith("/catalog/agency-groups");
  });

  it("should not fetch agency groups when disabled", () => {
    const { result } = renderHook(() => useAgencyGroups({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});
