import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AgentFormData, AgentFormErrors } from "@/features/edit-agent";

import { GeneralInformationCard } from "../ui/GeneralInformationCard";

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

const defaultFormData: AgentFormData = {
  firstName: "Jonathan",
  lastName: "Annan",
  primaryEmail: "jonathan@example.com",
  alternateEmail: "",
  phone: "+1 44 555-01-02",
  agencyId: "agency-1",
  assignedSafariPlannerId: "sp-2",
  assignedSafariPlannerName: "Amelia Earhart",
  language: "",
  notes: "",
  currency: "",
  status: "Active",
};

describe("GeneralInformationCard", () => {
  it("renders section title and form fields", () => {
    const updateField = vi.fn();
    renderWithQueryClient(
      <GeneralInformationCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
        agencyName="Africa Tours"
      />
    );

    expect(screen.getByText("General Information")).toBeDefined();
    expect(screen.getByLabelText(/first name/i)).toBeDefined();
    expect(screen.getByLabelText(/last name/i)).toBeDefined();
    expect(screen.getByLabelText(/agency/i)).toBeDefined();
    expect(screen.getByLabelText(/assigned sp/i)).toBeDefined();
  });

  it("shows agency name as read-only in Agency field", () => {
    renderWithQueryClient(
      <GeneralInformationCard
        formData={defaultFormData}
        errors={{}}
        updateField={vi.fn()}
        agencyName="Africa Tours"
      />
    );

    const agencyInput = screen.getByDisplayValue("Africa Tours");
    expect(agencyInput).toBeDefined();
    expect((agencyInput as HTMLInputElement).disabled).toBe(true);
  });

  it("calls updateField when First Name is changed", () => {
    const updateField = vi.fn();
    renderWithQueryClient(
      <GeneralInformationCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
      />
    );

    const input = screen.getByPlaceholderText("e.g. Jonathan");
    fireEvent.change(input, { target: { value: "Jane" } });

    expect(updateField).toHaveBeenCalledWith("firstName", "Jane");
  });

  it("calls updateField when Last Name is changed", () => {
    const updateField = vi.fn();
    renderWithQueryClient(
      <GeneralInformationCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
      />
    );

    const input = screen.getByPlaceholderText("e.g. Annan");
    fireEvent.change(input, { target: { value: "Doe" } });

    expect(updateField).toHaveBeenCalledWith("lastName", "Doe");
  });

  it("renders Assigned SP select with current value", () => {
    const updateField = vi.fn();
    renderWithQueryClient(
      <GeneralInformationCard
        formData={{
          ...defaultFormData,
          assignedSafariPlannerId: "sp-2",
          assignedSafariPlannerName: "Amelia Earhart",
        }}
        errors={{}}
        updateField={updateField}
      />
    );

    const trigger = screen.getByRole("combobox", { name: /assigned sp/i });
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toContain("Amelia Earhart");
  });

  it("displays field errors when provided", () => {
    const errors: AgentFormErrors = {
      firstName: "First name is required",
      assignedSafariPlannerId: "Assigned Safari Planner is required",
    };
    renderWithQueryClient(
      <GeneralInformationCard
        formData={defaultFormData}
        errors={errors}
        updateField={vi.fn()}
      />
    );

    expect(screen.getByText("First name is required")).toBeDefined();
    expect(
      screen.getByText("Assigned Safari Planner is required")
    ).toBeDefined();
  });

  it("has id general-information for section anchor", () => {
    const { container } = renderWithQueryClient(
      <GeneralInformationCard
        formData={defaultFormData}
        errors={{}}
        updateField={vi.fn()}
      />
    );

    const card = container.querySelector("#general-information");
    expect(card).toBeTruthy();
  });
});
