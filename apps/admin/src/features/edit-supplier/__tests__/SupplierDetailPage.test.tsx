import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateSupplierFormData } from "@/features/create-supplier/model/types";

vi.mock("@tanstack/react-form", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-form")>();
  return {
    ...actual,
    useStore: <T,>(
      _store: unknown,
      selector: (s: { values: CreateSupplierFormData }) => T
    ): T =>
      selector({
        values: { xeroId: "test-xero-id" } as CreateSupplierFormData,
      }) as T,
  };
});

import { SupplierDetailPage } from "@/pages/SupplierDetailPage";
import { ROUTES } from "@/shared/lib/paths";

const mockUseSupplierData = vi.fn();
const mockUseSupplierDetailTabs = vi.fn();
const mockUseSupplierOverviewTab = vi.fn();
const mockUseSupplierNotesTab = vi.fn();

vi.mock("@/widgets/supplier-form", () => ({
  SupplierForm: (props: {
    title?: string;
    submitButtonLabel: string;
    subHeader?: ReactNode;
    tabs?: ReactNode;
    contentOnly?: boolean;
  }) => (
    <div data-testid="supplier-form">
      {!props.contentOnly && (
        <>
          {props.subHeader}
          {props.tabs}
          <h1>{props.title}</h1>
        </>
      )}
      <span>General Information</span>
      <a href="#general-information">General Information</a>
      <a href="#contacts">Contacts</a>
      <a href="#address-location">Address & Location</a>
      <button type="button">Cancel</button>
      <button type="submit">{props.submitButtonLabel}</button>
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/widgets/supplier-contracts-list/ui/SupplierContractsList", () => ({
  SupplierContractsList: (props: { supplierId: string }) => (
    <div data-testid="supplier-contracts-list">
      Contracts for {props.supplierId}
    </div>
  ),
}));

vi.mock("@/widgets/supplier-services-list", () => ({
  SupplierServicesList: () => (
    <div data-testid="supplier-services-list">Services</div>
  ),
}));

vi.mock("@/widgets/supplier-extras-list", () => ({
  SupplierExtrasList: (props: { supplierId: string | undefined }) => (
    <div data-testid="supplier-extras-list">Extras for {props.supplierId}</div>
  ),
}));

vi.mock("@/widgets/supplier-configuration", () => ({
  SupplierConfigurationPanel: (props: { supplierId: string }) => (
    <div data-testid="supplier-configuration-panel">
      Configuration for {props.supplierId}
    </div>
  ),
}));

vi.mock("@/features/edit-supplier", () => ({
  useSupplierData: () => mockUseSupplierData(),
  useSupplierDetailTabs: () => mockUseSupplierDetailTabs(),
  useSupplierOverviewTab: (
    supplier: unknown,
    supplierId: string | undefined,
    _options?: unknown
  ) => mockUseSupplierOverviewTab(supplier, supplierId, _options),
  useSupplierNotesTab: () => mockUseSupplierNotesTab(),
  SupplierDetailMetaStrip: () => (
    <>
      <span>Location</span>
      <span>Email</span>
      <span>Last updated</span>
      <span>Last updated by</span>
    </>
  ),
}));

const defaultSupplier = {
  id: "supplier-123",
  name: "Test Supplier",
  isActive: true,
};

const defaultData = {
  supplierId: "supplier-123",
  supplier: defaultSupplier,
  isLoading: false,
  error: null,
  title: "Test Supplier",
  description: "Complete and manage supplier information.",
};

const defaultTabs = {
  activeTab: "overview" as const,
  tabBar: <div data-testid="tab-bar">Tab bar</div>,
};

const defaultController = {
  formId: "supplier-detail-form",
  isPending: false,
  submitButtonLabel: "Save",
  handleSubmit: vi.fn(),
  handleCancel: vi.fn(),
  unsavedDialogOpen: false,
  handleUnsavedDiscard: vi.fn(),
  handleUnsavedStay: vi.fn(),
  sections: [
    { id: "general-information", label: "General Information" },
    { id: "contacts", label: "Contacts" },
    { id: "address-location", label: "Address & Location" },
  ],
  activeSectionId: null,
  showSidebar: true,
  wrapInForm: true,
};

const defaultOverview = {
  controller: defaultController,
  form: {},
  requestToggleSupplierStatus: vi.fn(),
  supplierStatusToggleLoading: false,
};

const defaultNotesTab = {
  text: "",
  setText: vi.fn(),
  isLoading: false,
  isFetched: true,
  loadError: false,
  isDirty: false,
  resetToSaved: vi.fn(),
  handleSave: vi.fn((e: { preventDefault: () => void }) => e.preventDefault()),
  isPending: false,
  formId: "supplier-notes-form",
};

function renderWithRouter(
  initialEntry: string = "/database/destinations/suppliers/supplier-123"
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/database/destinations/suppliers/:supplierId"
            element={<SupplierDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("SupplierDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSupplierData.mockReturnValue(defaultData);
    mockUseSupplierDetailTabs.mockReturnValue(defaultTabs);
    mockUseSupplierOverviewTab.mockReturnValue(defaultOverview);
    mockUseSupplierNotesTab.mockReturnValue(defaultNotesTab);
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: true,
        supplier: undefined,
        error: null,
      });

      const { container } = renderWithRouter();

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
      expect(screen.queryByText("Supplier not found")).toBeNull();
    });

    it("does not render SupplierForm or ResourceNotFound while loading", () => {
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: true,
        supplier: undefined,
        error: null,
      });

      renderWithRouter();

      expect(screen.queryByText("Supplier not found")).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Test Supplier" })
      ).toBeNull();
    });

    it("does not call useSupplierOverviewTab when isLoading is true", () => {
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: true,
        supplier: undefined,
        error: null,
      });

      renderWithRouter();

      expect(mockUseSupplierOverviewTab).not.toHaveBeenCalled();
    });
  });

  describe("error and not found", () => {
    it("shows ResourceNotFound when error is set", () => {
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: false,
        error: new Error("Network error"),
        supplier: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Supplier not found")).toBeDefined();
      expect(
        screen.getByText(
          /The requested supplier could not be found. It may have been removed or the link may be incorrect/i
        )
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Suppliers" })
      ).toBeDefined();
    });

    it("shows ResourceNotFound when supplier is null/undefined", () => {
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: false,
        error: null,
        supplier: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Supplier not found")).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Suppliers" })
      ).toBeDefined();
    });

    it("navigates to suppliers list when Back to Suppliers is clicked", async () => {
      const user = userEvent.setup();
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: false,
        error: new Error("Not found"),
        supplier: undefined,
      });

      renderWithRouter();

      const backButton = screen.getByRole("button", {
        name: "Back to Suppliers",
      });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SUPPLIERS);
    });
  });

  describe("success state", () => {
    it("renders chrome with title and SupplierForm (overview) when supplier is loaded", () => {
      renderWithRouter();

      expect(screen.getByTestId("supplier-form")).toBeDefined();
      // Title comes from SupplierDetailLayout
      expect(
        screen.getByRole("heading", { name: "Test Supplier" })
      ).toBeDefined();
      // Chrome and form both render Save/Cancel (header + footer + form)
      expect(
        screen.getAllByRole("button", { name: /save/i }).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByRole("button", { name: /cancel/i }).length
      ).toBeGreaterThanOrEqual(1);
    });

    it("renders General Information section when form is shown", () => {
      renderWithRouter();

      expect(
        screen.getByRole("link", { name: "General Information" })
      ).toBeDefined();
    });

    it("renders section anchor navigation when form is shown", () => {
      renderWithRouter();

      expect(
        screen.getByRole("link", { name: "General Information" })
      ).toBeDefined();
      expect(screen.getByRole("link", { name: "Contacts" })).toBeDefined();
      expect(
        screen.getByRole("link", { name: "Address & Location" })
      ).toBeDefined();
    });

    it("renders supplier meta strip (Location, Email, Last updated) when supplier is loaded", () => {
      renderWithRouter();

      expect(screen.getByText("Location")).toBeDefined();
      expect(screen.getByText("Email")).toBeDefined();
      expect(screen.getByText("Last updated")).toBeDefined();
    });
  });

  describe("tab navigation", () => {
    it("renders tab bar when supplier is loaded", () => {
      renderWithRouter();

      expect(screen.getByTestId("tab-bar")).toBeDefined();
    });

    it("shows overview form when activeTab is overview", () => {
      mockUseSupplierDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "overview",
      });

      renderWithRouter();

      expect(
        screen.getByRole("link", { name: "General Information" })
      ).toBeDefined();
      expect(screen.queryByText("Coming soon")).toBeNull();
    });

    it("shows contracts list and does not render SupplierForm when activeTab is contracts", () => {
      mockUseSupplierDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "contracts",
      });

      renderWithRouter();

      expect(screen.getByTestId("supplier-contracts-list")).toBeDefined();
      expect(screen.queryByTestId("supplier-form")).toBeNull();
    });

    it("shows supplier configuration panel when activeTab is configuration", () => {
      mockUseSupplierDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "configuration",
      });

      renderWithRouter();

      expect(screen.getByTestId("supplier-configuration-panel")).toBeDefined();
      expect(screen.getByText("Configuration for supplier-123")).toBeDefined();
      expect(screen.queryByTestId("supplier-form")).toBeNull();
    });

    it("shows ComingSoon when activeTab is an unrecognized tab", () => {
      mockUseSupplierDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "pricing",
      });

      renderWithRouter();

      expect(screen.getByText("Coming soon")).toBeDefined();
      expect(screen.queryByTestId("supplier-form")).toBeNull();
    });

    it("calls useSupplierOverviewTab with supplier and supplierId when supplier is loaded (to provide form/controller for overview tab)", () => {
      renderWithRouter();

      expect(mockUseSupplierOverviewTab).toHaveBeenCalledWith(
        defaultSupplier,
        "supplier-123",
        expect.objectContaining({
          mergeUnsaved: expect.objectContaining({
            isDirty: false,
            onDiscardMerged: expect.any(Function),
          }),
        })
      );
    });

    it("calls useSupplierOverviewTab when a non-overview tab is active (form/controller still needed for when user switches to overview)", () => {
      mockUseSupplierDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "contracts",
      });

      renderWithRouter();

      expect(mockUseSupplierOverviewTab).toHaveBeenCalledWith(
        defaultSupplier,
        "supplier-123",
        expect.any(Object)
      );
    });

    it("shows notes tab content when activeTab is notes", () => {
      mockUseSupplierDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "notes",
      });

      renderWithRouter();

      expect(screen.getByRole("heading", { name: "Notes" })).toBeDefined();
      expect(screen.getByRole("textbox", { name: /^notes$/i })).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("shows not found when supplier is null and error is null (e.g. 404)", () => {
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: false,
        error: null,
        supplier: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Supplier not found")).toBeDefined();
    });

    it("prefers error state over empty supplier for not-found UI", () => {
      mockUseSupplierData.mockReturnValue({
        ...defaultData,
        isLoading: false,
        error: new Error("Failed to fetch"),
        supplier: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Supplier not found")).toBeDefined();
      expect(
        screen.getByText(
          /The requested supplier could not be found. It may have been removed or the link may be incorrect/i
        )
      ).toBeDefined();
    });
  });
});
