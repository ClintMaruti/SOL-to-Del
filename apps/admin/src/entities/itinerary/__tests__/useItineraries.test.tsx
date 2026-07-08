import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ITINERARIES_SEARCH_PATH,
  buildItinerariesSearchRequestBody,
} from "../api/request";
import { useItineraries } from "../api/useItineraries";

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
  post: ReturnType<typeof vi.fn>;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockListItem = {
  id: "1",
  reference: "AN1",
  title: null,
  agency: "A",
  agent: null,
  safariPlanner: "U",
  travelDateFrom: "2026-01-01",
  travelDateTo: "2026-01-10",
  status: "DRAFT" as const,
  paymentStatus: "UNPAID" as const,
  totalUsd: 0,
  balanceUsd: 0,
  updatedAt: "2026-01-02",
  createdAt: "2026-01-02",
  version: 1,
};

describe("useItineraries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts search body with PascalCase enums and mapped filters", async () => {
    mockApi.post.mockResolvedValueOnce({
      items: [mockListItem],
      total: 1,
    });

    const { result } = renderHook(
      () =>
        useItineraries({
          search: "AN1",
          hideCompleted: true,
          sort: "reference",
          order: "desc",
          agencyId: "agency-guid",
          destinationId: "loc-guid",
          dateFrom: "2026-01-01",
          dateTo: "2026-12-31",
          createdOnFrom: "2026-02-01",
          createdOnTo: "2026-02-28",
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.post).toHaveBeenCalledWith(
      ITINERARIES_SEARCH_PATH,
      expect.objectContaining({
        pageSize: 50,
        sortBy: "Reference",
        sortDirection: "Desc",
        search: "AN1",
        agencyIds: ["agency-guid"],
        locationIds: ["loc-guid"],
        travelDateFrom: "2026-01-01",
        travelDateTo: "2026-12-31",
        createdAtFrom: "2026-02-01",
        createdAtTo: "2026-02-28",
        hideCompleted: true,
      })
    );
    expect(result.current.data?.total).toBe(1);
  });

  it("normalizes envelope with items and cursor but no total (uses items length)", async () => {
    mockApi.post.mockResolvedValueOnce({
      items: [mockListItem],
      cursor: null,
    });

    const { result } = renderHook(() => useItineraries({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.post).toHaveBeenCalledWith(
      ITINERARIES_SEARCH_PATH,
      expect.objectContaining({
        sortBy: "None",
        sortDirection: "Asc",
      })
    );
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.total).toBe(1);
  });

  it("normalizes array response to items and total", async () => {
    mockApi.post.mockResolvedValueOnce([mockListItem]);

    const { result } = renderHook(() => useItineraries({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.total).toBe(1);
  });
});

describe("buildItinerariesSearchRequestBody", () => {
  it("matches sample backend contract shape", () => {
    const body = buildItinerariesSearchRequestBody({
      sort: "updatedAt",
      order: "asc",
      search: "smith",
      agencyId: "A1B82341-D6AD-486F-AFCA-786411C5EF9C",
      destinationId: "6C64EB3C-D06C-45D8-845D-7710F76E97F4",
      dateFrom: "2026-03-01",
      dateTo: "2026-12-01",
      createdOnFrom: "2026-02-01",
      createdOnTo: "2026-02-28",
    });

    expect(body).toEqual({
      pageSize: 50,
      sortBy: "UpdatedAt",
      sortDirection: "Asc",
      search: "smith",
      agencyIds: ["A1B82341-D6AD-486F-AFCA-786411C5EF9C"],
      locationIds: ["6C64EB3C-D06C-45D8-845D-7710F76E97F4"],
      travelDateFrom: "2026-03-01",
      travelDateTo: "2026-12-01",
      createdAtFrom: "2026-02-01",
      createdAtTo: "2026-02-28",
    });
  });

  it("maps travel date sort field to backend TravelDateFrom sortBy", () => {
    expect(
      buildItinerariesSearchRequestBody({
        sort: "travelDateFrom",
        order: "desc",
      }).sortBy
    ).toBe("TravelDateFrom");
  });

  it("includes hideCompleted when true", () => {
    expect(
      buildItinerariesSearchRequestBody({ hideCompleted: true })
    ).toMatchObject({ hideCompleted: true });
    expect(
      buildItinerariesSearchRequestBody({ hideCompleted: false })
    ).not.toHaveProperty("hideCompleted");
    expect(buildItinerariesSearchRequestBody({})).not.toHaveProperty(
      "hideCompleted"
    );
  });
});
