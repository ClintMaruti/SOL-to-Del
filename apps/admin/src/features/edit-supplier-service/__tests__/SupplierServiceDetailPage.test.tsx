import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SupplierServiceDetailPage } from "@/pages/SupplierServiceDetailPage";
import { generateRoutePath } from "@/shared/lib/routing";

const mockUseSupplierServiceDetailPage = vi.fn();
const mockUseSupplierServiceDetailTabs = vi.fn();
const mockUseSupplier = vi.fn();
const mockUseLoadingStates = vi.fn();

vi.mock("@/features/edit-supplier-service", () => ({
  useSupplierServiceDetailPage: () => mockUseSupplierServiceDetailPage(),
  useSupplierServiceDetailTabs: () => mockUseSupplierServiceDetailTabs(),
}));

vi.mock("@/entities/suppliers", () => ({
  useSupplier: () => mockUseSupplier(),
}));

vi.mock("@/shared/stores/loadingStates", () => ({
  useLoadingStates: (selector: (state: unknown) => unknown) =>
    mockUseLoadingStates(selector),
}));

vi.mock("@/widgets/supplier-service-form", () => ({
  EditSupplierServiceForm: (props: {
    contentOnly?: boolean;
    title: string;
    submitButtonLabel: string;
  }) => (
    <div data-testid="edit-supplier-service-form">
      <span>{props.title}</span>
      <button type="submit">{props.submitButtonLabel}</button>
    </div>
  ),
  SupplierServiceDetailSkeleton: () => (
    <div
      className="animate-spin"
      data-testid="supplier-service-detail-skeleton"
    />
  ),
}));

vi.mock("@/widgets/service-options-tab", () => ({
  ServiceOptionsTab: (props: {
    serviceId: string | null;
    supplierId: string | null;
  }) => (
    <div data-testid="service-options-tab">
      <span>Options for {props.serviceId}</span>
    </div>
  ),
}));

vi.mock("@/widgets/service-extras-list", () => ({
  ServiceExtrasList: (props: {
    supplierId: string | undefined;
    serviceId: string | undefined;
  }) => (
    <div data-testid="service-extras-list">Extras for {props.serviceId}</div>
  ),
}));

vi.mock("@/features/edit-supplier-service/ui/SupplierServiceNotesTab", () => ({
  SupplierServiceNotesTab: () => (
    <div data-testid="supplier-service-notes-tab">Notes tab content</div>
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

const defaultSupplierService = {
  id: "svc-1",
  supplierId: "sup-1",
  name: "Game Drive",
  serviceTypeId: "047a5ae2-c3ed-4d6e-9f93-d42e1ff57f7a",
  type: "activity",
  isActive: true,
  tags: "",
  options: [],
  nominalSaleCode: null,
  purchaseNominalCode: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const defaultNotes = {
  text: "",
  setText: vi.fn(),
  isDirty: false,
  isLoading: false,
  isPending: false,
  queryError: null,
  save: vi.fn(),
  resetToServer: vi.fn(),
};

const defaultPageProps = {
  supplierId: "sup-1",
  serviceId: "svc-1",
  supplierService: defaultSupplierService,
  isLoading: false,
  error: null,
  form: { state: { isDirty: false } },
  isPending: false,
  activeSectionId: null,
  sections: [{ id: "general-information", label: "General Information" }],
  unsavedDialogOpen: false,
  handleCancel: vi.fn(),
  handleSubmit: vi.fn(),
  handleUnsavedDiscard: vi.fn(),
  handleUnsavedStay: vi.fn(),
  formId: "supplier-service-detail-form",
  title: "Game Drive",
  submitButtonLabel: "Save",
  schemaError: undefined,
  showActiveToggle: true,
  serviceStatusActive: true,
  handleToggleServiceStatus: vi.fn(),
  notes: defaultNotes,
};

const defaultTabs = {
  activeTab: "general" as const,
  tabBar: <div data-testid="tab-bar">Tab bar</div>,
};

const defaultSupplier = {
  data: { id: "sup-1", name: "Asilia Dunia Camp" },
  isLoading: false,
  error: null,
};

function renderWithRouter(
  initialEntry: string = "/database/destinations/suppliers/sup-1/services/svc-1"
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/database/destinations/suppliers/:supplierId/services/:serviceId"
          element={<SupplierServiceDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("SupplierServiceDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSupplierServiceDetailPage.mockReturnValue(defaultPageProps);
    mockUseSupplierServiceDetailTabs.mockReturnValue(defaultTabs);
    mockUseSupplier.mockReturnValue(defaultSupplier);
    mockUseLoadingStates.mockReturnValue(false);
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      mockUseSupplierServiceDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: true,
        supplierService: undefined,
        error: null,
      });

      const { container } = renderWithRouter();

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
      expect(screen.queryByTestId("edit-supplier-service-form")).toBeNull();
    });

    it("does not render form or ResourceNotFound while loading", () => {
      mockUseSupplierServiceDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: true,
        supplierService: undefined,
        error: null,
      });

      renderWithRouter();

      expect(screen.queryByText("Supplier service not found")).toBeNull();
      expect(screen.queryByTestId("edit-supplier-service-form")).toBeNull();
    });
  });

  describe("error and not found", () => {
    it("shows ResourceNotFound when error is set", () => {
      mockUseSupplierServiceDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Network error"),
        supplierService: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Service not found")).toBeDefined();
    });

    it("shows ResourceNotFound when supplierService is null/undefined", () => {
      mockUseSupplierServiceDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: null,
        supplierService: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Service not found")).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Suppliers" })
      ).toBeDefined();
    });

    it("navigates to suppliers list when Back to Suppliers is clicked", async () => {
      const user = userEvent.setup();
      mockUseSupplierServiceDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Not found"),
        supplierService: undefined,
      });

      renderWithRouter();

      const backButton = screen.getByRole("button", {
        name: "Back to Suppliers",
      });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(
        generateRoutePath("database", "destinations", "suppliers")
      );
    });
  });

  describe("success state", () => {
    it("renders page title when service is loaded", () => {
      renderWithRouter();

      expect(screen.getByRole("heading", { name: "Game Drive" })).toBeDefined();
    });

    it("renders EditSupplierServiceForm when on general tab", () => {
      renderWithRouter();

      expect(screen.getByTestId("edit-supplier-service-form")).toBeDefined();
    });

    it("renders active toggle with label", () => {
      renderWithRouter();

      expect(screen.getByText("Active")).toBeDefined();
      expect(
        screen.getByRole("switch", {
          name: "Toggle Game Drive active status",
        })
      ).toBeDefined();
    });

    it("renders Cancel and Save action buttons on general tab", () => {
      renderWithRouter();

      expect(
        screen.getAllByRole("button", { name: /save/i }).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByRole("button", { name: /cancel/i }).length
      ).toBeGreaterThanOrEqual(1);
    });

    it("does not render action buttons on non-general tabs", () => {
      mockUseSupplierServiceDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "closeout",
      });

      renderWithRouter();

      expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    });
  });

  describe("breadcrumb navigation", () => {
    it("renders breadcrumb with all segments", () => {
      renderWithRouter();

      expect(screen.getByText("Suppliers")).toBeDefined();
      expect(screen.getByText("Asilia Dunia Camp")).toBeDefined();
      expect(screen.getByText("Services")).toBeDefined();
      const gameDriveElements = screen.getAllByText("Game Drive");
      expect(gameDriveElements.length).toBeGreaterThanOrEqual(1);
      const breadcrumbPage = gameDriveElements.find(
        (el) => el.getAttribute("data-slot") === "breadcrumb-page"
      );
      expect(breadcrumbPage).toBeDefined();
    });

    it("renders Suppliers link pointing to suppliers list", () => {
      renderWithRouter();

      const suppliersLink = screen.getByRole("link", { name: "Suppliers" });
      expect(suppliersLink.getAttribute("href")).toBe(
        generateRoutePath("database", "destinations", "suppliers")
      );
    });

    it("renders supplier name link pointing to supplier detail", () => {
      renderWithRouter();

      const supplierLink = screen.getByRole("link", {
        name: "Asilia Dunia Camp",
      });
      expect(supplierLink.getAttribute("href")).toContain("/sup-1");
    });

    it("renders Services link pointing to supplier services tab", () => {
      renderWithRouter();

      const servicesLink = screen.getByRole("link", { name: "Services" });
      expect(servicesLink.getAttribute("href")).toContain("?tab=services");
    });

    it("shows fallback when supplier name is not yet loaded", () => {
      mockUseSupplier.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderWithRouter();

      expect(screen.getByText("...")).toBeDefined();
    });
  });

  describe("tab navigation", () => {
    it("renders tab bar when service is loaded", () => {
      renderWithRouter();

      expect(screen.getByTestId("tab-bar")).toBeDefined();
    });

    it("shows form when activeTab is general", () => {
      mockUseSupplierServiceDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "general",
      });

      renderWithRouter();

      expect(screen.getByTestId("edit-supplier-service-form")).toBeDefined();
      expect(screen.queryByText("Coming soon")).toBeNull();
    });

    it("shows ServiceOptionsTab when activeTab is options", () => {
      mockUseSupplierServiceDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "options",
      });

      renderWithRouter();

      expect(screen.getByTestId("service-options-tab")).toBeDefined();
      expect(screen.queryByTestId("edit-supplier-service-form")).toBeNull();
    });

    it("shows Coming soon when activeTab is closeout", () => {
      mockUseSupplierServiceDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "closeout",
      });

      renderWithRouter();

      expect(screen.getByText("Coming soon")).toBeDefined();
      expect(screen.queryByTestId("edit-supplier-service-form")).toBeNull();
    });

    it("shows SupplierServiceNotesTab when activeTab is notes", () => {
      mockUseSupplierServiceDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "notes",
      });

      renderWithRouter();

      expect(screen.getByTestId("supplier-service-notes-tab")).toBeDefined();
      expect(screen.queryByTestId("edit-supplier-service-form")).toBeNull();
    });

    it("renders Save and Cancel on notes tab", () => {
      mockUseSupplierServiceDetailTabs.mockReturnValue({
        ...defaultTabs,
        activeTab: "notes",
      });

      renderWithRouter();

      expect(
        screen.getAllByRole("button", { name: /save/i }).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByRole("button", { name: /cancel/i }).length
      ).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    it("shows not found when supplierService is null and error is null", () => {
      mockUseSupplierServiceDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: null,
        supplierService: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Service not found")).toBeDefined();
    });

    it("does not show active toggle when showActiveToggle is false", () => {
      mockUseSupplierServiceDetailPage.mockReturnValue({
        ...defaultPageProps,
        showActiveToggle: false,
      });

      renderWithRouter();

      expect(
        screen.queryByRole("switch", {
          name: /toggle.*active status/i,
        })
      ).toBeNull();
    });
  });
});
