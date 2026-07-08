import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/entities/auth";

import { useCreateItinerary } from "../api/useCreateItinerary";
import { getItinerariesQueryKey } from "../model/queryKeys";
import type {
  CreateItineraryPayload,
  ItinerariesListResponse,
  ItineraryListItem,
} from "../model/types";

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

const mockApi = api as unknown as { post: ReturnType<typeof vi.fn> };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
  const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

  return {
    queryClient,
    invalidateQueriesSpy,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const payload: CreateItineraryPayload = {
  mode: "new",
  travelDateFrom: "2026-03-01",
  travelDateTo: "2026-03-10",
  agencyId: "agency-2",
  agentId: "agent-2",
  leadTravelerFirstName: "David",
  leadTravelerLastName: "Smith",
  adultsCount: 2,
  childrenCount: 3,
  infantsCount: 1,
  childrenAges: [10, 12, 15],
};

const response: ItineraryListItem = {
  id: "itinerary-1",
  reference: "AN1234",
  title: null,
  agency: "Serengeti Adventures",
  agent: "Jomo Kenyatta",
  safariPlanner: "James Smith",
  travelDateFrom: "2026-03-01",
  travelDateTo: "2026-03-10",
  status: "DRAFT",
  paymentStatus: "UNPAID",
  totalUsd: 0,
  balanceUsd: 0,
  updatedAt: "2026-02-01",
  createdAt: "2026-02-01",
  version: 1,
};

describe("useCreateItinerary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it("posts the create payload and prepends the created itinerary to list caches", async () => {
    mockApi.post.mockResolvedValueOnce(response);
    const { wrapper, queryClient, invalidateQueriesSpy } = createWrapper();
    const listQueryKey = getItinerariesQueryKey({});
    queryClient.setQueryData<ItinerariesListResponse>(listQueryKey, {
      items: [
        {
          id: "existing-itinerary",
          reference: "AN0001",
          title: null,
          agency: "Existing Agency",
          agent: null,
          safariPlanner: "James Smith",
          travelDateFrom: "2026-01-01",
          travelDateTo: "2026-01-10",
          status: "DRAFT",
          paymentStatus: "UNPAID",
          totalUsd: 0,
          balanceUsd: 0,
          updatedAt: "2026-01-01",
          createdAt: "2026-01-01",
          version: 1,
        },
      ],
      total: 1,
    });

    const { result } = renderHook(() => useCreateItinerary(), { wrapper });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.post).toHaveBeenCalledWith(
      "/itinerary/itineraries",
      payload
    );
    expect(result.current.data).toEqual(response);
    expect(
      queryClient.getQueryData<ItinerariesListResponse>(listQueryKey)
    ).toMatchObject({
      items: [{ id: "itinerary-1" }, { id: "existing-itinerary" }],
      total: 2,
    });
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("maps safariPlanner from current user id to email for list cache and mutation data", async () => {
    useAuthStore.setState({
      user: {
        userId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
        email: "signed-in@example.com",
        roles: [],
      },
      isAuthenticated: true,
      isLoading: false,
    });

    const apiRow: ItineraryListItem = {
      ...response,
      id: "new-itinerary",
      safariPlanner: "A1B2C3D4-E5F6-4789-A012-3456789ABCDE",
    };
    mockApi.post.mockResolvedValueOnce(apiRow);
    const { wrapper, queryClient } = createWrapper();
    const listQueryKey = getItinerariesQueryKey({});
    queryClient.setQueryData<ItinerariesListResponse>(listQueryKey, {
      items: [],
      total: 0,
    });

    const { result } = renderHook(() => useCreateItinerary(), { wrapper });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.safariPlanner).toBe("signed-in@example.com");
    expect(
      queryClient.getQueryData<ItinerariesListResponse>(listQueryKey)?.items[0]
        ?.safariPlanner
    ).toBe("signed-in@example.com");
  });
});
