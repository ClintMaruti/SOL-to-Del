import { i18n } from "@sol/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { agencyGroupDetailPath } from "@/shared/lib/paths";

import { useAgencyGroupDetailPage } from "../model/useAgencyGroupDetailPage";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));
vi.mock("@sol/ui", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

const mockHandleCancel = vi.fn();
const mockHandleUnsavedDiscard = vi.fn();
const mockHandleUnsavedStay = vi.fn();
vi.mock("@/shared/hooks", () => ({
  useActiveSection: vi.fn(() => ({
    activeSectionId: null,
    onSectionClick: vi.fn(),
  })),
  useDebouncedValue: vi.fn((v: unknown) => v),
  useUnsavedChangesBlocker: vi.fn(() => ({
    showUnsavedDialog: false,
    handleCancel: mockHandleCancel,
    handleUnsavedDiscard: mockHandleUnsavedDiscard,
    handleUnsavedStay: mockHandleUnsavedStay,
  })),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  return {
    ...actual,
    scrollToSection: vi.fn(),
  };
});

vi.mock("@/shared/lib/draftStorage", () => ({
  getDraft: vi.fn(() => null),
  setDraft: vi.fn(),
  clearDraft: vi.fn(),
  hasReturningFromCreateAgencyFlag: vi.fn(() => false),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockAgencyGroup = {
  id: "ag-1",
  name: "AAConsultants",
  description: "Internal group",
  agenciesCount: 1,
  isActive: true,
  version: 0,
};

const mockAgencies = [
  {
    id: "a-1",
    name: "Agency One",
    agencyGroupId: "ag-1",
    agencyGroupName: "AAConsultants",
    assignedSafariPlannerId: "",
    assignedSafariPlannerName: "",
    email: "one@test.com",
    number: "001",
    sourceMarketId: "uk",
    iataAgencyCode: null,
    country: "Kenya",
    city: "Nairobi",
    postalCode: null,
    address: null,
    website: null,
    kenXeroId: null,
    rwXeroId: null,
    tzXeroId: null,
    znzXeroId: null,
    paymentDepositPercent: 30,
    paymentBalanceDueDays: 60,
    paymentTaxCode: "VAT",
    hasCreditTerms: false,
    creditNotes: null,
    requiresWhiteLabeling: false,
    whiteLabelingNote: null,
    visibilityForAgentZone: false,
    agentZoneId: null,
    agencyAffiliations: null,
    additionalNotes: null,
    isActive: true,
    version: 1,
  },
  {
    id: "a-2",
    name: "Agency Two",
    agencyGroupId: "other",
    agencyGroupName: "OtherGroup",
    assignedSafariPlannerId: "",
    assignedSafariPlannerName: "",
    email: "two@test.com",
    number: "002",
    sourceMarketId: "uk",
    iataAgencyCode: null,
    country: null,
    city: null,
    postalCode: null,
    address: null,
    website: null,
    kenXeroId: null,
    rwXeroId: null,
    tzXeroId: null,
    znzXeroId: null,
    paymentDepositPercent: 30,
    paymentBalanceDueDays: 60,
    paymentTaxCode: "VAT",
    hasCreditTerms: false,
    creditNotes: null,
    requiresWhiteLabeling: false,
    whiteLabelingNote: null,
    visibilityForAgentZone: false,
    agentZoneId: null,
    agencyAffiliations: null,
    additionalNotes: null,
    isActive: true,
    version: 1,
  },
];

// ---------------------------------------------------------------------------
// Entity hook mocks
// ---------------------------------------------------------------------------

const mockUpdateAgencyGroup = vi.fn();
const mockToggleStatus = vi.fn();

vi.mock("@/entities/agency-group", () => ({
  useAgencyGroup: vi.fn(),
  useUpdateAgencyGroup: () => ({
    mutateAsync: mockUpdateAgencyGroup,
    isPending: false,
  }),
  useToggleAgencyGroupStatus: () => ({
    mutate: mockToggleStatus,
    isPending: false,
  }),
}));

vi.mock("@/entities/agency/api/useAgencies", () => ({
  useAgencies: vi.fn(),
}));

const mockUpdateAgencyAsync = vi.fn().mockResolvedValue(undefined);
vi.mock("@/entities/agency", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/agency")>();
  return {
    ...actual,
    useUpdateAgency: () => ({
      mutateAsync: mockUpdateAgencyAsync,
    }),
  };
});

const useAgencyGroup = await import("@/entities/agency-group").then(
  (m) => m.useAgencyGroup
);
const useAgencies = await import("@/entities/agency/api/useAgencies").then(
  (m) => m.useAgencies
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultQueryState = {
  data: mockAgencyGroup,
  isLoading: false,
  error: null,
  isError: false,
  isSuccess: true,
  refetch: vi.fn(),
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  isPending: false,
  isFetching: false,
  isStale: true,
  status: "success" as const,
  fetchStatus: "idle" as const,
  isFetched: true,
  isFetchedAfterMount: true,
  isRefetching: false,
  isLoadingError: false,
  isPaused: false,
  isPlaceholderData: false,
  isRefetchError: false,
};

function createWrapper(
  initialEntry: string = "/database/destinations/agency-groups/ag-1"
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            path="/database/destinations/agency-groups/:agencyGroupId"
            element={children}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAgencyGroupDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAgencyGroup).mockReturnValue({
      ...defaultQueryState,
      data: mockAgencyGroup,
    } as unknown as ReturnType<typeof useAgencyGroup>);
    vi.mocked(useAgencies).mockReturnValue({
      ...defaultQueryState,
      data: mockAgencies,
    } as unknown as ReturnType<typeof useAgencies>);
  });

  describe("initial state and data", () => {
    it("returns agencyGroupId from route params", () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper("/database/destinations/agency-groups/ag-99"),
      });
      expect(result.current.agencyGroupId).toBe("ag-99");
    });

    it("returns agency group data when loaded", () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.agencyGroup).toEqual(mockAgencyGroup);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("returns loading state when useAgencyGroup is loading", () => {
      vi.mocked(useAgencyGroup).mockReturnValue({
        ...defaultQueryState,
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useAgencyGroup>);

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.agencyGroup).toBeUndefined();
    });

    it("returns error when useAgencyGroup fails", () => {
      const err = new Error("Not found");
      vi.mocked(useAgencyGroup).mockReturnValue({
        ...defaultQueryState,
        data: undefined,
        isLoading: false,
        error: err,
      } as unknown as ReturnType<typeof useAgencyGroup>);

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.error).toBe(err);
      expect(result.current.agencyGroup).toBeUndefined();
    });

    it("returns form props: formId, title, submitButtonLabel, showActiveToggle", () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.formId).toBe("agency-group-detail-form");
      expect(result.current.title).toBe("AAConsultants");
      expect(result.current.submitButtonLabel).toBe("Save");
      expect(result.current.showActiveToggle).toBe(true);
    });

    it("returns isActive from agencyGroup.isActive", () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.isActive).toBe(true);
    });

    it("returns redirectPath based on agencyGroupId", () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.redirectPath).toBe(agencyGroupDetailPath("ag-1"));
    });

    it("returns draftKey scoped to the agencyGroupId", () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.draftKey).toBe("editAgencyGroupDraft_ag-1");
    });
  });

  describe("onStatusChange and status confirmation dialog", () => {
    it("opens status confirm dialog when onStatusChange is called (does not update isActive until confirm)", () => {
      vi.mocked(useAgencies).mockReturnValue({
        ...defaultQueryState,
        data: mockAgencies.map((a) => ({ ...a, isActive: false })),
      } as unknown as ReturnType<typeof useAgencies>);

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.statusConfirmDialog.open).toBe(false);

      act(() => {
        result.current.onStatusChange(false);
      });

      expect(result.current.statusConfirmDialog.open).toBe(true);
      expect(result.current.isActive).toBe(true);
    });

    it("statusConfirmDialog.onConfirm calls toggle mutation with correct params", () => {
      vi.mocked(useAgencies).mockReturnValue({
        ...defaultQueryState,
        data: mockAgencies.map((a) => ({ ...a, isActive: false })),
      } as unknown as ReturnType<typeof useAgencies>);

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onStatusChange(false);
      });

      expect(mockToggleStatus).not.toHaveBeenCalled();

      act(() => {
        result.current.statusConfirmDialog.onConfirm();
      });

      expect(mockToggleStatus).toHaveBeenCalledTimes(1);
      expect(mockToggleStatus).toHaveBeenCalledWith(
        { agencyGroupId: "ag-1", active: false },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it("statusConfirmDialog shows suspend copy when pendingStatusChange is false", () => {
      vi.mocked(useAgencies).mockReturnValue({
        ...defaultQueryState,
        data: mockAgencies.map((a) => ({ ...a, isActive: false })),
      } as unknown as ReturnType<typeof useAgencies>);

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onStatusChange(false);
      });

      expect(result.current.statusConfirmDialog.title).toBe(
        "Deactivate Agency Group"
      );
      expect(result.current.statusConfirmDialog.confirmLabel).toBe(
        "Deactivate Agency Group"
      );
    });

    it("statusConfirmDialog shows reactivate copy when pendingStatusChange is true", () => {
      vi.mocked(useAgencyGroup).mockReturnValue({
        ...defaultQueryState,
        data: { ...mockAgencyGroup, isActive: false },
      } as unknown as ReturnType<typeof useAgencyGroup>);

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onStatusChange(true);
      });

      expect(result.current.statusConfirmDialog.title).toBe(
        "Reactivate agency group?"
      );
      expect(result.current.statusConfirmDialog.confirmLabel).toBe(
        "Reactivate"
      );
    });
  });

  describe("cancel and unsaved changes", () => {
    it("exposes unsaved dialog state and handlers", () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.unsavedDialogOpen).toBe(false);
      expect(result.current.handleCancel).toBe(mockHandleCancel);
      expect(result.current.handleUnsavedDiscard).toBe(
        mockHandleUnsavedDiscard
      );
      expect(result.current.handleUnsavedStay).toBe(mockHandleUnsavedStay);
    });
  });

  describe("handleSubmit", () => {
    it("calls updateAgencyGroup with correct payload when form is valid", async () => {
      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      await waitFor(() => {
        expect(mockUpdateAgencyGroup).toHaveBeenCalledWith(
          expect.objectContaining({
            agencyGroupId: "ag-1",
            payload: expect.objectContaining({
              name: "AAConsultants",
              description: "Internal group",
              isActive: true,
              version: 0,
            }),
          })
        );
      });
    });

    it("shows success toast when update succeeds", async () => {
      mockUpdateAgencyGroup.mockResolvedValueOnce(mockAgencyGroup);

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith(
        i18n.t("modals.agencyGroupUpdatedSuccess", { ns: "admin" })
      );
    });

    it("shows error toast when update fails", async () => {
      mockUpdateAgencyGroup.mockImplementation(
        (_args: unknown, opts?: { onError?: (err: Error) => void }) => {
          opts?.onError?.(new Error("Server error"));
        }
      );

      const { result } = renderHook(() => useAgencyGroupDetailPage(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockToastError).toHaveBeenCalled();
    });
  });
});
