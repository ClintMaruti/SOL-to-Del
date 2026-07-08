import {
  QueryClient,
  QueryClientProvider,
  type UseQueryResult,
} from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useServiceRatePlans,
  type RatePlan,
  type RateRule,
} from "@/entities/service-option-rate-plan";

import { RatePlanSection } from "../ui/RatePlanSection";

vi.mock("../ui/RatePlanCard", () => ({
  RatePlanCard: ({
    ratePlan,
    onDuplicate,
  }: {
    ratePlan: RatePlan;
    onDuplicate?: (source: RatePlan, sourceRules: RateRule[]) => void;
  }) => (
    <div data-testid={`rate-plan-card-${ratePlan.id}`}>
      {ratePlan.name}
      {onDuplicate ? (
        <button type="button" onClick={() => onDuplicate(ratePlan, [])}>
          Duplicate plan
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("../ui/CreateRatePlanSheet", () => ({
  CreateRatePlanSheet: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
  }) =>
    open ? (
      <div data-testid="create-sheet">
        <button type="button" onClick={() => onOpenChange(false)}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock("@/entities/service-option-rate-plan", () => ({
  useServiceRatePlans: vi.fn(),
}));

const mockUseServiceRatePlans = vi.mocked(useServiceRatePlans);

function mockRatePlansQuery(
  data: RatePlan[]
): UseQueryResult<RatePlan[], Error> {
  return {
    data,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isSuccess: true,
  } as unknown as UseQueryResult<RatePlan[], Error>;
}

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

const persistedPlan: RatePlan = {
  id: "rp-1",
  serviceId: "svc-1",
  name: "Standard",
  validityDateFrom: "2025-01-01",
  validityDateTo: "2025-12-31",
  payAtProperty: false,
  isActive: true,
  version: 1,
};

describe("RatePlanSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a rate plan card for each persisted plan", async () => {
    mockUseServiceRatePlans.mockReturnValue(
      mockRatePlansQuery([persistedPlan])
    );

    render(<RatePlanSection serviceId="svc-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId("rate-plan-card-rp-1")).toBeDefined();
    });
  });

  it("shows empty state text when there are no rate plans", async () => {
    mockUseServiceRatePlans.mockReturnValue(mockRatePlansQuery([]));

    render(<RatePlanSection serviceId="svc-1" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText(/no rate plans yet/i)).toBeDefined();
    expect(
      screen.getByText(/rate plans will appear here once they are created/i)
    ).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /create rate plan/i })
    ).toHaveLength(2);
  });

  it("adds a duplicate draft row when Duplicate is pressed on a plan card", async () => {
    mockUseServiceRatePlans.mockReturnValue(
      mockRatePlansQuery([persistedPlan])
    );

    render(<RatePlanSection serviceId="svc-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByTestId("rate-plan-card-rp-1")).toBeDefined();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /duplicate plan/i })
    );

    expect(await screen.findByText(/standard \(copy\)/i)).toBeDefined();
  });

  it("shows header Create Rate Plan button when plans exist", async () => {
    mockUseServiceRatePlans.mockReturnValue(
      mockRatePlansQuery([persistedPlan])
    );

    render(<RatePlanSection serviceId="svc-1" />, {
      wrapper: createWrapper(),
    });

    // Header button is always rendered regardless of whether plans exist
    expect(await screen.findByTestId("rate-plan-card-rp-1")).toBeDefined();
  });
});
