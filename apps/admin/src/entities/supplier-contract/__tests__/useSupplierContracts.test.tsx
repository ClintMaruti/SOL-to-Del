import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierContracts } from "../api/useSupplierContracts";
import type { SupplierContractApiResponse } from "../model/api-types";

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
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockApiResponse: SupplierContractApiResponse = {
  id: "contract-1",
  name: "Elewana Contract 2025",
  link: "https://drive.google.com/file/d/abc123/view",
  validFrom: "2025-01-01",
  validTo: "2025-12-31",
  isActive: true,
  createdAt: "2024-11-15T10:00:00Z",
  updatedAt: "2024-12-01T14:30:00Z",
};

const supplierId = "sup-1";
const contractsUrl = `/catalog/suppliers/${supplierId}/contracts`;

describe("useSupplierContracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Fetch", () => {
    it("should fetch supplier contracts from the contracts endpoint", async () => {
      mockApi.get.mockResolvedValueOnce([
        mockApiResponse,
        {
          ...mockApiResponse,
          id: "contract-2",
          name: "Elewana Contract 2024",
          validFrom: "2024-01-01",
          validTo: "2024-12-31",
        },
      ]);

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].id).toBe("contract-1");
      expect(result.current.data![0].name).toBe("Elewana Contract 2025");
      expect(result.current.data![1].id).toBe("contract-2");
      expect(result.current.data![1].name).toBe("Elewana Contract 2024");

      expect(mockApi.get).toHaveBeenCalledWith(contractsUrl);
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("should handle empty array when supplier has no contracts", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it("should return contracts with all fields populated", async () => {
      mockApi.get.mockResolvedValueOnce([mockApiResponse]);

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const contract = result.current.data![0];
      expect(contract.name).toBe("Elewana Contract 2025");
      expect(contract.link).toBe("https://drive.google.com/file/d/abc123/view");
      expect(contract.validFrom).toBe("2025-01-01");
      expect(contract.validTo).toBe("2025-12-31");
      expect(contract.isActive).toBe(true);
      expect(contract.createdAt).toBe("2024-11-15T10:00:00Z");
      expect(contract.updatedAt).toBe("2024-12-01T14:30:00Z");
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
      expect(result.current.data).toBeUndefined();
    });

    it("should handle HTTP 500 error", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Internal Server Error", 500, "Server Error")
      );

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal Server Error");
    });
  });

  describe("Loading State", () => {
    it("should transition from loading to success", async () => {
      mockApi.get.mockResolvedValueOnce([mockApiResponse]);

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it("should transition from loading to error", async () => {
      mockApi.get.mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe("Query Key", () => {
    it("should call the supplier contracts endpoint", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useSupplierContracts(supplierId), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith(contractsUrl);
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("should not fetch when supplierId is null", async () => {
      const { result } = renderHook(() => useSupplierContracts(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });
});
