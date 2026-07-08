import { render, screen } from "@testing-library/react";
import { Checkbox, CheckboxGroup } from "@sol/ui";
import { describe, expect, it } from "vitest";

describe("Checkbox", () => {
  it("renders semantic checkbox sizes and states", () => {
    render(
      <>
        <Checkbox aria-label="Default" />
        <Checkbox aria-label="Checked" checked />
        <Checkbox
          aria-label="Indeterminate"
          checked="indeterminate"
          size="md"
        />
        <Checkbox aria-label="Invalid" invalid size="lg" />
      </>
    );

    expect(
      screen
        .getByRole("checkbox", { name: "Default" })
        .getAttribute("data-size")
    ).toBe("sm");
    expect(
      screen
        .getByRole("checkbox", { name: "Checked" })
        .getAttribute("data-state")
    ).toBe("checked");
    expect(
      screen
        .getByRole("checkbox", { name: "Indeterminate" })
        .getAttribute("data-state")
    ).toBe("indeterminate");
    expect(
      screen
        .getByRole("checkbox", { name: "Invalid" })
        .getAttribute("aria-invalid")
    ).toBe("true");
  });

  it("renders grouped checkbox labels and descriptions", () => {
    render(
      <CheckboxGroup
        label="Receive updates"
        description="Used for product announcements"
        checked
      />
    );

    expect(
      screen
        .getByRole("checkbox", { name: "Receive updates" })
        .getAttribute("data-state")
    ).toBe("checked");
    expect(screen.getByText("Used for product announcements")).toBeDefined();
  });

  it("applies disabled state to checkbox group text and control", () => {
    render(<CheckboxGroup label="Disabled option" disabled />);

    const checkbox = screen.getByRole("checkbox", { name: "Disabled option" });
    expect((checkbox as HTMLButtonElement).disabled).toBe(true);
    expect(
      screen.getByText("Disabled option").parentElement?.className
    ).toContain("opacity-50");
  });

  it("passes icon classes directly to the checkbox svg", () => {
    render(
      <Checkbox aria-label="Styled icon" checked iconClassName="text-white" />
    );

    const icon = screen
      .getByRole("checkbox", { name: "Styled icon" })
      .querySelector("svg");

    expect(icon?.className.baseVal ?? icon?.getAttribute("class")).toContain(
      "text-white"
    );
  });
});
