import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteSupplierHeadOfficeForm } from "../model/useDeleteSupplierHeadOfficeForm";
import { DeleteSupplierHeadOfficeDialog } from "../ui/DeleteSupplierHeadOfficeDialog";

import { createSupplierHeadOffice } from "@/entities/supplier-head-office/testing/factories";

// Mock the useDeleteSupplierHeadOfficeForm hook
const mockHandleDelete = vi.fn();
const mockResetError = vi.fn();

vi.mock("../model/useDeleteSupplierHeadOfficeForm", () => ({
  useDeleteSupplierHeadOfficeForm: vi.fn(() => ({
    handleDelete: mockHandleDelete,
    isPending: false,
    error: null,
    resetError: mockResetError,
  })),
}));

describe("DeleteSupplierHeadOfficeDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeleteSupplierHeadOfficeForm).mockReturnValue({
      handleDelete: mockHandleDelete,
      isPending: false,
      error: null,
      resetError: mockResetError,
    });
  });

  describe("Rendering - No Supplier Head Office", () => {
    it("should not render when supplier head office is null", () => {
      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={null}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("should not render when open is false", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office");

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("Rendering - Head Office with Suppliers (Reassign Warning)", () => {
    it("should show reassign warning when head office has suppliers", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 5,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Reassign suppliers first")).toBeDefined();
      expect(
        screen.getByText(/this head office contains active suppliers/i)
      ).toBeDefined();
    });

    it("should show Ok button for reassign warning dialog", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 5,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      expect(okButton).toBeDefined();
    });

    it("should call onOpenChange with false when Ok is clicked", async () => {
      const user = userEvent.setup();
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 5,
      });
      const onOpenChange = vi.fn();

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      await user.click(okButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Rendering - Head Office without Suppliers (Delete Confirmation)", () => {
    it("should show delete confirmation when head office has no suppliers", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(
        screen.getByRole("heading", { name: "Delete Head Office" })
      ).toBeDefined();
      expect(
        screen.getByText(/this head office will be removed from active use/i)
      ).toBeDefined();
    });

    it("should show Cancel and Delete Head Office buttons", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: /delete head office/i })
      ).toBeDefined();
    });
  });

  describe("Interactions - Delete Confirmation", () => {
    it("should call handleDelete when Delete Head Office is clicked", async () => {
      const user = userEvent.setup();
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /delete head office/i,
      });
      await user.click(deleteButton);

      expect(mockHandleDelete).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenChange with false when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });
      const onOpenChange = vi.fn();

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Loading State", () => {
    it("should show loading state on confirm button when isPending is true", () => {
      vi.mocked(useDeleteSupplierHeadOfficeForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const confirmButton = screen.getByRole("button", {
        name: /delete head office/i,
      });
      expect(confirmButton.getAttribute("aria-busy")).toBe("true");
    });

    it("should disable buttons when isPending is true", () => {
      vi.mocked(useDeleteSupplierHeadOfficeForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const deleteButton = screen.getByRole("button", {
        name: /delete head office/i,
      });

      expect(cancelButton).toHaveProperty("disabled", true);
      expect(deleteButton).toHaveProperty("disabled", true);
    });
  });

  describe("Error State", () => {
    it("should display error message when error exists", () => {
      vi.mocked(useDeleteSupplierHeadOfficeForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: new Error("Network error"),
        resetError: mockResetError,
      });

      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Network error")).toBeDefined();
    });

    it("should display fallback error message for non-Error errors", () => {
      vi.mocked(useDeleteSupplierHeadOfficeForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: "Something went wrong" as unknown as Error,
        resetError: mockResetError,
      });

      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(
        screen.getByText("Failed to delete supplier head office")
      ).toBeDefined();
    });

    it("should call resetError when dialog closes", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      const { rerender } = render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      rerender(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      expect(mockResetError).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have a dialog role", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByRole("dialog")).toBeDefined();
    });

    it("should have a proper dialog title", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(
        screen.getByRole("heading", { name: "Delete Head Office" })
      ).toBeDefined();
    });

    it("should have a proper dialog description", () => {
      const headOffice = createSupplierHeadOffice("1", "Test Head Office", {
        suppliersCount: 0,
      });

      render(
        <DeleteSupplierHeadOfficeDialog
          supplierHeadOffice={headOffice}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(
        screen.getByText(/this head office will be removed from active use/i)
      ).toBeDefined();
    });
  });
});
