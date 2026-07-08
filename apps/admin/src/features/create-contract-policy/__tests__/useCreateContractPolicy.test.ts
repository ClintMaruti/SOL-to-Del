import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateContractPolicy,
  type CreateContractPolicyPayload,
} from "../api/useCreateContractPolicy";

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

const mockApi = api as unknown as { post: ReturnType<typeof vi.fn> };

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

const validPayload: CreateContractPolicyPayload = {
  supplierId: "sup-1",
  contractId: "c-1",
  policyName: "Standard Cancellation",
  description: "Cancel up to 30 days before",
  travelDates: [{ from: "2026-01-01", to: null }],
  refundable: false,
  conditions: [],
};

/** API returns array of all policies for the contract after create. */
const mockCreatedPolicyArray = [
  {
    id: "policy-new",
    contractId: "c-1",
    policyName: "Standard Cancellation",
    description: "Cancel up to 30 days before",
    refundable: false,
    isActive: true,
    travelDates: [
      { id: "range-1", version: 1, dateFrom: "2026-01-01", dateTo: null },
    ],
    conditions: [],
  },
];

describe("useCreateContractPolicy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful creation", () => {
    it("should create a policy successfully", async () => {
      mockApi.post.mockResolvedValueOnce(mockCreatedPolicyArray);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate(validPayload);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/suppliers/contracts/c-1/cancellation-policies",
        {
          policyName: "Standard Cancellation",
          description: "Cancel up to 30 days before",
          travelDates: [{ dateFrom: "2026-01-01", dateTo: null }],
          refundable: false,
          isActive: false,
          conditions: [],
        }
      );
      expect(result.current.data).toEqual([
        {
          id: "policy-new",
          contractId: "c-1",
          policyName: "Standard Cancellation",
          description: "Cancel up to 30 days before",
          refundable: false,
          isActive: true,
          travelDates: [
            { id: "range-1", version: 1, from: "2026-01-01", to: null },
          ],
          conditions: [],
        },
      ]);
    });

    it("should create a refundable policy with penalty rules", async () => {
      const refundablePayload: CreateContractPolicyPayload = {
        ...validPayload,
        refundable: true,
        conditions: [
          {
            starts: "Before",
            referenceEvent: "TravelDate",
            startDay: 30,
            startTime: "00:00",
            endDay: 15,
            endTime: "23:59",
            penaltyValue: 50,
            penaltyType: "Percent",
          },
        ],
      };
      mockApi.post.mockResolvedValueOnce([
        {
          ...mockCreatedPolicyArray[0],
          refundable: true,
          conditions: [
            {
              id: "rule-1",
              starts: "Before",
              referenceEvent: "TravelDate",
              startDay: 30,
              startTime: "00:00",
              endDay: 15,
              endTime: "23:59",
              penaltyType: "Percent",
              penaltyValue: 50,
            },
          ],
        },
      ]);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate(refundablePayload);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/suppliers/contracts/c-1/cancellation-policies",
        expect.objectContaining({
          policyName: "Standard Cancellation",
          refundable: true,
          isActive: false,
          conditions: expect.arrayContaining([
            expect.objectContaining({
              starts: "Before",
              referenceEvent: "TravelDate",
              penaltyType: "Percent",
              penaltyValue: 50,
            }),
          ]),
        })
      );
    });
  });

  describe("Cache invalidation", () => {
    it("should invalidate contract query on success", async () => {
      mockApi.post.mockResolvedValueOnce(mockCreatedPolicyArray);

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate(validPayload);
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
      expect(pred({ queryKey: ["supplier-contracts", "sup-1"] })).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should handle validation errors", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Policy name is required", 400, "Bad Request")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate(validPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Policy name is required");
    });

    it("should not invalidate cache on error", async () => {
      mockApi.post.mockRejectedValueOnce(new Error("Create failed"));

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateContractPolicy(), {
        wrapper,
      });

      act(() => {
        result.current.mutate(validPayload);
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending state", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApi.post.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateContractPolicy(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate(validPayload);
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      resolvePromise!(mockCreatedPolicyArray);

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
