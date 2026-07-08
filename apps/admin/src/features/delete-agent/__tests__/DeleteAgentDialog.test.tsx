import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAgent } from "@/entities/agent/testing/factories";

import { useDeleteAgentForm } from "../model/useDeleteAgentForm";
import { DeleteAgentDialog } from "../ui/DeleteAgentDialog";

// Mock the useDeleteAgentForm hook
const mockHandleDelete = vi.fn();
const mockResetError = vi.fn();

vi.mock("../model/useDeleteAgentForm", () => ({
  useDeleteAgentForm: vi.fn(() => ({
    handleDelete: mockHandleDelete,
    isPending: false,
    error: null,
    resetError: mockResetError,
  })),
}));

describe("DeleteAgentDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock implementation
    vi.mocked(useDeleteAgentForm).mockReturnValue({
      handleDelete: mockHandleDelete,
      isPending: false,
      error: null,
      resetError: mockResetError,
    });
  });

  describe("Rendering - No Agent", () => {
    it("should not render when agent is null", () => {
      render(
        <DeleteAgentDialog agent={null} open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("should not render when open is false", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={false} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("should not render when both agent is null and open is false", () => {
      render(
        <DeleteAgentDialog agent={null} open={false} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("Rendering - Delete Confirmation", () => {
    it("should show delete confirmation dialog when open with agent", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(
        screen.getByRole("heading", { name: "Delete Agent" })
      ).toBeDefined();
      expect(
        screen.getByText(
          /this agent will be removed from active use\. existing data linked to this agent will remain unchanged\./i
        )
      ).toBeDefined();
    });

    it("should show Cancel and Delete Agent buttons", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: /delete agent/i })
      ).toBeDefined();
    });
  });

  describe("Interactions", () => {
    it("should call handleDelete when Delete Agent is clicked", async () => {
      const user = userEvent.setup();
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      const deleteButton = screen.getByRole("button", {
        name: /delete agent/i,
      });
      await user.click(deleteButton);

      expect(mockHandleDelete).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenChange with false when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const agent = createAgent("1", "Test", "Agent");
      const onOpenChange = vi.fn();

      render(
        <DeleteAgentDialog
          agent={agent}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should pass onSuccess callback that calls onOpenChange(false)", () => {
      const agent = createAgent("1", "Test", "Agent");
      const onOpenChange = vi.fn();

      render(
        <DeleteAgentDialog
          agent={agent}
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      // Verify the hook was called with the agent and an onSuccess callback
      const hookCall = vi.mocked(useDeleteAgentForm).mock.calls[0][0];
      expect(hookCall.agent).toBe(agent);

      // Simulate the onSuccess callback
      hookCall.onSuccess?.();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Loading State", () => {
    it("should show loading state on confirm button when isPending is true", () => {
      vi.mocked(useDeleteAgentForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      const confirmButton = screen.getByRole("button", {
        name: /delete agent/i,
      });
      expect(confirmButton.getAttribute("aria-busy")).toBe("true");
    });

    it("should disable Cancel button when isPending is true", () => {
      vi.mocked(useDeleteAgentForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      expect(cancelButton).toHaveProperty("disabled", true);
    });

    it("should disable Delete Agent button when isPending is true", () => {
      vi.mocked(useDeleteAgentForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: true,
        error: null,
        resetError: mockResetError,
      });

      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      const deleteButton = screen.getByRole("button", {
        name: /delete agent/i,
      });
      expect(deleteButton).toHaveProperty("disabled", true);
    });

    it("should show 'Delete Agent' text when isPending is false", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(
        screen.getByRole("button", { name: /delete agent/i })
      ).toBeDefined();
      expect(screen.queryByText("Deleting...")).toBeNull();
    });
  });

  describe("Error State", () => {
    it("should display error message when error exists", () => {
      vi.mocked(useDeleteAgentForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: new Error("Network error"),
        resetError: mockResetError,
      });

      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText("Network error")).toBeDefined();
    });

    it("should display fallback error message for non-Error errors", () => {
      vi.mocked(useDeleteAgentForm).mockReturnValue({
        handleDelete: mockHandleDelete,
        isPending: false,
        error: "Something went wrong" as unknown as Error,
        resetError: mockResetError,
      });

      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByText("Failed to delete agent")).toBeDefined();
    });

    it("should not display error section when error is null", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.queryByText("Failed to delete agent")).toBeNull();
      expect(screen.queryByText("Network error")).toBeNull();
    });

    it("should call resetError when dialog closes", () => {
      const agent = createAgent("1", "Test", "Agent");

      const { rerender } = render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      // Close the dialog
      rerender(
        <DeleteAgentDialog agent={agent} open={false} onOpenChange={vi.fn()} />
      );

      expect(mockResetError).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have a dialog role", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByRole("dialog")).toBeDefined();
    });

    it("should have a proper dialog title", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(
        screen.getByRole("heading", { name: "Delete Agent" })
      ).toBeDefined();
    });

    it("should have a proper dialog description", () => {
      const agent = createAgent("1", "Test", "Agent");

      render(
        <DeleteAgentDialog agent={agent} open={true} onOpenChange={vi.fn()} />
      );

      expect(
        screen.getByText(/this agent will be removed from active use/i)
      ).toBeDefined();
    });
  });
});
