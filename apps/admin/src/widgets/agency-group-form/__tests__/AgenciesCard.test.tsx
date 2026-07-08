import { useForm } from "@tanstack/react-form";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@sol/ui";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Agency } from "@/entities/agency/model/types";

import { AgenciesCard } from "../ui/AgenciesCard";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/entities/agency/api/useToggleAgencyStatus", () => ({
  useToggleAgencyStatus: () => ({ mutate: vi.fn() }),
}));

function createAgency(
  id: string,
  name: string,
  options?: { agencyGroupId?: string; agentsCount?: number }
): Agency {
  return {
    id,
    name,
    sourceMarketId: "sm-1",
    sourceMarketName: "Test Source Market",
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
    agentsCount: options?.agentsCount ?? 0,
    agencyGroupIds: [options?.agencyGroupId ?? "ag-1"],
    agencyGroups: [
      { id: options?.agencyGroupId ?? "ag-1", name: "Test Group" },
    ],
    assignedSafariPlannerId: "",
    assignedSafariPlannerName: "",
  };
}

function CreateTestWrapper({
  initialAgencies = [],
  agencies = [],
}: {
  initialAgencies?: string[];
  agencies?: Agency[];
}) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      agencies: initialAgencies,
    },
  });
  return (
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <MemoryRouter>
          <AgenciesCard form={form} agencies={agencies} />
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe("AgenciesCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render Agency card title and description", () => {
      render(<CreateTestWrapper />);

      expect(screen.getByText("Agencies")).toBeDefined();
      expect(
        screen.getByText(
          /this is the list of agencies assigned to this agency group/i
        )
      ).toBeDefined();
    });

    it("should render the agencies table when agencies are selected", () => {
      const agency = createAgency("ag-1", "Agency One");
      render(
        <CreateTestWrapper initialAgencies={["ag-1"]} agencies={[agency]} />
      );

      expect(screen.getByText("Agency One")).toBeDefined();
    });

    it("should not render agencies that are not in the selected list", () => {
      const agency = createAgency("ag-1", "Agency One");
      render(<CreateTestWrapper initialAgencies={[]} agencies={[agency]} />);

      expect(screen.queryByText("Agency One")).toBeNull();
    });

    it("should add multiple agencies from the picker in one action", async () => {
      const user = userEvent.setup();
      const firstAgency = createAgency("agency-1", "Agency One");
      const secondAgency = createAgency("agency-2", "Agency Two");

      render(<CreateTestWrapper agencies={[firstAgency, secondAgency]} />);

      await user.click(screen.getByRole("combobox"));
      await user.click(await screen.findByText("Agency One"));
      await user.click(screen.getByText("Agency Two"));
      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", { name: "Add" }));

      expect(screen.getByText("Agency One")).toBeDefined();
      expect(screen.getByText("Agency Two")).toBeDefined();
    });
  });
});
