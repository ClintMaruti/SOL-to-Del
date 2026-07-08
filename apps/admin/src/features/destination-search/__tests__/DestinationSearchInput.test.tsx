import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DestinationSearchInput } from "../ui/DestinationSearchInput";

describe("DestinationSearchInput", () => {
  describe("Rendering", () => {
    it("should render input field", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDefined();
    });

    it("should render search icon", () => {
      const onChange = vi.fn();
      const { container } = render(
        <DestinationSearchInput value="" onChange={onChange} />
      );

      const icon = container.querySelector("svg");
      expect(icon).not.toBeNull();
    });

    it("should apply correct CSS classes", () => {
      const onChange = vi.fn();
      const { container } = render(
        <DestinationSearchInput value="" onChange={onChange} />
      );

      const wrapper = container.querySelector(".relative.mb-4");
      expect(wrapper).not.toBeNull();

      const input = screen.getByRole("textbox");
      expect(input.className).toContain("text-brand-primary");
    });
  });

  describe("Props", () => {
    it("should display initial value", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="kenya" onChange={onChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("kenya");
    });

    it("should use default placeholder when not provided", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText("Search destination");
      expect(input).toBeDefined();
    });

    it("should use custom placeholder when provided", () => {
      const onChange = vi.fn();
      render(
        <DestinationSearchInput
          value=""
          onChange={onChange}
          placeholder="Custom placeholder"
        />
      );

      const input = screen.getByPlaceholderText("Custom placeholder");
      expect(input).toBeDefined();
    });

    it("should call onChange when input changes", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "kenya" } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("kenya");
    });
  });

  describe("User Interactions", () => {
    it("should update value when typing", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test" } });

      expect(onChange).toHaveBeenCalledWith("test");
    });

    it("should handle multiple changes correctly", () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <DestinationSearchInput value="" onChange={onChange} />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "kenya" } });
      expect(onChange).toHaveBeenCalledWith("kenya");

      rerender(<DestinationSearchInput value="kenya" onChange={onChange} />);
      fireEvent.change(input, { target: { value: "uganda" } });
      expect(onChange).toHaveBeenCalledWith("uganda");
    });

    it("should handle clearing input", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="kenya" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "" } });

      expect(onChange).toHaveBeenCalledWith("");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty value", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should handle long value", () => {
      const longValue = "a".repeat(1000);
      const onChange = vi.fn();
      render(<DestinationSearchInput value={longValue} onChange={onChange} />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe(longValue);
    });

    it("should handle special characters", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "test@123!$%" } });

      expect(onChange).toHaveBeenCalledWith("test@123!$%");
    });

    it("should handle unicode characters", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "café" } });

      expect(onChange).toHaveBeenCalledWith("café");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible input", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDefined();
      expect(input.getAttribute("type")).toBe("text");
    });

    it("should have proper input attributes", () => {
      const onChange = vi.fn();
      render(<DestinationSearchInput value="" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      expect(input.getAttribute("type")).toBe("text");
    });
  });
});
