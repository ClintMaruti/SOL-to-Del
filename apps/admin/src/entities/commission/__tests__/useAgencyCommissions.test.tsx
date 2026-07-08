import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyCommissions } from "../api/useAgencyCommissions";
import { createCommission } from "../testing/factories";

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

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
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

describe("useAgencyCommissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches commissions from the agency commissions endpoint and sorts them latest first", async () => {
    const commissions = [
      createCommission("commission-1", "2026-06-01", {
        commissionPercent: 7,
      }),
      createCommission("commission-2", "2026-09-20", {
        commissionPercent: 6,
      }),
      createCommission("commission-3", "2026-04-16", {
        commissionPercent: 4,
      }),
    ];

    mockApi.get.mockResolvedValueOnce(commissions);

    const { result } = renderHook(() => useAgencyCommissions("agency-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      commissions[1],
      commissions[0],
      commissions[2],
    ]);
    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/agencies/agency-1/commissions"
    );
  });

  it("does not fetch when agencyId is missing", () => {
    const { result } = renderHook(() => useAgencyCommissions(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it("returns an empty array when the API returns a non-array payload", async () => {
    mockApi.get.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAgencyCommissions("agency-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("surfaces request errors", async () => {
    mockApi.get.mockRejectedValueOnce(
      new ApiError("Network error: Unable to reach the server", 0, "Network")
    );

    const { result } = renderHook(() => useAgencyCommissions("agency-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe(
      "Network error: Unable to reach the server"
    );
  });
});
