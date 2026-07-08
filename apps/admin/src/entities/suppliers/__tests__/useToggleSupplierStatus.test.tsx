import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@sol/ui";

import { useToggleSupplierStatus } from "../api/useToggleSupplierStatus";
import type { Supplier } from "../model/types";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

vi.mock("@sol/ui", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: (s: unknown) => unknown) => selector,
}));

const mockSetSuppliersStatus = vi.fn();
vi.mock("@/shared/stores/loadingStates", () => ({
  useLoadingStates: () => ({
    setSuppliersStatus: mockSetSuppliersStatus,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const createMockSupplier = (
  id: string,
  overrides: Partial<Supplier> = {}
): Supplier => ({
  id,
  name: "Test Supplier",
  headOfficeName: "ho-1",
  locationName: "location-1",
  code: "TST001",
  email: "test@supplier.com",
  phone: "+123",
  isActive: true,
  paymentTermId: "pt-1",
  isDeleted: false,
  deletedAt: null,
  ...overrides,
});

describe("useToggleSupplierStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Toggle", () => {
    it("should activate supplier when currently inactive", async () => {
      const updatedSupplier = createMockSupplier("sup-1", {
        isActive: true,
      });
      mockApi.patch.mockResolvedValueOnce(updatedSupplier);

      const { wrapper, queryClient } = createWrapper();
      vi.spyOn(queryClient, "setQueryData").mockImplementation(() => {});

      const { result } = renderHook(() => useToggleSupplierStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          activate: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/suppliers/sup-1/activate"
      );
      expect(mockApi.patch).toHaveBeenCalledTimes(1);
      expect(mockSetSuppliersStatus).toHaveBeenCalledWith("sup-1", true);
      expect(mockSetSuppliersStatus).toHaveBeenCalledWith("sup-1", false);
    });

    it("should deactivate supplier when currently active", async () => {
      const updatedSupplier = createMockSupplier("sup-1", {
        isActive: false,
      });
      mockApi.patch.mockResolvedValueOnce(updatedSupplier);

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useToggleSupplierStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          activate: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/suppliers/sup-1/deactivate"
      );
      expect(mockApi.patch).toHaveBeenCalledTimes(1);
    });

    it("should optimistically update cache on success", async () => {
      mockApi.patch.mockResolvedValueOnce(
        createMockSupplier("sup-1", { isActive: false })
      );

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleSupplierStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          activate: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["suppliers"],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["suppliers", "sup-1"],
        expect.any(Function)
      );
    });
  });

  describe("Error Handling", () => {
    it("should reset loading state and toast on error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Server error", 500, "")
      );

      const { wrapper } = createWrapper();

      const { result } = renderHook(() => useToggleSupplierStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          activate: true,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(mockSetSuppliersStatus).toHaveBeenCalledWith("sup-1", false);
      expect(toast.error).toHaveBeenCalledWith("Server error");
    });
  });
});
