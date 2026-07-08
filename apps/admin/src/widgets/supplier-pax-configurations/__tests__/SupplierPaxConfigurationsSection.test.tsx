import { TooltipProvider } from "@sol/ui";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useSupplierPaxTypeSchedules,
  useUpdateSupplierPaxTypeSchedule,
  type SupplierPaxTypeSchedule,
} from "@/entities/supplier-pax-type-schedule";

import { SupplierPaxConfigurationsSection } from "../ui/SupplierPaxConfigurationsSection";

vi.mock("@/entities/supplier-pax-type-schedule", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/entities/supplier-pax-type-schedule")
    >();
  return {
    ...actual,
    useSupplierPaxTypeSchedules: vi.fn(),
    useUpdateSupplierPaxTypeSchedule: vi.fn(),
  };
});

vi.mock(
  "@/features/create-supplier-pax-type-schedule",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/features/create-supplier-pax-type-schedule")
      >();
    return {
      ...actual,
      AddPaxConfigurationSheet: ({ open }: { open: boolean }) =>
        open ? <div>Add PAX Types & Ages sheet</div> : null,
    };
  }
);

const schedules: SupplierPaxTypeSchedule[] = [
  {
    id: "current",
    supplierId: "sup-1",
    validFrom: "2026-01-01",
    validTo: null,
    version: 1,
    paxTypes: [
      {
        id: "adt",
        name: "Adult",
        paxType: "Adult",
        code: "ADT",
        ageFrom: 18,
        ageTo: 999,
        isActive: true,
        version: 1,
        isAdult: true,
        isInfant: false,
        canDeactivate: false,
        hasActiveDownstreamReferences: false,
      },
    ],
  },
  {
    id: "historical",
    supplierId: "sup-1",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    version: 1,
    paxTypes: [],
  },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

describe("SupplierPaxConfigurationsSection", () => {
  beforeEach(() => {
    vi.mocked(useUpdateSupplierPaxTypeSchedule).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateSupplierPaxTypeSchedule>);
  });

  it("shows empty state and opens the Add sheet", () => {
    vi.mocked(useSupplierPaxTypeSchedules).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierPaxTypeSchedules>);

    renderWithProviders(
      <SupplierPaxConfigurationsSection supplierId="sup-1" />
    );

    expect(screen.getByText("No PAX Configuration defined yet")).toBeDefined();
    const addButtons = screen.getAllByRole("button", {
      name: /add pax configuration/i,
    });

    fireEvent.click(addButtons.at(-1)!);
    expect(screen.getByText("Add PAX Types & Ages sheet")).toBeDefined();
  });

  it("expands the current schedule by default and keeps historical cards collapsed", () => {
    vi.mocked(useSupplierPaxTypeSchedules).mockReturnValue({
      data: schedules,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierPaxTypeSchedules>);

    renderWithProviders(
      <SupplierPaxConfigurationsSection supplierId="sup-1" />
    );

    expect(
      screen.getByRole("button", { name: /^select date$/i })
    ).toBeDefined();
    expect(screen.queryByText("Open / Current")).toBeNull();
    expect(screen.getByText("ADT")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /expand pax configuration/i })
    ).toBeDefined();
  });
});
