import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "@sol/ui";
import { describe, expect, it } from "vitest";

describe("Input", () => {
  it("renders semantic input sizes", () => {
    render(
      <>
        <Input aria-label="Extra small" size="xs" />
        <Input aria-label="Small" size="sm" />
        <Input aria-label="Default" />
        <Input aria-label="Large" size="lg" />
      </>
    );

    expect(
      screen
        .getByRole("textbox", { name: "Extra small" })
        .getAttribute("data-size")
    ).toBe("xs");
    expect(
      screen.getByRole("textbox", { name: "Small" }).getAttribute("data-size")
    ).toBe("sm");
    expect(
      screen.getByRole("textbox", { name: "Default" }).getAttribute("data-size")
    ).toBe("md");
    expect(
      screen.getByRole("textbox", { name: "Large" }).getAttribute("data-size")
    ).toBe("lg");
  });

  it("tracks filled state for controlled and uncontrolled inputs", () => {
    const { rerender } = render(
      <>
        <Input aria-label="Controlled" value="Initial value" readOnly />
        <Input aria-label="Uncontrolled" defaultValue="" />
      </>
    );

    expect(
      screen
        .getByRole("textbox", { name: "Controlled" })
        .getAttribute("data-filled")
    ).toBe("true");
    expect(
      screen
        .getByRole("textbox", { name: "Uncontrolled" })
        .getAttribute("data-filled")
    ).toBe("false");

    fireEvent.change(screen.getByRole("textbox", { name: "Uncontrolled" }), {
      target: { value: "Typed value" },
    });

    expect(
      screen
        .getByRole("textbox", { name: "Uncontrolled" })
        .getAttribute("data-filled")
    ).toBe("true");

    rerender(<Input aria-label="Controlled" value="" readOnly />);

    expect(
      screen
        .getByRole("textbox", { name: "Controlled" })
        .getAttribute("data-filled")
    ).toBe("false");
  });

  it("keeps readonly separate from disabled", () => {
    render(
      <>
        <Input aria-label="Read only" value="Static value" readOnly />
        <Input aria-label="Disabled" value="Disabled value" disabled readOnly />
      </>
    );

    const readOnlyInput = screen.getByRole("textbox", { name: "Read only" });
    const disabledInput = screen.getByRole("textbox", { name: "Disabled" });

    expect(readOnlyInput.getAttribute("readonly")).not.toBeNull();
    expect(readOnlyInput.getAttribute("data-readonly")).toBe("true");
    expect((readOnlyInput as HTMLInputElement).disabled).toBe(false);
    expect(readOnlyInput.getAttribute("tabindex")).toBe("-1");

    expect((disabledInput as HTMLInputElement).disabled).toBe(true);
    expect(disabledInput.getAttribute("data-readonly")).toBe("true");
  });
});
