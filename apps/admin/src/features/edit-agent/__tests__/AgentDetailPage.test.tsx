import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AgentDetailPage } from "@/pages/AgentDetailPage";
import { ROUTES } from "@/shared/lib/paths";

vi.mock("@/widgets/agent-form", () => ({
  AgentForm: (props: { title: string }) => (
    <div data-testid="agent-form">
      <h1>{props.title}</h1>
      <button type="button">Cancel</button>
      <button type="submit">Save</button>
    </div>
  ),
  AgentDetailSkeleton: () => (
    <div className="animate-spin" data-testid="agent-detail-skeleton" />
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

const mockUseAgentDetailPage = vi.fn();
vi.mock("../model/useAgentDetailPage", () => ({
  useAgentDetailPage: (opts: { agentId: string }) =>
    mockUseAgentDetailPage(opts),
}));

const defaultPageProps = {
  isLoading: false,
  isError: false,
  agent: { id: "agent-1", firstName: "Jane", lastName: "Doe" },
  formData: {},
  errors: {},
  updateField: vi.fn(),
  isPending: false,
  activeSectionId: null,
  sections: [],
  unsavedDialogOpen: false,
  formId: "agent-detail-form",
  title: "Jane Doe",
  submitButtonLabel: "Save",
  handleCancel: vi.fn(),
  handleUnsavedDiscard: vi.fn(),
  handleUnsavedStay: vi.fn(),
  handleSubmit: vi.fn(),
  agencies: [],
  agencyName: "Test Agency",
  showActiveToggle: true,
  isActive: true,
  onStatusChange: vi.fn(),
};

function renderWithRouter(
  initialEntry: string = "/database/destinations/agents/agent-1"
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/database/destinations/agents/:id"
          element={<AgentDetailPage />}
        />
        <Route
          path="/database/destinations/agents"
          element={<AgentDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("AgentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgentDetailPage.mockReturnValue(defaultPageProps);
  });

  it("renders Missing agent ID when id is not in params", () => {
    render(
      <MemoryRouter initialEntries={["/database/destinations/agents"]}>
        <Routes>
          <Route
            path="/database/destinations/agents"
            element={<AgentDetailPage />}
          />
          <Route
            path="/database/destinations/agents/:id"
            element={<AgentDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Missing agent ID.")).toBeDefined();
    expect(mockUseAgentDetailPage).not.toHaveBeenCalled();
  });

  describe("loading state", () => {
    it("shows loading spinner when isLoading is true", () => {
      mockUseAgentDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: true,
        agent: undefined,
        isError: false,
      });

      const { container } = renderWithRouter();

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
      expect(screen.queryByText("Agent not found")).toBeNull();
    });
  });

  describe("error and not found", () => {
    it("shows ResourceNotFound when isError is true", () => {
      mockUseAgentDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        isError: true,
        agent: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Agent not found")).toBeDefined();
      expect(
        screen.getByText(
          /The requested agent could not be found. It may have been removed or the link may be incorrect/i
        )
      ).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Agents" })
      ).toBeDefined();
    });

    it("shows ResourceNotFound when agent is null/undefined", () => {
      mockUseAgentDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        isError: false,
        agent: undefined,
      });

      renderWithRouter();

      expect(screen.getByText("Agent not found")).toBeDefined();
      expect(
        screen.getByRole("button", { name: "Back to Agents" })
      ).toBeDefined();
    });

    it("navigates to agents list when Back to Agents is clicked", async () => {
      const user = userEvent.setup();
      mockUseAgentDetailPage.mockReturnValue({
        ...defaultPageProps,
        isLoading: false,
        isError: true,
        agent: undefined,
      });

      renderWithRouter();

      const backButton = screen.getByRole("button", {
        name: "Back to Agents",
      });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.AGENTS);
    });
  });

  describe("success state", () => {
    it("calls useAgentDetailPage with agentId from params", () => {
      renderWithRouter("/database/destinations/agents/agent-123");

      expect(mockUseAgentDetailPage).toHaveBeenCalledWith({
        agentId: "agent-123",
      });
    });

    it("renders AgentForm with hook props when agent is loaded", () => {
      mockUseAgentDetailPage.mockReturnValue(defaultPageProps);

      renderWithRouter();

      expect(screen.getByTestId("agent-form")).toBeDefined();
      expect(screen.getByRole("heading", { name: "Jane Doe" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Save" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
    });
  });
});
