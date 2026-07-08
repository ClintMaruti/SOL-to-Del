import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DropdownSelectOption } from "@/shared/ui";

import { MarginRulesFilterChipEditor } from "../ui/MarginRulesFilterChipEditor";

const agencyOptions: DropdownSelectOption[] = [
  { value: "ag-1", label: "AAConsultants" },
  { value: "ag-2", label: "WHAgent" },
];

describe("MarginRulesFilterChipEditor", () => {
  it("opens a searchable agency popover and updates the filter when a new option is chosen", () => {
    const onChange = vi.fn();

    render(
      <MarginRulesFilterChipEditor
        chip={{
          key: "agencyGroupId",
          label: "Agency Group",
          value: "AAConsultants",
          rawValue: "ag-1",
        }}
        options={agencyOptions}
        onChange={onChange}
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Agency Group: AAConsultants"));

    expect(screen.getByPlaceholderText("Search...")).toBeDefined();
    expect(screen.getByRole("button", { name: "All" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "WHAgent" }));

    expect(onChange).toHaveBeenCalledWith("agencyGroupId", "ag-2");
  });

  it("removes the chip without opening the editor when the close button is clicked", () => {
    const onRemove = vi.fn();

    render(
      <MarginRulesFilterChipEditor
        chip={{
          key: "agencyGroupId",
          label: "Agency Group",
          value: "AAConsultants",
          rawValue: "ag-1",
        }}
        options={agencyOptions}
        onChange={vi.fn()}
        onRemove={onRemove}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove filter Agency Group: AAConsultants",
      })
    );

    expect(onRemove).toHaveBeenCalledWith("agencyGroupId");
    expect(screen.queryByPlaceholderText("Search...")).toBeNull();
  });

  it("uses the active chip styling while the editor is open", () => {
    render(
      <MarginRulesFilterChipEditor
        chip={{
          key: "agencyGroupId",
          label: "Agency Group",
          value: "AAConsultants",
          rawValue: "ag-1",
        }}
        options={agencyOptions}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Agency Group: AAConsultants"));

    const trigger = screen.getByLabelText("Agency Group: AAConsultants");
    const removeButton = screen.getByRole("button", {
      name: "Remove filter Agency Group: AAConsultants",
    });

    expect(trigger.className).toContain("border-brand-red");
    expect(trigger.className).toContain("bg-gray-100");
    expect(removeButton.className).toContain("text-brand-red");
  });

  it("bounds select chip dropdowns and scrolls long option lists", () => {
    const options = Array.from({ length: 20 }, (_, index) => ({
      value: `supplier-${index}`,
      label: `Supplier ${index}`,
    }));

    render(
      <MarginRulesFilterChipEditor
        chip={{
          key: "supplierId",
          label: "Supplier",
          value: "Supplier 1",
          rawValue: "supplier-1",
        }}
        options={options}
        onChange={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    fireEvent.click(screen.getByLabelText("Supplier: Supplier 1"));

    const popoverContent = screen
      .getByPlaceholderText("Search...")
      .closest('[data-slot="popover-content"]');
    const optionsList = screen.getByRole("button", {
      name: "All",
    }).parentElement;

    expect(popoverContent?.getAttribute("style")).toContain("max-height");
    expect(optionsList?.className).toContain("overflow-y-auto");
  });
});
