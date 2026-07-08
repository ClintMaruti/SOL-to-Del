import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@sol/ui";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const CI_TIMEOUT = 10000;

import { useAgencies } from "@/entities/agency/api/useAgencies";
import type { Agency } from "@/entities/agency/model/types";
import { createAgency } from "@/entities/agency/testing/factories";

import { AgencyList } from "../ui/AgencyList";

vi.mock("@/entities/agency/api/useAgencies");

const mockUseAgencies = vi.mocked(useAgencies);

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithRouter(ui: ReactNode, options?: { agencies?: Agency[] }) {
  const agencies = options?.agencies ?? mockAgencies;
  mockUseAgencies.mockReturnValue({
    data: agencies,
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
  } as unknown as ReturnType<typeof useAgencies>);

  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const mockAgencies: Agency[] = [
  createAgency("agency-1", "Kilimanjaro Experts", {
    agentsCount: 0,
    isActive: false,
    sourceMarketId: "FIT",
    agencyGroupId: "AAConsultants",
    agencyGroupName: "AAConsultants",
    assignedSafariPlannerName: "Erik Karlsson",
  }),
  createAgency("agency-2", "Serengeti Adventures", {
    agentsCount: 7,
    isActive: true,
    sourceMarketId: "FIT",
    agencyGroupId: "AngamaSpecial",
    agencyGroupName: "AngamaSpecial",
    assignedSafariPlannerName: "Amelia Earhart",
  }),
  createAgency("agency-3", "Africa Tours", {
    agentsCount: 2,
    isActive: true,
    sourceMarketId: "AFR",
    agencyGroupId: "Asia2Africa",
    agencyGroupName: "Asia2Africa",
    assignedSafariPlannerName: "Amelia Earhart",
  }),
];

describe("AgencyList", () => {
  beforeEach(() => {
    mockUseAgencies.mockReturnValue({
      data: mockAgencies,
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
    } as unknown as ReturnType<typeof useAgencies>);
  });

  describe("Rendering", () => {
    it("should render search input", () => {
      renderWithRouter(<AgencyList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agency by name, group or assigned Safari Planner"
      );
      expect(searchInput).toBeDefined();
    });

    it("should render table headers", () => {
      renderWithRouter(<AgencyList />);

      expect(screen.getByText("Agency Name")).toBeDefined();
      expect(screen.getByText("Number of Agents")).toBeDefined();
      expect(screen.getByText("Agency Group")).toBeDefined();
      expect(screen.getByText("SM")).toBeDefined();
      expect(screen.getByText("Assigned Safari Planner")).toBeDefined();
      expect(screen.getByText("Status")).toBeDefined();
      expect(screen.getByText("Actions")).toBeDefined();
    });

    it("should render all agencies", () => {
      renderWithRouter(<AgencyList />);

      expect(screen.getByText("Kilimanjaro Experts")).toBeDefined();
      expect(screen.getByText("Serengeti Adventures")).toBeDefined();
      expect(screen.getByText("Africa Tours")).toBeDefined();
    });

    it("should render agency details correctly", () => {
      renderWithRouter(<AgencyList />);

      // Check first agency details
      expect(screen.getByText("Kilimanjaro Experts")).toBeDefined();
      expect(screen.getByText("0 Agents")).toBeDefined();
      expect(screen.getByText("AAConsultants")).toBeDefined();
      expect(screen.getByText("Erik Karlsson")).toBeDefined();
    });

    it("should display singular 'Agent' for count of 1", () => {
      const agencies = [createAgency("1", "Test Agency", { agentsCount: 1 })];

      renderWithRouter(<AgencyList />, { agencies });

      expect(screen.getByText("1 Agent")).toBeDefined();
    });

    it("should display plural 'Agents' for count > 1", () => {
      const agencies = [createAgency("1", "Test Agency", { agentsCount: 5 })];

      renderWithRouter(<AgencyList />, { agencies });

      expect(screen.getByText("5 Agents")).toBeDefined();
    });

    it("should render empty state when no agencies", () => {
      renderWithRouter(<AgencyList />, { agencies: [] });

      // Empty state should be visible
      expect(screen.getByText("No agencies yet")).toBeDefined();

      // No agency rows should exist
      expect(screen.queryByText("Kilimanjaro Experts")).toBeNull();
    });
  });

  describe("Agency Name Link", () => {
    it("should render agency name as link to agency detail page", () => {
      renderWithRouter(<AgencyList />);

      const link = screen.getByRole("link", { name: "Kilimanjaro Experts" });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe(
        "/database/destinations/agencies/agency-1"
      );
    });

    it("should not throw when agency name link is clicked", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgencyList />);

      await user.click(screen.getByText("Kilimanjaro Experts"));
    });
  });

  describe("View Agents Click", () => {
    it("should render link to agents list search when agency has agents", () => {
      renderWithRouter(<AgencyList />);

      const link = screen.getByRole("link", { name: "7 Agents" });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe(
        "/database/destinations/agents?search=Serengeti%20Adventures"
      );
    });

    it("should not throw when agents count link is clicked", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgencyList />);

      const link = screen.getByRole("link", { name: "7 Agents" });
      await user.click(link);
      // Link navigates; in MemoryRouter no throw is sufficient
    });
  });

  describe("Agency Group Link", () => {
    it("should render agency group as link to agency groups search", () => {
      renderWithRouter(<AgencyList />);

      const link = screen.getByRole("link", { name: "AAConsultants" });
      expect(link).toBeDefined();
      expect(link.getAttribute("href")).toBe(
        "/database/destinations/agency-groups?search=AAConsultants"
      );
    });

    it("should render each assigned agency group as its own search link", () => {
      const agencies = [
        createAgency("agency-10", "Multi Group Agency", {
          agencyGroupIds: ["ag-1", "ag-2"],
          agencyGroups: [
            { id: "ag-1", name: "Elewana Lodges & Camps" },
            { id: "ag-2", name: "Trigfinance" },
          ],
        }),
      ];

      renderWithRouter(<AgencyList />, { agencies });

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
    it("should render switch checked for active agency", () => {
      const agencies = [createAgency("1", "Active Agency", { isActive: true })];

      renderWithRouter(<AgencyList />, { agencies });

      const toggle = screen.getByRole("switch", {
        name: /toggle active agency active status/i,
      });
      expect(toggle).toBeDefined();
      expect(toggle.getAttribute("data-state")).toBe("checked");
    });

    it("should render switch unchecked for inactive agency", () => {
      const agencies = [
        createAgency("1", "Inactive Agency", { isActive: false }),
      ];

      renderWithRouter(<AgencyList />, { agencies });

      const toggle = screen.getByRole("switch", {
        name: /toggle inactive agency active status/i,
      });
      expect(toggle).toBeDefined();
      expect(toggle.getAttribute("data-state")).toBe("unchecked");
    });

    it("should call onToggleStatus when toggle is clicked", async () => {
      const user = userEvent.setup();
      const onToggleStatus = vi.fn();
      const agencies = [createAgency("1", "Test Agency", { isActive: true })];

      renderWithRouter(<AgencyList onToggleStatus={onToggleStatus} />, {
        agencies,
      });

      const toggle = screen.getByRole("switch", {
        name: /toggle test agency active status/i,
      });
      await user.click(toggle);

      expect(onToggleStatus).toHaveBeenCalledTimes(1);
      expect(onToggleStatus).toHaveBeenCalledWith(agencies[0], false);
    });
  });

  describe("Actions Menu", () => {
    it("should render actions button for each agency", () => {
      renderWithRouter(<AgencyList />);

      const actionButtons = screen.getAllByRole("button", {
        name: /actions for/i,
      });
      expect(actionButtons).toHaveLength(mockAgencies.length);
    });

    // TODO: Disabled due to slow render times in CI - needs optimization
    // it(
    //   "should open dropdown menu when actions button is clicked",
    //   async () => {
    //     const user = userEvent.setup();

    //     renderWithRouter(<AgencyList />);

    //     const actionButton = screen.getByRole("button", {
    //       name: "Actions for Kilimanjaro Experts",
    //     });
    //     await user.click(actionButton);

    //     // Wait for dropdown to open (CI can be slower)
    //     expect(
    //       await screen.findByText("Delete", {}, { timeout: CI_TIMEOUT })
    //     ).toBeDefined();
    //   },
    //   CI_TIMEOUT
    // );

    it("should call onDelete when delete is clicked from dropdown", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      renderWithRouter(<AgencyList onDelete={onDelete} />);

      const actionButton = screen.getByRole("button", {
        name: "Actions for Kilimanjaro Experts",
      });
      await user.click(actionButton);

      const deleteButton = screen.getByText("Delete");
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(mockAgencies[0]);
    });
  });

  describe("Search Functionality", () => {
    it("should filter agencies when searching by name", async () => {
      renderWithRouter(<AgencyList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agency by name, group or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "kilimanjaro" } });

      await waitFor(
        () => {
          expect(
            screen.getByRole("link", { name: "Kilimanjaro Experts" })
          ).toBeDefined();
          expect(screen.queryByText("Serengeti Adventures")).toBeNull();
          expect(screen.queryByText("Africa Tours")).toBeNull();
        },
        { timeout: CI_TIMEOUT }
      );
    });

    it("should filter agencies when searching by agency group", async () => {
      renderWithRouter(<AgencyList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agency by name, group or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "AAConsultants" } });

      await waitFor(
        () => {
          expect(screen.getByText("Kilimanjaro Experts")).toBeDefined();
          expect(screen.queryByText("Serengeti Adventures")).toBeNull();
        },
        { timeout: CI_TIMEOUT }
      );
    });

    it("should filter agencies when searching by source market", async () => {
      renderWithRouter(<AgencyList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agency by name, group or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "AFR" } });

      await waitFor(
        () => {
          expect(
            screen.getByRole("link", { name: "Africa Tours" })
          ).toBeDefined();
          expect(screen.queryByText("Kilimanjaro Experts")).toBeNull();
        },
        { timeout: CI_TIMEOUT }
      );
    });

    it("should filter agencies when searching by safari planner", async () => {
      renderWithRouter(<AgencyList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agency by name, group or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "Erik" } });

      await waitFor(
        () => {
          expect(screen.getByText("Kilimanjaro Experts")).toBeDefined();
          expect(screen.queryByText("Serengeti Adventures")).toBeNull();
        },
        { timeout: CI_TIMEOUT }
      );
    });

    it("should show all agencies when search is cleared", async () => {
      renderWithRouter(<AgencyList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agency by name, group or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "kilimanjaro" } });

      await waitFor(
        () => expect(screen.queryByText("Serengeti Adventures")).toBeNull(),
        { timeout: CI_TIMEOUT }
      );

      fireEvent.change(searchInput, { target: { value: "" } });

      await waitFor(
        () => {
          expect(screen.getByText("Kilimanjaro Experts")).toBeDefined();
          expect(screen.getByText("Serengeti Adventures")).toBeDefined();
          expect(screen.getByText("Africa Tours")).toBeDefined();
        },
        { timeout: CI_TIMEOUT }
      );
    });

    it("should be case-insensitive", async () => {
      renderWithRouter(<AgencyList />);

      const searchInput = screen.getByPlaceholderText(
        "Search agency by name, group or assigned Safari Planner"
      );
      fireEvent.change(searchInput, { target: { value: "KILIMANJARO" } });

      await waitFor(
        () => {
          expect(
            screen.getByRole("link", { name: "Kilimanjaro Experts" })
          ).toBeDefined();
        },
        { timeout: CI_TIMEOUT }
      );
    });
  });

  describe("Sorting", () => {
    it("should sort by name when name header is clicked", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgencyList />);

      // Click on Agency Name header to sort
      const nameHeader = screen.getByText("Agency Name");
      await user.click(nameHeader);

      // Get all agency name links (agency names are now Link, not button)
      const agencyNameLinks = screen
        .getAllByRole("link")
        .filter((link) =>
          mockAgencies.some((a) => link.textContent?.trim() === a.name)
        );

      // First should be Africa Tours (alphabetically first)
      expect(agencyNameLinks[0].textContent).toBe("Africa Tours");
    });

    it("should toggle sort direction when clicking same header twice", async () => {
      const user = userEvent.setup();

      renderWithRouter(<AgencyList />);

      const nameHeader = screen.getByText("Agency Name");

      // First click - ascending
      await user.click(nameHeader);

      // Second click - descending
      await user.click(nameHeader);

      const agencyNameLinks = screen
        .getAllByRole("link")
        .filter((link) =>
          mockAgencies.some((a) => link.textContent?.trim() === a.name)
        );

      // First should be Serengeti Adventures (alphabetically last)
      expect(agencyNameLinks[0].textContent).toBe("Serengeti Adventures");
    });

    it("should sort by agents count when header is clicked", async () => {
      const user = userEvent.setup();

      const { container } = renderWithRouter(<AgencyList />);

      const agentsHeader = screen.getByText("Number of Agents");
      await user.click(agentsHeader);

      // Agent count column is the second column (index 1); cells are Link or span
      const firstRowAgentCell = container.querySelector(
        "tbody tr:first-child td:nth-child(2)"
      );
      expect(firstRowAgentCell?.textContent).toContain("0");
    });
  });

  describe("Row Styling", () => {
    it("should alternate row backgrounds", () => {
      const { container } = renderWithRouter(<AgencyList />);

      const rows = container.querySelectorAll("tbody tr");

      // First row (odd index 0) should have bg-white
      expect(rows[0].className).toContain("bg-white");

      // Second row (even index 1) should have bg-gray-50
      expect(rows[1].className).toContain("bg-gray-50");
    });
  });

  describe("Accessibility", () => {
    it("should have proper aria-labels for toggle switches", () => {
      renderWithRouter(<AgencyList />);

      mockAgencies.forEach((agency) => {
        const toggle = screen.getByRole("switch", {
          name: `Toggle ${agency.name} active status`,
        });
        expect(toggle).toBeDefined();
      });
    });

    it("should have proper aria-labels for action buttons", () => {
      renderWithRouter(<AgencyList />);

      mockAgencies.forEach((agency) => {
        const actionButton = screen.getByRole("button", {
          name: `Actions for ${agency.name}`,
        });
        expect(actionButton).toBeDefined();
      });
    });
  });

  describe("agencyGroupId prop", () => {
    it("should pass agencyGroupId to useAgencies hook", () => {
      renderWithRouter(<AgencyList agencyGroupId="AAConsultants" />);

      expect(mockUseAgencies).toHaveBeenCalledWith("AAConsultants");
    });

    it("should pass undefined to useAgencies when no agencyGroupId prop is given", () => {
      renderWithRouter(<AgencyList />);

      expect(mockUseAgencies).toHaveBeenCalledWith(undefined);
    });

    it("should pass null to useAgencies when agencyGroupId prop is null", () => {
      renderWithRouter(<AgencyList agencyGroupId={null} />);

      expect(mockUseAgencies).toHaveBeenCalledWith(null);
    });

    it("should render only agencies returned for the given group", () => {
      const filteredAgencies = [
        createAgency("agency-1", "Kilimanjaro Experts", {
          agencyGroupId: "AAConsultants",
          agencyGroupName: "AAConsultants",
          isActive: true,
        }),
        createAgency("agency-4", "Savanna Specialists", {
          agencyGroupId: "AAConsultants",
          agencyGroupName: "AAConsultants",
          isActive: true,
        }),
      ];

      renderWithRouter(<AgencyList agencyGroupId="AAConsultants" />, {
        agencies: filteredAgencies,
      });

      expect(screen.getByText("Kilimanjaro Experts")).toBeDefined();
      expect(screen.getByText("Savanna Specialists")).toBeDefined();
      expect(screen.queryByText("Serengeti Adventures")).toBeNull();
      expect(screen.queryByText("Africa Tours")).toBeNull();
    });

    it("should verify all rendered agencies belong to the given group", () => {
      const filteredAgencies = [
        createAgency("agency-1", "Kilimanjaro Experts", {
          agencyGroupId: "AAConsultants",
          agencyGroupName: "AAConsultants",
          isActive: true,
        }),
        createAgency("agency-4", "Savanna Specialists", {
          agencyGroupId: "AAConsultants",
          agencyGroupName: "AAConsultants",
          isActive: true,
        }),
      ];

      renderWithRouter(<AgencyList agencyGroupId="AAConsultants" />, {
        agencies: filteredAgencies,
      });

      const groupCells = screen.getAllByText("AAConsultants");
      expect(groupCells.length).toBeGreaterThanOrEqual(filteredAgencies.length);
    });

    it("should show empty state when no agencies belong to the group", () => {
      renderWithRouter(<AgencyList agencyGroupId="empty-group" />, {
        agencies: [],
      });

      expect(screen.getByText("No agencies yet")).toBeDefined();
      expect(screen.queryByText("Kilimanjaro Experts")).toBeNull();
    });
  });
});
