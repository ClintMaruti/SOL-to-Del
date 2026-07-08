import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleContractPolicyStatus } from "../api/useToggleContractPolicyStatus";
import type { ContractPolicy } from "../model/types";

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

const mockApi = api as unknown as {
  patch: ReturnType<typeof vi.fn>;
};

const mockPolicy: ContractPolicy = {
  id: "pol-1",
  policyName: "Standard Cancellation",
  description: "Standard cancellation policy",
  refundable: true,
  isActive: true,
  conditions: [],
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

describe("useToggleContractPolicyStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("API Endpoint", () => {
    it("should call deactivate endpoint when isActive is true", async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockPolicy, isActive: false });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/suppliers/contracts/cancellation-policies/pol-1/deactivate"
      );
    });

    it("should call activate endpoint when isActive is false", async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockPolicy, isActive: true });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/suppliers/contracts/cancellation-policies/pol-1/activate"
      );
    });
  });

  describe("Query cache update", () => {
    it("should optimistically toggle isActive in policies cache", async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockPolicy, isActive: false });

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["contract-cancellation-policies", "c-1"],
        expect.any(Function)
      );

      const updater = setQueryDataSpy.mock.calls.find(
        (c) =>
          Array.isArray(c[0]) &&
          c[0][0] === "contract-cancellation-policies" &&
          c[0][1] === "c-1"
      )?.[1] as (
        prev: ContractPolicy[] | undefined
      ) => ContractPolicy[] | undefined;

      const updated = updater([mockPolicy]);
      expect(updated?.[0].isActive).toBe(false);
    });

    it("should preserve refundable when toggling isActive", async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockPolicy, isActive: false });

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const updater = setQueryDataSpy.mock.calls.find(
        (c) =>
          Array.isArray(c[0]) &&
          c[0][0] === "contract-cancellation-policies" &&
          c[0][1] === "c-1"
      )?.[1] as (
        prev: ContractPolicy[] | undefined
      ) => ContractPolicy[] | undefined;

      const updated = updater([{ ...mockPolicy, refundable: true }]);
      expect(updated?.[0].refundable).toBe(true);
    });

    it("should invalidate contract query on success", async () => {
      mockApi.patch.mockResolvedValueOnce({ ...mockPolicy, isActive: false });

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: true,
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
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Policy not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Policy not found");
    });

    it("should not update cache on error", async () => {
      mockApi.patch.mockRejectedValueOnce(new Error("Toggle failed"));

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(setQueryDataSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending state", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: (value: ContractPolicy) => void;
      const promise = new Promise<ContractPolicy>((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.patch.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleContractPolicyStatus(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          policyId: "pol-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!({ ...mockPolicy, isActive: false });

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
