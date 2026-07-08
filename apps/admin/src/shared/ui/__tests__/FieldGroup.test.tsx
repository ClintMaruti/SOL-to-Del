import { FieldGroup, Input } from "@sol/ui";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("FieldGroup", () => {
  it("renders labels and helper text", () => {
    render(
      <FieldGroup
        htmlFor="service-name"
        label="Label"
        topRightLabel="Top Right label"
        bottomLeftLabel="Bottom Left label"
        bottomRightLabel="Bottom Right label"
      >
        <Input id="service-name" value="This is my text" readOnly />
      </FieldGroup>
    );

    expect(screen.getByText("Label")).toBeDefined();
    expect(screen.getByText("Top Right label")).toBeDefined();
    expect(screen.getByText("Bottom Left label")).toBeDefined();
    expect(screen.getByText("Bottom Right label")).toBeDefined();
  });

  it("renders the error state in place of helper text", () => {
    render(
      <FieldGroup
        htmlFor="service-name"
        label="Label"
        topRightLabel="Top Right label"
        bottomLeftLabel="Bottom Left label"
        bottomRightLabel="Bottom Right label"
        error="Error state description"
      >
        <Input
          id="service-name"
          value="This is my text"
          readOnly
          aria-invalid
        />
      </FieldGroup>
    );

    expect(screen.getByRole("alert").textContent).toBe(
      "Error state description"
    );
    expect(screen.queryByText("Bottom Left label")).toBeNull();
    expect(screen.queryByText("Bottom Right label")).toBeNull();
  });
});
