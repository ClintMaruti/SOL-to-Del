import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyGroups } from "@/entities/agency-group";
import { useMarginRulesList } from "@/entities/margin-rule";
import { useServiceTypes } from "@/entities/service-type";
import { useSupplierServices } from "@/entities/supplier-services";
import { useSuppliers } from "@/entities/suppliers";

import { MarginRulesList } from "../ui/MarginRulesList";

vi.mock("@/entities/agency-group", () => ({
  useAgencyGroups: vi.fn(),
}));

vi.mock("@/entities/margin-rule", () => ({
  useMarginRulesList: vi.fn(),
}));

vi.mock("@/entities/service-type", () => ({
  useServiceTypes: vi.fn(),
}));

vi.mock("@/entities/supplier-services", () => ({
  useSupplierServices: vi.fn(),
}));

vi.mock("@/entities/suppliers", () => ({
  useSuppliers: vi.fn(),
}));

vi.mock("../ui/MarginRulesVirtualizedTable", () => ({
  MarginRulesVirtualizedTable: ({ rows }: { rows: Array<{ id: string }> }) => (
    <div>Virtualized rows: {rows.length}</div>
  ),
}));

const mockUseAgencyGroups = vi.mocked(useAgencyGroups);
const mockUseMarginRulesList = vi.mocked(useMarginRulesList);
const mockUseServiceTypes = vi.mocked(useServiceTypes);
const mockUseSupplierServices = vi.mocked(useSupplierServices);
const mockUseSuppliers = vi.mocked(useSuppliers);

function createListHookResult(
  overrides?: Partial<ReturnType<typeof useMarginRulesList>>
) {
  return {
    items: [],
    totalCount: 0,
    isLoading: false,
    isFetchingNextPage: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    resetToFirstPage: vi.fn(),
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useMarginRulesList>;
}

describe("MarginRulesList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    mockUseAgencyGroups.mockReturnValue({
      data: [
        { id: "ag-1", name: "AAConsultants", isActive: true },
        { id: "ag-2", name: "Inactive", isActive: false },
      ],
    } as unknown as ReturnType<typeof useAgencyGroups>);
    mockUseServiceTypes.mockReturnValue({
      data: [
        {
          id: "st-1",
          name: "ACCOMMODATION",
          displayName: "Accommodation",
        },
      ],
    } as unknown as ReturnType<typeof useServiceTypes>);
    mockUseSuppliers.mockReturnValue({
      data: [{ id: "sup-1", name: "Elewana Lodges & Camps", isActive: true }],
    } as unknown as ReturnType<typeof useSuppliers>);
    mockUseSupplierServices.mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useSupplierServices>);
    mockUseMarginRulesList.mockReturnValue(createListHookResult());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the onboarding empty state when there are no rules and no filters", () => {
    render(
      <MarginRulesList
        onCreateAction={vi.fn()}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    expect(screen.getByText("No Margin Rules yet")).toBeDefined();
    expect(screen.queryByText("Virtualized rows: 1")).toBeNull();
  });

  it("renders the record count and the virtualized table when rules exist", () => {
    mockUseMarginRulesList.mockReturnValue(
      createListHookResult({
        items: [
          {
            id: "rule-1",
            agencyGroupId: "ag-1",
            agencyGroupName: "AAConsultants",
            serviceTypeNameId: null,
            serviceTypeName: null,
            supplierId: null,
            supplierName: null,
            serviceId: null,
            serviceName: null,
            optionId: null,
            optionName: null,
            validFrom: "2026-01-01",
            validTo: "2026-12-31",
            marginPercent: 12.5,
            version: 1,
          },
        ],
        totalCount: 68,
      })
    );

    render(
      <MarginRulesList
        onCreateAction={vi.fn()}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    expect(screen.getByText("68")).toBeDefined();
    expect(screen.getByText("records")).toBeDefined();
    expect(screen.getByText("Virtualized rows: 1")).toBeDefined();
  });

  it("applies the hide-expired toggle immediately without waiting for filter apply", () => {
    mockUseMarginRulesList.mockReturnValue(
      createListHookResult({
        items: [
          {
            id: "rule-1",
            agencyGroupId: "ag-1",
            agencyGroupName: "AAConsultants",
            serviceTypeNameId: null,
            serviceTypeName: null,
            supplierId: null,
            supplierName: null,
            serviceId: null,
            serviceName: null,
            optionId: null,
            optionName: null,
            validFrom: "2026-01-01",
            validTo: "2026-12-31",
            marginPercent: 12.5,
            version: 1,
          },
        ],
        totalCount: 1,
      })
    );

    render(
      <MarginRulesList
        onCreateAction={vi.fn()}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    expect(mockUseMarginRulesList.mock.calls.at(-1)?.[0]).toMatchObject({
      hideExpired: false,
    });

    fireEvent.click(screen.getByLabelText("Hide expired margin rules"));

    expect(mockUseMarginRulesList.mock.calls.at(-1)?.[0]).toMatchObject({
      hideExpired: true,
    });
  });

  it("debounces search and shows the filtered empty state when no rows match", () => {
    render(
      <MarginRulesList
        onCreateAction={vi.fn()}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    fireEvent.change(
      screen.getByPlaceholderText("Search by Agency Group or Supplier name"),
      {
        target: { value: "Hil" },
      }
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockUseMarginRulesList.mock.calls.at(-1)?.[0]).toMatchObject({
      search: "Hil",
    });
    expect(screen.getByText("No match")).toBeDefined();
  });

  it("renders gracefully when option labels or hook payloads are incomplete", () => {
    mockUseAgencyGroups.mockReturnValue({
      data: [{ id: "ag-1", name: undefined, isActive: true }],
    } as unknown as ReturnType<typeof useAgencyGroups>);
    mockUseServiceTypes.mockReturnValue({
      data: [{ id: "st-1", name: undefined, displayName: undefined }],
    } as unknown as ReturnType<typeof useServiceTypes>);
    mockUseSuppliers.mockReturnValue({
      data: [{ id: "sup-1", name: undefined, isActive: true }],
    } as unknown as ReturnType<typeof useSuppliers>);
    mockUseSupplierServices.mockReturnValue({
      data: [
        {
          id: "service-1",
          name: undefined,
          serviceName: undefined,
          isActive: true,
          options: [{ id: "option-1", title: undefined, isActive: true }],
        },
      ],
    } as unknown as ReturnType<typeof useSupplierServices>);

    render(
      <MarginRulesList
        onCreateAction={vi.fn()}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    expect(screen.getByText("No Margin Rules yet")).toBeDefined();
  });

  it("retries by resetting the infinite query to page one", () => {
    const resetToFirstPage = vi.fn();
    const refetch = vi.fn();

    mockUseMarginRulesList.mockReturnValue(
      createListHookResult({
        isError: true,
        error: new Error("boom"),
        resetToFirstPage,
        refetch,
      })
    );

    render(
      <MarginRulesList
        onCreateAction={vi.fn()}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(resetToFirstPage).toHaveBeenCalledTimes(1);
    expect(refetch).not.toHaveBeenCalled();
  });
});
