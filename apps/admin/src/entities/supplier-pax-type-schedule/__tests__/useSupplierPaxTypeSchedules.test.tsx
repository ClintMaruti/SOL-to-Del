import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierPaxTypeSchedules } from "../api/useSupplierPaxTypeSchedules";

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

const mockGet = vi.mocked(api.get);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 1000 * 60 * 5 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useSupplierPaxTypeSchedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call the API for an empty supplier id", () => {
    const { result } = renderHook(() => useSupplierPaxTypeSchedules(null), {
      wrapper: createWrapper(),
    });

    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
  });

  it("loads, guards, normalizes, and sorts supplier schedules", async () => {
    mockGet.mockResolvedValueOnce([
      {
        id: "old",
        supplierId: "sup-1",
        validFrom: "2025-01-01",
        validTo: "2025-12-31",
        paxTypes: null,
      },
      {
        id: "new",
        supplierId: "sup-1",
        validFrom: "2026-01-01",
        validTo: null,
        paxTypes: [
          {
            id: "adt",
            name: "Adult",
            paxType: "Adult",
            ageFrom: 18,
            ageTo: 999,
            isActive: true,
          },
        ],
      },
    ]);

    const { result } = renderHook(() => useSupplierPaxTypeSchedules("sup-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toHaveLength(2));

    expect(mockGet).toHaveBeenCalledWith(
      "/catalog/suppliers/sup-1/pax-type-schedules"
    );
    expect(result.current.data?.map((schedule) => schedule.id)).toEqual([
      "new",
      "old",
    ]);
    expect(result.current.data?.[0].paxTypes[0]).toMatchObject({
      code: "ADT",
      isAdult: true,
      canDeactivate: false,
    });
  });
});
