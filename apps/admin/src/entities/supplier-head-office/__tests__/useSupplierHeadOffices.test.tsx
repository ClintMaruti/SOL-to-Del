import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierHeadOffices } from "../api/useSupplierHeadOffices";
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
  suppliersCount: 5,
};

/** Expected entity after mapping. */
const mockHeadOffice: SupplierHeadOffice = {
  ...mockApiResponse,
  suppliersCount: mockApiResponse.suppliersCount ?? 0,
};

describe("useSupplierHeadOffices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Fetch", () => {
    it("should fetch supplier head offices successfully", async () => {
      const mockData: SupplierHeadOfficeApiResponse[] = [
        mockApiResponse,
        {
          ...mockApiResponse,
          id: "sho-2",
          name: "Serengeti Safari",
          email: "info.serengeti@serengeti.com",
        },
      ];

      mockApi.get.mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useSupplierHeadOffices(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].id).toBe("sho-1");
      expect(result.current.data![0].name).toBe("Elewana Collection");
      expect(result.current.data![1].id).toBe("sho-2");
      expect(result.current.data![1].name).toBe("Serengeti Safari");

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/head-offices");
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("should handle empty array", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useSupplierHeadOffices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual([]);
    });

    it("should return head offices with all fields populated", async () => {
      mockApi.get.mockResolvedValueOnce([mockApiResponse]);

      const { result } = renderHook(() => useSupplierHeadOffices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const office = result.current.data![0];
      expect(office.email).toBe("info.elewana@elewana.com");
      expect(office.phoneNumber).toBe("+1 23-555-901-2345");
      expect(office.additionalEmail).toBe("reservations@elewana.com");
      expect(office.website).toBe("https://www.elewanacollection.com");
      expect(office.country).toBe("Tanzania");
      expect(office.city).toBe("Arusha");
      expect(office.postalCode).toBe("23100");
      expect(office.streetAddress).toBe("Plot 45, Serengeti Road");
      expect(office.isActive).toBe(true);
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

      const { result } = renderHook(() => useSupplierHeadOffices(), {
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

      const { result } = renderHook(() => useSupplierHeadOffices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal Server Error");
    });
  });

  describe("Loading State", () => {
    it("should transition from loading to success", async () => {
      mockApi.get.mockResolvedValueOnce([mockHeadOffice]);

      const { result } = renderHook(() => useSupplierHeadOffices(), {
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

      const { result } = renderHook(() => useSupplierHeadOffices(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(false);
    });
  });

  describe("Query Key", () => {
    it("should call the correct endpoint", async () => {
      mockApi.get.mockResolvedValueOnce([]);

      const { result } = renderHook(() => useSupplierHeadOffices(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.get).toHaveBeenCalledWith("/catalog/head-offices");
    });
  });
});
