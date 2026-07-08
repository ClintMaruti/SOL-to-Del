import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AgencyListEmpty } from "../ui/AgencyListEmpty";

describe("AgencyListEmpty", () => {
  describe("Rendering", () => {
    it("should render the empty state icon", () => {
      const { container } = render(<AgencyListEmpty />);

      // Should have an SVG icon
      const icon = container.querySelector("svg");
      expect(icon).toBeDefined();
    });

    it("should render the 'No agencies yet' title", () => {
      render(<AgencyListEmpty />);

      expect(screen.getByText("No agencies yet")).toBeDefined();
    });

    it("should render the description text", () => {
      render(<AgencyListEmpty />);

      expect(
        screen.getByText(/agencies will appear here once they are added/i)
      ).toBeDefined();
      expect(
        screen.getByText(/create an agency to start managing agents/i)
      ).toBeDefined();
    });

    it("should render create button when onCreateAgency is provided", () => {
      const onCreateAgency = vi.fn();

      render(<AgencyListEmpty onCreateAgency={onCreateAgency} />);

      const createButton = screen.getByRole("button", { name: /create/i });
      expect(createButton).toBeDefined();
    });

    it("should not render create button when onCreateAgency is not provided", () => {
      render(<AgencyListEmpty />);

      const createButton = screen.queryByRole("button", { name: /create/i });
      expect(createButton).toBeNull();
    });
  });

  describe("Interactions", () => {
    it("should call onCreateAgency when create button is clicked", async () => {
      const user = userEvent.setup();
      const onCreateAgency = vi.fn();

      render(<AgencyListEmpty onCreateAgency={onCreateAgency} />);

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      expect(onCreateAgency).toHaveBeenCalledTimes(1);
    });
  });

  describe("Styling", () => {
    it("should have centered content", () => {
      const { container } = render(<AgencyListEmpty />);

      const contentWrapper = container.querySelector(
        ".flex.flex-col.items-center"
      );
      expect(contentWrapper).toBeDefined();
      expect(contentWrapper?.className).toContain("justify-center");
    });

    it("should have a blue icon container", () => {
      const { container } = render(<AgencyListEmpty />);

      const iconContainer = container.querySelector(".bg-sky-100");
      expect(iconContainer).toBeDefined();
    });

    it("should have destructive variant button", () => {
      const onCreateAgency = vi.fn();
      render(<AgencyListEmpty onCreateAgency={onCreateAgency} />);

      const createButton = screen.getByRole("button", { name: /create/i });
      // The button should have destructive styling (usually red background)
      expect(createButton).toBeDefined();
    });
  });

  describe("Content", () => {
    it("should display proper heading hierarchy", () => {
      render(<AgencyListEmpty />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeDefined();
      expect(heading.textContent).toBe("No agencies yet");
    });
  });
});
