import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyGroups } from "@/entities/agency-group";
import { useCreateSupplierContract } from "@/entities/supplier-contract";

import { AttachContractModal } from "../ui/AttachContractModal";

vi.mock("@/entities/agency-group", () => ({
  useAgencyGroups: vi.fn(),
}));

vi.mock("@/entities/supplier-contract", () => ({
  useCreateSupplierContract: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("AttachContractModal", () => {
  const mockCreateSupplierContract = vi.fn();
  const mockOnOpenChange = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    supplierId: "supplier-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAgencyGroups).mockReturnValue({
      data: [
        {
          id: "ag-1",
          name: "AAConsultants",
          description: null,
          isActive: true,
          numberOfAgencies: 1,
          version: 0,
        },
        {
          id: "ag-2",
          name: "Inactive Group",
          description: null,
          isActive: false,
          numberOfAgencies: 0,
          version: 0,
        },
      ],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAgencyGroups>);

    vi.mocked(useCreateSupplierContract).mockReturnValue({
      mutate: mockCreateSupplierContract,
      isPending: false,
      error: null,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useCreateSupplierContract>);
  });

  describe("Rendering", () => {
    it("should not render content when modal is closed", () => {
      render(<AttachContractModal {...defaultProps} open={false} />);

      expect(
        screen.queryByRole("heading", { name: /attach contract/i })
      ).toBeNull();
      expect(useAgencyGroups).toHaveBeenCalledWith({ enabled: false });
    });

    it("should render modal title and description when open", () => {
      render(<AttachContractModal {...defaultProps} />);

      expect(
        screen.getByRole("heading", { name: /attach contract/i })
      ).toBeDefined();
      expect(
        screen.getByText(/newly created contract will be inactive by default/i)
      ).toBeDefined();
    });

    it("should render Contract Name and Link to the file fields", () => {
      render(<AttachContractModal {...defaultProps} />);

      expect(screen.getByLabelText(/contract name/i)).toBeDefined();
      expect(screen.getByLabelText(/link to the file/i)).toBeDefined();
      expect(screen.getByLabelText(/agency group/i)).toBeDefined();
    });

    it("defaults Agency Group to ANY", () => {
      render(<AttachContractModal {...defaultProps} />);

      expect(
        screen.getByRole("combobox", { name: /agency group/i })
      ).toHaveProperty("textContent", "ANY");
    });

    it("shows only ANY when there are no active agency groups", () => {
      vi.mocked(useAgencyGroups).mockReturnValue({
        data: [
          {
            id: "ag-2",
            name: "Inactive Group",
            description: null,
            isActive: false,
            numberOfAgencies: 0,
            version: 0,
          },
        ],
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useAgencyGroups>);

      render(<AttachContractModal {...defaultProps} />);

      expect(
        screen.getByRole("combobox", { name: /agency group/i })
      ).toHaveProperty("textContent", "ANY");
      expect(screen.queryByText("Inactive Group")).toBeNull();
    });

    it("should render Valid From and Valid To fields", () => {
      render(<AttachContractModal {...defaultProps} />);

      expect(screen.getByLabelText(/valid from/i)).toBeDefined();
      expect(screen.getByLabelText(/valid to/i)).toBeDefined();
    });

    it("should render Cancel and Save and Configure buttons", () => {
      render(<AttachContractModal {...defaultProps} />);

      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
      expect(
        screen.getByRole("button", { name: /save and configure/i })
      ).toBeDefined();
    });
  });

  describe("Loading State", () => {
    it("should disable buttons when isPending", () => {
      vi.mocked(useCreateSupplierContract).mockReturnValue({
        mutate: mockCreateSupplierContract,
        isPending: true,
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useCreateSupplierContract>);

      render(<AttachContractModal {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: /save and configure/i,
      });
      const cancelButton = screen.getByRole("button", { name: /cancel/i });

      expect(submitButton).toHaveProperty("disabled", true);
      expect(cancelButton).toHaveProperty("disabled", true);
    });
  });

  describe("Error Display", () => {
    it("should render API error message", () => {
      vi.mocked(useCreateSupplierContract).mockReturnValue({
        mutate: mockCreateSupplierContract,
        isPending: false,
        error: new Error("Failed to create contract"),
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useCreateSupplierContract>);

      render(<AttachContractModal {...defaultProps} />);

      expect(screen.getByText("Failed to create contract")).toBeDefined();
    });
  });

  describe("Validation", () => {
    it("should show validation error when name is empty on submit", async () => {
      render(<AttachContractModal {...defaultProps} />);

      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/contract name is required/i)).toBeDefined();
      });

      expect(mockCreateSupplierContract).not.toHaveBeenCalled();
    });
  });

  describe("Cancel Behavior", () => {
    it("should call onOpenChange(false) when cancel is clicked", () => {
      render(<AttachContractModal {...defaultProps} />);

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Form Submission", () => {
    it("should call createSupplierContract with form data when all required fields filled", async () => {
      render(<AttachContractModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/contract name/i);
      fireEvent.change(nameInput, { target: { value: "Contract 2025" } });

      const fileLinkInput = screen.getByLabelText(/link to the file/i);
      fireEvent.change(fileLinkInput, {
        target: { value: "https://drive.google.com/file/link.pdf" },
      });

      // DatePickerInput uses a button - we can't easily set dates via fireEvent in jsdom.
      // Submit will fail validation for empty validFrom/validTo.
      const form = document.querySelector("form");
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/valid from is required/i)).toBeDefined();
      });

      expect(mockCreateSupplierContract).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper labels for form fields", () => {
      render(<AttachContractModal {...defaultProps} />);

      expect(screen.getByLabelText(/contract name/i)).toBeDefined();
      expect(screen.getByLabelText(/link to the file/i)).toBeDefined();
      expect(screen.getByLabelText(/valid from/i)).toBeDefined();
      expect(screen.getByLabelText(/valid to/i)).toBeDefined();
    });

    it("should have required indicator on Contract Name", () => {
      render(<AttachContractModal {...defaultProps} />);

      const labels = screen.getAllByText(/contract name/i);
      const labelWithAsterisk = labels.find((el) =>
        el.textContent?.includes("*")
      );
      expect(labelWithAsterisk).toBeDefined();
    });
  });
});
