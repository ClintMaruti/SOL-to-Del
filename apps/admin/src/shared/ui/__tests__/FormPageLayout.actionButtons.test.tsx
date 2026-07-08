import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormPageActionButtons } from "../FormPageLayout";

describe("FormPageActionButtons", () => {
  it("renders semantic variants for delete, cancel, and submit actions", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onDelete = vi.fn();

    render(
      <FormPageActionButtons
        formId="test-form"
        submitButtonLabel="Save"
        isPending={false}
        onCancel={onCancel}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const saveButton = screen.getByRole("button", { name: /save/i });

    expect(deleteButton.getAttribute("data-variant")).toBe("danger");
    expect(cancelButton.getAttribute("data-variant")).toBe("secondary");
    expect(saveButton.getAttribute("data-variant")).toBe("primary");

    await user.click(cancelButton);
    await user.click(deleteButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables the action group while submit is pending", () => {
    render(
      <FormPageActionButtons
        formId="test-form"
        submitButtonLabel="Save"
        isPending
        onCancel={() => {}}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const saveButton = screen.getByRole("button", { name: /save/i });

    expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
    expect(saveButton.getAttribute("aria-busy")).toBe("true");
  });

  it("can disable only the submit button while leaving cancel enabled", () => {
    render(
      <FormPageActionButtons
        formId="test-form"
        submitButtonLabel="Save"
        isPending={false}
        isSubmitDisabled
        onCancel={() => {}}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    const saveButton = screen.getByRole("button", { name: /save/i });

    expect((cancelButton as HTMLButtonElement).disabled).toBe(false);
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
  });
});
