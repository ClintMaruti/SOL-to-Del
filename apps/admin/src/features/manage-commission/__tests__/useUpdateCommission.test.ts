import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAgencyCommissionsQueryKey,
  type Commission,
} from "@/entities/commission";
import { createCommission } from "@/entities/commission/testing/factories";

import { useUpdateCommission } from "../api/useUpdateCommission";

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

vi.mock("@sol/ui", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockApi = api as unknown as {
  put: ReturnType<typeof vi.fn>;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      ),
  };
}

describe("useUpdateCommission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("updates a commission and keeps the cache sorted latest first", async () => {
    const existingCommissions = [
      createCommission("commission-2", "2026-08-01", {
        agencyId: "agency-1",
        commissionPercent: 9,
      }),
      createCommission("commission-1", "2026-06-01", {
        agencyId: "agency-1",
        commissionPercent: 7,
        version: 3,
      }),
    ];
    const updatedCommission = createCommission("commission-1", "2026-09-01", {
      agencyId: "agency-1",
      commissionPercent: 7.5,
      version: 4,
    });

    mockApi.put.mockResolvedValueOnce(updatedCommission);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData<Commission[]>(
      getAgencyCommissionsQueryKey("agency-1"),
      existingCommissions
    );

    const { result } = renderHook(() => useUpdateCommission(), { wrapper });

    act(() => {
      result.current.mutate({
        commissionId: "commission-1",
        payload: {
          effectiveFrom: "2026-09-01",
          commissionPercent: 7.5,
          version: 3,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.put).toHaveBeenCalledWith(
      "/catalog/commissions/commission-1",
      {
        effectiveFrom: "2026-09-01",
        commissionPercent: 7.5,
        version: 3,
      }
    );
    expect(
      queryClient.getQueryData(getAgencyCommissionsQueryKey("agency-1"))
    ).toEqual([updatedCommission, existingCommissions[0]]);
  });

  it("does not update the commissions cache when the update fails", async () => {
    const existingCommissions = [
      createCommission("commission-1", "2026-06-01", {
        agencyId: "agency-1",
        commissionPercent: 7,
        version: 3,
      }),
    ];

    mockApi.put.mockRejectedValueOnce(new Error("Update failed"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData<Commission[]>(
      getAgencyCommissionsQueryKey("agency-1"),
      existingCommissions
    );

    const { result } = renderHook(() => useUpdateCommission(), { wrapper });

    act(() => {
      result.current.mutate({
        commissionId: "commission-1",
        payload: {
          effectiveFrom: "2026-07-01",
          commissionPercent: 7.5,
          version: 3,
        },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryData(getAgencyCommissionsQueryKey("agency-1"))
    ).toEqual(existingCommissions);
  });
});
