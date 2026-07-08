import { api, QueryClient, QueryClientProvider } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { buildCatalogExtraPutBody } from "@/features/edit-extra/model/build-catalog-extra-put-body";
import type { EditExtraSubmitValues } from "@/features/edit-extra/model/schema";

import type { CatalogExtraDetail } from "../model/types";
import { useUpdateCatalogExtra } from "../api/useUpdateCatalogExtra";

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

const mockPut = vi.mocked(api.put);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 60_000 },
      mutations: { retry: false },
    },
  });
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe("useUpdateCatalogExtra", () => {
  it("calls PUT /catalog/extras/:id with API-shaped body", async () => {
    const extra: CatalogExtraDetail = {
      id: "extra-1",
      supplierId: "sup-1",
      title: "Lunch",
      serviceId: "s1",
      serviceName: "Camp",
      description: "x",
      isActive: true,
      notes: null,
      version: 2,
      contractedExtra: {
        id: "ce-1",
        contractId: "c1",
        extraType: "Optional",
        chargeType: "Person",
        timeUnit: "Night",
        travelFrom: "2025-06-01",
        travelTo: "2025-10-31",
        net: null,
        rack: { amount: 35, currency: "USD" },
        sell: { amount: 40, currency: "USD" },
        version: 1,
      },
    };

    const values: EditExtraSubmitValues = {
      title: "Lunch",
      serviceIds: ["s1"],
      description: "x",
      notes: { id: null, text: "", version: 0 },
      contracted: {
        contractedExtraId: "ce-1",
        contractedExtraVersion: 1,
        contractId: "c1",
        validFrom: "2025-06-01",
        validTo: "2026-05-31",
        extraRequirement: "optional",
        chargeType: "person",
        timeUnit: "night",
        travelDates: [
          {
            id: "td-1",
            travelFrom: "2025-06-01",
            travelTo: "2025-10-31",
            net: "",
            rack: "35",
            sell: "40",
          },
        ],
      },
    };

    const body = buildCatalogExtraPutBody({ extra, values });

    mockPut.mockResolvedValueOnce({
      id: "extra-1",
      supplierId: "sup-1",
      title: "Lunch",
      serviceIds: ["s1"],
      description: "x",
      isActive: true,
      version: 3,
      notes: null,
      contractedExtra: extra.contractedExtra,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCatalogExtra(), { wrapper });

    act(() => {
      result.current.mutate({
        extraId: "extra-1",
        supplierId: "sup-1",
        body,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPut).toHaveBeenCalledWith(
      "/catalog/extras/extra-1",
      expect.objectContaining({
        title: "Lunch",
        version: 2,
        contractedExtra: expect.objectContaining({
          extraType: "Optional",
          chargeType: "Person",
          timeUnit: "Night",
          travelFrom: "2025-06-01",
          travelTo: "2025-10-31",
        }),
      })
    );
  });
});
