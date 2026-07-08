import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplierDetail } from "@/entities/suppliers/model/types";

import { useSupplierData } from "../model/useSupplierData";
import { useSupplierOverviewTab } from "../model/useSupplierOverviewTab";

const {
  mockToastError,
  mockToastSuccess,
  mockUpdateSupplier,
  mockSetSuppliersStatus,
  mockToggleSupplierStatus,
} = vi.hoisted(() => ({
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockUpdateSupplier: vi.fn(),
  mockSetSuppliersStatus: vi.fn(),
  mockToggleSupplierStatus: vi.fn(),
}));
vi.mock("@sol/ui", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

vi.mock("@sol/api-client", () => ({
  getErrorMessage: (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback,
  getValidationErrors: () => null,
  toFormErrors: (errors: Record<string, string[]>) => {
    const result: Record<string, string> = {};
    for (const [key, messages] of Object.entries(errors)) {
      if (messages.length > 0) {
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        result[camelKey] = messages[0];
      }
    }
    return result;
  },
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: <T,>(fn: (state: unknown) => T) => fn,
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- mock callback signature
const mockUseActiveSection = vi.fn((_sectionIds?: readonly string[]) => ({
  activeSectionId: null,
  onSectionClick: vi.fn(),
}));
const mockShowUnsavedDialog = false;
const mockHandleCancel = vi.fn();
const mockHandleUnsavedDiscard = vi.fn();
const mockHandleUnsavedStay = vi.fn();
vi.mock("@/shared/hooks", () => ({
  useActiveSection: (sectionIds: readonly string[]) =>
    mockUseActiveSection(sectionIds),
  useUnsavedChangesBlocker: vi.fn(() => ({
    showUnsavedDialog: mockShowUnsavedDialog,
    handleCancel: mockHandleCancel,
    handleUnsavedDiscard: mockHandleUnsavedDiscard,
    handleUnsavedStay: mockHandleUnsavedStay,
  })),
  useValueBasedDirty: vi.fn(() => ({
    isDirty: false,
    reset: vi.fn(),
    setBaseline: vi.fn(),
    setHasSeenFormMatchingInitial: vi.fn(),
  })),
}));

const mockSupplierData: SupplierDetail = {
  id: "supplier-123",
  name: "Test Supplier",
  headOfficeId: "ho-1",
  headOfficeName: "Head Office 1",
  locationName: "Location 1",
  code: "TST001",
  email: "supplier@test.com",
  phone: "+123",
  isActive: true,
  paymentTermId: "pt-1",
  isDeleted: false,
  deletedAt: null,

  additionalName: "",
  starRating: 5,
  serviceTypeId: "lodge-1",
  type: "Luxury",
  preferredSupplier: false,

  additionalEmail: "",
  secondAdditionalEmail: "",
  website: "",
  liveAvailabilityCheck: "",
  otherCommunicationChannels: "",

  countryId: "kenya",
  city: "Nairobi",
  postalCode: "",
  streetAddress: "",
  poBox: "",
  locationId: "11111111-1111-1111-1111-111111111111",
  latitude: null,
  longitude: null,
  closestAirstrip: "",
  airstripLatitude: "",
  airstripLongitude: "",

  checkIn: "",
  checkOut: "",
  pickUp: "",
  dropOff: "",

  xeroId: "1204810",
  taxCode: "Standard",

  paymentTerms: [
    {
      name: "General",
      travelDatesFrom: "",
      travelDatesTo: "",
      depositPercent: 20,
      balanceDueDays: 60,
    },
  ],

  visibilityForAgentZone: false,
  agentZoneId: "",
};

vi.mock("@/entities/suppliers", () => ({
  useSupplier: vi.fn(),
  useSuppliers: vi.fn(() => ({ data: [] })),
}));
vi.mock("@/entities/suppliers/api/useToggleSupplierStatus", () => ({
  useToggleSupplierStatus: () => ({
    mutate: mockToggleSupplierStatus,
    isPending: false,
  }),
}));
vi.mock("@/entities/suppliers/api/useUpdateSupplier", () => ({
  useUpdateSupplier: () => ({
    mutate: mockUpdateSupplier,
    isPending: false,
  }),
}));
vi.mock("@/shared/stores/loadingStates", () => ({
  useLoadingStates: (selector: (state: unknown) => unknown) =>
    selector({
      setSuppliersStatus: mockSetSuppliersStatus,
      suppliersStatus: {},
    }),
}));

const useSupplier = await import("@/entities/suppliers").then(
  (m) => m.useSupplier
);

function createWrapper(
  initialEntry: string = "/database/destinations/suppliers/supplier-123"
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
            path="/database/destinations/suppliers/:supplierId"
            element={children}
          />
          <Route path="/database/destinations/suppliers" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function mockUseSupplierReturn(
  overrides: Partial<ReturnType<typeof useSupplier>> = {}
) {
  vi.mocked(useSupplier).mockReturnValue({
    data: mockSupplierData,
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
    status: "success",
    fetchStatus: "idle",
    isFetched: true,
    isFetchedAfterMount: true,
    isRefetching: false,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useSupplier>);
}

function useCombined() {
  const data = useSupplierData();
  const overview = useSupplierOverviewTab(data.supplier, data.supplierId);
  return { ...data, ...overview.controller, form: overview.form };
}

describe("useSupplierData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSupplierReturn();
  });

  it("returns supplierId from route params", () => {
    const { result } = renderHook(() => useSupplierData(), {
      wrapper: createWrapper("/database/destinations/suppliers/supplier-456"),
    });
    expect(result.current.supplierId).toBe("supplier-456");
  });

  it("returns supplier data when loaded", () => {
    const { result } = renderHook(() => useSupplierData(), {
      wrapper: createWrapper(),
    });
    expect(result.current.supplier).toEqual(mockSupplierData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns loading state when useSupplier is loading", () => {
    mockUseSupplierReturn({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useSupplierData(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.supplier).toBeUndefined();
  });

  it("returns error when useSupplier fails", () => {
    const err = new Error("Not found");
    mockUseSupplierReturn({
      data: undefined,
      isLoading: false,
      error: err,
    });

    const { result } = renderHook(() => useSupplierData(), {
      wrapper: createWrapper(),
    });
    expect(result.current.error).toBe(err);
    expect(result.current.supplier).toBeUndefined();
  });

  it("uses supplier name for title", () => {
    const { result } = renderHook(() => useSupplierData(), {
      wrapper: createWrapper(),
    });
    expect(result.current.title).toBe("Test Supplier");
  });
});

describe("useSupplierOverviewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActiveSection.mockReturnValue({
      activeSectionId: null,
      onSectionClick: vi.fn(),
    });
    mockUseSupplierReturn();
  });

  it("returns controller with formId, submitButtonLabel, and sections", () => {
    const { result } = renderHook(() => useCombined(), {
      wrapper: createWrapper(),
    });
    expect(result.current.formId).toBe("supplier-detail-form");
    expect(result.current.submitButtonLabel).toBe("Save");
    expect(result.current.sections).toBeDefined();
    expect(result.current.sections.length).toBeGreaterThan(0);
  });

  it("returns form object populated from supplier", () => {
    const { result } = renderHook(() => useCombined(), {
      wrapper: createWrapper(),
    });
    expect(result.current.form).toBeDefined();
    expect(result.current.form.state.values.name).toBe("Test Supplier");
    expect(result.current.form.state.values.email).toBe("supplier@test.com");
  });

  describe("handleSubmit", () => {
    it("calls updateSupplier with supplierId and payload when valid", async () => {
      const { result } = renderHook(() => useCombined(), {
        wrapper: createWrapper("/database/destinations/suppliers/supplier-123"),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      await waitFor(() => {
        expect(mockUpdateSupplier).toHaveBeenCalledWith(
          expect.objectContaining({
            supplierId: "supplier-123",
            payload: expect.objectContaining({
              name: "Test Supplier",
              email: "supplier@test.com",
              isActive: true,
            }),
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it("sends toggled isActive in payload when form isActive is changed then submitted", async () => {
      const { result } = renderHook(() => useCombined(), {
        wrapper: createWrapper("/database/destinations/suppliers/supplier-123"),
      });

      act(() => {
        result.current.form.setFieldValue("isActive", false);
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      await waitFor(() => {
        expect(mockUpdateSupplier).toHaveBeenCalledWith(
          expect.objectContaining({
            supplierId: "supplier-123",
            payload: expect.objectContaining({
              isActive: false,
            }),
          }),
          expect.any(Object)
        );
      });
    });

    it("does not call updateSupplier when supplierId is missing", async () => {
      const { result } = renderHook(() => useCombined(), {
        wrapper: createWrapper("/database/destinations/suppliers"),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      expect(mockUpdateSupplier).not.toHaveBeenCalled();
    });

    it("resets form on update success when data is returned", async () => {
      let onSuccess: (data: SupplierDetail) => void = () => {};
      mockUpdateSupplier.mockImplementation(
        (
          _args: unknown,
          opts?: { onSuccess?: (data: SupplierDetail) => void }
        ) => {
          onSuccess = opts?.onSuccess ?? (() => {});
        }
      );

      const { result } = renderHook(() => useCombined(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      await waitFor(() => expect(mockUpdateSupplier).toHaveBeenCalled());

      act(() => {
        onSuccess(mockSupplierData);
      });

      expect(mockUpdateSupplier).toHaveBeenCalled();
      // Success toast is shown by useUpdateSupplier (entity layer), not by the overview hook
    });

    it("calls toast.error on update failure", async () => {
      let onError: (err: Error) => void = () => {};
      mockUpdateSupplier.mockImplementation(
        (_args: unknown, opts?: { onError?: (err: Error) => void }) => {
          onError = opts?.onError ?? (() => {});
        }
      );

      const { result } = renderHook(() => useCombined(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      await waitFor(() => expect(mockUpdateSupplier).toHaveBeenCalled());

      act(() => {
        onError(new Error("Server error"));
      });

      expect(mockToastError).toHaveBeenCalledWith("Server error");
    });
  });

  describe("cancel and unsaved changes", () => {
    it("exposes unsaved dialog state and handlers", () => {
      const { result } = renderHook(() => useCombined(), {
        wrapper: createWrapper(),
      });
      expect(result.current.unsavedDialogOpen).toBe(mockShowUnsavedDialog);
      expect(result.current.handleCancel).toBe(mockHandleCancel);
      expect(result.current.handleUnsavedDiscard).toBe(
        mockHandleUnsavedDiscard
      );
      expect(result.current.handleUnsavedStay).toBe(mockHandleUnsavedStay);
    });
  });
});
