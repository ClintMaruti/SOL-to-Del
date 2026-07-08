import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteContractPolicy } from "../api/useDeleteContractPolicy";

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

vi.mock("@sol/ui", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockApi = api as unknown as { delete: ReturnType<typeof vi.fn> };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        children
      ),
    queryClient,
  };
}

describe("useDeleteContractPolicy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful deletion", () => {
    it("should delete a policy successfully", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteContractPolicy(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.delete).toHaveBeenCalledWith(
        "/catalog/suppliers/contracts/cancellation-policies/pol-1"
      );
      expect(mockApi.delete).toHaveBeenCalledTimes(1);
    });

    it("should invalidate contract query on success", async () => {
      mockApi.delete.mockResolvedValueOnce(undefined);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const detailInvalidate = invalidateSpy.mock.calls.find(
        (c) => typeof c[0]?.predicate === "function"
      )?.[0] as {
        predicate?: (query: { queryKey: readonly unknown[] }) => boolean;
      };
      expect(detailInvalidate?.predicate).toBeDefined();
      const pred = detailInvalidate!.predicate!;
      expect(pred({ queryKey: ["supplier-contracts", null, "c-1"] })).toBe(
        true
      );
      expect(pred({ queryKey: ["supplier-contracts", "sup-1", "c-1"] })).toBe(
        true
      );
    });
  });

  describe("Error handling", () => {
    it("should handle API errors", async () => {
      mockApi.delete.mockRejectedValueOnce(
        new ApiError("Policy not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Policy not found");
    });

    it("should not invalidate cache on error", async () => {
      mockApi.delete.mockRejectedValueOnce(new Error("Delete failed"));

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending state", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: () => void;
      const promise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.delete.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteContractPolicy(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
        });
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!();

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
