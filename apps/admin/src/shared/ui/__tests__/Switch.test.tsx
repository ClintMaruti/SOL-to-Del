import { render, screen } from "@testing-library/react";
import { Switch } from "@sol/ui";
import { describe, expect, it } from "vitest";

describe("Switch", () => {
  it("renders semantic sizes and variants", () => {
    render(
      <>
        <Switch aria-label="Default" />
        <Switch aria-label="Small outline" size="sm" variant="outline" />
        <Switch aria-label="Large solid" size="lg" checked />
      </>
    );

    expect(
      screen.getByRole("switch", { name: "Default" }).getAttribute("data-size")
    ).toBe("sm");
    expect(
      screen
        .getByRole("switch", { name: "Small outline" })
        .getAttribute("data-variant")
    ).toBe("outline");
    expect(
      screen
        .getByRole("switch", { name: "Large solid" })
        .getAttribute("data-size")
    ).toBe("lg");
  });

  it("disables the control while loading", () => {
    render(<Switch aria-label="Loading" loading checked />);

    const control = screen.getByRole("switch", { name: "Loading" });
    expect((control as HTMLButtonElement).disabled).toBe(true);
    expect(control.getAttribute("data-loading")).toBe("true");
  });

  it("pins the thumb evenly inside the track", () => {
    render(<Switch aria-label="Pinned" checked />);

    const control = screen.getByRole("switch", { name: "Pinned" });
    const thumb = control.querySelector('[data-slot="switch-thumb"]');

    expect(thumb).not.toBeNull();
    expect(thumb?.className).toContain(
      "left-[length:var(--switch-thumb-inset)]"
    );
    expect(thumb?.className).toContain(
      "data-[state=checked]:translate-x-[length:var(--switch-thumb-travel-sm)]"
    );
    expect(thumb?.className).toContain(
      "transition-[transform,background-color]"
    );
  });

  it("uses an outer focus shadow for the solid variant", () => {
    render(<Switch aria-label="Focusable" />);

    const control = screen.getByRole("switch", { name: "Focusable" });

    expect(control.className).toContain(
      "focus-visible:shadow-[var(--switch-solid-focus-shadow)]"
    );
    expect(control.className).not.toContain("focus-visible:border-[4px]");
  });
});
