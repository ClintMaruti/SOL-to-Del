import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import type { AgentFormData } from "@/features/edit-agent";

import { OtherCard } from "../ui/OtherCard";

const defaultFormData: AgentFormData = {
  firstName: "",
  lastName: "",
  primaryEmail: "",
  alternateEmail: "",
  phone: "",
  agencyId: "",
  assignedSafariPlannerId: "",
  assignedSafariPlannerName: "",
  language: "",
  notes: "",
  currency: "",
  status: "Active",
};

describe("OtherCard", () => {
  it("renders section title and Notes textarea", () => {
    const updateField = vi.fn();
    render(<OtherCard formData={defaultFormData} updateField={updateField} />);

    expect(screen.getByText("Other")).toBeDefined();
    expect(screen.getByLabelText(/notes/i)).toBeDefined();
    expect(
      screen.getByPlaceholderText("Type any specific instructions here.")
    ).toBeDefined();
  });

  it("calls updateField with notes when textarea is changed", () => {
    const updateField = vi.fn();
    render(
      <OtherCard
        formData={{ ...defaultFormData, notes: "Existing" }}
        updateField={updateField}
      />
    );

    const textarea = screen.getByRole("textbox", { name: /notes/i });
    fireEvent.change(textarea, { target: { value: "New notes content" } });

    expect(updateField).toHaveBeenCalledWith("notes", "New notes content");
  });

  it("has id other for section anchor", () => {
    const { container } = render(
      <OtherCard formData={defaultFormData} updateField={vi.fn()} />
    );

    const card = container.querySelector("#other");
    expect(card).toBeTruthy();
  });
});
