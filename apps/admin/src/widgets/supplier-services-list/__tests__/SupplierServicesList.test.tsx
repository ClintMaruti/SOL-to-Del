import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import {
  useSupplierServices,
  type SupplierService,
} from "@/entities/supplier-services";
import {
  supplierServiceOptionsDetailSearch,
  supplierServiceRatesDetailSearch,
} from "@/shared/lib/paths";

import { SupplierServicesList } from "../ui/SupplierServicesList";

const mockToggleStatus = vi.fn();

const MOCK_TYPE_ID = "14eeea9e-603e-41da-b77d-3c745e1e5da9";

function createMockService(
  overrides: Partial<SupplierService> = {}
): SupplierService {
  return {
    id: "service-1",
    supplierId: "sup-1",
    name: "Camp",
    serviceTypeId: MOCK_TYPE_ID,
    type: "accommodation",
    isActive: true,
    tags: "",
    rates: [],
    options: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

const mockServices: SupplierService[] = [createMockService()];

const mockUseSupplierServices = vi.mocked(useSupplierServices);

vi.mock("@/entities/supplier-services", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/supplier-services")>();
  return {
    ...actual,
    useSupplierServices: vi.fn(() => ({
      data: [],
      isLoading: false,
      error: null,
    })),
    useToggleSupplierServiceStatus: vi.fn(() => ({
      mutate: mockToggleStatus,
      isPending: false,
    })),
  };
});

vi.mock("@/entities/destination/api/useDestinations", () => ({
  useDestinations: vi.fn(() => ({ data: [] })),
}));

vi.mock("@/entities/service-type", () => ({
  useServiceTypes: vi.fn(() => ({
    data: [
      {
        id: MOCK_TYPE_ID,
        code: 1,
        name: "ACCOMMODATION",
        displayName: "Accommodation",
        description: "Lodging and accommodation services",
      },
    ],
    isLoading: false,
  })),
}));

vi.mock("@/features/create-supplier-service", () => ({
  CreateSupplierServiceModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-service-modal">Create Modal</div> : null,
}));

vi.mock("@/features/delete-supplier-service", () => ({
  DeleteSupplierServiceDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-service-dialog">Delete Dialog</div> : null,
}));

function renderList(supplierId: string | undefined) {
  return render(
    <MemoryRouter>
      <SupplierServicesList supplierId={supplierId} />
    </MemoryRouter>
  );
}

function mockQuerySuccess(data: SupplierService[]) {
  mockUseSupplierServices.mockReturnValue({
    data,
    isLoading: false,
    error: null,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof mockUseSupplierServices>);
}

/** Row gets this class from coordinated hover state (not the TableRow `hover:*` variant). */
function hasCoordinatedHoverRowClass(className: string) {
  return className.split(/\s+/).includes("bg-muted/50");
}

describe("SupplierServicesList", () => {
  it("should render nothing when supplierId is undefined", () => {
    renderList(undefined);

    expect(screen.queryByText("Services")).toBeNull();
  });

  it("should render section header with title and Create Service button", () => {
    renderList("sup-1");

    expect(screen.getByRole("heading", { name: "Services" })).toBeDefined();
    const createButtons = screen.getAllByRole("button", {
      name: "Create Service",
    });
    expect(createButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should render empty state when there are no services", () => {
    mockQuerySuccess([]);

    renderList("sup-1");

    expect(screen.getByText("No Services yet")).toBeDefined();
  });

  it("should open create modal when Create Service is clicked", async () => {
    const user = userEvent.setup();
    renderList("sup-1");

    const createButtons = screen.getAllByRole("button", {
      name: "Create Service",
    });
    await user.click(createButtons[0]!);

    expect(screen.getByTestId("create-service-modal")).toBeDefined();
  });

  it("should render table with services when data is present", () => {
    mockQuerySuccess(mockServices);

    renderList("sup-1");

    expect(screen.getByText("Camp")).toBeDefined();
  });

  it("renders option, service rate, and rate plan links with correct deep-link hrefs", () => {
    const service = createMockService({
      id: "svc-rates",
      name: "Rated Service",
      rates: [{ id: "rate-1", rateName: "Peak Season" }],
      options: [
        {
          id: "opt-1",
          name: "Option A",
          isActive: true,
          ratePlans: [{ id: "rp-1", ratePlanName: "Standard" }],
        },
      ],
    });
    mockQuerySuccess([service]);

    renderList("sup-1");

    expect(
      screen.getByRole("link", { name: "Option A" }).getAttribute("href")
    ).toBe(
      supplierServiceOptionsDetailSearch("sup-1", "svc-rates", {
        optionId: "opt-1",
      })
    );
    expect(
      screen.getByRole("link", { name: "Peak Season" }).getAttribute("href")
    ).toBe(
      supplierServiceRatesDetailSearch("sup-1", "svc-rates", {
        rateId: "rate-1",
      })
    );
    expect(
      screen.getByRole("link", { name: "Standard" }).getAttribute("href")
    ).toBe(
      supplierServiceOptionsDetailSearch("sup-1", "svc-rates", {
        optionId: "opt-1",
        innerTab: "ratePlan",
        ratePlanId: "rp-1",
      })
    );
  });

  it("renders dash placeholders in rates and rate plan columns when lists are empty", () => {
    const service = createMockService({
      id: "svc-dash",
      name: "Empty rates",
      rates: [],
      options: [
        {
          id: "opt-1",
          name: "Only option",
          isActive: true,
          ratePlans: [],
        },
      ],
    });
    mockQuerySuccess([service]);

    const { container } = renderList("sup-1");

    const row = container.querySelector("tbody tr");
    expect(row).toBeTruthy();
    const dashes = row!.querySelectorAll(".text-gray-500");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("sets the same data-service-row on each tbody tr for a multi-option service", () => {
    const service = createMockService({
      id: "svc-multi",
      name: "Elewana",
      options: [
        {
          id: "o1",
          name: "Option 1",
          isActive: true,
          ratePlans: [],
        },
        {
          id: "o2",
          name: "Option 2",
          isActive: true,
          ratePlans: [],
        },
      ],
    });
    mockQuerySuccess([service]);

    const { container } = renderList("sup-1");

    const rows = container.querySelectorAll(
      'tbody tr[data-service-row="svc-multi"]'
    );
    expect(rows).toHaveLength(2);
  });

  it("applies hover highlight to all tbody rows of the same service when any sub-row is hovered", () => {
    const service = createMockService({
      id: "svc-multi",
      name: "Elewana",
      options: [
        {
          id: "o1",
          name: "Option 1",
          isActive: true,
          ratePlans: [],
        },
        {
          id: "o2",
          name: "Option 2",
          isActive: true,
          ratePlans: [],
        },
      ],
    });
    mockQuerySuccess([service]);

    const { container } = renderList("sup-1");

    const rows = container.querySelectorAll(
      'tbody tr[data-service-row="svc-multi"]'
    );
    const first = rows[0]!;
    const second = rows[1]!;

    fireEvent.mouseEnter(first);
    expect(hasCoordinatedHoverRowClass(first.className)).toBe(true);
    expect(hasCoordinatedHoverRowClass(second.className)).toBe(true);

    fireEvent.mouseLeave(first, {
      relatedTarget: second,
    });
    expect(hasCoordinatedHoverRowClass(first.className)).toBe(true);
    expect(hasCoordinatedHoverRowClass(second.className)).toBe(true);

    fireEvent.mouseLeave(second, { relatedTarget: document.body });
    expect(hasCoordinatedHoverRowClass(first.className)).toBe(false);
    expect(hasCoordinatedHoverRowClass(second.className)).toBe(false);
  });

  it("should open confirmation dialog when Active switch is clicked", async () => {
    const user = userEvent.setup();
    mockQuerySuccess(mockServices);

    renderList("sup-1");

    const switchEl = screen.getByRole("switch", {
      name: /toggle camp active status/i,
    });
    await user.click(switchEl);

    expect(
      screen.getByRole("heading", { name: "Deactivate this service?" })
    ).toBeDefined();
  });

  it("should call toggle mutation with correct payload when confirming dialog", async () => {
    const user = userEvent.setup();
    mockQuerySuccess(mockServices);

    renderList("sup-1");

    const switchEl = screen.getByRole("switch", {
      name: /toggle camp active status/i,
    });
    await user.click(switchEl);

    const confirmButton = screen.getByRole("button", { name: "Deactivate" });
    await user.click(confirmButton);

    expect(mockToggleStatus).toHaveBeenCalledWith(
      {
        serviceId: "service-1",
        supplierId: "sup-1",
        isActive: true,
      },
      expect.any(Object)
    );
  });
});
