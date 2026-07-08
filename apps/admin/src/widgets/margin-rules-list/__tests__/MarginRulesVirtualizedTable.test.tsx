import { TooltipProvider } from "@sol/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MarginRule } from "@/entities/margin-rule";

import { MarginRulesVirtualizedTable } from "../ui/MarginRulesVirtualizedTable";

vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi
    .fn()
    .mockImplementation(
      (options: { count: number; estimateSize: () => number }) => ({
        getVirtualItems: () =>
          Array.from({ length: options.count }, (_, index) => ({
            index,
            start: index * options.estimateSize(),
            size: options.estimateSize(),
            key: `virtual-row-${index}`,
          })),
        getTotalSize: () => options.count * options.estimateSize(),
      })
    ),
}));

function createMarginRule(
  id: string,
  overrides?: Partial<MarginRule>
): MarginRule {
  return {
    id,
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
    validFrom: "2026-06-01",
    validTo: "2026-12-31",
    marginPercent: 12.5,
    version: 1,
    ...overrides,
  };
}

describe("MarginRulesVirtualizedTable", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T12:00:00"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderTable(ui: ReactElement) {
    return render(<TooltipProvider>{ui}</TooltipProvider>);
  }

  it("renders visible rows, displays ANY for empty scope values, and wires the virtualizer", () => {
    const rows = [createMarginRule("rule-1")];

    const { container } = renderTable(
      <MarginRulesVirtualizedTable
        rows={rows}
        sortBy="agencyGroupName"
        sortDirection="asc"
        onSort={vi.fn()}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={vi.fn()}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    expect(screen.getByText("AAConsultants")).toBeDefined();
    expect(screen.getAllByText("ANY")).toHaveLength(4);
    expect(screen.getByRole("table")).toBeDefined();
    expect(screen.getAllByRole("columnheader")).toHaveLength(9);
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(
      (screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement)
        .disabled
    ).toBe(false);

    const lastCall = vi.mocked(useVirtualizer).mock.calls.at(-1)?.[0];
    const scrollElement = lastCall?.getScrollElement();

    expect(lastCall?.count).toBe(1);
    expect(scrollElement).toBe(container.querySelector(".overflow-auto"));
    expect(
      (scrollElement as HTMLDivElement).className.includes("h-[684px]")
    ).toBe(false);
  });

  it("loads the next page when the scroll container reaches the 100px threshold", () => {
    const onLoadMore = vi.fn();

    const { container } = renderTable(
      <MarginRulesVirtualizedTable
        rows={[createMarginRule("rule-1"), createMarginRule("rule-2")]}
        sortBy="agencyGroupName"
        sortDirection="asc"
        onSort={vi.fn()}
        hasNextPage
        isFetchingNextPage={false}
        onLoadMore={onLoadMore}
        shouldResetToFirstPageOnBackToTop={false}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    const scrollContainer = container.querySelector(
      ".overflow-auto"
    ) as HTMLDivElement;
    Object.defineProperty(scrollContainer, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scrollContainer, "clientHeight", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(scrollContainer, "scrollTop", {
      configurable: true,
      value: 650,
    });

    fireEvent.scroll(scrollContainer);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Back to top" })).toBeDefined();
  });

  it("does not request another page while a fetch is already in progress", () => {
    const onLoadMore = vi.fn();

    const { container } = renderTable(
      <MarginRulesVirtualizedTable
        rows={[createMarginRule("rule-1")]}
        sortBy="agencyGroupName"
        sortDirection="asc"
        onSort={vi.fn()}
        hasNextPage
        isFetchingNextPage
        onLoadMore={onLoadMore}
        shouldResetToFirstPageOnBackToTop={false}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    const scrollContainer = container.querySelector(
      ".overflow-auto"
    ) as HTMLDivElement;
    Object.defineProperty(scrollContainer, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scrollContainer, "clientHeight", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(scrollContainer, "scrollTop", {
      configurable: true,
      value: 650,
    });

    fireEvent.scroll(scrollContainer);

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("keeps duplicate, edit, and delete visible for all rules while disabling unavailable actions", () => {
    const { rerender } = renderTable(
      <MarginRulesVirtualizedTable
        rows={[
          createMarginRule("active-rule", {
            validFrom: "2026-01-01",
            validTo: "2026-12-31",
          }),
        ]}
        sortBy="agencyGroupName"
        sortDirection="asc"
        onSort={vi.fn()}
        hasNextPage={false}
        isFetchingNextPage={false}
        onLoadMore={vi.fn()}
        shouldResetToFirstPageOnBackToTop={false}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit" })).toBeDefined();
    expect(
      (screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);

    rerender(
      <TooltipProvider>
        <MarginRulesVirtualizedTable
          rows={[
            createMarginRule("past-rule", {
              validFrom: "2025-01-01",
              validTo: "2025-12-31",
            }),
          ]}
          sortBy="agencyGroupName"
          sortDirection="asc"
          onSort={vi.fn()}
          hasNextPage={false}
          isFetchingNextPage={false}
          onLoadMore={vi.fn()}
          shouldResetToFirstPageOnBackToTop={false}
          onDuplicateRule={vi.fn()}
          onEditRule={vi.fn()}
          onDeleteRule={vi.fn()}
        />
      </TooltipProvider>
    );

    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDefined();
    expect(
      (screen.getByRole("button", { name: "Edit" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });

  it("resets to the first page when back to top is clicked after additional pages were loaded", () => {
    const onResetToFirstPage = vi.fn();

    const { container } = renderTable(
      <MarginRulesVirtualizedTable
        rows={[createMarginRule("rule-1"), createMarginRule("rule-2")]}
        sortBy="agencyGroupName"
        sortDirection="asc"
        onSort={vi.fn()}
        hasNextPage
        isFetchingNextPage={false}
        onLoadMore={vi.fn()}
        shouldResetToFirstPageOnBackToTop
        onResetToFirstPage={onResetToFirstPage}
        onDuplicateRule={vi.fn()}
        onEditRule={vi.fn()}
        onDeleteRule={vi.fn()}
      />
    );

    const scrollContainer = container.querySelector(
      ".overflow-auto"
    ) as HTMLDivElement;
    scrollContainer.scrollTo = vi.fn();
    Object.defineProperty(scrollContainer, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(scrollContainer, "clientHeight", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(scrollContainer, "scrollTop", {
      configurable: true,
      value: 650,
    });

    fireEvent.scroll(scrollContainer);
    fireEvent.click(screen.getByRole("button", { name: "Back to top" }));

    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({ top: 0 });
    expect(onResetToFirstPage).toHaveBeenCalledTimes(1);
  });
});
