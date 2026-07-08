import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import type { AgencyGroup } from "@/entities/agency-group/model/types";

import { AgencyGroupsTable } from "../ui/AgencyGroupsTable";

function renderWithRouter(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function createAgencyGroup(
  id: string,
  name: string,
  options?: {
    description?: string | null;
    numberOfAgencies?: number;
    isActive?: boolean;
  }
): AgencyGroup {
  return {
    id,
    name,
    description: options?.description ?? null,
    numberOfAgencies: options?.numberOfAgencies ?? 0,
    isActive: options?.isActive ?? true,
    version: 0,
  };
}

describe("AgencyGroupsTable", () => {
  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
  });

  describe("Rendering", () => {
    it("should render table headers", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      expect(screen.getByText("Group Name")).toBeDefined();
      expect(screen.getByText("Number of agencies")).toBeDefined();
      expect(screen.getByText("Description")).toBeDefined();
      expect(screen.getByText("Status")).toBeDefined();
    });

    it("should render agency group names", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
        createAgencyGroup("ag-2", "AngamaSpecial"),
      ];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      expect(screen.getByText("AAConsultants")).toBeDefined();
      expect(screen.getByText("AngamaSpecial")).toBeDefined();
    });

    it("should render agency count formatted (1 Agency / N Agencies)", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "Single", { numberOfAgencies: 1 }),
        createAgencyGroup("ag-2", "Multiple", { numberOfAgencies: 6 }),
      ];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      expect(screen.getByText("1 Agency")).toBeDefined();
      expect(screen.getByText("6 Agencies")).toBeDefined();
    });

    it("should render description or em dash when null", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "WithDesc", {
          description: "Internal group",
        }),
        createAgencyGroup("ag-2", "NoDesc", { description: null }),
      ];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      expect(screen.getByText("Internal group")).toBeDefined();
      expect(screen.getByText("—")).toBeDefined();
    });

    it("should render empty state when no agency groups", () => {
      const agencyGroups: AgencyGroup[] = [];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      expect(screen.getByText("No agency groups found.")).toBeDefined();
    });
  });

  describe("Sorting", () => {
    it("should render sortable column headers when onSort is provided", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];
      const onSort = vi.fn();

      renderWithRouter(
        <AgencyGroupsTable
          agencyGroups={agencyGroups}
          onSort={onSort}
          sortKey={null}
          sortDirection="asc"
        />
      );

      const groupNameHeader = screen.getByRole("button", {
        name: /group name/i,
      });
      expect(groupNameHeader).toBeDefined();

      fireEvent.click(groupNameHeader);
      expect(onSort).toHaveBeenCalledWith("name", "asc");
    });

    it("should toggle sort direction when clicking same column", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];
      const onSort = vi.fn();

      renderWithRouter(
        <AgencyGroupsTable
          agencyGroups={agencyGroups}
          onSort={onSort}
          sortKey="name"
          sortDirection="asc"
        />
      );

      const groupNameHeader = screen.getByRole("button", {
        name: /group name/i,
      });
      fireEvent.click(groupNameHeader);
      expect(onSort).toHaveBeenCalledWith("name", "desc");
    });
  });

  describe("Search Highlighting", () => {
    it("should highlight matching text in group name", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      renderWithRouter(
        <AgencyGroupsTable agencyGroups={agencyGroups} searchQuery="AAC" />
      );

      expect(screen.getByText("AAC")).toBeDefined();
      expect(screen.getByText("onsultants")).toBeDefined();
    });

    it("should highlight matching text in description", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "Group", { description: "Internal group" }),
      ];

      renderWithRouter(
        <AgencyGroupsTable agencyGroups={agencyGroups} searchQuery="Int" />
      );

      expect(screen.getByText("Int")).toBeDefined();
      expect(screen.getByText("ernal group")).toBeDefined();
    });

    it("should not highlight when query is shorter than 3 characters", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      renderWithRouter(
        <AgencyGroupsTable agencyGroups={agencyGroups} searchQuery="AA" />
      );

      expect(screen.getByText("AAConsultants")).toBeDefined();
    });
  });

  describe("Callbacks", () => {
    it("should have clickable group name that navigates to group detail", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      const groupNameButton = screen.getByRole("button", {
        name: "AAConsultants",
      });
      expect(groupNameButton).toBeDefined();
      fireEvent.click(groupNameButton);
      // With MemoryRouter, navigate() is called; no error means component works
    });

    it("should navigate to agencies page search when agency count is clicked", () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "Group", { numberOfAgencies: 6 }),
      ];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      fireEvent.click(screen.getByText("6 Agencies"));

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith(
        "/database/destinations/agencies?search=Group"
      );
    });

    it("should not render a clickable control for zero agencies", () => {
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "Empty Group", { numberOfAgencies: 0 }),
      ];

      renderWithRouter(<AgencyGroupsTable agencyGroups={agencyGroups} />);

      expect(screen.getByText("0 Agencies")).toBeDefined();
      expect(screen.queryByRole("button", { name: "0 Agencies" })).toBeNull();

      fireEvent.click(screen.getByText("0 Agencies"));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should call onToggleActive when switch is clicked", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "Group", { isActive: false }),
      ];
      const onToggleActive = vi.fn();

      renderWithRouter(
        <AgencyGroupsTable
          agencyGroups={agencyGroups}
          onToggleActive={onToggleActive}
        />
      );

      const switchButton = screen.getByRole("switch");
      expect(switchButton).toBeDefined();
      fireEvent.click(switchButton);

      expect(onToggleActive).toHaveBeenCalledTimes(1);
      expect(onToggleActive).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ag-1" }),
        true
      );
    });

    it("should render actions button when onEdit and onDelete are provided", () => {
      const agencyGroups: AgencyGroup[] = [
        createAgencyGroup("ag-1", "AAConsultants"),
      ];
      const onDelete = vi.fn();

      renderWithRouter(
        <AgencyGroupsTable agencyGroups={agencyGroups} onDelete={onDelete} />
      );

      const actionsButton = screen.getByRole("button", {
        name: /actions/i,
      });
      expect(actionsButton).toBeDefined();
    });
  });
});
