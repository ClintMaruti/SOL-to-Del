import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContractConfigurationPage } from "../ContractConfigurationPage";

const mocks = vi.hoisted(() => ({
  useContractDetailPage: vi.fn(),
}));

vi.mock("@/features/edit-supplier-contract", () => ({
  ContractDetailsCard: () => <div>Contract details card</div>,
  ContractConfigurationSkeleton: () => <div>Contract loading</div>,
  useContractDetailPage: mocks.useContractDetailPage,
}));

vi.mock("@/widgets/contract-policies", () => ({
  PoliciesCard: () => <div>Policies card</div>,
}));

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/database/destinations/suppliers/sup-1/contracts/contract-1",
      ]}
    >
      <Routes>
        <Route path="*" element={<ContractConfigurationPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ContractConfigurationPage", () => {
  beforeEach(() => {
    mocks.useContractDetailPage.mockReturnValue({
      supplierId: "sup-1",
      contractId: "contract-1",
      contract: {
        id: "contract-1",
        name: "Contract 2026",
        link: null,
        agencyGroupId: null,
        agencyGroupName: null,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        isActive: false,
        isCurrentlyActive: false,
        canDelete: false,
      },
      supplier: { id: "sup-1", name: "Elewana" },
      isLoading: false,
      error: null,
      form: {},
      isPending: false,
      isDeletePending: false,
      schemaError: undefined,
      canDelete: false,
      unsavedDialogOpen: false,
      deleteDialogOpen: false,
      validityWarningOpen: false,
      formId: "contract-detail-form",
      title: "Contract 2026",
      submitButtonLabel: "Save",
      handleCancel: vi.fn(),
      handleSubmit: vi.fn(),
      handleUnsavedDiscard: vi.fn(),
      handleUnsavedStay: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      handleDeleteDialogClose: vi.fn(),
      handleValidityWarningConfirm: vi.fn(),
      handleValidityWarningCancel: vi.fn(),
      handlePoliciesDirtyChange: vi.fn(),
    });
  });

  it("renders contract details and policies without Pax Types", () => {
    renderPage();

    expect(screen.getByText("Contract details card")).toBeDefined();
    expect(screen.getByText("Policies card")).toBeDefined();
    expect(screen.queryByText("Pax types card")).toBeNull();
  });

  it("does not expose delete for saved contracts even when canDelete is true", () => {
    mocks.useContractDetailPage.mockReturnValue({
      ...mocks.useContractDetailPage(),
      canDelete: true,
    });

    renderPage();

    expect(screen.queryByRole("button", { name: /^delete$/i })).toBeNull();
  });
});
