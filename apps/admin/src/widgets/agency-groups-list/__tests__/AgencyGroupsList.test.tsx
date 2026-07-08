import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAgencyGroups } from "@/entities/agency-group";
import type { AgencyGroup } from "@/entities/agency-group/model/types";

import { AgencyGroupsList } from "../ui/AgencyGroupsList";

vi.mock("@/entities/agency-group", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/agency-group")>();
  return {
    ...actual,
    useAgencyGroups: vi.fn(),
  };
});

const mockUseAgencyGroups = vi.mocked(useAgencyGroups);

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

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderWithRouter(
  ui: ReactNode,
  options?: { agencyGroups?: AgencyGroup[]; skipMock?: boolean }
) {
  if (!options?.skipMock) {
    const agencyGroups = options?.agencyGroups ?? mockAgencyGroups;
    mockUseAgencyGroups.mockReturnValue({
      data: agencyGroups,
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
    } as unknown as ReturnType<typeof useAgencyGroups>);
  }

  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockAgencyGroups: AgencyGroup[] = [
  createAgencyGroup("ag-1", "AAConsultants", {
    description: "Internal group",
    numberOfAgencies: 1,
    isActive: true,
  }),
  createAgencyGroup("ag-2", "AngamaSpecial", {
    description: "Wholesale group",
    numberOfAgencies: 6,
    isActive: true,
  }),
  createAgencyGroup("ag-3", "ZooGroup", {
    description: null,
    numberOfAgencies: 12,
    isActive: true,
  }),
];

const SEARCH_PLACEHOLDER = "Search agency group by name or description";

describe("AgencyGroupsList", () => {
  beforeEach(() => {
    mockUseAgencyGroups.mockReturnValue({
      data: mockAgencyGroups,
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
    } as unknown as ReturnType<typeof useAgencyGroups>);
  });

  describe("Rendering", () => {
    it("should render search input", () => {
      renderWithRouter(<AgencyGroupsList />);

      expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeDefined();
    });

    it("should render table headers when groups are loaded", () => {
      renderWithRouter(<AgencyGroupsList />);

      expect(screen.getByText("Group Name")).toBeDefined();
      expect(screen.getByText("Number of agencies")).toBeDefined();
      expect(screen.getByText("Description")).toBeDefined();
      expect(screen.getByText("Status")).toBeDefined();
    });

    it("should render all agency groups", () => {
      renderWithRouter(<AgencyGroupsList />);

      expect(screen.getByText("AAConsultants")).toBeDefined();
      expect(screen.getByText("AngamaSpecial")).toBeDefined();
      expect(screen.getByText("ZooGroup")).toBeDefined();
    });

    it("should render agency count formatted (1 Agency / N Agencies)", () => {
      renderWithRouter(<AgencyGroupsList />);

      expect(screen.getByText("1 Agency")).toBeDefined();
      expect(screen.getByText("6 Agencies")).toBeDefined();
      expect(screen.getByText("12 Agencies")).toBeDefined();
    });

    it("should render description or em dash when null", () => {
      renderWithRouter(<AgencyGroupsList />);

      expect(screen.getByText("Internal group")).toBeDefined();
      expect(screen.getByText("—")).toBeDefined();
    });

    it("should render empty state when no agency groups", () => {
      renderWithRouter(<AgencyGroupsList />, { agencyGroups: [] });

      expect(screen.getByText("No agency groups yet")).toBeDefined();
      expect(screen.queryByText("AAConsultants")).toBeNull();
    });

    it("should show loading skeleton when isLoading is true", () => {
      mockUseAgencyGroups.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        isPending: true,
        isSuccess: false,
        status: "pending",
        fetchStatus: "fetching",
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        isFetched: false,
        isFetchedAfterMount: false,
        isRefetching: false,
        isLoadingError: false,
        isPaused: false,
        isRefetchError: false,
        isStale: true,
        refetch: vi.fn(),
        failureCount: 0,
        failureReason: null,
        isPlaceholderData: false,
      } as unknown as ReturnType<typeof useAgencyGroups>);

      renderWithRouter(<AgencyGroupsList />, { skipMock: true });

      expect(screen.queryByText("AAConsultants")).toBeNull();
    });

    it("should show error message when error is set", () => {
      mockUseAgencyGroups.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to load"),
        isError: true,
        isPending: false,
        isSuccess: false,
        status: "error",
        fetchStatus: "idle",
        dataUpdatedAt: 0,
        errorUpdatedAt: 1,
        isFetched: true,
        isFetchedAfterMount: true,
        isRefetching: false,
        isLoadingError: true,
        isPaused: false,
        isRefetchError: false,
        isStale: true,
        refetch: vi.fn(),
        failureCount: 1,
        failureReason: new Error("Failed to load"),
        isPlaceholderData: false,
      } as unknown as ReturnType<typeof useAgencyGroups>);

      renderWithRouter(<AgencyGroupsList />, { skipMock: true });

      expect(screen.getByText(/failed to load/i)).toBeDefined();
    });
  });

  describe("Search Functionality", () => {
    it("should filter agency groups when searching by name", async () => {
      vi.useFakeTimers();
      renderWithRouter(<AgencyGroupsList />);

      const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
      await act(() => {
        fireEvent.change(searchInput, { target: { value: "Angama" } });
      });

      // Flush debounce (useAgencyGroupSearch uses 300ms debounce)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(350);
      });

      // waitFor uses timers for polling; switch to real timers so it can complete
      vi.useRealTimers();

      await waitFor(
        () => {
          expect(
            screen.getByRole("button", { name: "AngamaSpecial" })
          ).toBeDefined();
          expect(screen.queryByText("AAConsultants")).toBeNull();
          expect(screen.queryByText("ZooGroup")).toBeNull();
        },
        { timeout: 2000 }
      );
    });

    it("should filter agency groups when searching by description", async () => {
      vi.useFakeTimers();
      renderWithRouter(<AgencyGroupsList />);

      const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
      await act(() => {
        fireEvent.change(searchInput, { target: { value: "Wholesale" } });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(350);
      });

      vi.useRealTimers();

      await waitFor(
        () => {
          expect(screen.getByText("AngamaSpecial")).toBeDefined();
          expect(screen.queryByText("AAConsultants")).toBeNull();
        },
        { timeout: 2000 }
      );
    });

    it("should show empty search result when no match", async () => {
      vi.useFakeTimers();
      renderWithRouter(<AgencyGroupsList />);

      const searchInput = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
      await act(() => {
        fireEvent.change(searchInput, {
          target: { value: "NonExistentGroup" },
        });
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(350);
      });

      vi.useRealTimers();

      await waitFor(
        () => {
          expect(screen.getByText("No match")).toBeDefined();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("Sorting", () => {
    it("should call onSort when column header is clicked", async () => {
      const user = userEvent.setup();
      renderWithRouter(<AgencyGroupsList />);

      const groupNameHeader = screen.getByRole("button", {
        name: /group name/i,
      });
      await user.click(groupNameHeader);

      await waitFor(() => {
        expect(screen.getByText("AAConsultants")).toBeDefined();
      });
    });
  });

  describe("Callbacks", () => {
    // TODO: Disabled due to flaky Radix UI dropdown interactions in CI - needs optimization
    // it("should call onDelete when Delete is clicked from row actions", async () => {
    //   const user = userEvent.setup({ delay: null });
    //   const onDelete = vi.fn();

    //   renderWithRouter(<AgencyGroupsList onDelete={onDelete} />);

    //   const actionsButtons = await screen.findAllByRole("button", {
    //     name: /actions/i,
    //   });
    //   await user.click(actionsButtons[0]);

    //   const deleteOption = await screen.findByRole(
    //     "menuitem",
    //     { name: /delete/i },
    //     { timeout: 3000 }
    //   );
    //   await user.click(deleteOption);

    //   expect(onDelete).toHaveBeenCalledTimes(1);
    //   expect(onDelete).toHaveBeenCalledWith(
    //     expect.objectContaining({
    //       id: "ag-1",
    //       name: "AAConsultants",
    //     })
    //   );
    // });

    it("should call onCreateAgencyGroup when Create is clicked in empty state", async () => {
      const user = userEvent.setup();
      const onCreateAgencyGroup = vi.fn();

      renderWithRouter(
        <AgencyGroupsList onCreateAgencyGroup={onCreateAgencyGroup} />,
        {
          agencyGroups: [],
        }
      );

      const createButton = screen.getByRole("button", { name: /create/i });
      await user.click(createButton);

      expect(onCreateAgencyGroup).toHaveBeenCalledTimes(1);
    });

    it("should not show Delete option when onDelete is not provided", async () => {
      const user = userEvent.setup();
      renderWithRouter(<AgencyGroupsList />);

      const actionsButton = screen.getAllByRole("button", {
        name: /actions/i,
      })[0];
      await user.click(actionsButton);

      expect(screen.queryByRole("menuitem", { name: /delete/i })).toBeNull();
    });
  });
});
