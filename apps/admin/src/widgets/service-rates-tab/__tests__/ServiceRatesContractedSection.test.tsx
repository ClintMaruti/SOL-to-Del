import { QueryClient, QueryClientProvider } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ContractedRate } from "@/entities/contracted-rate";
import type { ServiceRate } from "@/entities/service-rate";
import type { SupplierContract } from "@/entities/supplier-contract";

import { buildServiceRatesFilterChips } from "../lib/buildServiceRatesFilterChips";
import { ServiceRatesContractedSection } from "../ui/ServiceRatesContractedSection";

const mockUseServiceRates = vi.fn();
const mockUseServiceOptions = vi.fn();
const mockUseContractedRates = vi.fn();
const mockUseServiceRatesFilters = vi.fn();

vi.mock("@/entities/service-rate", () => ({
  useServiceRates: () => mockUseServiceRates(),
}));

vi.mock("@/entities/supplier-service-options", () => ({
  useServiceOptions: () => mockUseServiceOptions(),
}));

vi.mock("@/entities/contracted-rate", () => ({
  useContractedRates: () => mockUseContractedRates(),
  useCreateContractedRatesBatch: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/features/manage-contracted-rates", () => ({
  ContractedRateFormDialog: () => null,
}));

vi.mock("../ui/ContractedRatesTable", () => ({
  ContractedRatesTable: () => <div data-testid="contracted-table" />,
}));

vi.mock("../lib/buildServiceRatesFilterChips", () => ({
  buildServiceRatesFilterChips: vi.fn(() => []),
}));

function createWrapper(initialEntry = "/?contractId=c1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

const contracts: SupplierContract[] = [
  {
    id: "c1",
    name: "Contract A",
    supplierId: "sup-1",
    isActive: true,
  } as SupplierContract,
];

const defaultFilters = {
  filterState: {
    contractId: "c1",
    optionIds: [] as string[],
    rateIds: [] as string[],
    travelDateFrom: null,
    travelDateTo: null,
    chargeTypes: [] as ServiceRate["chargeType"][],
  },
  apiQueryParams: { contractId: "c1" },
  hasActiveFilters: false,
  clientFilterRows: (rows: ContractedRate[]) => rows,
  setContractId: vi.fn(),
  applyFilters: vi.fn(),
  clearAllFilters: vi.fn(),
  removeFilterChip: vi.fn(),
};

describe("ServiceRatesContractedSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseServiceRates.mockReturnValue({ data: [] });
    mockUseServiceOptions.mockReturnValue({ data: [] });
    mockUseServiceRatesFilters.mockReturnValue(defaultFilters);
  });

  it("renders toolbar with Filters button when contract selected even with zero rows", () => {
    mockUseContractedRates.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <ServiceRatesContractedSection serviceId="svc-1" contracts={contracts} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByRole("button", { name: /filters/i })).toBeDefined();
    expect(
      screen.queryAllByText(
        (_, el) =>
          el?.tagName === "SPAN" &&
          Boolean(el.textContent?.trim().match(/^\d+ records$/))
      ).length
    ).toBeGreaterThan(0);
  });

  it("renders filter chips when filters are active in URL state", async () => {
    await i18n.changeLanguage("en");
    vi.mocked(buildServiceRatesFilterChips).mockReturnValue([
      { key: "options", label: "Options: Full Board" },
      { key: "chargeTypes", label: "Charge Type: Person" },
    ]);
    mockUseServiceRatesFilters.mockReturnValue({
      ...defaultFilters,
      filterState: {
        ...defaultFilters.filterState,
        optionIds: ["opt-1"],
        chargeTypes: ["Person"],
      },
      hasActiveFilters: true,
    });
    mockUseServiceOptions.mockReturnValue({
      data: [{ id: "opt-1", title: "Full Board" }],
    });
    mockUseContractedRates.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <ServiceRatesContractedSection serviceId="svc-1" contracts={contracts} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("Options: Full Board")).toBeDefined();
    expect(screen.getByText("Charge Type: Person")).toBeDefined();
    expect(buildServiceRatesFilterChips).toHaveBeenCalled();
    expect(
      screen.getByLabelText(i18n.t("buttons.clearAll", { ns: "admin" }))
    ).toBeDefined();
  });

  it("renders contracted table when filtered rows exist", () => {
    const row: ContractedRate = {
      id: "cr-1",
      contractedRateId: "parent-1",
      contractId: "c1",
      rateId: "rate-1",
      serviceOptionId: "opt-1",
      seasonName: "Peak",
      priority: 1,
      net: { currency: "USD", value: 100 },
      rack: { currency: "USD", value: 120 },
      sell: { currency: "USD", value: 110 },
      version: 1,
      dates: [
        {
          id: "d1",
          travelDateFrom: "2025-01-01",
          travelDateTo: "2025-03-31",
          weekdays: [],
        },
      ],
    };

    mockUseContractedRates.mockReturnValue({
      data: [row],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <ServiceRatesContractedSection serviceId="svc-1" contracts={contracts} />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId("contracted-table")).toBeDefined();
    expect(screen.queryByRole("button", { name: /add rates/i })).toBeNull();
  });
});
