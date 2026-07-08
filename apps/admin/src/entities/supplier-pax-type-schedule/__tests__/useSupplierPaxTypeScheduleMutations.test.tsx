import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { supplierPaxTypeSchedulesQueryKey } from "../api/queryKeys";
import { useCreateSupplierPaxTypeSchedule } from "../api/useCreateSupplierPaxTypeSchedule";
import { useUpdateSupplierPaxTypeSchedule } from "../api/useUpdateSupplierPaxTypeSchedule";
import type { SupplierPaxTypeSchedule } from "../model/types";

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

vi.mock("@sol/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/ui")>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn() },
  };
});

const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const responseSchedule = {
  id: "schedule-1",
  supplierId: "sup-1",
  validFrom: "2026-01-01",
  validTo: null,
  version: 1,
  paxTypes: [
    {
      id: "pax-adt",
      name: "Adult",
      paxType: "Adult",
      ageFrom: 18,
      ageTo: 999,
      isActive: true,
      version: 1,
      isAdult: true,
      isInfant: false,
      canDeactivate: false,
      hasActiveDownstreamReferences: false,
    },
  ],
};

describe("supplier pax type schedule mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates under the supplier route and inserts into the list cache", async () => {
    mockPost.mockResolvedValueOnce(responseSchedule);
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateSupplierPaxTypeSchedule(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        supplierId: "sup-1",
        validFrom: "2026-01-01",
        validTo: null,
        paxTypes: [
          {
            name: "Adult",
            paxType: "Adult",
            ageFrom: 18,
            ageTo: 999,
            isActive: true,
          },
          {
            name: "Child",
            paxType: "Child",
            ageFrom: 2,
            ageTo: 17,
            isActive: true,
          },
          {
            name: "Infant",
            paxType: "Infant",
            ageFrom: null,
            ageTo: null,
            isActive: false,
          },
          {
            name: "Teen",
            paxType: "Teen",
            ageFrom: null,
            ageTo: null,
            isActive: false,
          },
        ],
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/catalog/suppliers/sup-1/pax-type-schedules",
      {
        supplierId: "sup-1",
        validFrom: "2026-01-01",
        validTo: null,
        paxTypes: [
          {
            name: "Adult",
            paxType: "Adult",
            ageFrom: 18,
            ageTo: 999,
            isActive: true,
          },
          {
            name: "Child",
            paxType: "Child",
            ageFrom: 2,
            ageTo: 17,
            isActive: true,
          },
          {
            name: "Infant",
            paxType: "Infant",
            ageFrom: null,
            ageTo: null,
            isActive: false,
          },
          {
            name: "Teen",
            paxType: "Teen",
            ageFrom: null,
            ageTo: null,
            isActive: false,
          },
        ],
      }
    );
    expect(
      queryClient.getQueryData<SupplierPaxTypeSchedule[]>(
        supplierPaxTypeSchedulesQueryKey("sup-1")
      )?.[0].id
    ).toBe("schedule-1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: supplierPaxTypeSchedulesQueryKey("sup-1"),
    });
  });

  it("updates via the schedule route and invalidates the supplier list", async () => {
    mockPut.mockResolvedValueOnce({
      ...responseSchedule,
      validTo: "2026-12-31",
    });
    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData<SupplierPaxTypeSchedule[]>(
      supplierPaxTypeSchedulesQueryKey("sup-1"),
      [
        {
          ...responseSchedule,
          validTo: null,
          paxTypes: [],
        } as SupplierPaxTypeSchedule,
      ]
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateSupplierPaxTypeSchedule(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "schedule-1",
        supplierId: "sup-1",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        version: 1,
        paxTypes: [],
      });
    });

    expect(mockPut).toHaveBeenCalledWith(
      "/catalog/pax-type-schedules/schedule-1",
      {
        supplierId: "sup-1",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        version: 1,
        paxTypes: [],
      }
    );
    expect(
      queryClient.getQueryData<SupplierPaxTypeSchedule[]>(
        supplierPaxTypeSchedulesQueryKey("sup-1")
      )?.[0].validTo
    ).toBe("2026-12-31");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: supplierPaxTypeSchedulesQueryKey("sup-1"),
    });
  });

  it("invalidates on stale update conflict", async () => {
    mockPut.mockRejectedValueOnce(
      new ApiError(
        "This PAX Configuration was updated by another user. Refresh and try again.",
        409,
        "Conflict"
      )
    );
    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateSupplierPaxTypeSchedule(), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({
        id: "schedule-1",
        supplierId: "sup-1",
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        version: 99,
        paxTypes: [],
      })
    ).rejects.toBeInstanceOf(ApiError);

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: supplierPaxTypeSchedulesQueryKey("sup-1"),
    });
  });
});
