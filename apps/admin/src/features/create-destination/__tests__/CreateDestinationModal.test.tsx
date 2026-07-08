import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Destination } from "@/entities/destination/model/types";

import type { CreateDestinationPayload } from "../api/useCreateDestination";
import { useCreateDestination } from "../api/useCreateDestination";
import { CreateDestinationModal } from "../ui/CreateDestinationModal";

// Mock only the API mutation hook
vi.mock("../api/useCreateDestination", () => ({
  useCreateDestination: vi.fn(),
}));

// Mock ParentDestinationDropdown since it's tested separately
vi.mock("../ui/ParentDestinationDropdown", () => ({
  ParentDestinationDropdown: () => (
    <div data-testid="parent-destination-dropdown">Parent Destination Mock</div>
  ),
}));

vi.mock("@/entities/destination/lib/destination-utils", () => ({
  getAllDestinationTypes: vi.fn(() => [
    { type: "Country", icon: () => null, color: "text-sky-600" },
    { type: "Region", icon: () => null, color: "text-lime-600" },
    { type: "Area", icon: () => null, color: "text-fuchsia-600" },
    { type: "City", icon: () => null, color: "text-indigo-600" },
    { type: "Airport", icon: () => null, color: "text-amber-600" },
  ]),
  wouldCreateCircularParent: vi.fn(() => false),
}));

// Helper to create test destinations
const createDestination = (
  id: string,
  name: string,
  options?: {
    type?: Destination["type"];
    code?: string;
    coordinates?: { lat: number; lng: number };
  }
): Destination => ({
  id,
  name,
  type: options?.type || "Country",
  code: options?.code,
  coordinates: options?.coordinates,
});

describe("CreateDestinationModal", () => {
  const mockCreateDestination = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCreateDestination).mockReturnValue({
      mutate: mockCreateDestination,
      isPending: false,
      error: null,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useCreateDestination>);
  });

  describe("Rendering", () => {
    it("should not render content when modal is closed", () => {
      render(
        <CreateDestinationModal
          open={false}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      expect(screen.queryByText("Create New Destination")).toBeNull();
    });

    it("should render modal when open is true", () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      expect(screen.getByText("Create New Destination")).toBeDefined();
      expect(
        screen.getByText(/Create a new destination in your hierarchy/)
      ).toBeDefined();
    });

    it("should render all form fields", () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      // Type label
      const typeLabel = screen.getByText((content, element) => {
        return (
          element?.tagName === "LABEL" &&
          element.getAttribute("for") === "type" &&
          content.includes("Type")
        );
      });
      expect(typeLabel).toBeDefined();

      expect(screen.getByLabelText(/name/i)).toBeDefined();
      expect(screen.getByTestId("parent-destination-dropdown")).toBeDefined();
      expect(screen.getByLabelText(/latitude/i)).toBeDefined();
      expect(screen.getByLabelText(/longitude/i)).toBeDefined();
    });

    it("should render destination code field for Country type (default)", () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      expect(screen.getByLabelText(/destination code/i)).toBeDefined();
    });

    it("should render IATA code field when Airport type is selected", async () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      // Click the Airport toggle
      const typeButtons = screen.getAllByRole("radio");
      const airportButton = typeButtons.find((btn) =>
        btn.textContent?.includes("Airport")
      );

      if (airportButton) {
        fireEvent.click(airportButton);
      }

      await waitFor(() => {
        expect(screen.getByLabelText(/iata code/i)).toBeDefined();
      });
    });

    it("should render API error message", () => {
      vi.mocked(useCreateDestination).mockReturnValue({
        mutate: mockCreateDestination,
        isPending: false,
        error: new Error("Failed to create destination"),
      } as unknown as ReturnType<typeof useCreateDestination>);

      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      expect(screen.getByText("Failed to create destination")).toBeDefined();
    });

    it("should disable buttons when loading", () => {
      vi.mocked(useCreateDestination).mockReturnValue({
        mutate: mockCreateDestination,
        isPending: true,
        error: null,
      } as unknown as ReturnType<typeof useCreateDestination>);

      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      const submitButton = screen.getByRole("button", {
        name: /create/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      expect(submitButton).toHaveProperty("disabled", true);
      expect(cancelButton).toHaveProperty("disabled", true);
    });

    it("should keep Create Destination label when mutation is pending", () => {
      vi.mocked(useCreateDestination).mockReturnValue({
        mutate: mockCreateDestination,
        isPending: true,
        error: null,
      } as unknown as ReturnType<typeof useCreateDestination>);

      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      expect(screen.getByRole("button", { name: /create/i })).toBeDefined();
    });
  });

  describe("Form Submission", () => {
    it("should call createDestination with parsed data on valid submit", async () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      // Fill in the required name field
      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: "Kenya" } });

      // Submit the form
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockCreateDestination).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Kenya",
            type: "Country",
            parentId: null,
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
          })
        );
      });
    });

    it("should not submit when name is empty and show validation error", async () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      // Submit with empty name
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeDefined();
      });

      expect(mockCreateDestination).not.toHaveBeenCalled();
    });

    it("should validate latitude on submit", async () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: "Kenya" } });

      const latInput = screen.getByLabelText(/latitude/i);
      fireEvent.change(latInput, { target: { value: "91" } });

      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(
          screen.getByText("Latitude must be a number between -90 and 90")
        ).toBeDefined();
      });

      expect(mockCreateDestination).not.toHaveBeenCalled();
    });

    it("should validate longitude on submit", async () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: "Kenya" } });

      const lngInput = screen.getByLabelText(/longitude/i);
      fireEvent.change(lngInput, { target: { value: "181" } });

      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(
          screen.getByText("Longitude must be a number between -180 and 180")
        ).toBeDefined();
      });

      expect(mockCreateDestination).not.toHaveBeenCalled();
    });

    it("should close modal on successful creation", async () => {
      let onSuccessCallback: (() => void) | undefined;
      mockCreateDestination.mockImplementation(
        (
          _data: CreateDestinationPayload,
          options?: { onSuccess?: () => void }
        ) => {
          onSuccessCallback = options?.onSuccess;
        }
      );

      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: "Kenya" } });

      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(onSuccessCallback).toBeDefined();
      });

      if (onSuccessCallback) {
        onSuccessCallback();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      }
    });
  });

  describe("Cancel Behavior", () => {
    it("should call onOpenChange(false) when cancel is clicked", () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Type Toggle Behavior", () => {
    it("should switch between destination types", async () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      const typeButtons = screen.getAllByRole("radio");
      const cityButton = typeButtons.find((btn) =>
        btn.textContent?.includes("City")
      );

      if (cityButton) {
        fireEvent.click(cityButton);
      }

      // After clicking City, the destination code field should still be visible
      // (destination code is shown for all non-Airport types)
      await waitFor(() => {
        expect(screen.getByLabelText(/destination code/i)).toBeDefined();
      });
    });
  });

  describe("With Parent Destination", () => {
    const parentDestination = createDestination("kenya", "Kenya", {
      type: "Country",
    });

    it("should disable the Country toggle when parentDestination is provided", () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[parentDestination]}
          parentDestination={parentDestination}
        />
      );

      const typeButtons = screen.getAllByRole("radio");
      const countryButton = typeButtons.find((btn) =>
        btn.textContent?.includes("Country")
      );

      expect(countryButton).toBeDefined();
      expect(countryButton).toHaveProperty("disabled", true);
    });

    it("should default to Region type when parentDestination is provided", async () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[parentDestination]}
          parentDestination={parentDestination}
        />
      );

      await waitFor(() => {
        const typeButtons = screen.getAllByRole("radio");
        const regionButton = typeButtons.find((btn) =>
          btn.textContent?.includes("Region")
        );

        expect(regionButton).toBeDefined();
        expect(regionButton?.getAttribute("aria-checked")).toBe("true");
      });
    });

    it("should not disable non-Country toggles when parentDestination is provided", () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[parentDestination]}
          parentDestination={parentDestination}
        />
      );

      const typeButtons = screen.getAllByRole("radio");
      const nonCountryButtons = typeButtons.filter(
        (btn) => !btn.textContent?.includes("Country")
      );

      for (const btn of nonCountryButtons) {
        expect(btn).toHaveProperty("disabled", false);
      }
    });
  });

  describe("With Destinations", () => {
    it("should render with provided destinations", () => {
      const destinations = [
        createDestination("kenya", "Kenya", { type: "Country" }),
        createDestination("nairobi", "Nairobi", { type: "City" }),
      ];

      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={destinations}
        />
      );

      expect(screen.getByText("Create New Destination")).toBeDefined();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for all form fields", () => {
      render(
        <CreateDestinationModal
          open={true}
          onOpenChange={mockOnOpenChange}
          destinations={[]}
        />
      );

      expect(screen.getByLabelText(/name/i)).toBeDefined();
      expect(screen.getByLabelText(/latitude/i)).toBeDefined();
      expect(screen.getByLabelText(/longitude/i)).toBeDefined();
      expect(screen.getByLabelText(/destination code/i)).toBeDefined();
    });
  });
});
