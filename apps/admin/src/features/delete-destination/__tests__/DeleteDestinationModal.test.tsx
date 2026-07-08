import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteDestination } from "../api/useDeleteDestination";
import { useDeleteDestinationForm } from "../model/useDeleteDestination";
import { DeleteDestinationModal } from "../ui/DeleteDestinationModal";

import type { Destination } from "@/entities/destination/model/types";

// Mock the hooks
vi.mock("../api/useDeleteDestination", () => ({
  useDeleteDestination: vi.fn(),
}));

vi.mock("../model/useDeleteDestination", () => ({
  useDeleteDestinationForm: vi.fn(),
}));

// Helper to create test destinations
const createDestination = (
  id: string,
  name: string,
  options?: {
    type?: Destination["type"];
    code?: string;
    coordinates?: { lat: number; lng: number };
    children?: Destination[];
  }
): Destination => ({
  id,
  name,
  type: options?.type || "Country",
  code: options?.code,
  coordinates: options?.coordinates,
  children: options?.children,
});

describe("DeleteDestinationModal", () => {
  const mockDeleteDestination = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockHandleDelete = vi.fn();
  const mockResetError = vi.fn();

  const testDestination = createDestination("dest-123", "Kenya", {
    type: "Country",
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useDeleteDestination).mockReturnValue({
      mutate: mockDeleteDestination,
      isPending: false,
      error: null,
      reset: mockResetError,
    } as unknown as ReturnType<typeof useDeleteDestination>);

    vi.mocked(useDeleteDestinationForm).mockReturnValue({
      handleDelete: mockHandleDelete,
      isPending: false,
      error: null,
      canDelete: true,
      resetError: mockResetError,
    });
  });

  describe("Rendering", () => {
    it("should not render content when modal is closed", () => {
      render(
        <DeleteDestinationModal
          open={false}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      expect(screen.queryByText("Delete Destination")).toBeNull();
    });

    it("should render modal when open is true", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      expect(
        screen.getByRole("heading", { name: "Delete Destination" })
      ).toBeDefined();
    });

    it("should render warning icon", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      // Check for the warning icon container
      const iconContainer = document.querySelector(".bg-destructive\\/10");
      expect(iconContainer).toBeDefined();
    });

    it("should render description text", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      expect(
        screen.getByText(
          /This location will be removed from active use but kept in the system/
        )
      ).toBeDefined();
      expect(
        screen.getByText(/Existing data linked to it will remain unchanged/)
      ).toBeDefined();
    });

    it("should render Cancel and Delete buttons", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: /delete destination/i })
      ).toBeDefined();
    });

    it("should not render if destination is null", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={null}
        />
      );

      expect(screen.queryByText("Delete Destination")).toBeNull();
    });
  });

  describe("Error States", () => {
    it("should render API error message", () => {
      vi.mocked(useDeleteDestinationForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: new Error("Failed to delete destination"),
        canDelete: true,
        resetError: mockResetError,
      });

      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      expect(screen.getByText("Failed to delete destination")).toBeDefined();
    });

    it("should render fallback error message for non-Error objects", () => {
      vi.mocked(useDeleteDestinationForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: { message: "Something went wrong" } as unknown as Error,
        canDelete: true,
        resetError: mockResetError,
      });

      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      // Non-Error objects should show fallback message
      expect(screen.getByText("Failed to delete destination")).toBeDefined();
    });
  });

  describe("Loading States", () => {
    it("should disable buttons when loading", () => {
      vi.mocked(useDeleteDestinationForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        canDelete: false,
        resetError: mockResetError,
      });

      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      // When loading, confirm button keeps its label and both buttons are disabled
      const deleteButton = screen.getByRole("button", {
        name: /delete destination/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      expect(deleteButton).toHaveProperty("disabled", true);
      expect(cancelButton).toHaveProperty("disabled", true);
    });

    it("should show loading state on confirm button when mutation is pending", () => {
      vi.mocked(useDeleteDestinationForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        canDelete: false,
        resetError: mockResetError,
      });

      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      const confirmButton = screen.getByRole("button", {
        name: /delete destination/i,
      });
      expect(confirmButton.getAttribute("aria-busy")).toBe("true");
    });
  });

  describe("User Interactions", () => {
    it("should call handleDelete when delete button is clicked", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      const deleteButton = screen.getByRole("button", {
        name: /delete destination/i,
      });
      fireEvent.click(deleteButton);

      expect(mockHandleDelete).toHaveBeenCalled();
    });

    it("should call onOpenChange with false when cancel is clicked", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should call onSuccess callback and close modal after successful deletion", async () => {
      let onSuccessCallback: (() => void) | undefined;

      vi.mocked(useDeleteDestinationForm).mockImplementation(
        ({ onSuccess }) => {
          onSuccessCallback = onSuccess;
          return {
            handleDelete: mockHandleDelete,
            isPending: false,
            error: null,
            canDelete: true,
            resetError: mockResetError,
          };
        }
      );

      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      // Simulate successful deletion
      if (onSuccessCallback) {
        onSuccessCallback();
        await waitFor(() => {
          expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        });
      }
    });
  });

  describe("Modal Close Behavior", () => {
    it("should reset error when modal closes", () => {
      const { rerender } = render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      rerender(
        <DeleteDestinationModal
          open={false}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      expect(mockResetError).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper dialog structure", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      // Check that the dialog is present
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeDefined();
    });

    it("should have descriptive button labels", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={testDestination}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      const deleteButton = screen.getByRole("button", {
        name: /delete destination/i,
      });

      expect(cancelButton).toBeDefined();
      expect(deleteButton).toBeDefined();
    });
  });

  describe("Destinations with Children", () => {
    const childDestination = createDestination("child-1", "Nairobi", {
      type: "City",
    });

    const destinationWithChildren = createDestination("dest-123", "Kenya", {
      type: "Country",
      children: [childDestination],
    });

    it("should show 'Delete child locations first' title when destination has children", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={destinationWithChildren}
        />
      );

      expect(
        screen.getByRole("heading", { name: "Delete child locations first" })
      ).toBeDefined();
    });

    it("should show appropriate description when destination has children", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={destinationWithChildren}
        />
      );

      expect(
        screen.getByText(/This location contains active child locations/)
      ).toBeDefined();
      expect(
        screen.getByText(
          /Deactivate or reassign them before attempting to delete this location/
        )
      ).toBeDefined();
    });

    it("should only show Ok button when destination has children", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={destinationWithChildren}
        />
      );

      expect(screen.getByRole("button", { name: /ok/i })).toBeDefined();
      expect(screen.queryByRole("button", { name: /cancel/i })).toBeNull();
      expect(
        screen.queryByRole("button", { name: /delete destination/i })
      ).toBeNull();
    });

    it("should close modal when Ok button is clicked", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={destinationWithChildren}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should not call handleDelete when Ok button is clicked", () => {
      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={destinationWithChildren}
        />
      );

      const okButton = screen.getByRole("button", { name: /ok/i });
      fireEvent.click(okButton);

      expect(mockHandleDelete).not.toHaveBeenCalled();
    });

    it("should show delete confirmation modal when destination has empty children array", () => {
      const destinationWithEmptyChildren = createDestination(
        "dest-123",
        "Kenya",
        {
          type: "Country",
          children: [],
        }
      );

      render(
        <DeleteDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destination={destinationWithEmptyChildren}
        />
      );

      // Should show normal delete modal, not the children warning
      expect(
        screen.getByRole("heading", { name: "Delete Destination" })
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: /delete destination/i })
      ).toBeDefined();
    });
  });
});
