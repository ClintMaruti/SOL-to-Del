import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupplierHeadOffice } from "@/entities/supplier-head-office/testing/factories";
import { supplierDetailPath } from "@/shared/lib/paths";

import { useHeadOfficeDetailPage } from "../model/useHeadOfficeDetailPage";

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

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseActiveSection = vi.fn((_?: readonly string[]) => ({
  activeSectionId: null as string | null,
  onSectionClick: vi.fn(),
}));
const mockHandleCancel = vi.fn();
const mockHandleUnsavedDiscard = vi.fn();
const mockHandleUnsavedStay = vi.fn();
vi.mock("@/shared/hooks", () => ({
  useActiveSection: (sectionIds: readonly string[]) =>
    mockUseActiveSection(sectionIds),
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

const mockHeadOffice = createSupplierHeadOffice("sho-1", "Elewana Collection", {
  email: "info@elewana.com",
  phoneNumber: "+254712345678",
  country: "Kenya",
  city: "Nairobi",
  suppliersCount: 2,
});

const mockSuppliers = [
  {
    id: "sup-1",
    name: "Supplier One",
    headOfficeName: "Elewana Collection",
    code: "S1",
    locationName: null as string | null,
    email: "one@test.com",
    phone: "+1",
    isActive: true,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
  },
  {
    id: "sup-2",
    name: "Supplier Two",
    headOfficeName: "Other Head Office",
    code: "S2",
    locationName: null as string | null,
    email: "two@test.com",
    phone: "+2",
    isActive: true,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
  },
];

const mockHeadOffices = [
  mockHeadOffice,
  createSupplierHeadOffice("sho-2", "Other Head Office"),
];

const mockUpdateHeadOffice = vi.fn();
const mockToggleHeadOfficeStatus = vi.fn();
const mockToggleSupplierStatus = vi.fn();
const mockUpdateSupplier = vi.fn();
const mockDeleteSupplier = vi.fn();

vi.mock("@/entities/supplier-head-office", () => ({
  useSupplierHeadOffice: vi.fn(),
  useSupplierHeadOffices: vi.fn(),
  useToggleSupplierHeadOfficeStatus: () => ({
    mutate: mockToggleHeadOfficeStatus,
    isPending: false,
  }),
  useUpdateSupplierHeadOffice: () => ({
    mutate: mockUpdateHeadOffice,
    isPending: false,
  }),
}));

vi.mock("@/entities/suppliers", () => ({
  useSuppliers: vi.fn(),
  useToggleSupplierStatus: () => ({
    mutate: mockToggleSupplierStatus,
  }),
  useUpdateSupplier: () => ({
    mutate: mockUpdateSupplier,
    isPending: false,
  }),
  useDeleteSupplier: () => ({
    mutate: mockDeleteSupplier,
    isPending: false,
  }),
}));

const useSupplierHeadOffice =
  await import("@/entities/supplier-head-office").then(
    (m) => m.useSupplierHeadOffice
  );
const useSuppliers = await import("@/entities/suppliers").then(
  (m) => m.useSuppliers
);
const useSupplierHeadOffices =
  await import("@/entities/supplier-head-office").then(
    (m) => m.useSupplierHeadOffices
  );

function createWrapper(
  initialEntry: string = "/database/destinations/supplier-head-offices/sho-1"
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
            path="/database/destinations/supplier-head-offices/:headOfficeId"
            element={children}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const defaultQueryState = {
  data: mockHeadOffice,
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

describe("useHeadOfficeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseActiveSection.mockReturnValue({
      activeSectionId: null,
      onSectionClick: vi.fn(),
    });
    vi.mocked(useSupplierHeadOffice).mockReturnValue({
      ...defaultQueryState,
      data: mockHeadOffice,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useSupplierHeadOffice>);
    vi.mocked(useSuppliers).mockReturnValue({
      ...defaultQueryState,
      data: mockSuppliers,
    } as unknown as ReturnType<typeof useSuppliers>);
    vi.mocked(useSupplierHeadOffices).mockReturnValue({
      ...defaultQueryState,
      data: mockHeadOffices,
    } as unknown as ReturnType<typeof useSupplierHeadOffices>);
  });

  describe("initial state and data", () => {
    it("returns headOfficeId from route params", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(
          "/database/destinations/supplier-head-offices/sho-99"
        ),
      });
      expect(result.current.headOfficeId).toBe("sho-99");
    });

    it("returns head office data when loaded", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.headOffice).toEqual(mockHeadOffice);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("returns loading state when useSupplierHeadOffice is loading", () => {
      vi.mocked(useSupplierHeadOffice).mockReturnValue({
        ...defaultQueryState,
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useSupplierHeadOffice>);

      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.isLoading).toBe(true);
      expect(result.current.headOffice).toBeUndefined();
    });

    it("returns error when useSupplierHeadOffice fails", () => {
      const err = new Error("Not found");
      vi.mocked(useSupplierHeadOffice).mockReturnValue({
        ...defaultQueryState,
        data: undefined,
        isLoading: false,
        error: err,
      } as unknown as ReturnType<typeof useSupplierHeadOffice>);

      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.error).toBe(err);
      expect(result.current.headOffice).toBeUndefined();
    });

    it("returns form props: formId, title, submitButtonLabel, showActiveToggle", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.formId).toBe("head-office-detail-form");
      expect(result.current.title).toBe("Elewana Collection");
      expect(result.current.submitButtonLabel).toBe("Save");
      expect(result.current.showActiveToggle).toBe(true);
    });

    it("returns suppliers filtered by headOfficeName", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(
          "/database/destinations/supplier-head-offices/sho-1"
        ),
      });
      expect(result.current.suppliers).toHaveLength(1);
      expect(result.current.suppliers[0].id).toBe("sup-1");
      expect(result.current.suppliers[0].headOfficeName).toBe(
        "Elewana Collection"
      );
    });

    it("returns canDelete when other head offices exist", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.canDelete).toBe(true);
    });

    it("returns headOfficeStatusActive from headOffice.isActive", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.headOfficeStatusActive).toBe(true);
    });

    it("returns activeSectionId from observer when useActiveSection returns a value", () => {
      mockUseActiveSection.mockReturnValue({
        activeSectionId: "contacts-and-address",
        onSectionClick: vi.fn(),
      });
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.activeSectionId).toBe("contacts-and-address");
    });

    it("returns onSectionClick from useActiveSection", () => {
      const mockOnClick = vi.fn();
      mockUseActiveSection.mockReturnValue({
        activeSectionId: "general-information",
        onSectionClick: mockOnClick,
      });
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      expect(result.current.activeSectionId).toBe("general-information");
      expect(result.current.onSectionClick).toBe(mockOnClick);
    });

    it("returns empty suppliers array when allSuppliers is not an array", () => {
      vi.mocked(useSuppliers).mockReturnValue({
        ...defaultQueryState,
        data: undefined,
      } as unknown as ReturnType<typeof useSuppliers>);

      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(
          "/database/destinations/supplier-head-offices/sho-1"
        ),
      });

      expect(result.current.suppliers).toEqual([]);
    });

    it("returns empty suppliers array when allSuppliers is non-array", () => {
      vi.mocked(useSuppliers).mockReturnValue({
        ...defaultQueryState,
        data: { items: mockSuppliers } as unknown as typeof mockSuppliers,
      } as unknown as ReturnType<typeof useSuppliers>);

      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(
          "/database/destinations/supplier-head-offices/sho-1"
        ),
      });

      expect(result.current.suppliers).toEqual([]);
    });

    it("returns canDelete false when headOffices is not an array", () => {
      vi.mocked(useSupplierHeadOffices).mockReturnValue({
        ...defaultQueryState,
        data: undefined,
      } as unknown as ReturnType<typeof useSupplierHeadOffices>);

      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });

      expect(result.current.canDelete).toBe(false);
      expect(result.current.deleteTargetHeadOfficeName).toBeNull();
    });
  });

  describe("handleToggleHeadOfficeStatus", () => {
    it("opens the confirmation dialog without immediately calling toggleStatus", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(
          "/database/destinations/supplier-head-offices/sho-1"
        ),
      });

      act(() => {
        result.current.handleToggleHeadOfficeStatus();
      });

      expect(result.current.toggleConfirmDialog.open).toBe(true);
      expect(mockToggleHeadOfficeStatus).not.toHaveBeenCalled();
    });

    it("calls toggleStatus with headOfficeId and current isActive when confirmed", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(
          "/database/destinations/supplier-head-offices/sho-1"
        ),
      });

      act(() => {
        result.current.handleToggleHeadOfficeStatus();
      });

      act(() => {
        result.current.toggleConfirmDialog.onConfirm();
      });

      expect(mockToggleHeadOfficeStatus).toHaveBeenCalledWith(
        { supplierHeadOfficeId: "sho-1", isActive: true },
        expect.any(Object)
      );
    });
  });

  describe("onSupplierNameClick", () => {
    it("navigates to supplier detail path", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.onSupplierNameClick("sup-1");
      });

      expect(mockNavigate).toHaveBeenCalledWith(supplierDetailPath("sup-1"));
    });
  });

  describe("onToggleSupplierStatus", () => {
    it("calls toggleSupplierStatus with supplier id and activate flag", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      const supplier = result.current.suppliers[0];

      act(() => {
        result.current.onToggleSupplierStatus?.(supplier);
      });

      expect(mockToggleSupplierStatus).toHaveBeenCalledWith({
        supplierId: "sup-1",
        activate: false,
      });
    });
  });

  describe("onDeleteSupplier", () => {
    it("calls deleteSupplier with supplier id", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      const supplier = result.current.suppliers[0];

      act(() => {
        result.current.onDeleteSupplier?.(supplier, { onSuccess: vi.fn() });
      });

      expect(mockDeleteSupplier).toHaveBeenCalledWith(
        "sup-1",
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it("calls toast.error when no other head office exists", () => {
      vi.mocked(useSupplierHeadOffices).mockReturnValue({
        ...defaultQueryState,
        data: [mockHeadOffice],
      } as unknown as ReturnType<typeof useSupplierHeadOffices>);

      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(),
      });
      const supplier = result.current.suppliers[0];

      act(() => {
        result.current.onDeleteSupplier?.(supplier);
      });

      expect(mockUpdateSupplier).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith(
        "Add another Head Office before deleting."
      );
    });
  });

  describe("cancel and unsaved changes", () => {
    it("exposes unsaved dialog state and handlers", () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
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
    it("calls updateHeadOffice with headOfficeId and payload when form valid", async () => {
      const { result } = renderHook(() => useHeadOfficeDetailPage(), {
        wrapper: createWrapper(
          "/database/destinations/supplier-head-offices/sho-1"
        ),
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: vi.fn(),
        } as unknown as React.FormEvent);
      });

      await waitFor(() => {
        expect(mockUpdateHeadOffice).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              id: "sho-1",
              name: "Elewana Collection",
              email: "info@elewana.com",
              phoneNumber: "+254712345678",
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
  });
});
