import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SupplierContractsListEmpty } from "../ui/SupplierContractsListEmpty";

describe("SupplierContractsListEmpty", () => {
  describe("Rendering", () => {
    it("should render the empty state icon", () => {
      const { container } = render(<SupplierContractsListEmpty />);

      const icon = container.querySelector("svg");
      expect(icon).toBeDefined();
    });

    it("should render the 'No Contracts yet' title", () => {
      render(<SupplierContractsListEmpty />);

      expect(screen.getByText("No Contracts yet")).toBeDefined();
    });

    it("should render the description text", () => {
      render(<SupplierContractsListEmpty />);

      expect(
        screen.getByText(/contracts will appear here once they are added/i)
      ).toBeDefined();
      expect(
        screen.getByText(
          /attach the first one to start working with suppliers/i
        )
      ).toBeDefined();
    });

    it("should render action button when onAttachContract is provided", () => {
      const onAttachContract = vi.fn();

      render(
        <SupplierContractsListEmpty onAttachContract={onAttachContract} />
      );

      const button = screen.getByRole("button", { name: /attach contract/i });
      expect(button).toBeDefined();
    });

    it("should not render action button when onAttachContract is not provided", () => {
      render(<SupplierContractsListEmpty />);

      const button = screen.queryByRole("button", {
        name: /attach contract/i,
      });
      expect(button).toBeNull();
    });
  });

  describe("Interactions", () => {
    it("should call onAttachContract when button is clicked", async () => {
      const user = userEvent.setup();
      const onAttachContract = vi.fn();

      render(
        <SupplierContractsListEmpty onAttachContract={onAttachContract} />
      );

      const button = screen.getByRole("button", { name: /attach contract/i });
      await user.click(button);

      expect(onAttachContract).toHaveBeenCalledTimes(1);
    });
  });

  describe("Styling", () => {
    it("should have centered content", () => {
      const { container } = render(<SupplierContractsListEmpty />);

      const contentWrapper = container.querySelector(
        ".flex.flex-col.items-center"
      );
      expect(contentWrapper).toBeDefined();
      expect(contentWrapper?.className).toContain("justify-center");
    });

    it("should have a sky icon container", () => {
      const { container } = render(<SupplierContractsListEmpty />);

      const iconContainer = container.querySelector(".bg-sky-100");
      expect(iconContainer).toBeDefined();
    });
  });

  describe("Content", () => {
    it("should display proper heading hierarchy", () => {
      render(<SupplierContractsListEmpty />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeDefined();
      expect(heading.textContent).toBe("No Contracts yet");
    });
  });
});
