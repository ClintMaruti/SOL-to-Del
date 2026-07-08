import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { Agency } from "@/entities/agency/model/types";

import { AgencyGroupForm } from "../ui/AgencyGroupForm";

function createAgency(id: string, name: string): Agency {
  return {
    id,
    name,
    sourceMarketId: "sm-1",
    iataAgencyCode: null,
    email: "test@test.com",
    number: "",
    country: null,
    city: null,
    postalCode: null,
    address: null,
    website: null,
    kenXeroId: null,
    rwXeroId: null,
    tzXeroId: null,
    znzXeroId: null,
    paymentDepositPercent: 0,
    paymentBalanceDueDays: 0,
    paymentTaxCode: "",
    hasCreditTerms: false,
    creditNotes: null,
    requiresWhiteLabeling: false,
    whiteLabelingNote: null,
    visibilityForAgentZone: false,
    agentZoneId: null,
    agencyAffiliations: null,
    additionalNotes: null,
    isActive: true,
    version: 1,
    agencyGroupIds: ["ag-1"],
    agencyGroups: [{ id: "ag-1", name: "Test Group" }],
    assignedSafariPlannerId: "",
    assignedSafariPlannerName: "",
    sourceMarketName: "Test Source Market",
  };
}

const SECTIONS = [
  { id: "general-information", label: "General" },
  { id: "agencies", label: "Agency" },
] as const;

interface TestFormProps {
  isPending?: boolean;
  description?: string;
  handleCancel?: () => void;
  handleSubmit?: (e: React.FormEvent) => void;
  agencies?: Agency[];
}

function TestFormWrapper({
  isPending = false,
  description = "Newly created group will be active by default.",
  handleCancel = vi.fn(),
  handleSubmit = vi.fn(),
}: TestFormProps) {
  const form = useForm({
    defaultValues: { name: "", description: "", agencies: [] },
  });
  return (
    <AgencyGroupForm
      form={form}
      isPending={isPending}
      activeSectionId="general-information"
      sections={SECTIONS}
      formId="create-agency-group-form"
      title="Create New Agency Group"
      submitButtonLabel="Save New Agency Group"
      description={description}
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      mode="create"
    />
  );
}

function createTestWrapper(props?: Partial<TestFormProps>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TestFormWrapper {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AgencyGroupForm", () => {
  describe("Rendering - Create mode", () => {
    it("should render Create New Agency Group title", () => {
      createTestWrapper({ agencies: [createAgency("ag-1", "Agency One")] });

      expect(
        screen.getByRole("heading", { name: "Create New Agency Group" })
      ).toBeDefined();
    });

    it("should render description text", () => {
      createTestWrapper();

      expect(
        screen.getByText(/newly created group will be active by default/i)
      ).toBeDefined();
    });

    it("should render General Information and Agency sections", () => {
      createTestWrapper({ description: "" });

      expect(screen.getByText("General Information")).toBeDefined();
      expect(screen.getAllByText("Agency").length).toBeGreaterThanOrEqual(1);
    });

    it("should render Save and Cancel buttons", () => {
      createTestWrapper({ description: "" });

      const saveButtons = screen.getAllByRole("button", {
        name: "Save New Agency Group",
      });
      const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });

      expect(saveButtons.length).toBeGreaterThanOrEqual(1);
      expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Interactions", () => {
    it("should call handleCancel when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const handleCancel = vi.fn();

      createTestWrapper({ handleCancel, description: "" });

      const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
      await user.click(cancelButtons[0]!);

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it("should call handleSubmit when Save is clicked", async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());

      createTestWrapper({ handleSubmit, description: "" });

      const saveButtons = screen.getAllByRole("button", {
        name: "Save New Agency Group",
      });
      await user.click(saveButtons[0]!);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Loading state", () => {
    it("should keep Save New Agency Group label when isPending is true", () => {
      createTestWrapper({ isPending: true, description: "" });

      const saveButtons = screen.getAllByRole("button", {
        name: "Save New Agency Group",
      });
      expect(saveButtons.length).toBeGreaterThanOrEqual(1);
      expect((saveButtons[0] as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
