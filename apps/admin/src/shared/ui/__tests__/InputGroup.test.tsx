import { InputGroup, InputGroupAddon, InputGroupInput } from "@sol/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import { Search } from "lucide-react";
import { describe, expect, it } from "vitest";

describe("InputGroup", () => {
  it("uses the same border-box focus treatment as regular inputs", () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" />
      </InputGroup>
    );

    const group = container.querySelector('[data-slot="input-group"]');

    expect(group).not.toBeNull();
    expect(group?.className).toContain("box-border");
    expect(group?.className).toContain(
      "has-[[data-slot=input-group-control]:focus-visible]:border-[3px]"
    );
    expect(group?.className).toContain(
      "has-[[data-slot=input-group-control]:focus-visible]:border-[color:var(--input-border-focus)]"
    );
  });

  it("keeps grouped inputs visually transparent even when they are filled", () => {
    render(
      <InputGroup>
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search" defaultValue="" />
      </InputGroup>
    );

    const input = screen.getByRole("textbox", { name: "Search" });

    fireEvent.change(input, { target: { value: "margin" } });

    expect(input.getAttribute("data-filled")).toBe("true");
    expect(input.className).toContain("data-[filled=true]:bg-transparent");
    expect(input.className).toContain(
      "aria-invalid:data-[filled=true]:bg-transparent"
    );
  });
});
