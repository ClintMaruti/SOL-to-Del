import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AgentListEmpty } from "../ui/AgentListEmpty";

describe("AgentListEmpty", () => {
  describe("Rendering", () => {
    it("should render the empty state heading", () => {
      render(<AgentListEmpty />);

      expect(screen.getByText("No agents yet")).toBeDefined();
    });

    it("should render the description text", () => {
      render(<AgentListEmpty />);

      expect(
        screen.getByText(/Agents will appear here once they are added/i)
      ).toBeDefined();
    });

    it("should render the create button when onCreateAgent is provided", () => {
      const onCreateAgent = vi.fn();

      render(<AgentListEmpty onCreateAgent={onCreateAgent} />);

      const createButton = screen.getByRole("button", { name: /create/i });
      expect(createButton).toBeDefined();
    });

    it("should not render the create button when onCreateAgent is not provided", () => {
      render(<AgentListEmpty />);

      const createButton = screen.queryByRole("button", { name: /create/i });
      expect(createButton).toBeNull();
    });
  });

  describe("Interactions", () => {
    it("should call onCreateAgent when create button is clicked", async () => {
      const user = userEvent.setup();
      const onCreateAgent = vi.fn();

      render(<AgentListEmpty onCreateAgent={onCreateAgent} />);

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      expect(onCreateAgent).toHaveBeenCalledTimes(1);
    });
  });
});
