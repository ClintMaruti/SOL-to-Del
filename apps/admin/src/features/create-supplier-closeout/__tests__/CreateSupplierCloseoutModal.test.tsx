import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useServiceOptions } from "@/entities/supplier-service-options";
import { useSupplierServices } from "@/entities/supplier-services";

import { useCreateSupplierCloseout } from "../api/useCreateSupplierCloseout";

let CreateSupplierCloseoutModal: typeof import("../ui/CreateSupplierCloseoutModal").CreateSupplierCloseoutModal;

vi.mock("@/shared/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/ui")>();
  return {
    ...actual,
    DatePickerGridInput: ({
      id,
      value,
      onChange,
      placeholder,
    }: {
      id?: string;
      value?: string;
      onChange?: (value: string) => void;
      placeholder?: string;
    }) => (
      <input
        id={id}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
    ),
  };
});

vi.mock("@/shared/ui/DropdownSelect", () => ({
  DropdownSelect: ({
    id,
    value,
    onValueChange,
    placeholder,
    options,
    disabled,
  }: {
    id?: string;
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    disabled?: boolean;
  }) => (
    <select
      id={id}
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {(options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("@/entities/supplier-services", () => ({
  useSupplierServices: vi.fn(),
}));

vi.mock("@/entities/supplier-service-options", () => ({
  useServiceOptions: vi.fn(),
}));

vi.mock("../api/useCreateSupplierCloseout", () => ({
  useCreateSupplierCloseout: vi.fn(),
}));

const mockUseSupplierServices = vi.mocked(useSupplierServices);
const mockUseServiceOptions = vi.mocked(useServiceOptions);
const mockUseCreateSupplierCloseout = vi.mocked(useCreateSupplierCloseout);

describe("CreateSupplierCloseoutModal", () => {
  const mockCreateCloseout = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockResetMutation = vi.fn();

  beforeAll(async () => {
    ({ CreateSupplierCloseoutModal } =
      await import("../ui/CreateSupplierCloseoutModal"));
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCreateSupplierCloseout.mockReturnValue({
      mutate: mockCreateCloseout,
      isPending: false,
      error: null,
      reset: mockResetMutation,
    } as unknown as ReturnType<typeof useCreateSupplierCloseout>);
    mockUseSupplierServices.mockReturnValue({
      data: [
        { id: "svc-1", name: "Camp" },
        { id: "svc-2", name: "Family Camp" },
      ],
    } as unknown as ReturnType<typeof useSupplierServices>);
    mockUseServiceOptions.mockImplementation((serviceId) => {
      const rows =
        serviceId === "svc-1"
          ? [{ id: "opt-1", title: "Game Package" }]
          : serviceId === "svc-2"
            ? [{ id: "opt-2", title: "Family Package" }]
            : [];

      return { data: rows } as unknown as ReturnType<typeof useServiceOptions>;
    });
  });

  it("defaults to supplier scope and hides service fields", () => {
    render(
      <CreateSupplierCloseoutModal
        open
        onOpenChange={mockOnOpenChange}
        supplierId="sup-1"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Create Closeout" })
    ).toBeDefined();
    expect(screen.queryByLabelText("Service")).toBeNull();
    expect(screen.queryByLabelText("Option")).toBeNull();
  });

  it("submits supplier scope with null service and option ids", async () => {
    const user = userEvent.setup();
    render(
      <CreateSupplierCloseoutModal
        open
        onOpenChange={mockOnOpenChange}
        supplierId="sup-1"
      />
    );

    await user.type(
      screen.getByRole("textbox", { name: /from/i }),
      "2026-06-01"
    );
    await user.type(screen.getByRole("textbox", { name: /to/i }), "2026-06-30");
    await user.type(screen.getByLabelText("Reason"), "  Rain Season  ");
    await user.click(screen.getByRole("button", { name: /create closeout/i }));

    await waitFor(() => {
      expect(mockCreateCloseout).toHaveBeenCalledWith(
        {
          supplierId: "sup-1",
          travelDateFrom: "2026-06-01",
          travelDateTo: "2026-06-30",
          serviceId: null,
          serviceOptionId: null,
          reason: "Rain Season",
        },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });

  it("shows service fields for service scope and filters options by selected service", async () => {
    const user = userEvent.setup();
    render(
      <CreateSupplierCloseoutModal
        open
        onOpenChange={mockOnOpenChange}
        supplierId="sup-1"
      />
    );

    await user.click(screen.getByRole("radio", { name: "Service" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /service/i }),
      "svc-1"
    );

    expect(screen.getByRole("option", { name: "Game Package" })).toBeDefined();
    expect(screen.queryByRole("option", { name: "Family Package" })).toBeNull();
  });

  it("requires service when service scope is selected", async () => {
    const user = userEvent.setup();
    render(
      <CreateSupplierCloseoutModal
        open
        onOpenChange={mockOnOpenChange}
        supplierId="sup-1"
      />
    );

    await user.click(screen.getByRole("radio", { name: "Service" }));
    await user.type(
      screen.getByRole("textbox", { name: /from/i }),
      "2026-06-01"
    );
    await user.type(screen.getByRole("textbox", { name: /to/i }), "2026-06-30");
    await user.click(screen.getByRole("button", { name: /create closeout/i }));

    await waitFor(() => {
      expect(mockCreateCloseout).not.toHaveBeenCalled();
      expect(
        screen.getAllByText(/service is required/i).length
      ).toBeGreaterThan(0);
    });
  });

  it("submits service option scope when an option is selected", async () => {
    const user = userEvent.setup();
    render(
      <CreateSupplierCloseoutModal
        open
        onOpenChange={mockOnOpenChange}
        supplierId="sup-1"
      />
    );

    await user.click(screen.getByRole("radio", { name: "Service" }));
    await user.type(
      screen.getByRole("textbox", { name: /from/i }),
      "2026-06-01"
    );
    await user.type(screen.getByRole("textbox", { name: /to/i }), "2026-06-30");
    await user.selectOptions(
      screen.getByRole("combobox", { name: /service/i }),
      "svc-1"
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /option/i }),
      "opt-1"
    );
    await user.click(screen.getByRole("button", { name: /create closeout/i }));

    await waitFor(() => {
      expect(mockCreateCloseout).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: "sup-1",
          serviceId: "svc-1",
          serviceOptionId: "opt-1",
        }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });

  it("resets mutation state when the modal closes", () => {
    render(
      <CreateSupplierCloseoutModal
        open={false}
        onOpenChange={mockOnOpenChange}
        supplierId="sup-1"
      />
    );

    expect(mockResetMutation).toHaveBeenCalled();
  });
});
