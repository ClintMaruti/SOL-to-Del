import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SupplierService } from "@/entities/supplier-services";

import { useDeleteSupplierServiceForm } from "../model/useDeleteSupplierServiceForm";

const mockMutate = vi.fn();

vi.mock("@/entities/supplier-services", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/supplier-services")>();
  return {
    ...actual,
    useDeleteSupplierService: () => ({
      mutate: mockMutate,
      isPending: false,
    }),
  };
});

const mockService: SupplierService = {
  id: "service-1",
  supplierId: "sup-1",
  name: "Test Service",
  serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
  type: "accommodation",
  isActive: true,
  tags: "",
  options: [],
  rates: [],
  nominalSaleCode: null,
  purchaseNominalCode: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("useDeleteSupplierServiceForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should return initial state with no error and not pending", () => {
      const { result } = renderHook(() =>
        useDeleteSupplierServiceForm({ supplierService: mockService })
      );

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.handleDelete).toBe("function");
      expect(typeof result.current.resetError).toBe("function");
    });
  });

  describe("handleDelete", () => {
    it("should call mutate with serviceId and supplierId", () => {
      const { result } = renderHook(() =>
        useDeleteSupplierServiceForm({ supplierService: mockService })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        { serviceId: "service-1", supplierId: "sup-1" },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it("should not call mutate when supplierService is null", () => {
      const { result } = renderHook(() =>
        useDeleteSupplierServiceForm({ supplierService: null })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should call onSuccess callback when mutation succeeds", async () => {
      let capturedOnSuccess: (() => void) | undefined;
      mockMutate.mockImplementation(
        (
          _params: { serviceId: string; supplierId: string },
          opts: { onSuccess?: () => void }
        ) => {
          capturedOnSuccess = opts.onSuccess;
        }
      );

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useDeleteSupplierServiceForm({
          supplierService: mockService,
          onSuccess,
        })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(capturedOnSuccess).toBeDefined();
      act(() => capturedOnSuccess?.());

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("should set error when mutation calls onError", async () => {
      const apiError = new Error("Failed to delete");
      let capturedOnError: ((err: Error) => void) | undefined;
      mockMutate.mockImplementation(
        (
          _params: { serviceId: string; supplierId: string },
          opts: { onError?: (err: Error) => void }
        ) => {
          capturedOnError = opts.onError;
        }
      );

      const { result } = renderHook(() =>
        useDeleteSupplierServiceForm({ supplierService: mockService })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(capturedOnError).toBeDefined();
      act(() => capturedOnError?.(apiError));

      await waitFor(() => {
        expect(result.current.error).toBe(apiError);
      });
    });
  });

  describe("resetError", () => {
    it("should clear error when resetError is called", async () => {
      const apiError = new Error("Failed to delete");
      let capturedOnError: ((err: Error) => void) | undefined;
      mockMutate.mockImplementation(
        (
          _params: { serviceId: string; supplierId: string },
          opts: { onError?: (err: Error) => void }
        ) => {
          capturedOnError = opts.onError;
        }
      );

      const { result } = renderHook(() =>
        useDeleteSupplierServiceForm({ supplierService: mockService })
      );

      act(() => result.current.handleDelete());
      act(() => capturedOnError?.(apiError));

      await waitFor(() => expect(result.current.error).toBe(apiError));

      act(() => result.current.resetError());

      expect(result.current.error).toBeNull();
    });
  });
});
