import { ApiError } from "@sol/api-client";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplierService } from "@/entities/supplier-services/types";

import { useCreateExtra } from "../api/useCreateExtra";
import { CreateExtraModal } from "../ui/CreateExtraModal";

vi.mock("../api/useCreateExtra", () => ({
  useCreateExtra: vi.fn(),
}));

const mockServices: SupplierService[] = [
  {
    id: "service-1",
    supplierId: "sup-1",
    name: "Camp",
    serviceTypeId: "st-1",
    isActive: true,
    tags: "",
    options: [],
    rates: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    type: "accommodation",
  },
  {
    id: "service-5",
    supplierId: "sup-1",
    name: "Inactive Svc",
    serviceTypeId: "st-1",
    isActive: false,
    tags: "",
    options: [],
    rates: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    type: "other",
  },
];

vi.mock("@/entities/supplier-services", () => ({
  useSupplierServices: vi.fn(() => ({
    data: mockServices,
    isLoading: false,
  })),
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("CreateExtraModal", () => {
  const mockMutate = vi.fn();
  const mockOnOpenChange = vi.fn();
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    supplierId: "sup-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateExtra).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useCreateExtra>);
  });

  it("does not render dialog content when closed", () => {
    render(<CreateExtraModal {...defaultProps} open={false} />);

    expect(screen.queryByRole("heading", { name: /create extra/i })).toBeNull();
  });

  it("renders title, inactive description, and primary action", () => {
    render(<CreateExtraModal {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: /create extra/i })
    ).toBeDefined();
    expect(
      screen.getByText(/newly created extra will be inactive by default/i)
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: /save and configure/i })
    ).toBeDefined();
  });

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    render(<CreateExtraModal {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not submit when title and service are empty", async () => {
    render(<CreateExtraModal {...defaultProps} />);

    fireEvent.submit(document.querySelector("form")!);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeDefined();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("shows duplicate alert when API returns 409", async () => {
    vi.mocked(useCreateExtra).mockReturnValue({
      mutate: (
        _vars: unknown,
        opts?: {
          onSuccess?: (data: unknown) => void;
          onError?: (error: unknown) => void;
        }
      ) => {
        opts?.onError?.(
          new ApiError("conflict", 409, "Conflict", {
            error: "Duplicate",
          })
        );
      },
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useCreateExtra>);

    render(<CreateExtraModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/^title/i), {
      target: { value: "Lunch" },
    });

    fireEvent.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("Camp")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Camp"));

    fireEvent.click(
      screen.getByRole("button", { name: /save and configure/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Extra must be unique.")).toBeDefined();
      expect(screen.getByText(/change the title to proceed/i)).toBeDefined();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("navigates to extra detail on successful create", async () => {
    vi.mocked(useCreateExtra).mockReturnValue({
      mutate: (
        _vars: unknown,
        opts?: {
          onSuccess?: (data: unknown) => void;
          onError?: (error: unknown) => void;
        }
      ) => {
        opts?.onSuccess?.({
          id: "extra-new",
          title: "Lunch",
          linkedServicesOptions: [],
          description: null,
          isActive: false,
        });
      },
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useCreateExtra>);

    render(<CreateExtraModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/^title/i), {
      target: { value: "Lunch" },
    });

    fireEvent.click(screen.getByRole("combobox"));

    await waitFor(() => {
      expect(screen.getByText("Camp")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Camp"));

    fireEvent.click(
      screen.getByRole("button", { name: /save and configure/i })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/database/destinations/suppliers/sup-1/extras/extra-new"
      );
    });
  });
});
