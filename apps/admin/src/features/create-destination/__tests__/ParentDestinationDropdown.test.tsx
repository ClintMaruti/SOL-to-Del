import { useVirtualizer } from "@tanstack/react-virtual";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { flattenDestinationTree } from "@/entities/destination/lib/destination-utils";
import type { Destination } from "@/entities/destination/model/types";

import { ParentDestinationDropdown } from "../ui/ParentDestinationDropdown";

// Mock destination-utils
vi.mock("@/entities/destination/lib/destination-utils", () => ({
  flattenDestinationTree: vi.fn(() => []),
  getAllDestinationTypes: vi.fn(() => [
    { type: "Country", icon: () => null, color: "text-sky-600" },
    { type: "Region", icon: () => null, color: "text-lime-600" },
    { type: "Area", icon: () => null, color: "text-fuchsia-600" },
    { type: "City", icon: () => null, color: "text-indigo-600" },
    { type: "Airport", icon: () => null, color: "text-amber-600" },
  ]),
}));

// Mock @tanstack/react-virtual to bypass DOM measurement requirements in jsdom
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: vi
    .fn()
    .mockImplementation(
      (options: {
        count: number;
        estimateSize: (index: number) => number;
      }) => ({
        getVirtualItems: () =>
          Array.from({ length: options.count }, (_, i) => ({
            index: i,
            start:
              i *
              (typeof options.estimateSize === "function"
                ? options.estimateSize(i)
                : 36),
            size:
              typeof options.estimateSize === "function"
                ? options.estimateSize(i)
                : 36,
            key: `vitem_${i}`,
          })),
        getTotalSize: () => {
          let total = 0;
          for (let i = 0; i < options.count; i++) {
            total +=
              typeof options.estimateSize === "function"
                ? options.estimateSize(i)
                : 36;
          }
          return total;
        },
      })
    ),
}));

// Helper to create test destinations
const createDestination = (
  id: string,
  name: string,
  options?: {
    type?: Destination["type"];
    code?: string;
    coordinates?: { lat: number; lng: number };
    children?: Destination[];
  }
): Destination => ({
  id,
  name,
  type: options?.type || "Country",
  code: options?.code,
  coordinates: options?.coordinates,
  children: options?.children || [],
});

/** Helper to create a mock TanStack Form field API for parentId */
function createMockField(value: string = "", errors: string[] = []) {
  return {
    state: {
      value,
      meta: {
        errors,
        isValid: errors.length === 0,
        errorMap: {},
        isTouched: false,
        isDirty: false,
        isPristine: true,
        isValidating: false,
      },
    },
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    name: "parentId",
  };
}

describe("ParentDestinationDropdown", () => {
  const defaultField = createMockField();

  const defaultProps = {
    destinations: [] as Destination[],
    field: defaultField,
    isParentOptional: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(flattenDestinationTree).mockReturnValue([]);
    // Reset the default field mock
    defaultProps.field = createMockField();
  });

  describe("Rendering", () => {
    it("should render the label 'Parent Destination'", () => {
      render(<ParentDestinationDropdown {...defaultProps} />);

      expect(screen.getByText("Parent Destination")).toBeDefined();
    });

    it("should render the select trigger", () => {
      render(<ParentDestinationDropdown {...defaultProps} />);

      expect(
        screen.getByRole("combobox", { name: /parent destination/i })
      ).toBeDefined();
    });

    it("should show required indicator when isParentOptional is false", () => {
      render(
        <ParentDestinationDropdown {...defaultProps} isParentOptional={false} />
      );

      const label = screen.getByText("Parent Destination");
      const asterisk = label.querySelector(".text-destructive");
      expect(asterisk).not.toBeNull();
      expect(asterisk?.textContent).toBe("*");
    });

    it("should not show required indicator when isParentOptional is true", () => {
      render(
        <ParentDestinationDropdown {...defaultProps} isParentOptional={true} />
      );

      const label = screen.getByText("Parent Destination");
      const asterisk = label.querySelector(".text-destructive");
      expect(asterisk).toBeNull();
    });

    it("should show placeholder in trigger when parentId is empty", () => {
      render(<ParentDestinationDropdown {...defaultProps} />);

      expect(screen.getByText("Select Parent Destination")).toBeDefined();
    });

    it("should show placeholder in trigger when parentId is 'root_id'", () => {
      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("root_id")}
        />
      );

      expect(screen.getByText("Select Parent Destination")).toBeDefined();
    });

    it("should show error message when parentId error exists", () => {
      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("", ["Parent destination is required"])}
        />
      );

      expect(screen.getByText("Parent destination is required")).toBeDefined();
    });

    it("should set aria-invalid on trigger when parentId error exists", () => {
      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("", ["Parent destination is required"])}
        />
      );

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger.getAttribute("aria-invalid")).toBe("true");
    });

    it("should set aria-invalid to false on trigger when no errors", () => {
      render(<ParentDestinationDropdown {...defaultProps} />);

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger.getAttribute("aria-invalid")).toBe("false");
    });
  });

  describe("Disabled States", () => {
    it("should disable select when parentDestination prop is provided", () => {
      const parentDestination = createDestination("kenya", "Kenya");

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          parentDestination={parentDestination}
          field={createMockField("kenya")}
        />
      );

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger).toHaveProperty("disabled", true);
    });

    it("should disable select when isParentOptional is true", () => {
      render(
        <ParentDestinationDropdown {...defaultProps} isParentOptional={true} />
      );

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger).toHaveProperty("disabled", true);
    });

    it("should enable select when no parentDestination and isParentOptional is false", () => {
      render(
        <ParentDestinationDropdown {...defaultProps} isParentOptional={false} />
      );

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger).toHaveProperty("disabled", false);
    });

    it("should disable select when both parentDestination and isParentOptional", () => {
      const parentDestination = createDestination("kenya", "Kenya");

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          parentDestination={parentDestination}
          isParentOptional={true}
          field={createMockField("kenya")}
        />
      );

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger).toHaveProperty("disabled", true);
    });
  });

  describe("Selected Parent Display", () => {
    it("should show parentDestination name when parentId matches parentDestination.id", () => {
      const parentDestination = createDestination("kenya", "Kenya", {
        type: "Country",
      });

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          parentDestination={parentDestination}
          field={createMockField("kenya")}
        />
      );

      expect(screen.getByText("Kenya")).toBeDefined();
    });

    it("should show selected destination from flattened tree when no parentDestination prop", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
        { id: "nairobi", name: "Nairobi", type: "City", parent: "Kenya" },
      ]);

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("nairobi")}
        />
      );

      expect(screen.getByText("Nairobi")).toBeDefined();
    });

    it("should show only destination name in trigger (no parent path)", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
        { id: "nairobi", name: "Nairobi", type: "City", parent: "Kenya" },
      ]);

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("nairobi")}
        />
      );

      expect(screen.getByText("Nairobi")).toBeDefined();
      expect(screen.queryByText("- Kenya")).toBeNull();
    });

    it("should not show parent path when selected destination has no parent", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
      ]);

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("kenya")}
        />
      );

      expect(screen.getByText("Kenya")).toBeDefined();
      expect(screen.queryByText(/^-/)).toBeNull();
    });

    it("should return null when parentId does not match any destination", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
      ]);

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("nonexistent")}
        />
      );

      // Should not show "All Destinations" since parentId is set (but not root_id)
      // The trigger should exist but the selected display returns null
      expect(
        screen.getByRole("combobox", { name: /parent destination/i })
      ).toBeDefined();
    });
  });

  describe("Data Flow", () => {
    it("should call flattenDestinationTree with provided destinations", () => {
      const destinations = [
        createDestination("kenya", "Kenya"),
        createDestination("tanzania", "Tanzania"),
      ];

      render(
        <ParentDestinationDropdown
          {...defaultProps}
          destinations={destinations}
        />
      );

      expect(flattenDestinationTree).toHaveBeenCalledWith(destinations);
    });

    it("should pass correct count to virtualizer for single destination", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
      ]);

      render(<ParentDestinationDropdown {...defaultProps} />);

      const lastCall = vi.mocked(useVirtualizer).mock.calls.at(-1);
      expect(lastCall?.[0].count).toBe(1);
    });

    it("should pass correct count to virtualizer for multiple destinations", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
        { id: "nairobi", name: "Nairobi", type: "City", parent: "Kenya" },
        { id: "mombasa", name: "Mombasa", type: "City", parent: "Kenya" },
      ]);

      render(<ParentDestinationDropdown {...defaultProps} />);

      const lastCall = vi.mocked(useVirtualizer).mock.calls.at(-1);
      expect(lastCall?.[0].count).toBe(3);
    });

    it("should pass count of 0 when no destinations", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([]);

      render(<ParentDestinationDropdown {...defaultProps} />);

      const lastCall = vi.mocked(useVirtualizer).mock.calls.at(-1);
      expect(lastCall?.[0].count).toBe(0);
    });
  });

  describe("Virtualization", () => {
    it("should estimate 36px for items without parent subtitle", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
      ]);

      render(<ParentDestinationDropdown {...defaultProps} />);

      const lastCall = vi.mocked(useVirtualizer).mock.calls.at(-1);
      const estimateSize = lastCall?.[0].estimateSize;

      // Index 0: "Kenya" with no parent → 36px
      expect(estimateSize?.(0)).toBe(36);
    });

    it("should estimate 50px for items with parent subtitle", () => {
      vi.mocked(flattenDestinationTree).mockReturnValue([
        { id: "kenya", name: "Kenya", type: "Country" },
        { id: "nairobi", name: "Nairobi", type: "City", parent: "Kenya" },
      ]);

      render(<ParentDestinationDropdown {...defaultProps} />);

      const lastCall = vi.mocked(useVirtualizer).mock.calls.at(-1);
      const estimateSize = lastCall?.[0].estimateSize;

      // Index 0: "Kenya" without parent → 36px
      expect(estimateSize?.(0)).toBe(36);
      // Index 1: "Nairobi" with parent "Kenya" → 50px
      expect(estimateSize?.(1)).toBe(50);
    });

    it("should use overscan of 5", () => {
      render(<ParentDestinationDropdown {...defaultProps} />);

      const lastCall = vi.mocked(useVirtualizer).mock.calls.at(-1);
      expect(lastCall?.[0].overscan).toBe(5);
    });
  });

  describe("Accessibility", () => {
    it("should have proper htmlFor on label pointing to the select trigger", () => {
      render(<ParentDestinationDropdown {...defaultProps} />);

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger.id).toBe("parent");
    });

    it("should mark trigger as invalid when parentId error exists", () => {
      render(
        <ParentDestinationDropdown
          {...defaultProps}
          field={createMockField("", ["Error"])}
        />
      );

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger.getAttribute("aria-invalid")).toBe("true");
    });

    it("should not mark trigger as invalid when no errors", () => {
      render(<ParentDestinationDropdown {...defaultProps} />);

      const trigger = screen.getByRole("combobox", {
        name: /parent destination/i,
      });
      expect(trigger.getAttribute("aria-invalid")).toBe("false");
    });
  });
});
