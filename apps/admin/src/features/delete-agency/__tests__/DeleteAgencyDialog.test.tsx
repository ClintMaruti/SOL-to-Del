import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteAgencyForm } from "../model/useDeleteAgencyForm";
import { DeleteAgencyDialog } from "../ui/DeleteAgencyDialog";

import { createAgency } from "@/entities/agency/testing/factories";

// Mock the useDeleteAgencyForm hook
const mockHandleDelete = vi.fn();
const mockResetError = vi.fn();

vi.mock("../model/useDeleteAgencyForm", () => ({
  useDeleteAgencyForm: vi.fn(() => ({
    handleDelete: mockHandleDelete,
    isPending: false,
    error: null,
    resetError: mockResetError,
  })),
}));

describe("DeleteAgencyDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock implementation
    vi.mocked(useDeleteAgencyForm).mockReturnValue({
      handleDelete: mockHandleDelete,
      isPending: false,
      error: null,
      resetError: mockResetError,
    });
  });

  describe("Rendering - No Agency", () => {
    it("should not render when agency is null", () => {
      render(
        <DeleteAgencyDialog agency={null} open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("should not render when open is false", () => {
      const agency = createAgency("1", "Test Agency");

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("Rendering - Agency with Agents (Reassign Warning)", () => {
    it("should show reassign warning when agency has agents", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 5 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Reassign agents first")).toBeDefined();
      expect(
        screen.getByText(/this group contains active agents/i)
      ).toBeDefined();
    });

    it("should show Ok button for reassign warning dialog", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 5 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      expect(okButton).toBeDefined();
    });

    it("should call onOpenChange with false when Ok is clicked", async () => {
      const user = userEvent.setup();
      const agency = createAgency("1", "Test Agency", { agentsCount: 5 });
      const onOpenChange = vi.fn();

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      await user.click(okButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Rendering - Agency without Agents (Delete Confirmation)", () => {
    it("should show delete confirmation when agency has no agents", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Use heading role to specifically find the dialog title
      expect(
        screen.getByRole("heading", { name: "Delete Agency" })
      ).toBeDefined();
      expect(
        screen.getByText(/this agency will be removed from active use/i)
      ).toBeDefined();
    });

    it("should show Cancel and Delete Agency buttons", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: /delete agency/i })
      ).toBeDefined();
    });
  });

  describe("Interactions - Delete Confirmation", () => {
    it("should call handleDelete when Delete Agency is clicked", async () => {
      const user = userEvent.setup();
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /delete agency/i,
      });
      await user.click(deleteButton);

      expect(mockHandleDelete).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenChange with false when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });
      const onOpenChange = vi.fn();

      render(
        <DeleteAgencyDialog
          agency={agency}
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
      vi.mocked(useDeleteAgencyForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const confirmButton = screen.getByRole("button", {
        name: /delete agency/i,
      });
      expect(confirmButton.getAttribute("aria-busy")).toBe("true");
    });

    it("should disable buttons when isPending is true", () => {
      vi.mocked(useDeleteAgencyForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const deleteButton = screen.getByRole("button", {
        name: /delete agency/i,
      });

      expect(cancelButton).toHaveProperty("disabled", true);
      expect(deleteButton).toHaveProperty("disabled", true);
    });
  });

  describe("Error State", () => {
    it("should display error message when error exists", () => {
      vi.mocked(useDeleteAgencyForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: new Error("Network error"),
        resetError: mockResetError,
      });

      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Network error")).toBeDefined();
    });

    it("should display fallback error message for non-Error errors", () => {
      vi.mocked(useDeleteAgencyForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: "Something went wrong" as unknown as Error,
        resetError: mockResetError,
      });

      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Failed to delete agency")).toBeDefined();
    });

    it("should call resetError when dialog closes", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      const { rerender } = render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Close the dialog
      rerender(
        <DeleteAgencyDialog
          agency={agency}
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      expect(mockResetError).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have a dialog role", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByRole("dialog")).toBeDefined();
    });

    it("should have a proper dialog title", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      // Use heading role to specifically find the dialog title
      expect(
        screen.getByRole("heading", { name: "Delete Agency" })
      ).toBeDefined();
    });

    it("should have a proper dialog description", () => {
      const agency = createAgency("1", "Test Agency", { agentsCount: 0 });

      render(
        <DeleteAgencyDialog
          agency={agency}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(
        screen.getByText(/this agency will be removed from active use/i)
      ).toBeDefined();
    });
  });
});
