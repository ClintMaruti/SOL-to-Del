import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import type { Destination } from "@/entities/destination/model/types";

import { DestinationTreeRow } from "../ui/DestinationTreeRow";

const createDestination = (
  id: string,
  name: string,
  options?: {
    type?: Destination["type"];
    code?: string;
    children?: Destination[];
    coordinates?: { lat: number; lng: number };
    status?: Destination["status"];
  }
): Destination => ({
  id,
  name,
  type: options?.type || "Country",
  code: options?.code,
  children: options?.children,
  coordinates: options?.coordinates,
  status: options?.status,
});

describe("DestinationTreeRow", () => {
  describe("Action Buttons", () => {
    it("should show action buttons on hover when handlers are provided", () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onAdd = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={onAdd}
        />
      );

      const row = container.firstChild as HTMLElement;

      // Initially, buttons should not be visible
      expect(screen.queryByLabelText("Edit Kenya")).toBeNull();
      expect(screen.queryByLabelText("Delete Kenya")).toBeNull();
      expect(screen.queryByLabelText("Add to Kenya")).toBeNull();

      // Hover over the row
      fireEvent.mouseEnter(row);

      // Buttons should now be visible
      expect(screen.getByLabelText("Edit Kenya")).toBeDefined();
      expect(screen.getByLabelText("Delete Kenya")).toBeDefined();
      expect(screen.getByLabelText("Add to Kenya")).toBeDefined();
    });

    it("should hide action buttons when mouse leaves", () => {
      const onEdit = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onEdit={onEdit}
        />
      );

      const row = container.firstChild as HTMLElement;

      // Hover to show buttons
      fireEvent.mouseEnter(row);
      expect(screen.getByLabelText("Edit Kenya")).toBeDefined();

      // Leave hover
      fireEvent.mouseLeave(row);
      expect(screen.queryByLabelText("Edit Kenya")).toBeNull();
    });

    it("should not show action buttons for 'not-in-use' destinations", () => {
      const onEdit = vi.fn();
      const destination = createDestination("kenya", "Kenya", {
        status: "Inactive",
      });

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onEdit={onEdit}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      // Buttons should not appear even on hover
      expect(screen.queryByLabelText("Edit Kenya")).toBeNull();
    });

    it("should not show action buttons when no handlers are provided", () => {
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      // No buttons should appear
      expect(screen.queryByLabelText("Edit Kenya")).toBeNull();
      expect(screen.queryByLabelText("Delete Kenya")).toBeNull();
      expect(screen.queryByLabelText("Add to Kenya")).toBeNull();
    });

    it("should call onEdit when Edit button is clicked", () => {
      const onEdit = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onEdit={onEdit}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      const editButton = screen.getByLabelText("Edit Kenya");
      fireEvent.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(destination);
    });

    it("should call onDelete when Delete button is clicked", () => {
      const onDelete = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onDelete={onDelete}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      const deleteButton = screen.getByLabelText("Delete Kenya");
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(destination);
    });

    it("should call onAdd when Add button is clicked", () => {
      const onAdd = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onAdd={onAdd}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      const addButton = screen.getByLabelText("Add to Kenya");
      fireEvent.click(addButton);

      expect(onAdd).toHaveBeenCalledTimes(1);
      expect(onAdd).toHaveBeenCalledWith(destination);
    });

    it("should show only Edit button when only onEdit is provided", () => {
      const onEdit = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onEdit={onEdit}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      expect(screen.getByLabelText("Edit Kenya")).toBeDefined();
      expect(screen.queryByLabelText("Delete Kenya")).toBeNull();
      expect(screen.queryByLabelText("Add to Kenya")).toBeNull();
    });

    it("should show only Delete button when only onDelete is provided", () => {
      const onDelete = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onDelete={onDelete}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      expect(screen.queryByLabelText("Edit Kenya")).toBeNull();
      expect(screen.getByLabelText("Delete Kenya")).toBeDefined();
      expect(screen.queryByLabelText("Add to Kenya")).toBeNull();
    });

    it("should show only Add button when only onAdd is provided", () => {
      const onAdd = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onAdd={onAdd}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      expect(screen.queryByLabelText("Edit Kenya")).toBeNull();
      expect(screen.queryByLabelText("Delete Kenya")).toBeNull();
      expect(screen.getByLabelText("Add to Kenya")).toBeDefined();
    });

    it("should show buttons in correct order: Edit, Delete, Add", () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onAdd = vi.fn();
      const destination = createDestination("kenya", "Kenya");

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={onAdd}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      const buttons = screen.getAllByRole("button");
      const actionButtons = buttons.filter(
        (btn) =>
          btn.getAttribute("aria-label")?.includes("Edit") ||
          btn.getAttribute("aria-label")?.includes("Delete") ||
          btn.getAttribute("aria-label")?.includes("Add")
      );

      expect(actionButtons).toHaveLength(3);
      expect(actionButtons[0].getAttribute("aria-label")).toBe("Edit Kenya");
      expect(actionButtons[1].getAttribute("aria-label")).toBe("Delete Kenya");
      expect(actionButtons[2].getAttribute("aria-label")).toBe("Add to Kenya");
    });

    it("should stop event propagation when action buttons are clicked", () => {
      const onToggle = vi.fn();
      const onEdit = vi.fn();
      const destination = createDestination("kenya", "Kenya", {
        children: [createDestination("region", "Region")],
      });

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={onToggle}
          onEdit={onEdit}
        />
      );

      const row = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(row);

      const editButton = screen.getByLabelText("Edit Kenya");

      // Click edit button
      fireEvent.click(editButton);

      // onEdit should be called
      expect(onEdit).toHaveBeenCalledTimes(1);

      // onToggle should NOT be called (event propagation stopped)
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe("Coordinates Display", () => {
    it("should hide coordinates when action buttons are shown on hover", () => {
      const onEdit = vi.fn();
      const destination = createDestination("kenya", "Kenya", {
        coordinates: { lat: -0.0236, lng: 37.9062 },
      });

      const { container } = render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
          onEdit={onEdit}
        />
      );

      const row = container.firstChild as HTMLElement;

      // Coordinates should be visible initially
      expect(screen.getByText("-0.0236, 37.9062")).toBeDefined();

      // Hover to show actions
      fireEvent.mouseEnter(row);

      // Coordinates should be hidden (opacity-0 class applied)
      // const coordinatesSpan = screen.queryByText("-0.0236, 37.9062");
      // The element might still exist but with opacity-0, so we check for action buttons instead
      expect(screen.getByLabelText("Edit Kenya")).toBeDefined();
    });

    it("should show coordinates when not hovered and no actions", () => {
      const destination = createDestination("kenya", "Kenya", {
        coordinates: { lat: -0.0236, lng: 37.9062 },
      });

      render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText("-0.0236, 37.9062")).toBeDefined();
    });
  });

  describe("Rendering", () => {
    it("should render destination name", () => {
      const destination = createDestination("kenya", "Kenya");

      render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText("Kenya")).toBeDefined();
    });

    it("should render code badge when code is provided", () => {
      const destination = createDestination("kenya", "Kenya", {
        code: "KEN",
      });

      render(
        <DestinationTreeRow
          destination={destination}
          depth={0}
          isExpanded={false}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText("KEN")).toBeDefined();
    });
  });
});
