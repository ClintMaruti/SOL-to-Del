import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

describe("ConfirmDeleteDialog", () => {
  it("uses semantic secondary and danger buttons", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDeleteDialog
        open
        onOpenChange={onOpenChange}
        title="Delete item"
        description="This cannot be undone."
        onConfirm={onConfirm}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const deleteButton = screen.getByRole("button", { name: /delete/i });

    expect(cancelButton.getAttribute("data-variant")).toBe("secondary");
    expect(deleteButton.getAttribute("data-variant")).toBe("danger");

    await user.click(cancelButton);
    await user.click(deleteButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("keeps destructive confirmation disabled while pending", () => {
    render(
      <ConfirmDeleteDialog
        open
        onOpenChange={() => {}}
        title="Delete item"
        description="This cannot be undone."
        isPending
        onConfirm={() => {}}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const deleteButton = screen.getByRole("button", { name: /delete/i });

    expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
    expect(deleteButton.getAttribute("aria-busy")).toBe("true");
  });
});
