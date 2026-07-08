import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useDestination } from "@/entities/destination/api/useDestination";
import { findParentDestination } from "@/entities/destination/lib/destination-utils";
import type {
  DestinationApiItem,
  UpdateLocationRequest,
} from "@/entities/destination/model/api-types";
import type { Destination } from "@/entities/destination/model/types";

import { useUpdateDestination } from "../api/useUpdateDestination";
import { EditDestinationModal } from "../ui/EditDestinationModal";

vi.mock("@/entities/destination/api/useDestination", () => ({
  useDestination: vi.fn(),
}));

vi.mock("../api/useUpdateDestination", async () => {
  const actual = await vi.importActual<
    typeof import("../api/useUpdateDestination")
  >("../api/useUpdateDestination");
  return {
    ...actual,
    useUpdateDestination: vi.fn(),
  };
});

vi.mock("@/entities/destination/lib/destination-utils", () => ({
  findParentDestination: vi.fn(),
  getAllDestinationTypes: vi.fn(() => [
    { type: "Country", icon: () => null, color: "text-sky-600" },
    { type: "Region", icon: () => null, color: "text-lime-600" },
    { type: "Area", icon: () => null, color: "text-fuchsia-600" },
    { type: "City", icon: () => null, color: "text-indigo-600" },
    { type: "Airport", icon: () => null, color: "text-amber-600" },
  ]),
}));

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

describe("EditDestinationModal", () => {
  const mockUpdateDestination = vi.fn();
  const mockOnOpenChange = vi.fn();

  const defaultDestination = createDestination("kenya", "Kenya", {
    type: "Country",
    code: "KEN",
    coordinates: { lat: -0.0236, lng: 37.9062 },
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useDestination).mockReturnValue({
      data: {
        id: "kenya",
        parentId: "root_id",
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: -0.0236,
        longitude: 37.9062,
        isActive: true,
        version: 1,
        isPreferred: false,
      } as DestinationApiItem,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDestination>);

    vi.mocked(findParentDestination).mockReturnValue(null);

    vi.mocked(useUpdateDestination).mockReturnValue({
      mutate: mockUpdateDestination,
      isPending: false,
      error: null,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateDestination>);
  });

  describe("Rendering", () => {
    it("should not render when destination is null", () => {
      const { container } = render(
        <EditDestinationModal
          destination={null}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render modal when destination is provided", () => {
      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("Edit Destination")).toBeDefined();
      expect(
        screen.getByText("You can change the name, code or coordinates only.")
      ).toBeDefined();
    });

    it("should render all form fields", () => {
      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const typeLabel = screen.getByText((content, element) => {
        return (
          element?.tagName === "LABEL" &&
          element.getAttribute("for") === "type" &&
          content.includes("Type")
        );
      });
      expect(typeLabel).toBeDefined();
      expect(screen.getByLabelText(/name/i)).toBeDefined();
      expect(screen.getByLabelText(/parent destination/i)).toBeDefined();
      expect(screen.getByLabelText(/code/i)).toBeDefined();
      expect(screen.getByLabelText(/latitude/i)).toBeDefined();
      expect(screen.getByLabelText(/longitude/i)).toBeDefined();
    });

    it("should display destination name in input", () => {
      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("Kenya");
    });

    it("should display parent as 'All Destinations' when parentId is root_id", () => {
      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const parentInput = screen.getByLabelText(
        /parent destination/i
      ) as HTMLInputElement;
      expect(parentInput.value).toBe("All Destinations");
    });

    it("should display parent destination name when parent exists", () => {
      const parentDest = createDestination("parent", "Parent Country");
      vi.mocked(useDestination).mockReturnValue({
        data: { id: "kenya", parentId: "parent" } as DestinationApiItem,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useDestination>);
      vi.mocked(findParentDestination).mockReturnValue(parentDest);

      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[parentDest]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const parentInput = screen.getByLabelText(
        /parent destination/i
      ) as HTMLInputElement;
      expect(parentInput.value).toBe("Parent Country");
    });

    it("should render API error message", () => {
      vi.mocked(useUpdateDestination).mockReturnValue({
        mutate: mockUpdateDestination,
        isPending: false,
        error: new Error("Failed to update destination"),
      } as unknown as ReturnType<typeof useUpdateDestination>);

      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("Failed to update destination")).toBeDefined();
    });

    it("should disable buttons when loading", () => {
      vi.mocked(useUpdateDestination).mockReturnValue({
        mutate: mockUpdateDestination,
        isPending: true,
        error: null,
      } as unknown as ReturnType<typeof useUpdateDestination>);

      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      expect(submitButton).toHaveProperty("disabled", true);
      expect(cancelButton).toHaveProperty("disabled", true);
    });
  });

  describe("Form Submission", () => {
    it("should call updateDestination with correct data on submit", async () => {
      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockUpdateDestination).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "kenya",
            parentId: null,
            name: "Kenya",
            type: "Country",
            code: "KEN",
            isPreferred: false,
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
          })
        );
      });
    });

    it("should not submit when name is empty and show validation error", async () => {
      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const nameInput = screen.getByLabelText(/name/i);
      fireEvent.change(nameInput, { target: { value: "" } });

      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeDefined();
      });

      expect(mockUpdateDestination).not.toHaveBeenCalled();
    });

    it("should close modal on successful update", async () => {
      let onSuccessCallback: (() => void) | undefined;
      mockUpdateDestination.mockImplementation(
        (
          _data: UpdateLocationRequest,
          options?: { onSuccess?: () => void }
        ) => {
          onSuccessCallback = options?.onSuccess;
        }
      );

      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

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
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Loading States", () => {
    it("should disable buttons when destination is being fetched", () => {
      vi.mocked(useDestination).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useDestination>);

      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const submitButton = screen.getByRole("button", {
        name: /save changes/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      expect(submitButton).toHaveProperty("disabled", true);
      expect(cancelButton).toHaveProperty("disabled", true);
    });

    it("should keep Save Changes label and disable submit when update is pending", () => {
      vi.mocked(useUpdateDestination).mockReturnValue({
        mutate: mockUpdateDestination,
        isPending: true,
        error: null,
      } as unknown as ReturnType<typeof useUpdateDestination>);

      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const submitBtn = screen.getByRole("button", { name: /save changes/i });
      expect(submitBtn).toBeDefined();
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("Parent Field Display", () => {
    it("should show parent ID when parent destination not found in tree", () => {
      vi.mocked(useDestination).mockReturnValue({
        data: { id: "kenya", parentId: "parent-id-123" } as DestinationApiItem,
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof useDestination>);
      vi.mocked(findParentDestination).mockReturnValue(null);

      render(
        <EditDestinationModal
          destination={defaultDestination}
          destinations={[]}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const parentInput = screen.getByLabelText(
        /parent destination/i
      ) as HTMLInputElement;
      expect(parentInput.value).toBe("parent-id-123");
    });
  });
});
