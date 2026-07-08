import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierHeadOffice } from "../api/useSupplierHeadOffice";
import type { SupplierHeadOfficeApiResponse } from "../model/api-types";
import type { SupplierHeadOffice } from "../model/types";

// Mock the api module from @sol/api-client
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

/** API response shape (backend uses phoneNumber); hook maps to entity. */
const mockApiResponse: SupplierHeadOfficeApiResponse = {
  id: "sho-1",
  name: "Elewana Collection",
  email: "info.elewana@elewana.com",
  phoneNumber: "+1 23-555-901-2345",
  additionalEmail: "reservations@elewana.com",
  website: "https://www.elewanacollection.com",
  country: "Tanzania",
  city: "Arusha",
  postalCode: "23100",
  streetAddress: "Plot 45, Serengeti Road",
  isActive: true,
  suppliersCount: 12,
};

/** Expected entity after mapHeadOfficeApiResponseToEntity. */
const mockHeadOffice: SupplierHeadOffice = {
  id: mockApiResponse.id,
  name: mockApiResponse.name,
  email: mockApiResponse.email,
  phoneNumber: mockApiResponse.phoneNumber,
  additionalEmail: mockApiResponse.additionalEmail,
  website: mockApiResponse.website,
  country: mockApiResponse.country,
  city: mockApiResponse.city,
  postalCode: mockApiResponse.postalCode,
  streetAddress: mockApiResponse.streetAddress,
  isActive: mockApiResponse.isActive,
  suppliersCount: mockApiResponse.suppliersCount ?? 0,
};

describe("useSupplierHeadOffice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Fetch", () => {
    it("should fetch a single supplier head office by ID", async () => {
      mockApi.get.mockResolvedValueOnce(mockApiResponse);

      const { result } = renderHook(() => useSupplierHeadOffice("sho-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockHeadOffice);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(mockApi.get).toHaveBeenCalledWith("/catalog/head-offices/sho-1");
    });

    it("should call api with correct endpoint", async () => {
      mockApi.get.mockResolvedValueOnce(mockApiResponse);

      const { result } = renderHook(() => useSupplierHeadOffice("sho-5"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/head-offices/sho-5");
    });
  });

  describe("Null ID Handling", () => {
    it("should not fetch when id is null", () => {
      const { result } = renderHook(() => useSupplierHeadOffice(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });

    it("should be disabled when id is null", () => {
      const { result } = renderHook(() => useSupplierHeadOffice(null), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 error", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError("Request failed: Not Found", 404, "Not Found")
      );

      const { result } = renderHook(
        () => useSupplierHeadOffice("nonexistent"),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Request failed: Not Found");
      expect(result.current.data).toBeUndefined();
    });

    it("should handle network errors", async () => {
      mockApi.get.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const { result } = renderHook(() => useSupplierHeadOffice("sho-1"), {
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
        new ApiError(
          "Request failed: Internal Server Error",
          500,
          "Server Error"
        )
      );

      const { result } = renderHook(() => useSupplierHeadOffice("sho-1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe(
        "Request failed: Internal Server Error"
      );
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("Loading State", () => {
    it("should handle loading state correctly", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.get.mockReturnValueOnce(promise);

      const { result } = renderHook(() => useSupplierHeadOffice("sho-1"), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      resolvePromise!(mockApiResponse);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Query Key", () => {
    it("should use correct query key for caching", async () => {
      mockApi.get.mockResolvedValueOnce(mockApiResponse);

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
        },
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useSupplierHeadOffice("sho-1"), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const queryData = queryClient.getQueryData([
        "supplier-head-office",
        "sho-1",
      ]);
      expect(queryData).toEqual(mockHeadOffice);
    });
  });
});
