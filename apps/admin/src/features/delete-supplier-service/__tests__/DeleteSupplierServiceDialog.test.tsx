import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteSupplierServiceForm } from "../model/useDeleteSupplierServiceForm";
import { DeleteSupplierServiceDialog } from "../ui/DeleteSupplierServiceDialog";

const mockHandleDelete = vi.fn();
const mockResetError = vi.fn();

vi.mock("../model/useDeleteSupplierServiceForm", () => ({
  useDeleteSupplierServiceForm: vi.fn(() => ({
    handleDelete: mockHandleDelete,
    isPending: false,
    error: null,
    resetError: mockResetError,
  })),
}));

const mockService = {
  id: "service-1",
  supplierId: "sup-1",
  name: "Test Service",
  serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
  type: "accommodation",
  isActive: true,
  tags: "",
  options: [],
  rates: [],
  nominalSaleCode: null,
  purchaseNominalCode: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("DeleteSupplierServiceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeleteSupplierServiceForm).mockReturnValue({
      handleDelete: mockHandleDelete,
      isPending: false,
      error: null,
      resetError: mockResetError,
    });
  });

  it("should not render when supplier service is null", () => {
    render(
      <DeleteSupplierServiceDialog
        supplierService={null}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should not render when open is false", () => {
    render(
      <DeleteSupplierServiceDialog
        supplierService={mockService}
        open={false}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should render dialog with title and description when open with service", () => {
    render(
      <DeleteSupplierServiceDialog
        supplierService={mockService}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeDefined();
    // Title and description come from i18n (delete.deleteService, delete.deleteServiceDescription)
    expect(
      screen.getByRole("heading", { name: /delete service/i })
    ).toBeDefined();
  });

  it("should call handleDelete when confirm button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DeleteSupplierServiceDialog
        supplierService={mockService}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    expect(mockHandleDelete).toHaveBeenCalledTimes(1);
  });

  it("should call onOpenChange with false when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <DeleteSupplierServiceDialog
        supplierService={mockService}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("should call resetError when open becomes false", () => {
    const { rerender } = render(
      <DeleteSupplierServiceDialog
        supplierService={mockService}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(mockResetError).not.toHaveBeenCalled();

    rerender(
      <DeleteSupplierServiceDialog
        supplierService={mockService}
        open={false}
        onOpenChange={vi.fn()}
      />
    );

    expect(mockResetError).toHaveBeenCalled();
  });
});
