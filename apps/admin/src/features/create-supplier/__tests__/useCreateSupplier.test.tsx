import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplierDetail } from "@/entities/suppliers/model/types";

import { useCreateSupplier } from "../api/useCreateSupplier";

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const minimalCreatedSupplier = (id: string): SupplierDetail =>
  ({
    id,
    name: "New Supplier",
    code: "NS001",
    headOfficeId: "ho-1",
    isActive: true,
    countryId: "",
    city: "",
    postalCode: "",
    streetAddress: "",
    poBox: "",
    locationId: null,
    latitude: null,
    longitude: null,
    closestAirstrip: "",
    airstripLatitude: 0,
    airstripLongitude: 0,
    version: 1,
  }) as SupplierDetail;

describe("useCreateSupplier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("seeds supplier detail cache so detail route can render without initial skeleton gap", async () => {
    const created = minimalCreatedSupplier("sup-new");
    vi.mocked(api.post).mockResolvedValueOnce(created);

    const { wrapper, queryClient } = createWrapper();
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateSupplier(), { wrapper });

    act(() => {
      result.current.mutate({
        name: "New Supplier",
        headOfficeId: "ho-1",
        serviceTypeId: "st-1",
        starRating: 0,
        preferredSupplier: false,
        isActive: false,
        countryId: "",
      } as never);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ["suppliers", "sup-new"],
      expect.objectContaining({
        id: "sup-new",
        name: "New Supplier",
        code: "NS001",
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["suppliers"],
    });
  });
});
