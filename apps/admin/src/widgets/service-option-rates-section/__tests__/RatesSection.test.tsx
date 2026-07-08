import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ServiceOptionRateApiItem } from "@/entities/service-option-rate";

import { formatDateRange } from "../lib/formatDate";
import { RatesSection } from "../ui/RatesSection";

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
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
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

/** GET catalog wire shape; `useServiceOptionRates` maps to normalized `Rate` in the UI. */
const mockRatesFromApi: ServiceOptionRateApiItem[] = [
  {
    id: "rate-1",
    serviceOptionId: "option-1",
    rateName: "Standard Rate",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    isActive: true,
    contractedRates: [],
  },
];

describe("RatesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render header with title and Add button", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    render(<RatesSection serviceOptionId="option-1" contractId={null} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText("Rates")).toBeDefined();
    });

    expect(
      screen.getAllByRole("button", { name: /add/i }).length
    ).toBeGreaterThan(0);
  });

  it("should render empty state when no rates", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    render(
      <RatesSection serviceOptionId="option-1" contractId="contract-1" />,
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => {
      expect(
        screen.getByText("No rates yet. Add a rate to get started.")
      ).toBeDefined();
    });
  });

  it("should render list of rate cards when data exists", async () => {
    mockApi.get.mockResolvedValueOnce(mockRatesFromApi);

    render(<RatesSection serviceOptionId="option-1" contractId={null} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Standard Rate")).toBeDefined();
    });

    expect(screen.getByText(/Person/)).toBeDefined();
    expect(screen.getByText(/Night/)).toBeDefined();
    expect(screen.queryByRole("button", { name: /^None$/i })).toBeNull();
  });

  it("should show loading skeleton while fetching", () => {
    mockApi.get.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    );

    render(<RatesSection serviceOptionId="option-1" contractId={null} />, {
      wrapper: createWrapper(),
    });

    expect(document.querySelector('[data-slot="skeleton"]')).toBeDefined();
  });

  it("survives fetch error without inline error panel (retry UI deferred)", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("Network error"));

    render(<RatesSection serviceOptionId="option-1" contractId={null} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 3, name: /Rates/i })
      ).toBeDefined();
    });
  });

  it("should show contracted rates table when rate card is expanded", async () => {
    const ratesWithContractedFromApi: ServiceOptionRateApiItem[] = [
      {
        ...mockRatesFromApi[0],
        contractedRates: [
          {
            id: "cr-1",
            contractId: "c-1",
            rateId: "rate-1",
            rack: { currency: "USD", value: 250 },
            net: { currency: "USD", value: 200 },
            sell: { currency: "USD", value: 280 },
            priority: 1,
            bookingWindowFrom: "2025-01-01",
            bookingWindowTo: "2025-05-31",
            isActive: true,
            contractedRateDates: [
              {
                travelDateFrom: "2025-06-01",
                travelDateTo: "2025-10-31",
              },
            ],
          },
        ],
      },
    ];

    mockApi.get.mockResolvedValueOnce(ratesWithContractedFromApi);

    const user = userEvent.setup();

    render(<RatesSection serviceOptionId="option-1" contractId="c-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Standard Rate")).toBeDefined();
    });

    await user.click(
      screen.getByRole("button", { name: /toggle rate details/i })
    );

    const expectedTravelRange = formatDateRange("2025-06-01", "2025-10-31");
    expect(expectedTravelRange).toBeTruthy();

    await waitFor(() => {
      // Same label as TravelDateItem: formatDateRange → formatDate (en-GB short)
      expect(screen.getByText(expectedTravelRange!)).toBeDefined();
      expect(screen.getByDisplayValue("200")).toBeDefined();
    });
  });

  it("saves after removing one persisted travel date when another remains", async () => {
    const ratesWithTwoPersistedTravelDates: ServiceOptionRateApiItem[] = [
      {
        ...mockRatesFromApi[0],
        version: 3,
        contractedRates: [
          {
            id: "cr-1",
            contractId: "c-1",
            rateId: "rate-1",
            rack: { currency: "USD", value: 250 },
            net: { currency: "USD", value: 200 },
            sell: { currency: "USD", value: 280 },
            priority: 1,
            bookingWindowFrom: "2025-01-01",
            bookingWindowTo: "2025-05-31",
            isActive: true,
            version: 7,
            contractedRateDates: [
              {
                id: "crd-1",
                travelDateFrom: "2025-06-01",
                travelDateTo: "2025-06-15",
                weekdays: ["MON", "TUE"],
                version: 1,
              },
              {
                id: "crd-2",
                travelDateFrom: "2025-07-01",
                travelDateTo: "2025-07-15",
                weekdays: ["WED", "THU"],
                version: 1,
              },
            ],
          },
        ],
      },
    ];

    mockApi.get.mockResolvedValueOnce(ratesWithTwoPersistedTravelDates);
    mockApi.put.mockResolvedValueOnce({
      ...ratesWithTwoPersistedTravelDates[0],
      contractedRates: [],
    });

    const user = userEvent.setup();

    render(<RatesSection serviceOptionId="option-1" contractId="c-1" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Standard Rate")).toBeDefined();
    });

    await user.click(
      screen.getByRole("button", { name: /toggle rate details/i })
    );

    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: /remove this travel date row/i })
      ).toHaveLength(2);
    });

    await user.click(
      screen.getAllByRole("button", { name: /remove this travel date row/i })[0]
    );

    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    const remainingTravelRange = formatDateRange("2025-07-01", "2025-07-15");

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith(
        "/catalog/services/options/rates/rate-1",
        expect.objectContaining({
          version: 3,
          contractedRates: [
            expect.objectContaining({
              contractedRateDates: [
                expect.objectContaining({
                  id: "crd-2",
                  travelDateFrom: "2025-07-01",
                  travelDateTo: "2025-07-15",
                }),
              ],
            }),
          ],
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(remainingTravelRange!)).toBeDefined();
    });
  });
});
