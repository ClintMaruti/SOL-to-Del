import { TooltipProvider } from "@sol/ui";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useSupplierCloseouts,
  useToggleSupplierCloseoutStatus,
  type SupplierCloseout,
} from "@/entities/supplier-closeout";
import { useDeleteSupplierCloseout } from "@/features/delete-supplier-closeout";

import { SupplierCloseoutsCard } from "../ui/SupplierCloseoutsCard";

vi.mock("@/entities/supplier-closeout", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/supplier-closeout")>();
  return {
    ...actual,
    useSupplierCloseouts: vi.fn(),
    useToggleSupplierCloseoutStatus: vi.fn(),
  };
});

vi.mock("@/features/delete-supplier-closeout", () => ({
  useDeleteSupplierCloseout: vi.fn(),
}));

vi.mock("@/features/create-supplier-closeout", () => ({
  CreateSupplierCloseoutModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-supplier-closeout-modal" /> : null,
}));

vi.mock("@/shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/ui")>();
  return {
    ...actual,
    ConfirmDeleteDialog: ({
      open,
      onConfirm,
    }: {
      open: boolean;
      onConfirm: () => void;
    }) =>
      open ? (
        <div data-testid="confirm-delete-dialog">
          <button type="button" onClick={onConfirm}>
            Confirm delete
          </button>
        </div>
      ) : null,
  };
});

const mockUseSupplierCloseouts = vi.mocked(useSupplierCloseouts);
const mockUseToggleSupplierCloseoutStatus = vi.mocked(
  useToggleSupplierCloseoutStatus
);
const mockUseDeleteSupplierCloseout = vi.mocked(useDeleteSupplierCloseout);

function closeout(
  id: string,
  overrides: Partial<SupplierCloseout> = {}
): SupplierCloseout {
  return {
    id,
    supplierId: "sup-1",
    serviceId: null,
    serviceOptionId: null,
    travelDateFrom: "2025-10-01",
    travelDateTo: "2025-10-31",
    reason: "Rain Season",
    status: "Active",
    isActive: true,
    version: 1,
    ...overrides,
  };
}

function renderCard() {
  return render(
    <TooltipProvider>
      <SupplierCloseoutsCard supplierId="sup-1" />
    </TooltipProvider>
  );
}

describe("SupplierCloseoutsCard", () => {
  const mockToggle = vi.fn();
  const mockDelete = vi.fn();
  const mockResetDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSupplierCloseouts.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierCloseouts>);
    mockUseToggleSupplierCloseoutStatus.mockReturnValue({
      mutate: mockToggle,
    } as unknown as ReturnType<typeof useToggleSupplierCloseoutStatus>);
    mockUseDeleteSupplierCloseout.mockReturnValue({
      mutate: mockDelete,
      isPending: false,
      reset: mockResetDelete,
    } as unknown as ReturnType<typeof useDeleteSupplierCloseout>);
  });

  it("renders header, subtitle, and empty state CTA", () => {
    renderCard();

    expect(screen.getByText("Closeouts")).toBeDefined();
    expect(
      screen.getByText(
        "View and manage all closeouts for this supplier and its services or options."
      )
    ).toBeDefined();
    expect(screen.getByText("No closeouts yet")).toBeDefined();
    expect(
      screen.getAllByRole("button", { name: /add closeout/i }).length
    ).toBeGreaterThan(0);
  });

  it("opens the create modal from the empty state CTA", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(
      screen.getAllByRole("button", { name: /add closeout/i })[1]
    );

    expect(screen.getByTestId("create-supplier-closeout-modal")).toBeDefined();
  });

  it("renders sorted supplier, service, and option scope rows", () => {
    mockUseSupplierCloseouts.mockReturnValue({
      data: [
        closeout("cl-aug", {
          travelDateFrom: "2025-08-10",
          travelDateTo: "2025-08-16",
          serviceId: "svc-1",
          serviceName: "Camp",
          serviceOptionId: "opt-1",
          serviceOptionName: "Game Package",
          reason: "No such option for these dates",
        }),
        closeout("cl-oct", {
          travelDateFrom: "2025-10-01",
          travelDateTo: "2025-10-31",
          serviceId: null,
          serviceOptionId: null,
          reason: "Rain Season",
        }),
        closeout("cl-dec", {
          travelDateFrom: "2025-12-10",
          travelDateTo: "2026-01-07",
          serviceId: "svc-2",
          serviceName: "Family Camp",
          serviceOptionId: null,
          serviceOptionName: "ALL",
          reason: "Renovation of the Family Camp",
        }),
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierCloseouts>);

    renderCard();

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("10 Dec 2025")).toBeDefined();
    expect(within(rows[0]).getByText("Family Camp")).toBeDefined();
    expect(within(rows[0]).getByText("-")).toBeDefined();
    expect(within(rows[1]).getByText("01 Oct 2025")).toBeDefined();
    expect(within(rows[2]).getByText("Camp")).toBeDefined();
    expect(within(rows[2]).getByText("Game Package")).toBeDefined();
  });

  it("truncates long reasons while preserving the full text for the tooltip trigger", () => {
    const reason =
      "Renovation of the Family Camp and even more long description";
    mockUseSupplierCloseouts.mockReturnValue({
      data: [closeout("cl-1", { reason })],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierCloseouts>);

    renderCard();

    const reasonTrigger = screen.getByText(reason);
    expect(reasonTrigger.className).toContain("truncate");
  });

  it("toggles closeout status through the supplier toggle hook", async () => {
    const user = userEvent.setup();
    mockUseSupplierCloseouts.mockReturnValue({
      data: [closeout("cl-1", { isActive: true })],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierCloseouts>);

    renderCard();

    await user.click(screen.getByRole("switch"));

    expect(mockToggle).toHaveBeenCalledWith({
      supplierId: "sup-1",
      closeoutId: "cl-1",
      isActive: true,
    });
  });

  it("deletes a closeout after confirmation", async () => {
    const user = userEvent.setup();
    mockUseSupplierCloseouts.mockReturnValue({
      data: [closeout("cl-1", { isActive: false, status: "Inactive" })],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierCloseouts>);

    renderCard();

    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /confirm delete/i }));

    expect(mockDelete).toHaveBeenCalledWith(
      { supplierId: "sup-1", closeoutId: "cl-1" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("disables delete for active closeouts and explains why in a tooltip", async () => {
    const user = userEvent.setup();
    mockUseSupplierCloseouts.mockReturnValue({
      data: [closeout("cl-1", { isActive: true, status: "Active" })],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierCloseouts>);

    renderCard();

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    expect((deleteButton as HTMLButtonElement).disabled).toBe(true);

    await user.hover(deleteButton.parentElement as HTMLElement);

    expect(
      (
        await screen.findAllByText(
          "Active closeouts cannot be deleted. Disable it first."
        )
      ).length
    ).toBeGreaterThan(0);

    await user.click(deleteButton);

    expect(screen.queryByTestId("confirm-delete-dialog")).toBeNull();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
