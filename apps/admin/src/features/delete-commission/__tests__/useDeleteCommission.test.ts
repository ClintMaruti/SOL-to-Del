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

import { useDeleteCommission } from "../api/useDeleteCommission";

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
  delete: ReturnType<typeof vi.fn>;
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

describe("useDeleteCommission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deletes a commission and removes it from the agency commissions cache", async () => {
    const existingCommissions = [
      createCommission("commission-1", "2026-06-01", { agencyId: "agency-1" }),
      createCommission("commission-2", "2026-08-01", { agencyId: "agency-1" }),
    ];

    mockApi.delete.mockResolvedValueOnce(undefined);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData<Commission[]>(
      getAgencyCommissionsQueryKey("agency-1"),
      existingCommissions
    );

    const { result } = renderHook(() => useDeleteCommission(), { wrapper });

    act(() => {
      result.current.mutate({
        agencyId: "agency-1",
        commissionId: "commission-1",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.delete).toHaveBeenCalledWith(
      "/catalog/commissions/commission-1"
    );
    expect(
      queryClient.getQueryData(getAgencyCommissionsQueryKey("agency-1"))
    ).toEqual([existingCommissions[1]]);
  });

  it("does not update the commissions cache when deletion fails", async () => {
    const existingCommissions = [
      createCommission("commission-1", "2026-06-01", { agencyId: "agency-1" }),
    ];

    mockApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData<Commission[]>(
      getAgencyCommissionsQueryKey("agency-1"),
      existingCommissions
    );

    const { result } = renderHook(() => useDeleteCommission(), { wrapper });

    act(() => {
      result.current.mutate({
        agencyId: "agency-1",
        commissionId: "commission-1",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryData(getAgencyCommissionsQueryKey("agency-1"))
    ).toEqual(existingCommissions);
  });
});
