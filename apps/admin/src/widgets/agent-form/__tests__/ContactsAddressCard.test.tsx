import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import type { AgentFormData, AgentFormErrors } from "@/features/edit-agent";

import { ContactsAddressCard } from "../ui/ContactsAddressCard";

const defaultFormData: AgentFormData = {
  firstName: "Jonathan",
  lastName: "Annan",
  primaryEmail: "jonathan@example.com",
  alternateEmail: "",
  phone: "+14455501020",
  agencyId: "agency-1",
  assignedSafariPlannerId: "sp-2",
  assignedSafariPlannerName: "Amelia Earhart",
  language: "",
  notes: "",
  currency: "",
  status: "Active",
};

describe("ContactsAddressCard", () => {
  it("renders section title and form fields", () => {
    const updateField = vi.fn();
    render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
      />
    );

    expect(screen.getByText("Contacts & Address")).toBeDefined();
    expect(screen.getByLabelText(/^email/i)).toBeDefined();
    expect(screen.getByLabelText(/phone/i)).toBeDefined();
    expect(screen.getByLabelText(/additional email/i)).toBeDefined();
  });

  it("calls updateField when primary email is changed", () => {
    const updateField = vi.fn();
    render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
      />
    );

    const input = screen.getByPlaceholderText("e.g. agent@company.com");
    fireEvent.change(input, { target: { value: "new@example.com" } });

    expect(updateField).toHaveBeenCalledWith("primaryEmail", "new@example.com");
  });

  it("calls updateField when phone is changed", () => {
    const updateField = vi.fn();
    render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
      />
    );

    const input = screen.getByPlaceholderText("+1 44 555-01-02");
    fireEvent.change(input, { target: { value: "+1998887766" } });

    expect(updateField).toHaveBeenCalledWith("phone", "+1998887766");
  });

  it("calls updateField when additional email is changed", () => {
    const updateField = vi.fn();
    render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
      />
    );

    const input = screen.getByPlaceholderText("e.g. agent.annan@company.com");
    fireEvent.change(input, { target: { value: "alt@example.com" } });

    expect(updateField).toHaveBeenCalledWith(
      "alternateEmail",
      "alt@example.com"
    );
  });

  it("filters phone input to allowed characters (strips letters)", () => {
    const updateField = vi.fn();
    render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={{}}
        updateField={updateField}
      />
    );

    const phoneInput = screen.getByLabelText(/phone/i);
    fireEvent.change(phoneInput, { target: { value: "12ab34cd56" } });

    expect(updateField).toHaveBeenCalledWith("phone", "+123456");
  });

  it("displays phone error when provided", () => {
    const phoneError =
      "Phone must contain only numbers and valid separators (e.g. + - ( ) ).";
    render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={{ phone: phoneError }}
        updateField={vi.fn()}
      />
    );

    expect(screen.getByText(phoneError)).toBeDefined();
  });

  it("displays field errors when provided", () => {
    const errors: AgentFormErrors = {
      primaryEmail: "Please enter a valid email address",
      alternateEmail: "Please enter a valid email address",
    };
    render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={errors}
        updateField={vi.fn()}
      />
    );

    const errorParagraphs = screen.getAllByText(
      "Please enter a valid email address"
    );
    expect(errorParagraphs).toHaveLength(2);
  });

  it("has id contacts-address for section anchor", () => {
    const { container } = render(
      <ContactsAddressCard
        formData={defaultFormData}
        errors={{}}
        updateField={vi.fn()}
      />
    );

    const card = container.querySelector("#contacts-address");
    expect(card).toBeTruthy();
  });
});
