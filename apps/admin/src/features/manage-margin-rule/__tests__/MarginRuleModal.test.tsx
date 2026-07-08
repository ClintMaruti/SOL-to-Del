import { ApiError } from "@sol/api-client";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyGroups } from "@/entities/agency-group";
import type { MarginRule } from "@/entities/margin-rule";
import { useServiceTypes } from "@/entities/service-type";
import { useSupplierServices } from "@/entities/supplier-services";
import { useSuppliers } from "@/entities/suppliers";

import { useCreateMarginRule } from "../api/useCreateMarginRule";
import { useUpdateMarginRule } from "../api/useUpdateMarginRule";
import { MarginRuleModal } from "../ui/MarginRuleModal";

vi.mock("@/entities/agency-group", () => ({
  useAgencyGroups: vi.fn(),
}));

vi.mock("@/entities/service-type", () => ({
  useServiceTypes: vi.fn(),
}));

vi.mock("@/entities/suppliers", () => ({
  useSuppliers: vi.fn(),
}));

vi.mock("@/entities/supplier-services", () => ({
  useSupplierServices: vi.fn(),
}));

vi.mock("../api/useCreateMarginRule", () => ({
  useCreateMarginRule: vi.fn(),
}));

vi.mock("../api/useUpdateMarginRule", () => ({
  useUpdateMarginRule: vi.fn(),
}));

vi.mock("@/shared/ui", () => ({
  DropdownSelect: ({
    options = [],
    value,
    onValueChange,
    disabled,
  }: {
    options?: Array<{ value: string; label: string }>;
    value?: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <select
      value={value ?? ""}
      onChange={(event) => onValueChange(event.target.value)}
      disabled={disabled}
    >
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
  DatePickerGridInput: ({
    value,
    onChange,
    disabled,
    hasError,
    isDateDisabled,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    hasError?: boolean;
    isDateDisabled?: (date: Date) => boolean;
  }) => (
    <input
      data-testid="date-picker"
      data-error={hasError ? "true" : "false"}
      data-today-disabled={
        isDateDisabled?.(new Date("2026-04-16T00:00:00")) ? "true" : "false"
      }
      data-tomorrow-disabled={
        isDateDisabled?.(new Date("2026-04-17T00:00:00")) ? "true" : "false"
      }
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

const mockUseAgencyGroups = vi.mocked(useAgencyGroups);
const mockUseServiceTypes = vi.mocked(useServiceTypes);
const mockUseSuppliers = vi.mocked(useSuppliers);
const mockUseSupplierServices = vi.mocked(useSupplierServices);
const mockUseCreateMarginRule = vi.mocked(useCreateMarginRule);
const mockUseUpdateMarginRule = vi.mocked(useUpdateMarginRule);

function createMarginRule(
  id: string,
  overrides?: Partial<MarginRule>
): MarginRule {
  return {
    id,
    agencyGroupId: "ag-1",
    agencyGroupName: "AAConsultants",
    serviceTypeNameId: "st-1",
    serviceTypeName: "Accommodation",
    supplierId: null,
    supplierName: null,
    serviceId: null,
    serviceName: null,
    optionId: null,
    optionName: null,
    validFrom: "2026-06-01",
    validTo: "2026-12-31",
    marginPercent: 12.5,
    version: 3,
    ...overrides,
  };
}

function createCreateMutationResult(
  mutate: ReturnType<typeof vi.fn> = vi.fn()
): ReturnType<typeof useCreateMarginRule> {
  return {
    mutate,
    isPending: false,
    reset: vi.fn(),
  } as unknown as ReturnType<typeof useCreateMarginRule>;
}

function createUpdateMutationResult(
  mutate: ReturnType<typeof vi.fn> = vi.fn()
): ReturnType<typeof useUpdateMarginRule> {
  return {
    mutate,
    isPending: false,
    reset: vi.fn(),
  } as unknown as ReturnType<typeof useUpdateMarginRule>;
}

function StatefulMarginRuleModal({
  initialMode,
  initialRule = null,
}: {
  initialMode: "create" | "edit" | "duplicate";
  initialRule?: MarginRule | null;
}) {
  const [mode, setMode] = useState<"create" | "edit" | "duplicate">(
    initialMode
  );
  const [rule, setRule] = useState<MarginRule | null>(initialRule);

  return (
    <MarginRuleModal
      open={true}
      mode={mode}
      rule={rule}
      onOpenChange={vi.fn()}
      onSaveAndCreateSuccess={() => {
        setMode("create");
        setRule(null);
      }}
    />
  );
}

describe("MarginRuleModal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-04-16T12:00:00"));
    vi.clearAllMocks();

    mockUseAgencyGroups.mockReturnValue({
      data: [{ id: "ag-1", name: "AAConsultants", isActive: true }],
    } as unknown as ReturnType<typeof useAgencyGroups>);
    mockUseServiceTypes.mockReturnValue({
      data: [
        { id: "st-1", name: "Accommodation", displayName: "Accommodation" },
        { id: "st-2", name: "Activity", displayName: "Activity" },
      ],
    } as unknown as ReturnType<typeof useServiceTypes>);
    mockUseSuppliers.mockReturnValue({
      data: [{ id: "sup-1", name: "Elewana Lodges & Camps", isActive: true }],
    } as unknown as ReturnType<typeof useSuppliers>);
    mockUseSupplierServices.mockImplementation(
      (supplierId) =>
        ({
          data:
            supplierId === "sup-1"
              ? [
                  {
                    id: "service-1",
                    supplierId: "sup-1",
                    name: undefined,
                    serviceName: "Camp",
                    serviceTypeId: "st-1",
                    createdAt: "",
                    updatedAt: "",
                    isActive: true,
                    tags: "",
                    options: [
                      {
                        id: "option-1",
                        name: "Full Board",
                        isActive: true,
                        rates: [],
                        ratePlans: [],
                      },
                      {
                        id: "option-2",
                        name: "Half Board",
                        isActive: true,
                        rates: [],
                        ratePlans: [],
                      },
                    ],
                    nominalSaleCode: null,
                    purchaseNominalCode: null,
                    type: "accommodation",
                  },
                  {
                    id: "service-2",
                    supplierId: "sup-1",
                    name: undefined,
                    serviceName: "Game Drive",
                    serviceTypeId: "st-2",
                    createdAt: "",
                    updatedAt: "",
                    isActive: true,
                    tags: "",
                    options: [],
                    nominalSaleCode: null,
                    purchaseNominalCode: null,
                    type: "activity",
                  },
                ]
              : [],
        }) as unknown as ReturnType<typeof useSupplierServices>
    );
    mockUseCreateMarginRule.mockReturnValue(createCreateMutationResult());
    mockUseUpdateMarginRule.mockReturnValue(createUpdateMutationResult());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("submits the create payload with normalized optional scopes", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const createMutate = vi.fn();
    mockUseCreateMarginRule.mockReturnValue(
      createCreateMutationResult(createMutate)
    );

    render(
      <MarginRuleModal open={true} mode="create" onOpenChange={vi.fn()} />
    );

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "ag-1");
    await user.selectOptions(selects[1], "st-1");

    const dateInputs = screen.getAllByTestId("date-picker");
    await user.type(dateInputs[0], "2026-06-01");
    await user.type(dateInputs[1], "2026-12-31");
    await user.type(screen.getByPlaceholderText("Type margin"), "12.5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createMutate).toHaveBeenCalledWith(
      {
        payload: {
          agencyGroupId: "ag-1",
          serviceTypeId: "st-1",
          supplierId: null,
          serviceId: null,
          optionId: null,
          validFrom: "2026-06-01",
          validTo: "2026-12-31",
          marginPercent: 12.5,
        },
        cacheItem: expect.objectContaining({
          agencyGroupId: "ag-1",
          agencyGroupName: "AAConsultants",
          serviceTypeNameId: "st-1",
          serviceTypeName: "Accommodation",
          validTo: "2026-12-31",
        }),
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      })
    );
  });

  it("submits create with validTo null when Valid To is left empty", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const createMutate = vi.fn();
    mockUseCreateMarginRule.mockReturnValue(
      createCreateMutationResult(createMutate)
    );

    render(
      <MarginRuleModal open={true} mode="create" onOpenChange={vi.fn()} />
    );

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "ag-1");
    await user.selectOptions(selects[1], "st-1");

    const dateInputs = screen.getAllByTestId("date-picker");
    await user.type(dateInputs[0], "2026-06-01");
    await user.type(screen.getByPlaceholderText("Type margin"), "12.5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createMutate).toHaveBeenCalledWith(
      {
        payload: expect.objectContaining({
          validFrom: "2026-06-01",
          validTo: null,
        }),
        cacheItem: expect.objectContaining({
          validTo: null,
        }),
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      })
    );
  });

  it("resets dependent service and option fields when supplier changes", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <MarginRuleModal open={true} mode="create" onOpenChange={vi.fn()} />
    );

    const selects = screen.getAllByRole("combobox");
    expect((selects[2] as HTMLSelectElement).value).toBe("__any__");
    expect((selects[3] as HTMLSelectElement).value).toBe("__any__");
    expect((selects[4] as HTMLSelectElement).value).toBe("__any__");
    expect((selects[3] as HTMLSelectElement).disabled).toBe(false);
    expect((selects[4] as HTMLSelectElement).disabled).toBe(false);

    await user.selectOptions(selects[2], "sup-1");
    await user.selectOptions(screen.getAllByRole("combobox")[3], "service-1");
    await user.selectOptions(screen.getAllByRole("combobox")[4], "option-1");

    expect(
      (screen.getAllByRole("combobox")[3] as HTMLSelectElement).value
    ).toBe("service-1");
    expect(
      (screen.getAllByRole("combobox")[4] as HTMLSelectElement).value
    ).toBe("option-1");

    await user.selectOptions(screen.getAllByRole("combobox")[2], "__any__");

    expect(
      (screen.getAllByRole("combobox")[3] as HTMLSelectElement).value
    ).toBe("__any__");
    expect(
      (screen.getAllByRole("combobox")[4] as HTMLSelectElement).value
    ).toBe("__any__");
  });

  it("filters services by the selected service type and treats ANY as no restriction", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <MarginRuleModal open={true} mode="create" onOpenChange={vi.fn()} />
    );

    const selects = screen.getAllByRole("combobox");
    const serviceSelect = selects[3] as HTMLSelectElement;
    const optionSelect = selects[4] as HTMLSelectElement;

    await user.selectOptions(selects[2], "sup-1");

    expect(
      within(serviceSelect)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Select...", "ANY", "Camp", "Game Drive"]);

    await user.selectOptions(selects[1], "st-1");

    expect(serviceSelect.value).toBe("__any__");
    expect(optionSelect.value).toBe("__any__");
    expect(
      within(serviceSelect)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Select...", "ANY", "Camp"]);

    await user.selectOptions(selects[1], "__any__");

    expect(
      within(serviceSelect)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Select...", "ANY", "Camp", "Game Drive"]);
    expect(
      within(optionSelect)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Select...", "ANY"]);
  });

  it("renders gracefully when select option labels are partially missing", () => {
    mockUseServiceTypes.mockReturnValue({
      data: [{ id: "st-1", name: undefined, displayName: undefined }],
    } as unknown as ReturnType<typeof useServiceTypes>);
    mockUseSuppliers.mockReturnValue({
      data: [{ id: "sup-1", name: undefined, isActive: true }],
    } as unknown as ReturnType<typeof useSuppliers>);
    mockUseSupplierServices.mockReturnValue({
      data: [
        {
          id: "service-1",
          supplierId: "sup-1",
          name: undefined,
          serviceName: undefined,
          serviceTypeId: "st-1",
          createdAt: "",
          updatedAt: "",
          isActive: true,
          tags: "",
          options: [],
          nominalSaleCode: null,
          purchaseNominalCode: null,
          type: "accommodation",
        },
      ],
    } as unknown as ReturnType<typeof useSupplierServices>);
    render(
      <MarginRuleModal open={true} mode="create" onOpenChange={vi.fn()} />
    );

    expect(screen.getByText("Create Margin Rule")).toBeDefined();
    expect(screen.getAllByRole("combobox")).toHaveLength(5);
  });

  it("uses the supplier service display name instead of falling back to ids", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <MarginRuleModal open={true} mode="create" onOpenChange={vi.fn()} />
    );

    const selects = screen.getAllByRole("combobox");
    const serviceSelect = selects[3] as HTMLSelectElement;

    await user.selectOptions(selects[2], "sup-1");

    expect(
      within(serviceSelect)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Select...", "ANY", "Camp", "Game Drive"]);
  });

  it("lists all embedded service options for the selected service", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <MarginRuleModal open={true} mode="create" onOpenChange={vi.fn()} />
    );

    const selects = screen.getAllByRole("combobox");
    const optionSelect = selects[4] as HTMLSelectElement;

    await user.selectOptions(selects[2], "sup-1");
    await user.selectOptions(selects[3], "service-1");

    expect(
      within(optionSelect)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Select...", "ANY", "Full Board", "Half Board"]);
  });

  it("locks active edit fields except Valid To and keeps Save & Create visible", () => {
    render(
      <MarginRuleModal
        open={true}
        mode="edit"
        rule={createMarginRule("active-rule", {
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
        })}
        onOpenChange={vi.fn()}
      />
    );

    const selects = screen.getAllByRole("combobox");
    const dateInputs = screen.getAllByTestId("date-picker");

    expect((selects[0] as HTMLSelectElement).disabled).toBe(true);
    expect((selects[1] as HTMLSelectElement).disabled).toBe(true);
    expect((dateInputs[0] as HTMLInputElement).disabled).toBe(true);
    expect((dateInputs[1] as HTMLInputElement).disabled).toBe(false);
    expect(dateInputs[1].dataset.todayDisabled).toBe("true");
    expect(dateInputs[1].dataset.tomorrowDisabled).toBe("false");
    expect(
      (screen.getByPlaceholderText("Type margin") as HTMLInputElement).disabled
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Save & Create" })).toBeDefined();
  });

  it("shows the duplicate banner when create returns an exact-duplicate conflict", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const createMutate = vi.fn((_variables, options) => {
      options?.onError?.(
        new ApiError(
          "Rule already exists. Adjust the conditions to proceed.",
          409,
          "Conflict"
        )
      );
    });
    mockUseCreateMarginRule.mockReturnValue(
      createCreateMutationResult(createMutate)
    );

    render(
      <MarginRuleModal
        open={true}
        mode="duplicate"
        rule={createMarginRule("duplicate-rule")}
        onOpenChange={vi.fn()}
      />
    );

    expect(
      (screen.getByRole("button", { name: "Save" }) as HTMLButtonElement)
        .disabled
    ).toBe(false);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByText("Rule already exists.")).toBeDefined();
    expect(screen.getByText("Adjust the conditions to proceed.")).toBeDefined();
  });

  it("switches duplicate mode to create mode after Save & Create succeeds", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const createMutate = vi.fn((_variables, options) => {
      options?.onSuccess?.();
    });
    mockUseCreateMarginRule.mockReturnValue(
      createCreateMutationResult(createMutate)
    );

    render(
      <StatefulMarginRuleModal
        initialMode="duplicate"
        initialRule={createMarginRule("duplicate-rule")}
      />
    );

    await user.click(screen.getByRole("button", { name: "Save & Create" }));

    expect(screen.getByText("Create Margin Rule")).toBeDefined();

    const selects = screen.getAllByRole("combobox");
    const dateInputs = screen.getAllByTestId("date-picker");

    expect((selects[0] as HTMLSelectElement).value).toBe("");
    expect((selects[1] as HTMLSelectElement).value).toBe("");
    expect((selects[2] as HTMLSelectElement).value).toBe("");
    expect((selects[3] as HTMLSelectElement).value).toBe("");
    expect((selects[4] as HTMLSelectElement).value).toBe("");
    expect((dateInputs[0] as HTMLInputElement).value).toBe("");
    expect((dateInputs[1] as HTMLInputElement).value).toBe("");
    expect(
      (screen.getByPlaceholderText("Type margin") as HTMLInputElement).value
    ).toBe("");
  });

  it("switches edit mode to create mode after Save & Create succeeds", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const updateMutate = vi.fn((_variables, options) => {
      options?.onSuccess?.();
    });
    mockUseUpdateMarginRule.mockReturnValue(
      createUpdateMutationResult(updateMutate)
    );

    render(
      <StatefulMarginRuleModal
        initialMode="edit"
        initialRule={createMarginRule("edit-rule")}
      />
    );

    await user.click(screen.getByRole("button", { name: "Save & Create" }));

    expect(screen.getByText("Create Margin Rule")).toBeDefined();

    const selects = screen.getAllByRole("combobox");
    const dateInputs = screen.getAllByTestId("date-picker");

    expect((selects[0] as HTMLSelectElement).value).toBe("");
    expect((selects[1] as HTMLSelectElement).value).toBe("");
    expect((selects[2] as HTMLSelectElement).value).toBe("");
    expect((selects[3] as HTMLSelectElement).value).toBe("");
    expect((selects[4] as HTMLSelectElement).value).toBe("");
    expect((dateInputs[0] as HTMLInputElement).value).toBe("");
    expect((dateInputs[1] as HTMLInputElement).value).toBe("");
    expect(
      (screen.getByPlaceholderText("Type margin") as HTMLInputElement).value
    ).toBe("");
  });
});
