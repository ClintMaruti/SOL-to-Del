import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useServiceTypes } from "@/entities/service-type";
import {
  useDeleteServiceOption,
  useServiceOptions,
  useUpdateServiceOption,
  type ServiceOption,
} from "@/entities/supplier-service-options";
import { useSupplierService } from "@/entities/supplier-services";

import { ServiceOptionsTab } from "../ui/ServiceOptionsTab";

const { mockOptionSheet } = vi.hoisted(() => ({
  mockOptionSheet: vi.fn(
    ({
      open,
      mode,
      option,
    }: {
      open: boolean;
      mode: "create" | "edit";
      option?: ServiceOption | null;
    }) =>
      open ? (
        <div role="dialog" aria-label="Option sheet">
          <span>{mode}</span>
          <span>{option?.title ?? "new option"}</span>
        </div>
      ) : null
  ),
}));

vi.mock("@/features/manage-service-options", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/manage-service-options")
  >("@/features/manage-service-options");

  return {
    ...actual,
    OptionSheet: mockOptionSheet,
  };
});

vi.mock("@/entities/supplier-service-options", async () => {
  const actual = await vi.importActual<
    typeof import("@/entities/supplier-service-options")
  >("@/entities/supplier-service-options");

  return {
    ...actual,
    useServiceOptions: vi.fn(),
    useUpdateServiceOption: vi.fn(),
    useDeleteServiceOption: vi.fn(),
  };
});

vi.mock("@/entities/supplier-services", async () => {
  const actual = await vi.importActual<
    typeof import("@/entities/supplier-services")
  >("@/entities/supplier-services");

  return {
    ...actual,
    useSupplierService: vi.fn(),
  };
});

vi.mock("@/entities/service-type", async () => {
  const actual = await vi.importActual<
    typeof import("@/entities/service-type")
  >("@/entities/service-type");

  return {
    ...actual,
    useServiceTypes: vi.fn(),
  };
});

const mockUseServiceOptions = vi.mocked(useServiceOptions);
const mockUseSupplierService = vi.mocked(useSupplierService);
const mockUseServiceTypes = vi.mocked(useServiceTypes);
const mockUseUpdateServiceOption = vi.mocked(useUpdateServiceOption);
const mockUseDeleteServiceOption = vi.mocked(useDeleteServiceOption);

function optionFixture(overrides: Partial<ServiceOption> = {}): ServiceOption {
  return {
    id: "opt-1",
    serviceId: "svc-1",
    title: "Alpha",
    includes: "",
    excludes: "",
    contractId: null,
    isActive: true,
    version: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function setupHooks(
  options: ServiceOption[] = [],
  serviceTypeName = "Accommodation"
) {
  mockUseServiceOptions.mockReturnValue({
    data: options,
    isPending: false,
    isFetching: false,
    error: null,
  } as never);
  mockUseSupplierService.mockReturnValue({
    data: {
      id: "svc-1",
      serviceTypeId: `type-${serviceTypeName.toLowerCase()}`,
      type: serviceTypeName.toLowerCase(),
      options: options.map((option) => ({
        id: option.id,
        name: option.title,
        isActive: option.isActive,
        rates: [],
        ratePlans: [],
      })),
    },
  } as never);
  mockUseServiceTypes.mockReturnValue({
    data: [
      {
        id: `type-${serviceTypeName.toLowerCase()}`,
        name: serviceTypeName,
      },
    ],
  } as never);
}

describe("ServiceOptionsTab", () => {
  const updateOptionAsync = vi.fn();
  const deleteOptionAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdateServiceOption.mockReturnValue({
      mutateAsync: updateOptionAsync,
      isPending: false,
    } as never);
    mockUseDeleteServiceOption.mockReturnValue({
      mutateAsync: deleteOptionAsync,
      isPending: false,
      error: null,
      reset: vi.fn(),
    } as never);
  });

  it("shows the Figma empty state and opens the create sheet", async () => {
    const user = userEvent.setup();
    setupHooks([]);

    render(<ServiceOptionsTab serviceId="svc-1" supplierId="sup-1" />);

    expect(screen.getByText("No Options yet")).toBeDefined();
    expect(
      screen.getByText("Options will appear here once they are created.")
    ).toBeDefined();

    await user.click(
      screen.getAllByRole("button", { name: "Create Option" })[1]
    );

    expect(
      screen.getByRole("dialog", { name: "Option sheet" }).textContent
    ).toContain("create");
  });

  it("renders options in cache order and opens edit sheet prefilled", async () => {
    const user = userEvent.setup();
    setupHooks([
      optionFixture({ id: "opt-b", title: "Zulu" }),
      optionFixture({ id: "opt-a", title: "Alpha", includes: "Meals" }),
    ]);

    render(<ServiceOptionsTab serviceId="svc-1" supplierId="sup-1" />);

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Zulu")).toBeDefined();
    expect(within(rows[2]).getByText("Alpha")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Edit Alpha" }));

    const dialog = screen.getByRole("dialog", { name: "Option sheet" });
    expect(dialog.textContent).toContain("edit");
    expect(dialog.textContent).toContain("Alpha");
  });

  it("sorts options by option name when the sortable header is clicked", async () => {
    const user = userEvent.setup();
    setupHooks([
      optionFixture({ id: "opt-b", title: "Zulu" }),
      optionFixture({ id: "opt-a", title: "Alpha" }),
    ]);

    render(<ServiceOptionsTab serviceId="svc-1" supplierId="sup-1" />);

    await user.click(screen.getByRole("button", { name: "Option Name" }));

    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Alpha")).toBeDefined();
    expect(within(rows[2]).getByText("Zulu")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Option Name" }));

    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Zulu")).toBeDefined();
    expect(within(rows[2]).getByText("Alpha")).toBeDefined();
  });

  it("renders flight-specific columns and sorts by flight number", async () => {
    const user = userEvent.setup();
    setupHooks(
      [
        optionFixture({
          id: "opt-b",
          title: "Chartered Flight",
          includes: "Accommodation, all meals",
          excludes: "Premium drinks",
          flightOption: {
            flightNumber: "ZZ200",
            timeFrom: "10:00 AM",
            timeTo: "12:00 PM",
            operatingDays: ["TUE", "WED", "THU"],
          },
        }),
        optionFixture({
          id: "opt-a",
          title: "Morning Flight",
          flightOption: {
            flightNumber: "AR12048",
            timeFrom: "8:15:00",
            timeTo: "10:30:00",
            operatingDays: ["MON"],
          },
        }),
      ],
      "Flight"
    );

    render(<ServiceOptionsTab serviceId="svc-1" supplierId="sup-1" />);

    expect(screen.getByRole("button", { name: "Flight #" })).toBeDefined();
    expect(screen.getByText("Schedule")).toBeDefined();
    expect(screen.getByText("Days")).toBeDefined();

    let rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("ZZ200")).toBeDefined();
    expect(within(rows[1]).getByText("10:00 A.M - 12:00 P.M")).toBeDefined();
    expect(within(rows[1]).getByText("TUE")).toBeDefined();
    expect(within(rows[1]).getByText("WED")).toBeDefined();
    expect(within(rows[1]).getByText("THU")).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Flight #" }));

    rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("AR12048")).toBeDefined();
    expect(within(rows[2]).getByText("ZZ200")).toBeDefined();
  });

  it("renders schedule-specific columns for activity options", () => {
    setupHooks(
      [
        optionFixture({
          id: "opt-a",
          title: "Morning balloon",
          activityOption: {
            timeFrom: "6:15 AM",
            timeTo: "6:45 AM",
            operatingDays: ["MON", "FRI"],
          },
        }),
      ],
      "Activity"
    );

    render(<ServiceOptionsTab serviceId="svc-1" supplierId="sup-1" />);

    expect(screen.queryByRole("button", { name: "Flight #" })).toBeNull();
    expect(screen.getByText("Schedule")).toBeDefined();
    expect(screen.getByText("Days")).toBeDefined();

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("6:15 A.M - 6:45 A.M")).toBeDefined();
    expect(within(rows[1]).getByText("MON")).toBeDefined();
    expect(within(rows[1]).getByText("FRI")).toBeDefined();
  });

  it("updates status through the row switch without invalidation", async () => {
    const user = userEvent.setup();
    setupHooks([optionFixture({ id: "opt-a", title: "Alpha" })]);
    updateOptionAsync.mockResolvedValueOnce(
      optionFixture({ id: "opt-a", title: "Alpha", isActive: false })
    );

    render(<ServiceOptionsTab serviceId="svc-1" supplierId="sup-1" />);

    await user.click(
      screen.getByRole("switch", { name: "Toggle Alpha active status" })
    );

    await waitFor(() => {
      expect(updateOptionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          optionId: "opt-a",
          serviceId: "svc-1",
          supplierId: "sup-1",
          suppressSuccessToast: true,
          payload: expect.objectContaining({
            isActive: false,
          }),
        })
      );
    });
  });

  it("blocks delete when service detail reports dependencies", async () => {
    const user = userEvent.setup();
    const option = optionFixture({ id: "opt-a", title: "Alpha" });
    setupHooks([option]);
    mockUseSupplierService.mockReturnValue({
      data: {
        id: "svc-1",
        serviceTypeId: "type-accommodation",
        type: "accommodation",
        options: [
          {
            id: option.id,
            name: option.title,
            isActive: true,
            ratePlans: [{ id: "rp-1", ratePlanName: "Standard" }],
          },
        ],
      },
    } as never);

    render(<ServiceOptionsTab serviceId="svc-1" supplierId="sup-1" />);

    await user.click(screen.getByRole("button", { name: "Delete Alpha" }));

    expect(screen.getByText("Option cannot be deleted")).toBeDefined();
    expect(screen.getByText(/dependent rate plans/i)).toBeDefined();
    expect(deleteOptionAsync).not.toHaveBeenCalled();
  });
});
