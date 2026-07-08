import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteSupplierHeadOfficeForm } from "../model/useDeleteSupplierHeadOfficeForm";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";
import { createSupplierHeadOffice } from "@/entities/supplier-head-office/testing/factories";

const mockMutate = vi.fn();

vi.mock(
  "@/entities/supplier-head-office/api/useDeleteSupplierHeadOffice",
  () => ({
    useDeleteSupplierHeadOffice: () => ({
      mutate: mockMutate,
      isPending: false,
    }),
  })
);

describe("useDeleteSupplierHeadOfficeForm", () => {
  let testHeadOffice: SupplierHeadOffice;

  beforeEach(() => {
    vi.clearAllMocks();
    testHeadOffice = createSupplierHeadOffice("sho-1", "Test Head Office");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should return initial state with no error and not pending", () => {
      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: testHeadOffice })
      );

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.handleDelete).toBe("function");
      expect(typeof result.current.resetError).toBe("function");
    });
  });

  describe("handleDelete", () => {
    it("should call mutate with supplier head office id and callbacks", () => {
      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: testHeadOffice })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        "sho-1",
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it("should call onSuccess callback when mutation succeeds", async () => {
      let capturedOnSuccess: (() => void) | undefined;
      mockMutate.mockImplementation(
        (_id: string, opts: { onSuccess?: () => void }) => {
          capturedOnSuccess = opts.onSuccess;
        }
      );

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({
          supplierHeadOffice: testHeadOffice,
          onSuccess,
        })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(capturedOnSuccess).toBeDefined();
      act(() => capturedOnSuccess?.());

      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(result.current.error).toBeNull();
    });

    it("should set error when mutation calls onError with Error", async () => {
      const apiError = new Error("Failed to delete supplier head office");
      let capturedOnError: ((err: Error) => void) | undefined;
      mockMutate.mockImplementation(
        (_id: string, opts: { onError?: (err: Error) => void }) => {
          capturedOnError = opts.onError;
        }
      );

      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: testHeadOffice })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(capturedOnError).toBeDefined();
      act(() => capturedOnError?.(apiError));

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error?.message).toBe(
        "Failed to delete supplier head office"
      );
    });

    it("should set error with default message when onError receives non-Error", async () => {
      let capturedOnError: ((err: unknown) => void) | undefined;
      mockMutate.mockImplementation(
        (_id: string, opts: { onError?: (err: unknown) => void }) => {
          capturedOnError = opts.onError;
        }
      );

      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: testHeadOffice })
      );

      act(() => {
        result.current.handleDelete();
      });

      act(() => capturedOnError?.("string error"));

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Failed to delete supplier head office"
      );
    });

    it("should not call onSuccess when mutation fails", async () => {
      let capturedOnError: ((err: Error) => void) | undefined;
      mockMutate.mockImplementation(
        (_id: string, opts: { onError?: (err: Error) => void }) => {
          capturedOnError = opts.onError;
        }
      );

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({
          supplierHeadOffice: testHeadOffice,
          onSuccess,
        })
      );

      act(() => {
        result.current.handleDelete();
      });

      act(() => capturedOnError?.(new Error("Delete failed")));

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should clear error before invoking mutate (retry)", async () => {
      let capturedOnError: ((err: Error) => void) | undefined;
      mockMutate.mockImplementation(
        (_id: string, opts: { onError?: (err: Error) => void }) => {
          capturedOnError = opts.onError;
        }
      );

      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: testHeadOffice })
      );

      act(() => result.current.handleDelete());
      act(() => capturedOnError?.(new Error("First failure")));
      await waitFor(() => expect(result.current.error).not.toBeNull());

      act(() => result.current.handleDelete());
      expect(result.current.error).toBeNull();
      expect(mockMutate).toHaveBeenCalledTimes(2);
    });
  });

  describe("Null Supplier Head Office", () => {
    it("should not call mutate when supplier head office is null", () => {
      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: null })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it("should not call onSuccess when supplier head office is null", () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({
          supplierHeadOffice: null,
          onSuccess,
        })
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("resetError", () => {
    it("should clear error when resetError is called", async () => {
      let capturedOnError: ((err: Error) => void) | undefined;
      mockMutate.mockImplementation(
        (_id: string, opts: { onError?: (err: Error) => void }) => {
          capturedOnError = opts.onError;
        }
      );

      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: testHeadOffice })
      );

      act(() => result.current.handleDelete());
      act(() => capturedOnError?.(new Error("Delete failed")));
      await waitFor(() => expect(result.current.error).not.toBeNull());

      act(() => result.current.resetError());
      expect(result.current.error).toBeNull();
    });
  });

  describe("isPending", () => {
    it("should return isPending from the delete hook", () => {
      const { result } = renderHook(() =>
        useDeleteSupplierHeadOfficeForm({ supplierHeadOffice: testHeadOffice })
      );
      expect(result.current.isPending).toBe(false);
    });
  });
});
