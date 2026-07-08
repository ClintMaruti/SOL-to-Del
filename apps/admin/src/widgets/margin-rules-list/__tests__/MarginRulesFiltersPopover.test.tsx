import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarginRulesFiltersPopover } from "../ui/MarginRulesFiltersPopover";

describe("MarginRulesFiltersPopover", () => {
  it("uses a scrollable form region so the footer actions remain outside the scroll area", () => {
    render(
      <MarginRulesFiltersPopover
        open
        onOpenChange={vi.fn()}
        filters={{
          agencyGroupId: "ag-1",
          serviceTypeId: "st-1",
          supplierId: "sup-1",
          serviceId: "svc-1",
          optionId: "opt-1",
          validFrom: "2026-01-01",
          validTo: "2026-12-31",
          marginPercent: "12.5",
        }}
        onFilterChange={vi.fn()}
        onApply={vi.fn()}
        onReset={vi.fn()}
        agencyGroupOptions={[{ value: "ag-1", label: "AAConsultants" }]}
        serviceTypeOptions={[{ value: "st-1", label: "Accommodation" }]}
        supplierOptions={[{ value: "sup-1", label: "Elewana Lodges & Camps" }]}
        serviceOptions={[{ value: "svc-1", label: "Camp" }]}
        optionOptions={[{ value: "opt-1", label: "Option 1" }]}
      />
    );

    const scrollRegion = document.body.querySelector(".overflow-y-auto");
    const resetButton = screen.getByRole("button", { name: "Reset" });
    const applyButton = screen.getByRole("button", { name: "Apply" });

    expect(scrollRegion).not.toBeNull();
    expect(scrollRegion?.contains(resetButton)).toBe(false);
    expect(scrollRegion?.contains(applyButton)).toBe(false);
  });
});
