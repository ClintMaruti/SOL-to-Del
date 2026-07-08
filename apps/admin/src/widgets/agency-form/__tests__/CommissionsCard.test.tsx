import { TooltipProvider } from "@sol/ui";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyCommissions } from "@/entities/commission";
import { createCommission } from "@/entities/commission/testing/factories";

import { CommissionsCard } from "../ui/CommissionsCard";

vi.mock("@/entities/commission", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/commission")>();
  return {
    ...actual,
    useAgencyCommissions: vi.fn(),
  };
});

vi.mock("@/features/manage-commission", () => ({
  CommissionModal: ({
    commission,
    open,
  }: {
    commission?: { id: string } | null;
    open: boolean;
  }) =>
    open ? (
      <div
        data-testid={
          commission ? "edit-commission-modal" : "create-commission-modal"
        }
      />
    ) : null,
}));

vi.mock("@/features/delete-commission", () => ({
  DeleteCommissionDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-commission-dialog" /> : null,
}));

const mockUseAgencyCommissions = vi.mocked(useAgencyCommissions);

function renderCard() {
  return render(
    <TooltipProvider delayDuration={0}>
      <CommissionsCard agencyId="agency-1" />
    </TooltipProvider>
  );
}

describe("CommissionsCard", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-04-15T12:00:00"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  it("renders the section header and create button", () => {
    mockUseAgencyCommissions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    renderCard();

    expect(screen.getByText("Commission")).toBeDefined();
    expect(
      screen.getByText(
        "Create, view and manage all commissions for this Agency."
      )
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "Create" })).toBeDefined();
  });

  it("shows only the header in the empty state", () => {
    mockUseAgencyCommissions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    renderCard();

    expect(screen.queryByRole("table")).toBeNull();
  });

  it("shows a loading skeleton under the header while loading", () => {
    mockUseAgencyCommissions.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    const { container } = renderCard();

    expect(screen.getByText("Commission")).toBeDefined();
    expect(
      container.querySelectorAll("[data-slot='skeleton'], .animate-pulse")
        .length
    ).toBeGreaterThan(0);
  });

  it("renders an inline error message", () => {
    mockUseAgencyCommissions.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Unable to load commissions"),
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    renderCard();

    expect(screen.getByText("Unable to load commissions")).toBeDefined();
  });

  it("preserves API order until the user sorts and then sorts by effective date", async () => {
    mockUseAgencyCommissions.mockReturnValue({
      data: [
        createCommission("commission-1", "2026-06-01", {
          commissionPercent: 7,
        }),
        createCommission("commission-2", "2025-10-20", {
          commissionPercent: 6,
        }),
        createCommission("commission-3", "2026-04-16", {
          commissionPercent: 4,
        }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    renderCard();

    const getRenderedDates = () =>
      screen
        .getAllByText(/^\d{2} [A-Z][a-z]{2} \d{4}$/)
        .map((element) => element.textContent);

    expect(getRenderedDates()).toEqual([
      "01 Jun 2026",
      "20 Oct 2025",
      "16 Apr 2026",
    ]);

    await user.click(screen.getByRole("button", { name: "Effective from" }));

    expect(getRenderedDates()).toEqual([
      "20 Oct 2025",
      "16 Apr 2026",
      "01 Jun 2026",
    ]);
  });

  it("formats commission values and shows locked actions for past rows", async () => {
    mockUseAgencyCommissions.mockReturnValue({
      data: [
        createCommission("commission-1", "2026-04-16", {
          commissionPercent: 7,
        }),
        createCommission("commission-2", "2026-04-15", {
          commissionPercent: 6,
        }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    renderCard();

    expect(screen.getByText("7")).toBeDefined();
    expect(screen.getByText("6")).toBeDefined();

    const futureRow = screen.getByText("16 Apr 2026").closest("tr");
    const lockedRow = screen.getByText("15 Apr 2026").closest("tr");

    expect(futureRow).not.toBeNull();
    expect(lockedRow).not.toBeNull();

    const futureEditButton = within(futureRow as HTMLElement).getByRole(
      "button",
      { name: "Edit commission" }
    );
    const futureDeleteButton = within(futureRow as HTMLElement).getByRole(
      "button",
      { name: "Delete commission" }
    );
    const lockedEditButton = within(lockedRow as HTMLElement).getByRole(
      "button",
      { name: "Edit commission" }
    );
    const lockedDeleteButton = within(lockedRow as HTMLElement).getByRole(
      "button",
      { name: "Delete commission" }
    );

    expect(futureEditButton.getAttribute("aria-disabled")).not.toBe("true");
    expect(futureDeleteButton.getAttribute("aria-disabled")).not.toBe("true");
    expect(lockedEditButton.getAttribute("aria-disabled")).toBe("true");
    expect(lockedDeleteButton.getAttribute("aria-disabled")).toBe("true");

    await user.hover(lockedEditButton);

    expect(
      screen.getAllByText("Past date commissions cannot be edited or deleted")
        .length
    ).toBeGreaterThan(0);
  });

  it("opens the create, edit, and delete commission dialogs for future rows", async () => {
    mockUseAgencyCommissions.mockReturnValue({
      data: [
        createCommission("commission-1", "2026-04-16", {
          commissionPercent: 7,
        }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyCommissions>);

    renderCard();

    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByTestId("create-commission-modal")).toBeDefined();

    const row = screen.getByText("16 Apr 2026").closest("tr");
    expect(row).not.toBeNull();

    await user.click(
      within(row as HTMLElement).getByRole("button", {
        name: "Edit commission",
      })
    );
    expect(screen.getByTestId("edit-commission-modal")).toBeDefined();

    await user.click(
      within(row as HTMLElement).getByRole("button", {
        name: "Delete commission",
      })
    );
    expect(screen.getByTestId("delete-commission-dialog")).toBeDefined();
  });
});
