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

import { useCreateCommission } from "../api/useCreateCommission";

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
  post: ReturnType<typeof vi.fn>;
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

describe("useCreateCommission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a commission and keeps the agency commissions cache sorted latest first", async () => {
    const existingCommissions = [
      createCommission("commission-1", "2026-08-01", { agencyId: "agency-1" }),
    ];
    const createdCommission = createCommission("commission-2", "2026-09-01", {
      agencyId: "agency-1",
      commissionPercent: 7.5,
    });

    mockApi.post.mockResolvedValueOnce(createdCommission);

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData<Commission[]>(
      getAgencyCommissionsQueryKey("agency-1"),
      existingCommissions
    );

    const { result } = renderHook(() => useCreateCommission(), { wrapper });

    act(() => {
      result.current.mutate({
        agencyId: "agency-1",
        payload: {
          effectiveFrom: "2026-09-01",
          commissionPercent: 7.5,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.post).toHaveBeenCalledWith(
      "/catalog/agencies/agency-1/commissions",
      {
        effectiveFrom: "2026-09-01",
        commissionPercent: 7.5,
      }
    );
    expect(
      queryClient.getQueryData(getAgencyCommissionsQueryKey("agency-1"))
    ).toEqual([createdCommission, ...existingCommissions]);
  });

  it("does not update the commissions cache when creation fails", async () => {
    const existingCommissions = [
      createCommission("commission-1", "2026-06-01", { agencyId: "agency-1" }),
    ];

    mockApi.post.mockRejectedValueOnce(new Error("Create failed"));

    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData<Commission[]>(
      getAgencyCommissionsQueryKey("agency-1"),
      existingCommissions
    );

    const { result } = renderHook(() => useCreateCommission(), { wrapper });

    act(() => {
      result.current.mutate({
        agencyId: "agency-1",
        payload: {
          effectiveFrom: "2026-07-01",
          commissionPercent: 7.5,
        },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryData(getAgencyCommissionsQueryKey("agency-1"))
    ).toEqual(existingCommissions);
  });
});
