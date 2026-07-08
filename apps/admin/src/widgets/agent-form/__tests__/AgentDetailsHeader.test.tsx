import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { AgentDetailsHeader } from "../ui/AgentDetailsHeader";

describe("AgentDetailsHeader", () => {
  it("renders agent name in heading", () => {
    render(
      <AgentDetailsHeader
        agentName="Jonathan Annan"
        isActive={true}
        onStatusChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Jonathan Annan" })
    ).toBeDefined();
  });

  it("renders Active switch checked when isActive is true", () => {
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={true}
        onStatusChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const switchControl = screen.getByRole("switch", {
      name: /toggle test agent active status/i,
    });
    expect(switchControl.getAttribute("aria-checked")).toBe("true");
  });

  it("renders Active switch unchecked when isActive is false", () => {
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={false}
        onStatusChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const switchControl = screen.getByRole("switch", {
      name: /toggle test agent active status/i,
    });
    expect(switchControl.getAttribute("aria-checked")).toBe("false");
  });

  it("calls onStatusChange when Active switch is toggled", () => {
    const onStatusChange = vi.fn();
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={false}
        onStatusChange={onStatusChange}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const switchControl = screen.getByRole("switch", {
      name: /toggle test agent active status/i,
    });
    fireEvent.click(switchControl);

    expect(onStatusChange).toHaveBeenCalledWith(true);
  });

  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={true}
        onStatusChange={vi.fn()}
        onCancel={onCancel}
        onSave={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("uses semantic secondary and primary action buttons", () => {
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={true}
        onStatusChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(
      screen
        .getByRole("button", { name: "Cancel" })
        .getAttribute("data-variant")
    ).toBe("secondary");
    expect(
      screen.getByRole("button", { name: "Save" }).getAttribute("data-variant")
    ).toBe("primary");
  });

  it("Save button has form attribute when formId is provided", () => {
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={true}
        onStatusChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        formId="agent-detail-form"
      />
    );

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton.getAttribute("form")).toBe("agent-detail-form");
    expect(saveButton.getAttribute("type")).toBe("submit");
  });

  it("disables Cancel and Save when isPending is true", () => {
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={true}
        onStatusChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        isPending={true}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    const saveBtn = screen.getByRole("button", { name: "Save" });
    expect((cancelBtn as HTMLButtonElement).disabled).toBe(true);
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps Save label when isPending (spinner shown instead of replacing text)", () => {
    render(
      <AgentDetailsHeader
        agentName="Test Agent"
        isActive={true}
        onStatusChange={vi.fn()}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        isPending={true}
      />
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
  });
});
