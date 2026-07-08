import { render, screen } from "@testing-library/react";
import { Button } from "@sol/ui";
import { Link, MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

describe("Button", () => {
  it("renders semantic variants and sizes", () => {
    render(
      <>
        <Button variant="primary" size="md">
          Primary
        </Button>
        <Button variant="secondary" size="sm">
          Secondary
        </Button>
        <Button variant="tertiary" size="lg">
          Tertiary
        </Button>
        <Button variant="outline-secondary">Outline Secondary</Button>
        <Button variant="danger" size="icon-md" aria-label="Delete" />
      </>
    );

    expect(
      screen
        .getByRole("button", { name: "Primary" })
        .getAttribute("data-variant")
    ).toBe("primary");
    expect(
      screen
        .getByRole("button", { name: "Secondary" })
        .getAttribute("data-size")
    ).toBe("sm");
    expect(
      screen.getByRole("button", { name: "Tertiary" }).getAttribute("data-size")
    ).toBe("lg");
    expect(
      screen
        .getByRole("button", { name: "Outline Secondary" })
        .getAttribute("data-variant")
    ).toBe("outline-secondary");
    expect(
      screen
        .getByRole("button", { name: "Delete" })
        .getAttribute("data-variant")
    ).toBe("danger");
  });

  it("supports loading and full-width states", () => {
    render(
      <Button isLoading fullWidth>
        Save
      </Button>
    );

    const button = screen.getByRole("button", { name: "Save" });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("data-loading")).toBe("true");
    expect(button.getAttribute("data-disabled")).toBeNull();
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(button.className.includes("w-full")).toBe(true);
    expect(button.querySelector("svg")).not.toBeNull();
    expect(button.querySelector(".invisible")).toBeNull();
  });

  it("keeps explicit disabled styling separate from loading styling", () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button.getAttribute("data-disabled")).toBe("true");
    expect(button.getAttribute("data-loading")).toBeNull();
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("keeps legacy aliases working during migration", () => {
    render(
      <>
        <Button variant="default" size="default">
          Legacy primary
        </Button>
        <Button variant="outline" size="icon" aria-label="Legacy outline" />
        <Button variant="destructive">Legacy danger</Button>
      </>
    );

    expect(
      screen
        .getByRole("button", { name: "Legacy primary" })
        .getAttribute("data-variant")
    ).toBe("default");
    expect(
      screen
        .getByRole("button", { name: "Legacy outline" })
        .getAttribute("data-size")
    ).toBe("icon");
    expect(
      screen
        .getByRole("button", { name: "Legacy danger" })
        .getAttribute("data-variant")
    ).toBe("destructive");
  });

  it("keeps brand outline and neutral outline-secondary distinct", () => {
    render(
      <>
        <Button variant="outline">Outline</Button>
        <Button variant="outline-secondary">Outline Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </>
    );

    const outline = screen.getByRole("button", { name: "Outline" });
    const outlineSecondary = screen.getByRole("button", {
      name: "Outline Secondary",
    });
    const ghost = screen.getByRole("button", { name: "Ghost" });

    expect(outline.className).toContain(
      "border-[color:var(--button-tertiary-border)]"
    );
    expect(outline.className).toContain("bg-transparent");
    expect(outline.className).toContain(
      "text-[color:var(--button-tertiary-fg)]"
    );
    expect(outlineSecondary.className).toContain(
      "border-[color:var(--button-outline-secondary-border)]"
    );
    expect(outlineSecondary.className).toContain("bg-transparent");
    expect(outlineSecondary.className).toContain(
      "text-[color:var(--button-outline-secondary-fg)]"
    );
    expect(ghost.className).toContain("bg-transparent");
  });

  it("does not apply loading behavior when used asChild", () => {
    render(
      <MemoryRouter>
        <Button asChild isLoading>
          <Link to="/example">Open</Link>
        </Button>
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "Open" });
    expect(link.getAttribute("aria-busy")).toBeNull();
    expect(screen.queryByRole("status", { name: "Loading" })).toBeNull();
  });
});
