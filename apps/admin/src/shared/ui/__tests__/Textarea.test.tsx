import { Textarea } from "@sol/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Textarea", () => {
  it("tracks empty and filled states", () => {
    render(<Textarea aria-label="Description" defaultValue="" />);

    const textarea = screen.getByRole("textbox", { name: "Description" });
    expect(textarea.getAttribute("data-filled")).toBe("false");

    fireEvent.change(textarea, { target: { value: "This is my text" } });

    expect(textarea.getAttribute("data-filled")).toBe("true");
  });

  it("supports readonly state without disabling the control", () => {
    render(<Textarea aria-label="Read only" value="Locked value" readOnly />);

    const textarea = screen.getByRole("textbox", { name: "Read only" });

    expect(textarea.getAttribute("readonly")).not.toBeNull();
    expect(textarea.getAttribute("data-readonly")).toBe("true");
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false);
    expect(textarea.getAttribute("tabindex")).toBe("-1");
  });

  it("forwards invalid state to the shared surface", () => {
    render(
      <Textarea
        aria-label="Invalid"
        value="This is my text"
        readOnly
        aria-invalid="true"
      />
    );

    expect(
      screen
        .getByRole("textbox", { name: "Invalid" })
        .getAttribute("aria-invalid")
    ).toBe("true");
  });
});
