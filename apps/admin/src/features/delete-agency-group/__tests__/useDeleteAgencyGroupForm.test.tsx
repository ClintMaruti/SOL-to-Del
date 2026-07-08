import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AgencyGroup } from "@/entities/agency-group/model/types";

import { useDeleteAgencyGroupForm } from "../model/useDeleteAgencyGroupForm";

const mockMutate = vi.fn();

vi.mock("@/entities/agency-group", () => ({
  useDeleteAgencyGroup: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    reset: vi.fn(),
  })),
}));

function createAgencyGroup(
  id: string,
  name: string,
  options?: { numberOfAgencies?: number }
): AgencyGroup {
  return {
    id,
    name,
    description: null,
    numberOfAgencies: options?.numberOfAgencies ?? 0,
    isActive: true,
    version: 0,
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useDeleteAgencyGroupForm", () => {
  const testGroup = createAgencyGroup("ag-1", "Test Group", {
    numberOfAgencies: 0,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutate.mockImplementation(
      (
        _id: string,
        opts?: { onSuccess?: () => void; onError?: (err: Error) => void }
      ) => {
        opts?.onSuccess?.();
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should return initial state with no error and not pending", () => {
      const { result } = renderHook(
        () => useDeleteAgencyGroupForm({ agencyGroup: testGroup }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.handleDelete).toBe("function");
      expect(typeof result.current.resetError).toBe("function");
    });
  });

  describe("Successful Deletion", () => {
    it("should call mutate with agency group id", () => {
      const { result } = renderHook(
        () => useDeleteAgencyGroupForm({ agencyGroup: testGroup }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(
        "ag-1",
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it("should call onSuccess callback after successful deletion", () => {
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () =>
          useDeleteAgencyGroupForm({
            agencyGroup: testGroup,
            onSuccess,
          }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("should not call handleDelete when agencyGroup is null", () => {
      const { result } = renderHook(
        () => useDeleteAgencyGroupForm({ agencyGroup: null }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleDelete();
      });

      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should set error when mutation fails", async () => {
      const deleteError = new Error("Failed to delete agency group");
      mockMutate.mockImplementation(
        (_id: string, opts?: { onError?: (err: Error) => void }) => {
          opts?.onError?.(deleteError);
        }
      );

      const { result } = renderHook(
        () => useDeleteAgencyGroupForm({ agencyGroup: testGroup }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      expect(result.current.error?.message).toBe(
        "Failed to delete agency group"
      );
    });

    it("should not call onSuccess when mutation fails", async () => {
      mockMutate.mockImplementation(
        (_id: string, opts?: { onError?: (err: Error) => void }) => {
          opts?.onError?.(new Error("Network error"));
        }
      );
      const onSuccess = vi.fn();

      const { result } = renderHook(
        () =>
          useDeleteAgencyGroupForm({
            agencyGroup: testGroup,
            onSuccess,
          }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("should wrap non-Error in Error with default message", async () => {
      mockMutate.mockImplementation(
        (_id: string, opts?: { onError?: (err: Error) => void }) => {
          opts?.onError?.("string error" as unknown as Error);
        }
      );

      const { result } = renderHook(
        () => useDeleteAgencyGroupForm({ agencyGroup: testGroup }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      expect(result.current.error?.message).toBe(
        "Failed to delete agency group"
      );
    });
  });

  describe("resetError", () => {
    it("should clear error when resetError is called", async () => {
      mockMutate.mockImplementation(
        (_id: string, opts?: { onError?: (err: Error) => void }) => {
          opts?.onError?.(new Error("API error"));
        }
      );

      const { result } = renderHook(
        () => useDeleteAgencyGroupForm({ agencyGroup: testGroup }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.handleDelete();
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());

      act(() => {
        result.current.resetError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
