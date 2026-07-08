import { render, screen } from "@testing-library/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";
import { describe, expect, it } from "vitest";

describe("Select", () => {
  it("renders semantic trigger sizes and filled state", () => {
    const { container } = render(
      <Select open defaultValue="one">
        <SelectTrigger aria-label="Status" size="lg" filled>
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
          <SelectItem value="two">Two</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = container.querySelector('[data-slot="select-trigger"]');

    if (!trigger) {
      throw new Error("Expected select trigger to render");
    }

    expect(trigger.getAttribute("data-size")).toBe("lg");
    expect(trigger.getAttribute("data-filled")).toBe("true");
  });

  it("supports invalid triggers and selected option styling", () => {
    const { container } = render(
      <Select open defaultValue="one">
        <SelectTrigger aria-label="Invalid status" aria-invalid="true">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
          <SelectItem value="two" disabled>
            Two
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = container.querySelector('[data-slot="select-trigger"]');
    const option = screen.getByRole("option", { name: "One" });

    if (!trigger) {
      throw new Error("Expected invalid select trigger to render");
    }

    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    expect(option.className).toContain(
      "data-[state=checked]:bg-[color:var(--select-item-bg-selected)]"
    );
  });

  it("propagates invalid state from the select root to the trigger", () => {
    const { container } = render(
      <Select aria-invalid="true" open defaultValue="one">
        <SelectTrigger aria-label="Inherited invalid status">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
        </SelectContent>
      </Select>
    );

    const trigger = container.querySelector('[data-slot="select-trigger"]');

    if (!trigger) {
      throw new Error("Expected inherited invalid select trigger to render");
    }

    expect(trigger.getAttribute("aria-invalid")).toBe("true");
  });
});
