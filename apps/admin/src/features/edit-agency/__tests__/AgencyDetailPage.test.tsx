import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AgencyDetailPage } from "@/pages/AgencyDetailPage";
import { ROUTES } from "@/shared/lib/paths";

vi.mock("@/widgets/agency-form", () => ({
  AgencyForm: (props: { title: string }) => (
    <div data-testid="agency-form">
      <h1>{props.title}</h1>
      <span>General Information</span>
      <a href="#general">General</a>
      <a href="#contacts">Contacts & Address</a>
      <button type="button">Cancel</button>
      <button type="submit">Save changes</button>
    </div>
  ),
  AgencyDetailSkeleton: () => (
    <div className="animate-spin" data-testid="agency-detail-skeleton" />
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

const mockUseAgencyDetailPage = vi.fn();
vi.mock("../model/useAgencyDetailPage", () => ({
  useAgencyDetailPage: () => mockUseAgencyDetailPage(),
}));

const defaultPageProps = {
  agencyId: "agency-123",
  agency: {
    id: "agency-123",
    name: "Test Agency",
    agencyName: "Test Agency",
  },
  isLoading: false,
  error: null,
  form: {},
  agents: [],
  isPending: false,
  activeSectionId: null,
  sections: [],
  unsavedDialogOpen: false,
  handleCancel: vi.fn(),
  handleSubmit: vi.fn(),
  handleUnsavedDiscard: vi.fn(),
  handleUnsavedStay: vi.fn(),
  formId: "agency-detail-form",
  title: "Test Agency",
  submitButtonLabel: "Save changes",
  showActiveToggle: true,
  agencyStatusActive: true,
  handleToggleAgencyStatus: vi.fn(),
  handleAgentNameClick: vi.fn(),
  createAgentModalOpen: false,
  setCreateAgentModalOpen: vi.fn(),
  toggleAgentActive: vi.fn(),
};

function renderWithRouter(
  initialEntry: string = "/database/destinations/agencies/agency-123"
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/database/destinations/agencies/:agencyId"
          element={<AgencyDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("AgencyDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgencyDetailPage.mockReturnValue(defaultPageProps);
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      mockUseAgencyDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: true,
        agency: undefined,
        error: null,
      });

      const { container } = renderWithRouter();

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
      expect(screen.queryByText("Agency not found")).toBeNull();
    });

    it("does not render AgencyForm or ResourceNotFound while loading", () => {
      mockUseAgencyDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: true,
        agency: undefined,
        error: null,
      });

      renderWithRouter();

      expect(screen.queryByText("Agency not found")).toBeNull();
      expect(screen.queryByRole("heading", { name: "Test Agency" })).toBeNull();
    });
  });

  describe("error and not found", () => {
    it("shows ResourceNotFound when error is set", () => {
      mockUseAgencyDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Network error"),
        agency: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Agency not found")).toBeDefined();
      expect(
        screen.getByText(
          /The requested agency could not be found. It may have been removed or the link may be incorrect/i
        )
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Agencies" })
      ).toBeDefined();
    });

    it("shows ResourceNotFound when agency is null/undefined", () => {
      mockUseAgencyDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: null,
        agency: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Agency not found")).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Agencies" })
      ).toBeDefined();
    });

    it("navigates to agencies list when Back to Agencies is clicked", async () => {
      const user = userEvent.setup();
      mockUseAgencyDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Not found"),
        agency: undefined,
      });

      renderWithRouter();

      const backButton = screen.getByRole("button", {
        name: "Back to Agencies",
      });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.AGENCIES);
    });
  });

  describe("success state", () => {
    it("renders AgencyForm with hook props when agency is loaded", () => {
      mockUseAgencyDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getByTestId("agency-form")).toBeDefined();
      expect(
        screen.getByRole("heading", { name: "Test Agency" })
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: /save changes/i })
      ).toBeDefined();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeDefined();
    });

    it("renders General Information section when form is shown", () => {
      mockUseAgencyDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getByText("General Information")).toBeDefined();
    });

    it("renders section anchor navigation when form is shown", () => {
      mockUseAgencyDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getByRole("link", { name: "General" })).toBeDefined();
      expect(
        screen.getByRole("link", { name: "Contacts & Address" })
      ).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("shows not found when agency is null and error is null (e.g. 404)", () => {
      mockUseAgencyDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: null,
        agency: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Agency not found")).toBeDefined();
    });

    it("prefers error state over empty agency for not-found UI", () => {
      mockUseAgencyDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        error: new Error("Failed to fetch"),
        agency: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Agency not found")).toBeDefined();
      expect(
        screen.getByText(
          /The requested agency could not be found. It may have been removed or the link may be incorrect/i
        )
      ).toBeDefined();
    });
  });
});
