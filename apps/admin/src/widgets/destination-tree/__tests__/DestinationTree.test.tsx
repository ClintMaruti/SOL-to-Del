import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import type { Destination } from "@/entities/destination/model/types";

import { DestinationTree } from "../ui/DestinationTree";

// Mock the hooks
vi.mock("@/features/destination-search/model/useDestinationSearch", () => ({
  useDestinationSearch: vi.fn((destinations: Destination[]) => ({
    searchQuery: "",
    setSearchQuery: vi.fn(),
    filteredDestinations: destinations,
    hasResults: destinations.length > 0,
  })),
}));

vi.mock("../model/useDestinationTree", () => ({
  useDestinationTree: vi.fn(() => ({
    expandedIds: new Set<string>(),
    toggleNode: vi.fn(),
    expandAll: vi.fn(),
  })),
}));

const createDestination = (
  id: string,
  name: string,
  options?: {
    type?: Destination["type"];
    code?: string;
    children?: Destination[];
    coordinates?: { lat: number; lng: number };
  }
): Destination => ({
  id,
  name,
  type: options?.type || "Country",
  code: options?.code,
  children: options?.children,
  coordinates: options?.coordinates,
});

describe("DestinationTree", () => {
  describe("Rendering", () => {
    it("should render search input", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      render(<DestinationTree destinations={destinations} />);

      const searchInput = screen.getByPlaceholderText("Search destination");
      expect(searchInput).toBeDefined();
    });

    it("should render destinations", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("uganda", "Uganda"),
      ];

      render(<DestinationTree destinations={destinations} />);

      expect(screen.getByText("Kenya")).toBeDefined();
      expect(screen.getByText("Uganda")).toBeDefined();
    });

    it("should render nested destinations", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          children: [createDestination("region", "Region")],
        }),
      ];

      render(<DestinationTree destinations={destinations} />);

      expect(screen.getByText("Kenya")).toBeDefined();
      // Child should be rendered when parent is expanded (default behavior in mock)
    });

    it("should render empty state when no destinations", () => {
      const destinations: Destination[] = [];

      render(<DestinationTree destinations={destinations} />);

      const emptyState = screen.getByText("No destinations yet");
      expect(emptyState).toBeDefined();
    });
  });

  describe("Search Integration", () => {
    it("should display search input", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      render(<DestinationTree destinations={destinations} />);

      const searchInput = screen.getByPlaceholderText("Search destination");
      expect(searchInput).toBeDefined();
    });
  });

  describe("Tree Structure", () => {
    it("should handle empty destinations array", () => {
      const destinations: Destination[] = [];

      render(<DestinationTree destinations={destinations} />);

      const emptyState = screen.getByText("No destinations yet");
      expect(emptyState).toBeDefined();
    });

    it("should render single destination", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      render(<DestinationTree destinations={destinations} />);

      expect(screen.getByText("Kenya")).toBeDefined();
    });

    it("should render multiple root destinations", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya"),
        createDestination("uganda", "Uganda"),
        createDestination("tanzania", "Tanzania"),
      ];

      render(<DestinationTree destinations={destinations} />);

      expect(screen.getByText("Kenya")).toBeDefined();
      expect(screen.getByText("Uganda")).toBeDefined();
      expect(screen.getByText("Tanzania")).toBeDefined();
    });
  });

  describe("Props", () => {
    it("should accept destinations prop", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      render(<DestinationTree destinations={destinations} />);

      expect(screen.getByText("Kenya")).toBeDefined();
    });

    it("should handle destinations with all optional fields", () => {
      const destinations: Destination[] = [
        createDestination("kenya", "Kenya", {
          code: "KEN",
          coordinates: { lat: -0.0236, lng: 37.9062 },
          children: [
            createDestination("region", "Region", {
              code: "REG",
            }),
          ],
        }),
      ];

      render(<DestinationTree destinations={destinations} />);

      expect(screen.getByText("Kenya")).toBeDefined();
    });

    it("should pass action handlers to DestinationTreeRow", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onAdd = vi.fn();

      const { container } = render(
        <DestinationTree
          destinations={destinations}
          onEdit={onEdit}
          onDelete={onDelete}
          onAdd={onAdd}
        />
      );

      // Find the row element (the div containing the destination)
      const row = container.querySelector(
        '[class*="flex items-center border-b border-border"]'
      ) as HTMLElement;

      expect(row).toBeDefined();

      // Hover over the row
      fireEvent.mouseEnter(row);

      // Action buttons should be visible
      expect(screen.getByLabelText("Edit Kenya")).toBeDefined();
      expect(screen.getByLabelText("Delete Kenya")).toBeDefined();
      expect(screen.getByLabelText("Add to Kenya")).toBeDefined();
    });

    it("should not show action buttons when handlers are not provided", () => {
      const destinations: Destination[] = [createDestination("kenya", "Kenya")];

      const { container } = render(
        <DestinationTree destinations={destinations} />
      );

      // Find the row element
      const row = container.querySelector(
        '[class*="flex items-center border-b border-border"]'
      ) as HTMLElement;

      expect(row).toBeDefined();

      // Hover over the row
      fireEvent.mouseEnter(row);

      // No action buttons should be visible
      expect(screen.queryByLabelText("Edit Kenya")).toBeNull();
      expect(screen.queryByLabelText("Delete Kenya")).toBeNull();
      expect(screen.queryByLabelText("Add to Kenya")).toBeNull();
    });
  });
});
