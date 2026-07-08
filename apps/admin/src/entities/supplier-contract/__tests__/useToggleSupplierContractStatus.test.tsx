import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleSupplierContractStatus } from "../api/useToggleSupplierContractStatus";
import type { SupplierContract } from "../model/types";
import { createSupplierContract } from "../testing/factories";

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

describe("useToggleSupplierContractStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Toggle", () => {
    it("should activate a contract successfully", async () => {
      const updatedContract = createSupplierContract("c-1", "Contract A", {
        isActive: true,
      });
      mockApi.patch.mockResolvedValueOnce(updatedContract);

      const { wrapper, queryClient } = createWrapper();
      const initialContracts = [
        createSupplierContract("c-1", "Contract A", { isActive: false }),
      ];
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/contracts/c-1/activate"
      );
      expect(mockApi.patch).toHaveBeenCalledTimes(1);

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["supplier-contracts", "sup-1"],
        expect.any(Function)
      );

      const updater = setQueryDataSpy.mock.calls[0]?.[1] as (
        prev: SupplierContract[] | undefined
      ) => SupplierContract[];
      const result_ = updater(initialContracts);
      expect(result_[0].isActive).toBe(true);
    });

    it("should deactivate a contract successfully", async () => {
      const updatedContract = createSupplierContract("c-1", "Contract A", {
        isActive: false,
      });
      mockApi.patch.mockResolvedValueOnce(updatedContract);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/contracts/c-1/deactivate"
      );
    });

    it("should return updated contract on success", async () => {
      const updatedContract = createSupplierContract("c-1", "Contract A", {
        isActive: true,
      });
      mockApi.patch.mockResolvedValueOnce(updatedContract);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedContract);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
    });

    it("should handle HTTP 404 error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Contract not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "non-existent",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Contract not found");
    });

    it("should not update query cache on error", async () => {
      mockApi.patch.mockRejectedValueOnce(new Error("Toggle failed"));

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(setQueryDataSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending State", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: (value: SupplierContract) => void;
      const promise = new Promise<SupplierContract>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.patch.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));

      const updatedContract = createSupplierContract("c-1", "Contract A", {
        isActive: true,
      });
      resolvePromise!(updatedContract);

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("API Endpoint", () => {
    it("should call activate endpoint when isActive is false", async () => {
      const updatedContract = createSupplierContract("c-1", "Contract A", {
        isActive: true,
      });
      mockApi.patch.mockResolvedValueOnce(updatedContract);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/contracts/c-1/activate"
      );
    });

    it("should call deactivate endpoint when isActive is true", async () => {
      const updatedContract = createSupplierContract("c-1", "Contract A", {
        isActive: false,
      });
      mockApi.patch.mockResolvedValueOnce(updatedContract);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: true,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/contracts/c-1/deactivate"
      );
    });
  });

  describe("Query cache update", () => {
    it("should optimistically update the contracts list cache", async () => {
      const updatedContract = createSupplierContract("c-1", "Contract A", {
        isActive: true,
      });
      mockApi.patch.mockResolvedValueOnce(updatedContract);

      const { wrapper, queryClient } = createWrapper();
      const initialContracts = [
        createSupplierContract("c-1", "Contract A", { isActive: false }),
        createSupplierContract("c-2", "Contract B", { isActive: true }),
      ];
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleSupplierContractStatus(), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          supplierId: "sup-1",
          contractId: "c-1",
          isActive: false,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["supplier-contracts", "sup-1"],
        expect.any(Function)
      );

      const updater = setQueryDataSpy.mock.calls.find(
        (c) =>
          Array.isArray(c[0]) &&
          c[0][0] === "supplier-contracts" &&
          c[0][1] === "sup-1"
      )?.[1] as (prev: SupplierContract[] | undefined) => SupplierContract[];

      const nextData = updater(initialContracts);
      expect(nextData).toHaveLength(2);
      expect(nextData[0].isActive).toBe(true);
      expect(nextData[1].isActive).toBe(true);
    });
  });
});
