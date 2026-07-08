import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { AgentDetailsFooter } from "../ui/AgentDetailsFooter";

describe("AgentDetailsFooter", () => {
  it("renders Cancel and Save buttons", () => {
    render(<AgentDetailsFooter onCancel={vi.fn()} />);

    expect(
      screen
        .getByRole("button", { name: "Cancel" })
        .getAttribute("data-variant")
    ).toBe("secondary");
    expect(
      screen.getByRole("button", { name: "Save" }).getAttribute("data-variant")
    ).toBe("primary");
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<AgentDetailsFooter onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Save button has form attribute when formId is provided", () => {
    render(
      <AgentDetailsFooter onCancel={vi.fn()} formId="agent-detail-form" />
    );

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton.getAttribute("form")).toBe("agent-detail-form");
    expect(saveButton.getAttribute("type")).toBe("submit");
  });

  it("disables both buttons when isPending is true", () => {
    render(<AgentDetailsFooter onCancel={vi.fn()} isPending={true} />);

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    const saveBtn = screen.getByRole("button", { name: "Save" });
    expect((cancelBtn as HTMLButtonElement).disabled).toBe(true);
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("renders footer with form actions aria-label", () => {
    render(<AgentDetailsFooter onCancel={vi.fn()} />);

    const footer = document.querySelector('footer[aria-label="Form actions"]');
    expect(footer).toBeTruthy();
  });
});
