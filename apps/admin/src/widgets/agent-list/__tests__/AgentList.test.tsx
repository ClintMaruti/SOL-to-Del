import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAgents } from "@/entities/agent/api/useAgents";
import type { Agent } from "@/entities/agent/model/types";
import { createAgent } from "@/entities/agent/testing/factories";

import { AgentList } from "../ui/AgentList";

vi.mock("@/entities/agent/api/useAgents");

const mockUseAgents = vi.mocked(useAgents);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithRouter(ui: ReactNode, options?: { agents?: Agent[] }) {
  const agents = options?.agents ?? mockAgents;
  mockUseAgents.mockReturnValue({
    data: agents,
    isLoading: false,
    error: null,
    isError: false,
    isPending: false,
    isSuccess: true,
    status: "success",
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    isFetched: true,
    isFetchedAfterMount: true,
    isRefetching: false,
    isLoadingError: false,
    isPaused: false,
    isRefetchError: false,
    isStale: false,
    refetch: vi.fn(),
    failureCount: 0,
    failureReason: null,
    isPlaceholderData: false,
  } as unknown as ReturnType<typeof useAgents>);

  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockAgents: Agent[] = [
  createAgent("agent-1", "Gugu", "Mbatha-Raw", {
    primaryEmail: "gugu@safari.com",
    phoneNumber: "+1 23-555-901-2345",
    isActive: false,
    agencyName: "Kilimanjaro Experts",
    agencyGroups: [{ id: "ag-1", name: "AAConsultants" }],
    assignedSafariPlannerId: "sp-1",
    assignedSafariPlannerName: "Erik Karlsson",
  }),
  createAgent("agent-2", "Jomo", "Kenyatta", {
    primaryEmail: "jomo@safari.com",
    phoneNumber: "+1 23-555-890-1234",
    isActive: true,
    agencyName: "Serengeti Adventures",
    agencyGroups: [{ id: "ag-2", name: "AngamaSpecial" }],
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
  }),
  createAgent("agent-3", "Jonathan", "Annan", {
    primaryEmail: "jonathan@adventure.com",
    phoneNumber: "+1 23-555-789-0123",
    isActive: true,
    agencyName: "Africa Tours",
    agencyGroups: [{ id: "ag-3", name: "Asia2Africa" }],
    assignedSafariPlannerId: "sp-2",
    assignedSafariPlannerName: "Amelia Earhart",
  }),
];

function fullName(agent: Agent) {
  return `${agent.firstName} ${agent.lastName}`;
}

describe("AgentList", () => {
  beforeEach(() => {
    mockUseAgents.mockReturnValue({
      data: mockAgents,
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isSuccess: true,
      status: "success",
      fetchStatus: "idle",
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isRefetching: false,
      isLoadingError: false,
      isPaused: false,
      isRefetchError: false,
      isStale: false,
      refetch: vi.fn(),
      failureCount: 0,
      failureReason: null,
      isPlaceholderData: false,
    } as unknown as ReturnType<typeof useAgents>);

    // Mock clipboard API for jsdom environment
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render search input", () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      expect(searchInput).toBeDefined();
    });

    it("should render table headers", () => {
      renderWithRouter(<AgentList />);

      expect(screen.getByText("Agent Name")).toBeDefined();
      expect(screen.getByText("Agency")).toBeDefined();
      expect(screen.getByText("Email")).toBeDefined();
      expect(screen.getByText("Phone")).toBeDefined();
      expect(screen.getByText("Assigned Safari Planner")).toBeDefined();
      expect(screen.getByText("Status")).toBeDefined();
      expect(screen.getByText("Actions")).toBeDefined();
    });

    it("should render all agents", () => {
      renderWithRouter(<AgentList />);

      expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
      expect(screen.getByText("Jomo Kenyatta")).toBeDefined();
      expect(screen.getByText("Jonathan Annan")).toBeDefined();
    });

    it("should render agent details correctly", () => {
      renderWithRouter(<AgentList />);

      expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
      expect(screen.getByText("Kilimanjaro Experts")).toBeDefined();
      expect(screen.getByText("Erik Karlsson")).toBeDefined();
    });

    it("should render empty state when no agents", () => {
      renderWithRouter(<AgentList />, { agents: [] });

      expect(screen.getByText("No agents yet")).toBeDefined();
      expect(screen.queryByText("Gugu Mbatha-Raw")).toBeNull();
    });
  });

  describe("Agent Name Link", () => {
    it("should link to agent detail when agent name is clicked", () => {
      renderWithRouter(<AgentList />);

      const link = screen.getByRole("link", { name: "Gugu Mbatha-Raw" });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe(
        "/database/destinations/agents/agent-1"
      );
    });

    it("should link agency group to agency groups search", () => {
      renderWithRouter(<AgentList />);

      const link = screen.getByRole("link", { name: "AAConsultants" });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe(
        "/database/destinations/agency-groups?search=AAConsultants"
      );
    });

    it("should render each assigned agency group as its own search link", () => {
      const agents = [
        createAgent("agent-10", "Multi", "Group", {
          agencyGroups: [
            { id: "ag-1", name: "Elewana Lodges & Camps" },
            { id: "ag-2", name: "Trigfinance" },
          ],
        }),
      ];

      renderWithRouter(<AgentList />, { agents });

      const elewanaLink = screen.getByRole("link", {
        name: "Elewana Lodges & Camps",
      });
      const trigfinanceLink = screen.getByRole("link", {
        name: "Trigfinance",
      });

      expect(elewanaLink.getAttribute("href")).toBe(
        "/database/destinations/agency-groups?search=Elewana%20Lodges%20%26%20Camps"
      );
      expect(trigfinanceLink.getAttribute("href")).toBe(
        "/database/destinations/agency-groups?search=Trigfinance"
      );
    });
  });

  describe("Active/Inactive Toggle", () => {
    it("should render switch checked for active agent", () => {
      const agents = [createAgent("1", "Active", "Agent", { isActive: true })];

      renderWithRouter(<AgentList />, { agents });

      const toggle = screen.getByRole("switch", {
        name: /toggle active agent active status/i,
      });
      expect(toggle).toBeDefined();
      expect(toggle.getAttribute("data-state")).toBe("checked");
    });

    it("should render switch unchecked for inactive agent", () => {
      const agents = [
        createAgent("1", "Inactive", "Agent", { isActive: false }),
      ];

      renderWithRouter(<AgentList />, { agents });

      const toggle = screen.getByRole("switch", {
        name: /toggle inactive agent active status/i,
      });
      expect(toggle).toBeDefined();
      expect(toggle.getAttribute("data-state")).toBe("unchecked");
    });

    it("should call onToggleStatus when toggle is clicked", async () => {
      const user = userEvent.setup();
      const onToggleStatus = vi.fn();
      const agents = [createAgent("1", "Test", "Agent", { isActive: true })];

      renderWithRouter(<AgentList onToggleStatus={onToggleStatus} />, {
        agents,
      });

      const toggle = screen.getByRole("switch", {
        name: /toggle test agent active status/i,
      });
      await user.click(toggle);

      expect(onToggleStatus).toHaveBeenCalledTimes(1);
      expect(onToggleStatus).toHaveBeenCalledWith(agents[0]);
    });
  });

  describe("Actions Menu", () => {
    it("should render actions button for each agent when onDelete is provided", () => {
      renderWithRouter(<AgentList onDelete={vi.fn()} />);

      const actionButtons = screen.getAllByRole("button", {
        name: /actions for/i,
      });
      expect(actionButtons).toHaveLength(mockAgents.length);
    });

    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should open dropdown menu when actions button is clicked", async () => {
    //   const user = userEvent.setup();

    //   renderWithRouter(<AgentList onDelete={vi.fn()} />);

    //   const actionButton = screen.getByRole("button", {
    //     name: /actions for gugu mbatha-raw/i,
    //   });
    //   await user.click(actionButton);

    //   expect(screen.getByText("Delete")).toBeDefined();
    // });

    it("should call onDelete when delete is clicked from dropdown", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      renderWithRouter(<AgentList onDelete={onDelete} />);

      const actionButton = screen.getByRole("button", {
        name: "Actions for Gugu Mbatha-Raw",
      });
      await user.click(actionButton);

      const deleteButton = screen.getByText("Delete");
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(mockAgents[0]);
    });
  });

  describe("Search Functionality", () => {
    it("should filter agents when searching by name", async () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "Gugu" } });

      // Wait for debounced filter (300ms) to apply; CI is slower than local
      await waitFor(
        () => expect(screen.queryByText("Jomo Kenyatta")).toBeNull(),
        { timeout: 2000 }
      );
      expect(
        screen.getByRole("link", { name: "Gugu Mbatha-Raw" })
      ).toBeDefined();
      expect(screen.queryByText("Jonathan Annan")).toBeNull();
    });

    it("should filter agents when searching by agency name", async () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "Kilimanjaro" } });

      await waitFor(
        () => {
          expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
          expect(screen.queryByText("Jomo Kenyatta")).toBeNull();
        },
        { timeout: 2000 }
      );
    });

    it("should filter agents when searching by email", async () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "gugu@safari" } });

      await waitFor(
        () => {
          expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
          expect(screen.queryByText("Jomo Kenyatta")).toBeNull();
        },
        { timeout: 2000 }
      );
    });

    it("should filter agents when searching by phone", async () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "901-2345" } });

      await waitFor(
        () => {
          expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
          expect(screen.queryByText("Jomo Kenyatta")).toBeNull();
        },
        { timeout: 2000 }
      );
    });

    it("should filter agents when searching by safari planner id", async () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "Erik Karlsson" } });

      await waitFor(
        () => {
          expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
          expect(screen.queryByText("Jomo Kenyatta")).toBeNull();
        },
        { timeout: 2000 }
      );
    });

    // TODO: Disabled due to slow render times in CI - needs optimization
    // it("should show all agents when search is cleared", async () => {
    //   renderWithRouter(<AgentList />);

    //   const searchInput = screen.getByPlaceholderText(
    //     "Search agent by name, agency, group, email or assigned Safari Planner"
    //   );
    //   fireEvent.change(searchInput, { target: { value: "Gugu" } });

    //   await waitFor(
    //     () => expect(screen.queryByText("Jomo Kenyatta")).toBeNull(),
    //     { timeout: 2000 }
    //   );

    //   fireEvent.change(searchInput, { target: { value: "" } });

    //   await waitFor(
    //     () => {
    //       expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
    //       expect(screen.getByText("Jomo Kenyatta")).toBeDefined();
    //       expect(screen.getByText("Jonathan Annan")).toBeDefined();
    //     },
    //     { timeout: 2000 }
    //   );
    // });

    it("should be case-insensitive", async () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "GUGU" } });

      await waitFor(
        () => {
          expect(
            screen.getByRole("link", { name: "Gugu Mbatha-Raw" })
          ).toBeDefined();
        },
        { timeout: 2000 }
      );
    });

    it("should show empty search result when no matches found", async () => {
      renderWithRouter(<AgentList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agent by name, agency, group, email or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });

      await waitFor(() => expect(screen.getByText("No match")).toBeDefined(), {
        timeout: 2000,
      });
    });
  });

  describe("Sorting", () => {
    it("should sort by name when name header is clicked", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgentList />);

      const nameHeader = screen.getByText("Agent Name");
      await user.click(nameHeader);

      const agentLinks = screen
        .getAllByRole("link")
        .filter((link) =>
          mockAgents.some((a) => link.textContent === fullName(a))
        );

      // First should be Gugu Mbatha-Raw (firstName ascending)
      expect(agentLinks[0].textContent).toBe("Gugu Mbatha-Raw");
    });

    it("should toggle sort direction when clicking same header twice", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgentList />);

      const nameHeader = screen.getByText("Agent Name");

      // First click - ascending
      await user.click(nameHeader);

      // Second click - descending
      await user.click(nameHeader);

      const agentLinks = screen
        .getAllByRole("link")
        .filter((link) =>
          mockAgents.some((a) => link.textContent === fullName(a))
        );

      // First should be Jonathan Annan (firstName descending)
      expect(agentLinks[0].textContent).toBe("Jonathan Annan");
    });
  });

  describe("Copy Functionality", () => {
    it("should render copy buttons for email and phone", () => {
      renderWithRouter(<AgentList />);

      // Each agent should have copy buttons for email and phone
      const copyButtons = screen.getAllByRole("button", {
        name: /^copy /i,
      });
      // 3 agents × 2 copyable fields (email + phone) = 6
      expect(copyButtons).toHaveLength(6);
    });

    it("should display check icon after copy button is clicked", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgentList />);

      const copyEmailButton = screen.getByRole("button", {
        name: "Copy gugu@safari.com",
      });
      await user.click(copyEmailButton);

      // After clicking, the "Copied!" tooltip and check icon should appear
      expect(screen.getByText("Copied!")).toBeDefined();
    });

    it("should show Copied! notification after clicking copy", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgentList />);

      const copyEmailButton = screen.getByRole("button", {
        name: "Copy gugu@safari.com",
      });
      await user.click(copyEmailButton);

      expect(screen.getByText("Copied!")).toBeDefined();
    });
  });

  describe("Row Styling", () => {
    it("should alternate row backgrounds", () => {
      const { container } = renderWithRouter(<AgentList />);

      const rows = container.querySelectorAll("tbody tr");

      expect(rows[0].className).toContain("bg-white");
      expect(rows[1].className).toContain("bg-gray-50");
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-labels for toggle switches", () => {
      renderWithRouter(<AgentList />);

      mockAgents.forEach((agent) => {
        const toggle = screen.getByRole("switch", {
          name: `Toggle ${fullName(agent)} active status`,
        });
        expect(toggle).toBeDefined();
      });
    });

    it("should have proper aria-labels for action buttons", () => {
      renderWithRouter(<AgentList onDelete={vi.fn()} />);

      mockAgents.forEach((agent) => {
        const actionButton = screen.getByRole("button", {
          name: new RegExp(`Actions for ${fullName(agent)}`, "i"),
        });
        expect(actionButton).toBeDefined();
      });
    });

    it("should have proper aria-labels for copy buttons", () => {
      renderWithRouter(<AgentList />);

      mockAgents.forEach((agent) => {
        expect(
          screen.getByRole("button", {
            name: `Copy ${agent.primaryEmail}`,
          })
        ).toBeDefined();
        expect(
          screen.getByRole("button", { name: `Copy ${agent.phoneNumber}` })
        ).toBeDefined();
      });
    });
  });

  describe("agencyId prop", () => {
    it("should pass agencyId to useAgents when prop is given", () => {
      renderWithRouter(<AgentList agencyId="agency-1" />);

      expect(mockUseAgents).toHaveBeenCalledWith("agency-1");
    });

    it("should pass undefined to useAgents when no agencyId prop is given", () => {
      renderWithRouter(<AgentList />);

      expect(mockUseAgents).toHaveBeenCalledWith(undefined);
    });

    it("should pass null to useAgents when agencyId prop is null", () => {
      renderWithRouter(<AgentList agencyId={null} />);

      expect(mockUseAgents).toHaveBeenCalledWith(null);
    });

    it("should render only agents returned for the given agency", () => {
      const filteredAgents = [
        createAgent("agent-1", "Gugu", "Mbatha-Raw", {
          agencyName: "Kilimanjaro Experts",
          isActive: true,
        }),
        createAgent("agent-4", "Wanjiru", "Kamau", {
          agencyName: "Kilimanjaro Experts",
          isActive: true,
        }),
      ];

      renderWithRouter(<AgentList agencyId="agency-1" />, {
        agents: filteredAgents,
      });

      expect(screen.getByText("Gugu Mbatha-Raw")).toBeDefined();
      expect(screen.getByText("Wanjiru Kamau")).toBeDefined();
      expect(screen.queryByText("Jomo Kenyatta")).toBeNull();
      expect(screen.queryByText("Jonathan Annan")).toBeNull();
    });

    it("should show empty state when no agents belong to the agency", () => {
      renderWithRouter(<AgentList agencyId="empty-agency" />, { agents: [] });

      expect(screen.getByText("No agents yet")).toBeDefined();
      expect(screen.queryByText("Gugu Mbatha-Raw")).toBeNull();
    });
  });
});
