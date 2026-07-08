import { TooltipProvider } from "@sol/ui";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Supplier } from "@/entities/suppliers/model/types";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import { SuppliersCard } from "../ui/SuppliersCard";

const baseSupplier: Supplier = {
  id: "sup-1",
  name: "Acme Supplies",
  code: "ACM-01",
  headOfficeName: "Head Office",
  locationName: "Nairobi",
  email: "contact@acme.test",
  isActive: false,
  xeroId: null,
};

function renderCard(supplier: Supplier, onToggleSupplierStatus = vi.fn()) {
  return {
    onToggleSupplierStatus,
    ...render(
      <TooltipProvider delayDuration={0}>
        <SuppliersCard
          suppliers={[supplier]}
          onToggleSupplierStatus={onToggleSupplierStatus}
        />
      </TooltipProvider>
    ),
  };
}

function getStatusSwitch(supplierName: string) {
  return screen.getByRole("switch", {
    name: `Toggle ${supplierName} active status`,
  }) as HTMLButtonElement;
}

describe("SuppliersCard", () => {
  beforeEach(() => {
    useLoadingStates.setState({ suppliersStatus: {} });
  });

  it("disables activation and shows a Xero ID tooltip for inactive suppliers without Xero ID", async () => {
    const user = userEvent.setup();
    const { onToggleSupplierStatus } = renderCard(baseSupplier);
    const statusSwitch = getStatusSwitch(baseSupplier.name);

    expect(statusSwitch.disabled).toBe(true);

    await user.hover(statusSwitch.parentElement!);

    expect(await screen.findAllByText("Requires Xero ID")).not.toHaveLength(0);
    expect(
      screen.getAllByText(
        "This supplier can be activated only if a Xero ID is provided."
      )
    ).not.toHaveLength(0);
    expect(onToggleSupplierStatus).not.toHaveBeenCalled();
  });

  it("allows deactivation for active suppliers without Xero ID", async () => {
    const user = userEvent.setup();
    const supplier = { ...baseSupplier, isActive: true };
    const { onToggleSupplierStatus } = renderCard(supplier);
    const statusSwitch = getStatusSwitch(supplier.name);

    expect(statusSwitch.disabled).toBe(false);

    await user.click(statusSwitch);

    expect(onToggleSupplierStatus).toHaveBeenCalledWith(supplier);
  });

  it("allows activation for inactive suppliers with Xero ID", async () => {
    const user = userEvent.setup();
    const supplier = { ...baseSupplier, xeroId: "xero-123" };
    const { onToggleSupplierStatus } = renderCard(supplier);
    const statusSwitch = getStatusSwitch(supplier.name);

    expect(statusSwitch.disabled).toBe(false);

    await user.click(statusSwitch);

    expect(onToggleSupplierStatus).toHaveBeenCalledWith(supplier);
  });

  it("shows the loading state while a supplier status toggle is pending", () => {
    const supplier = { ...baseSupplier, isActive: true };
    useLoadingStates.setState({
      suppliersStatus: { [supplier.id]: true },
    });

    renderCard(supplier);

    const statusSwitch = getStatusSwitch(supplier.name);
    expect(statusSwitch.disabled).toBe(true);
    expect(statusSwitch.getAttribute("data-loading")).toBe("true");
  });
});
