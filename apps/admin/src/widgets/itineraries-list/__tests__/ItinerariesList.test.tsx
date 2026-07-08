import { QueryClient, QueryClientProvider } from "@sol/api-client";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ItinerariesList } from "../ui/ItinerariesList";

const mockUseItineraries = vi.fn();

vi.mock("@/entities/itinerary", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/itinerary")>();
  return {
    ...actual,
    useItineraries: (...args: unknown[]) => mockUseItineraries(...args),
  };
});

vi.mock("@/entities/agency", () => ({
  useAgencies: () => ({ data: [] }),
}));

vi.mock("@/entities/agent", () => ({
  useAgents: () => ({ data: [] }),
}));

vi.mock("@/entities/destination", () => ({
  useDestinations: () => ({ data: [] }),
}));

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe("ItinerariesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton while fetching", () => {
    mockUseItineraries.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      isFetching: true,
      refetch: vi.fn(),
    });

    render(<ItinerariesList onCreate={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(document.querySelector("table")).not.toBeNull();
  });

  it("shows empty state when there are no items", () => {
    mockUseItineraries.mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ItinerariesList onCreate={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/No itineraries yet/i)).toBeTruthy();
  });

  it("renders CRM ref in table when data exists", () => {
    mockUseItineraries.mockReturnValue({
      data: {
        items: [
          {
            id: "id-1",
            crmReferenceNumber: "AN9999",
            travelDateFrom: "2026-06-01",
            travelDateTo: "2026-06-20",
            agency: "Test Agency",
            agent: "Agent Name",
            leadTravelerName: "Lead",
            createdBy: "Booker",
            createdAt: "2026-05-01",
            version: 1,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ItinerariesList onCreate={vi.fn()} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("link", { name: "AN9999" })).toBeTruthy();
    const duplicateBtn = screen.getByRole("button", {
      name: /duplicate itinerary/i,
    });
    const editBtn = screen.getByRole("button", { name: /edit itinerary/i });
    expect((duplicateBtn as HTMLButtonElement).disabled).toBe(true);
    expect((editBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
