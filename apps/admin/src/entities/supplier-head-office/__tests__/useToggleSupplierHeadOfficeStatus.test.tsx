import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleSupplierHeadOfficeStatus } from "../api/useToggleSupplierHeadOfficeStatus";
import type { SupplierHeadOffice } from "../model/types";

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const mockHeadOffice: SupplierHeadOffice = {
  id: "sho-1",
  name: "Elewana Collection",
  email: "info@elewana.com",
  phoneNumber: "+1234567890",
  additionalEmail: null,
  website: null,
  country: "Tanzania",
  city: "Arusha",
  postalCode: null,
  streetAddress: null,
  isActive: false,
  suppliersCount: 5,
};

describe("useToggleSupplierHeadOfficeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Route based on isActive", () => {
    it("should call deactivate route when isActive is true", async () => {
      mockApi.patch.mockResolvedValueOnce({
        ...mockHeadOffice,
        isActive: false,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierHeadOfficeStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierHeadOfficeId: "sho-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledTimes(1);
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/head-offices/sho-1/deactivate"
      );
    });

    it("should call activate route when isActive is false", async () => {
      mockApi.patch.mockResolvedValueOnce({
        ...mockHeadOffice,
        isActive: true,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierHeadOfficeStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierHeadOfficeId: "sho-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledTimes(1);
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/head-offices/sho-1/activate"
      );
    });

    it("should use correct head office id in both routes", async () => {
      mockApi.patch
        .mockResolvedValueOnce({
          ...mockHeadOffice,
          id: "sho-99",
          isActive: false,
        })
        .mockResolvedValueOnce({
          ...mockHeadOffice,
          id: "sho-99",
          isActive: true,
        });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierHeadOfficeStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierHeadOfficeId: "sho-99",
          isActive: true,
        });
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        1,
        "/catalog/head-offices/sho-99/deactivate"
      );

      act(() => {
        result.current.mutate({
          supplierHeadOfficeId: "sho-99",
          isActive: false,
        });
      });
      await waitFor(() => expect(result.current.data?.isActive).toBe(true));
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        2,
        "/catalog/head-offices/sho-99/activate"
      );
    });
  });

  describe("Query cache update", () => {
    it("should update supplier-head-offices and supplier-head-office query cache on success", async () => {
      mockApi.patch.mockResolvedValueOnce(mockHeadOffice);

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");
      const initialList = [
        { ...mockHeadOffice, isActive: true },
        { ...mockHeadOffice, id: "sho-2", name: "Other", isActive: false },
      ];

      const { result } = renderHook(() => useToggleSupplierHeadOfficeStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierHeadOfficeId: "sho-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["supplier-head-offices"],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["supplier-head-office", "sho-1"],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledTimes(2);

      const listUpdater = setQueryDataSpy.mock.calls.find(
        (c) =>
          Array.isArray(c[0]) &&
          c[0][0] === "supplier-head-offices" &&
          c[0].length === 1
      )?.[1] as (
        prev: SupplierHeadOffice[] | undefined
      ) => SupplierHeadOffice[];
      const nextList = listUpdater(initialList);
      expect(nextList).toHaveLength(2);
      expect(nextList[0].isActive).toBe(false);
      expect(nextList[1]).toEqual(initialList[1]);

      const detailUpdater = setQueryDataSpy.mock.calls.find(
        (c) =>
          Array.isArray(c[0]) &&
          c[0][0] === "supplier-head-office" &&
          c[0][1] === "sho-1"
      )?.[1] as (prev: SupplierHeadOffice | undefined) => SupplierHeadOffice;
      const previousDetail = { ...mockHeadOffice, isActive: true };
      expect(detailUpdater(previousDetail).isActive).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle API errors", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Head office not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierHeadOfficeStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierHeadOfficeId: "sho-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("Head office not found");
    });
  });
});
