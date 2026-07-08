import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SupplierHeadOfficeDetailPage } from "@/pages/SupplierHeadOfficeDetailPage";
import { ROUTES } from "@/shared/lib/paths";
import { SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS } from "@/widgets/supplier-head-office-form/constants";

const mockSupplierHeadOfficeForm = vi.fn(
  (props: {
    title: string;
    submitButtonLabel: string;
    headOfficeId?: string;
    onSectionClick?: (sectionId: string) => void;
    sections?: Array<{
      id: string;
      label: string;
    }>;
  }) => (
    <div data-testid="supplier-head-office-form">
      <h1>{props.title}</h1>
      {props.sections?.map((section) => (
        <span key={`section-${section.id}`}>
          {section.id === "general-information"
            ? "General Information"
            : section.label}
        </span>
      ))}
      {props.sections?.map((section) => (
        <a key={`anchor-${section.id}`} href={`#${section.id}`}>
          {section.label}
        </a>
      ))}
      <span data-testid="head-office-id">{props.headOfficeId}</span>
      <button type="button">Cancel</button>
      <button type="submit">{props.submitButtonLabel}</button>
    </div>
  )
);
vi.mock("@/widgets/supplier-head-office-form", () => ({
  SupplierHeadOfficeForm: (
    props: Parameters<typeof mockSupplierHeadOfficeForm>[0]
  ) => mockSupplierHeadOfficeForm(props),
  SupplierHeadOfficeDetailSkeleton: () => (
    <div
      className="animate-spin"
      data-testid="supplier-head-office-detail-skeleton"
    />
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

const mockUseHeadOfficeDetailPage = vi.fn();
vi.mock("../model/useHeadOfficeDetailPage", () => ({
  useHeadOfficeDetailPage: () => mockUseHeadOfficeDetailPage(),
}));

const defaultPageProps = {
  headOfficeId: "sho-1",
  headOffice: {
    id: "sho-1",
    name: "Elewana Collection",
    email: "info@elewana.com",
    phone: "+254 712 345678",
    additionalEmail: null,
    website: null,
    country: "Kenya",
    city: "Nairobi",
    postalCode: "00100",
    streetAddress: "123 Main Street",
    isActive: true,
    suppliersCount: 2,
  },
  isLoading: false,
  error: null,
  form: {},
  isPending: false,
  activeSectionId: null,
  onSectionClick: vi.fn(),
  sections: [...SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS],
  unsavedDialogOpen: false,
  handleCancel: vi.fn(),
  handleSubmit: vi.fn(),
  handleUnsavedDiscard: vi.fn(),
  handleUnsavedStay: vi.fn(),
  formId: "head-office-detail-form",
  title: "Elewana Collection",
  submitButtonLabel: "Save",
  description: undefined,
  showActiveToggle: true,
  headOfficeStatusActive: true,
  handleToggleHeadOfficeStatus: vi.fn(),
  suppliers: [],
  onSupplierNameClick: vi.fn(),
  schemaError: undefined,
  onToggleSupplierStatus: vi.fn(),
  onDeleteSupplier: vi.fn(),
  canDelete: true,
  isDeletePending: false,
  deleteError: null,
  resetDeleteError: vi.fn(),
};

function renderWithRouter(
  initialEntry: string = "/database/destinations/supplier-head-offices/sho-1"
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/database/destinations/supplier-head-offices/:headOfficeId"
          element={<SupplierHeadOfficeDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("SupplierHeadOfficeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: true,
        headOffice: undefined,
        error: null,
      });

      const { container } = renderWithRouter();

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
      expect(screen.queryByText("Head office not found")).toBeNull();
    });

    it("does not render form or ResourceNotFound while loading", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: true,
        headOffice: undefined,
        error: null,
      });

      renderWithRouter();

      expect(screen.queryByText("Head office not found")).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Elewana Collection" })
      ).toBeNull();
    });
  });

  describe("error and not found", () => {
    it("shows ResourceNotFound when error is set", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Network error"),
        headOffice: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Head office not found")).toBeDefined();
      expect(
        screen.getByText(
          /The requested head office could not be found. It may have been removed or the link may be incorrect/i
        )
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Head Offices" })
      ).toBeDefined();
    });

    it("shows ResourceNotFound when headOffice is null/undefined", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: null,
        headOffice: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Head office not found")).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Head Offices" })
      ).toBeDefined();
    });

    it("navigates to head offices list when Back to Head Offices is clicked", async () => {
      const user = userEvent.setup();
      mockUseHeadOfficeDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Not found"),
        headOffice: undefined,
      });

      renderWithRouter();

      const backButton = screen.getByRole("button", {
        name: "Back to Head Offices",
      });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SUPPLIER_HEAD_OFFICES);
    });
  });

  describe("success state", () => {
    it("renders SupplierHeadOfficeForm with hook props when head office is loaded", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getByTestId("supplier-head-office-form")).toBeDefined();
      expect(
        screen.getByRole("heading", { name: "Elewana Collection" })
      ).toBeDefined();
      expect(screen.getByRole("button", { name: /save/i })).toBeDefined();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
    });

    it("renders General Information section when form is shown", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getByText("General Information")).toBeDefined();
    });

    it("renders Contacts & Address and Suppliers sections when form is shown", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(
        screen.getAllByText("Contacts & Address").length
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Suppliers").length).toBeGreaterThanOrEqual(1);
    });

    it("renders the Promotions section and anchor when form is shown", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getAllByText("Promotions").length).toBeGreaterThanOrEqual(
        1
      );
      expect(screen.getByRole("link", { name: "Promotions" })).toBeDefined();
    });

    it("renders section anchor navigation when form is shown", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getByRole("link", { name: "General" })).toBeDefined();
      expect(
        screen.getByRole("link", { name: "Contacts & Address" })
      ).toBeDefined();
      expect(screen.getByRole("link", { name: "Suppliers" })).toBeDefined();
      expect(screen.getByRole("link", { name: "Promotions" })).toBeDefined();
    });

    it("passes onSectionClick from hook to SupplierHeadOfficeForm", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(mockSupplierHeadOfficeForm).toHaveBeenCalledWith(
        expect.objectContaining({
          onSectionClick: defaultPageProps.onSectionClick,
        })
      );
    });

    it("passes headOfficeId through to SupplierHeadOfficeForm", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(mockSupplierHeadOfficeForm).toHaveBeenCalledWith(
        expect.objectContaining({
          headOfficeId: "sho-1",
        })
      );
      expect(screen.getByTestId("head-office-id").textContent).toBe("sho-1");
    });
  });

  describe("edge cases", () => {
    it("shows not found when headOffice is null and error is null (e.g. 404)", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: null,
        headOffice: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Head office not found")).toBeDefined();
    });

    it("prefers error state over empty headOffice for not-found UI", () => {
      mockUseHeadOfficeDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Failed to fetch"),
        headOffice: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Head office not found")).toBeDefined();
      expect(
        screen.getByText(
          /The requested head office could not be found. It may have been removed or the link may be incorrect/i
        )
      ).toBeDefined();
    });
  });
});
