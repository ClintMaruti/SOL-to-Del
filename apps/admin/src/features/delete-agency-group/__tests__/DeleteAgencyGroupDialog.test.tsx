import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AgencyGroup } from "@/entities/agency-group/model/types";

import { useDeleteAgencyGroupForm } from "../model/useDeleteAgencyGroupForm";
import { DeleteAgencyGroupDialog } from "../ui/DeleteAgencyGroupDialog";

function createAgencyGroup(
  id: string,
  name: string,
  options?: { numberOfAgencies?: number }
): AgencyGroup {
  return {
    id,
    name,
    description: null,
    numberOfAgencies: options?.numberOfAgencies ?? 0,
    isActive: true,
    version: 0,
  };
}

const mockHandleDelete = vi.fn();
const mockResetError = vi.fn();

vi.mock("../model/useDeleteAgencyGroupForm", () => ({
  useDeleteAgencyGroupForm: vi.fn(() => ({
    handleDelete: mockHandleDelete,
    isPending: false,
    error: null,
    resetError: mockResetError,
  })),
}));

describe("DeleteAgencyGroupDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDeleteAgencyGroupForm).mockReturnValue({
      handleDelete: mockHandleDelete,
      isPending: false,
      error: null,
      resetError: mockResetError,
    });
  });

  describe("Rendering - No Agency Group", () => {
    it("should not render when agencyGroup is null", () => {
      render(
        <DeleteAgencyGroupDialog
          agencyGroup={null}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("should not render when open is false", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("Rendering - Group with Agencies (Blocked)", () => {
    it("should show blocked dialog when group has agencies", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 5,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Reassign agencies first")).toBeDefined();
      expect(screen.getByText(/this group contains agencies/i)).toBeDefined();
    });

    it("should show Ok button for blocked dialog", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 5,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      expect(okButton).toBeDefined();
    });

    it("should call onOpenChange with false when Ok is clicked on blocked dialog", async () => {
      const user = userEvent.setup();
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 5,
      });
      const onOpenChange = vi.fn();

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      await user.click(okButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Rendering - Group without Agencies (Delete Confirmation)", () => {
    it("should show delete confirmation when group has no agencies", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(
        screen.getByRole("heading", { name: "Delete Agency Group" })
      ).toBeDefined();
      expect(
        screen.getByText(/this agency group will be removed/i)
      ).toBeDefined();
    });

    it("should show Cancel and Delete Agency Group buttons", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: /delete agency group/i })
      ).toBeDefined();
    });
  });

  describe("Interactions - Delete Confirmation", () => {
    it("should call handleDelete when Delete Agency Group is clicked", async () => {
      const user = userEvent.setup();
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /delete agency group/i,
      });
      await user.click(deleteButton);

      expect(mockHandleDelete).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenChange with false when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });
      const onOpenChange = vi.fn();

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
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
      vi.mocked(useDeleteAgencyGroupForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const confirmButton = screen.getByRole("button", {
        name: /delete agency group/i,
      });
      expect(confirmButton.getAttribute("aria-busy")).toBe("true");
    });

    it("should disable buttons when isPending is true", () => {
      vi.mocked(useDeleteAgencyGroupForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const deleteButton = screen.getByRole("button", {
        name: /delete agency group/i,
      });

      expect(cancelButton).toHaveProperty("disabled", true);
      expect(deleteButton).toHaveProperty("disabled", true);
    });
  });

  describe("Error State", () => {
    it("should display error message when error exists", () => {
      vi.mocked(useDeleteAgencyGroupForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: new Error("Network error"),
        resetError: mockResetError,
      });

      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Network error")).toBeDefined();
    });

    it("should display default error message for non-Error errors", () => {
      vi.mocked(useDeleteAgencyGroupForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: "Something went wrong" as unknown as Error,
        resetError: mockResetError,
      });

      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByText("Failed to delete agency group")).toBeDefined();
    });

    it("should call resetError when dialog closes", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      const { rerender } = render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      rerender(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      expect(mockResetError).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have a dialog role when open with group without agencies", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(screen.getByRole("dialog")).toBeDefined();
    });

    it("should have proper dialog title", () => {
      const group = createAgencyGroup("ag-1", "Test Group", {
        numberOfAgencies: 0,
      });

      render(
        <DeleteAgencyGroupDialog
          agencyGroup={group}
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      expect(
        screen.getByRole("heading", { name: "Delete Agency Group" })
      ).toBeDefined();
    });
  });
});
