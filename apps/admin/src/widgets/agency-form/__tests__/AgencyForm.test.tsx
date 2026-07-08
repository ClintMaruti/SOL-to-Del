import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AGENCY_FORM_ANCHOR_SECTIONS } from "../constants";
import type { AgencyFormProps } from "../types";
import { AgencyForm } from "../ui/AgencyForm";

vi.mock("@/features/create-agent", () => ({
  CreateNewAgentModal: () => <div data-testid="create-agent-modal" />,
}));

vi.mock("@/shared/ui", () => ({
  ActiveStatusSwitchWithXeroGate: () => (
    <div data-testid="active-status-switch" />
  ),
  FormPageLayout: ({
    sections,
    children,
  }: {
    sections: { id: string; label: string }[];
    children: React.ReactNode;
  }) => (
    <div>
      <nav data-testid="section-anchor">
        {sections.map((section) => (
          <span key={section.id}>{section.label}</span>
        ))}
      </nav>
      <div data-testid="layout-children">{children}</div>
    </div>
  ),
}));

vi.mock("../ui/GeneralInformationCard", () => ({
  GeneralInformationCard: () => <div data-testid="general-card" />,
}));
vi.mock("../ui/ContactsAddressCard", () => ({
  ContactsAddressCard: () => <div data-testid="contacts-card" />,
}));
vi.mock("../ui/PaymentTermsCard", () => ({
  PaymentTermsCard: () => <div data-testid="terms-card" />,
}));
vi.mock("../ui/CommissionsCard", () => ({
  CommissionsCard: () => <div data-testid="commissions-card" />,
}));
vi.mock("../ui/AgentsCard", () => ({
  AgentsCard: () => <div data-testid="agents-card" />,
}));
vi.mock("../ui/WhiteLabelCard", () => ({
  WhiteLabelCard: () => <div data-testid="whitelabel-card" />,
}));
vi.mock("../ui/AgentZoneCard", () => ({
  AgentZoneCard: () => <div data-testid="agentzone-card" />,
}));
vi.mock("../ui/AgencyAffiliationsCard", () => ({
  AgencyAffiliationsCard: () => <div data-testid="affiliations-card" />,
}));
vi.mock("../ui/AdditionalIdsCard", () => ({
  AdditionalIdsCard: () => <div data-testid="additional-ids-card" />,
}));
vi.mock("../ui/AdditionalNotesCard", () => ({
  AdditionalNotesCard: () => <div data-testid="additional-notes-card" />,
}));

const baseProps: AgencyFormProps = {
  form: {} as AgencyFormProps["form"],
  schemaError: undefined,
  agents: [],
  isPending: false,
  activeSectionId: null,
  onSectionClick: vi.fn(),
  sections: AGENCY_FORM_ANCHOR_SECTIONS,
  unsavedDialogOpen: false,
  handleCancel: vi.fn(),
  handleSubmit: vi.fn(),
  handleUnsavedDiscard: vi.fn(),
  handleUnsavedStay: vi.fn(),
  formId: "agency-form",
  title: "Test Agency",
  submitButtonLabel: "Save",
  description: undefined,
  toggleAgentActive: vi.fn(),
  onAgentDeleted: vi.fn(),
  createAgentModalOpen: false,
  setCreateAgentModalOpen: vi.fn(),
  showActiveToggle: false,
  agencyStatusActive: true,
  handleToggleAgencyStatus: vi.fn(),
  activationKenXeroId: undefined,
  handleAgentNameClick: vi.fn(),
  agentToEdit: null,
  editAgent: vi.fn(),
  onUpdateAgent: vi.fn(),
  agencyId: "agency-1",
  mode: "edit",
};

describe("AgencyForm", () => {
  it("renders the commission section before agents in edit mode and includes the anchor", () => {
    render(<AgencyForm {...baseProps} />);

    const children = Array.from(
      screen.getByTestId("layout-children").children
    ).map((element) => element.getAttribute("data-testid"));

    expect(children).toContain("commissions-card");
    expect(children.indexOf("commissions-card")).toBeLessThan(
      children.indexOf("agents-card")
    );
    expect(screen.getByTestId("section-anchor").textContent).toContain(
      "Commission"
    );
  });

  it("does not render the commission section or anchor in create mode", () => {
    render(<AgencyForm {...baseProps} mode="create" />);

    expect(screen.queryByTestId("commissions-card")).toBeNull();
    expect(screen.getByTestId("section-anchor").textContent).not.toContain(
      "Commission"
    );
  });
});
