import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLoadingStates } from "@/shared/stores/loadingStates";

import { useToggleSupplierServiceStatus } from "../api/useToggleSupplierServiceStatus";
import type { SupplierService } from "../types";

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

const mockService: SupplierService = {
  id: "svc-1",
  supplierId: "sup-1",
  name: "Game Drive",
  serviceTypeId: "047a5ae2-c3ed-4d6e-9f93-d42e1ff57f7a",
  type: "activity",
  isActive: true,
  tags: "safari",
  options: [],
  rates: [],
  nominalSaleCode: null,
  purchaseNominalCode: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("useToggleSupplierServiceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLoadingStates.setState({
      supplierServicesStatus: {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Route based on isActive", () => {
    it("should call deactivate route when isActive is true", async () => {
      mockApi.patch.mockResolvedValueOnce({
        ...mockService,
        isActive: false,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledTimes(1);
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/services/svc-1/deactivate"
      );
    });

    it("should call activate route when isActive is false", async () => {
      mockApi.patch.mockResolvedValueOnce({
        ...mockService,
        isActive: true,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledTimes(1);
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/services/svc-1/activate"
      );
    });

    it("should use correct service id in both routes", async () => {
      mockApi.patch
        .mockResolvedValueOnce({
          ...mockService,
          id: "svc-99",
          isActive: false,
        })
        .mockResolvedValueOnce({
          ...mockService,
          id: "svc-99",
          isActive: true,
        });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-99",
          supplierId: "sup-1",
          isActive: true,
        });
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        1,
        "/catalog/services/svc-99/deactivate"
      );

      act(() => {
        result.current.mutate({
          serviceId: "svc-99",
          supplierId: "sup-1",
          isActive: false,
        });
      });
      await waitFor(() => expect(result.current.data?.isActive).toBe(true));
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        2,
        "/catalog/services/svc-99/activate"
      );
    });
  });

  describe("Loading states", () => {
    it("should set loading state to true when mutation starts", async () => {
      let resolvePromise: (value: SupplierService) => void;
      mockApi.patch.mockReturnValueOnce(
        new Promise<SupplierService>((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: true,
        });
      });

      await waitFor(() => {
        expect(
          useLoadingStates.getState().supplierServicesStatus["svc-1"]
        ).toBe(true);
      });

      act(() => {
        resolvePromise!({ ...mockService, isActive: false });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should set loading state to false on success", async () => {
      mockApi.patch.mockResolvedValueOnce({
        ...mockService,
        isActive: false,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(useLoadingStates.getState().supplierServicesStatus["svc-1"]).toBe(
        false
      );
    });

    it("should set loading state to false on error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Service not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(useLoadingStates.getState().supplierServicesStatus["svc-1"]).toBe(
        false
      );
    });
  });

  describe("Query cache update", () => {
    it("should update supplier-service query cache on success", async () => {
      mockApi.patch.mockResolvedValueOnce({
        ...mockService,
        isActive: false,
      });

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["supplier-service", "svc-1"],
        expect.any(Function)
      );

      const updater = setQueryDataSpy.mock.calls.find(
        (c) =>
          Array.isArray(c[0]) &&
          c[0][0] === "supplier-service" &&
          c[0][1] === "svc-1"
      )?.[1] as (prev: SupplierService | undefined) => SupplierService;

      const previousDetail = { ...mockService, isActive: true };
      expect(updater(previousDetail).isActive).toBe(false);
    });

    it("should update supplier-services list query cache on success and flip isActive for toggled service", async () => {
      mockApi.patch.mockResolvedValueOnce({
        ...mockService,
        isActive: false,
      });

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["supplier-services", "sup-1"],
        expect.any(Function)
      );

      const listUpdater = setQueryDataSpy.mock.calls.find(
        (c) =>
          Array.isArray(c[0]) &&
          c[0][0] === "supplier-services" &&
          c[0][1] === "sup-1"
      )?.[1] as (prev: SupplierService[] | undefined) => SupplierService[];

      const previousList: SupplierService[] = [
        { ...mockService, id: "svc-1", isActive: true },
        { ...mockService, id: "svc-2", isActive: false },
      ];
      const updatedList = listUpdater(previousList);
      expect(updatedList).toHaveLength(2);
      expect(updatedList[0]?.isActive).toBe(false);
      expect(updatedList[1]?.isActive).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle API errors", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Service not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierServiceStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          serviceId: "svc-1",
          supplierId: "sup-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("Service not found");
    });
  });
});
