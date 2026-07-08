import { RangeInputGroup } from "@sol/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("RangeInputGroup", () => {
  it("renders the paired labels and forwards value changes", () => {
    const onMinChange = vi.fn();
    const onMaxChange = vi.fn();

    render(
      <RangeInputGroup
        minLabel="min"
        maxLabel="max"
        minInputProps={{
          value: "1",
          onChange: onMinChange,
          "aria-label": "min value",
        }}
        maxInputProps={{
          value: "",
          onChange: onMaxChange,
          "aria-label": "max value",
        }}
      />
    );

    expect(screen.getByText("min")).toBeDefined();
    expect(screen.getByText("max")).toBeDefined();

    fireEvent.change(screen.getByLabelText("min value"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("max value"), {
      target: { value: "4" },
    });

    expect(onMinChange).toHaveBeenCalled();
    expect(onMaxChange).toHaveBeenCalled();
  });

  it("marks both inputs invalid when the pair is invalid", () => {
    render(
      <RangeInputGroup
        invalid
        minLabel="min age"
        maxLabel="max age"
        minInputProps={{
          value: "5",
          onChange: vi.fn(),
          "aria-label": "min age value",
        }}
        maxInputProps={{
          value: "",
          onChange: vi.fn(),
          "aria-label": "max age value",
        }}
      />
    );

    expect(
      screen.getByLabelText("min age value").getAttribute("aria-invalid")
    ).toBe("true");
    expect(
      screen.getByLabelText("max age value").getAttribute("aria-invalid")
    ).toBe("true");
  });
});
