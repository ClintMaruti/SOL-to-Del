import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateSupplierService } from "../api/useCreateSupplierService";
import type { CreateSupplierServicePayload } from "../model/type";

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

vi.mock("@sol/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/ui")>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn() },
  };
});

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useCreateSupplierService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validPayload: CreateSupplierServicePayload = {
    supplierId: "supplier-1",
    name: "Safari Camp",
    alternativeName: undefined,
    serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
    locationId: "loc-123",
    fromLocationId: undefined,
    toLocationId: undefined,
    description: undefined,
  };

  describe("Successful Mutations", () => {
    it("should create supplier service successfully", async () => {
      const mockService = {
        id: "service-1",
        ...validPayload,
        createdAt: "2026-03-04T00:00:00Z",
        updatedAt: "2026-03-04T00:00:00Z",
      };

      mockApi.post.mockResolvedValueOnce(mockService);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierService(), {
        wrapper,
      });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/services",
        validPayload
      );
      expect(result.current.data).toEqual(mockService);
    });

    it("should create a flight service with from/to fields", async () => {
      const flightPayload: CreateSupplierServicePayload = {
        supplierId: "supplier-1",
        name: "NBO to ARK",
        alternativeName: undefined,
        serviceTypeId: "a5d4151d-d125-4fca-af9d-3e05f5699d5c",
        locationId: undefined,
        fromLocationId: "nbo-id",
        toLocationId: "ark-id",
        description: undefined,
      };

      mockApi.post.mockResolvedValueOnce({
        id: "service-2",
        ...flightPayload,
        createdAt: "2026-03-04T00:00:00Z",
        updatedAt: "2026-03-04T00:00:00Z",
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierService(), {
        wrapper,
      });

      result.current.mutate(flightPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/services",
        flightPayload
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle HTTP error response", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Invalid service data", 400, "Bad Request")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierService(), {
        wrapper,
      });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Invalid service data");
    });

    it("should handle network error", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError(
          "Network error: Unable to reach the server",
          0,
          "Network Error"
        )
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierService(), {
        wrapper,
      });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
    });
  });

  describe("Loading States", () => {
    it("should set isPending while mutation is in progress", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.post.mockReturnValueOnce(promise);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierService(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePromise!({ id: "new-id", ...validPayload });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate supplier-services query on success", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      mockApi.post.mockResolvedValueOnce({ id: "new-id", ...validPayload });

      const { result } = renderHook(() => useCreateSupplierService(), {
        wrapper,
      });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["supplier-services", "supplier-1"],
      });
    });
  });
});
