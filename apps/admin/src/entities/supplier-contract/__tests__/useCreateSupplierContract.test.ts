import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateSupplierContract } from "../api/useCreateSupplierContract";
import type { CreateSupplierContractPayload } from "../api/useCreateSupplierContract";

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

describe("useCreateSupplierContract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validPayload: CreateSupplierContractPayload = {
    supplierId: "supplier-1",
    name: "Contract 2025",
    link: "https://drive.google.com/file/link.pdf",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
  };

  describe("Successful Mutations", () => {
    it("should create supplier contract successfully", async () => {
      const mockContract = {
        id: "contract-new",
        name: validPayload.name,
        link: validPayload.link,
        validFrom: validPayload.validFrom,
        validTo: validPayload.validTo,
        isActive: false,
        createdAt: "2026-03-09T00:00:00Z",
        updatedAt: "2026-03-09T00:00:00Z",
      };

      mockApi.post.mockResolvedValueOnce(mockContract);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierContract(), {
        wrapper,
      });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/catalog/suppliers/${validPayload.supplierId}/contracts`,
        {
          name: validPayload.name,
          link: validPayload.link,
          agencyGroupId: null,
          validFrom: validPayload.validFrom,
          validTo: validPayload.validTo,
        }
      );
      expect(result.current.data).toEqual(mockContract);
    });

    it("should create contract without link when omitted", async () => {
      const payloadWithoutLink: CreateSupplierContractPayload = {
        ...validPayload,
        link: undefined,
      };

      mockApi.post.mockResolvedValueOnce({
        id: "contract-2",
        name: payloadWithoutLink.name,
        link: null,
        validFrom: payloadWithoutLink.validFrom,
        validTo: payloadWithoutLink.validTo,
        isActive: false,
        createdAt: "2026-03-09T00:00:00Z",
        updatedAt: "2026-03-09T00:00:00Z",
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierContract(), {
        wrapper,
      });

      result.current.mutate(payloadWithoutLink);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        `/catalog/suppliers/supplier-1/contracts`,
        expect.objectContaining({
          name: payloadWithoutLink.name,
          validFrom: payloadWithoutLink.validFrom,
          validTo: payloadWithoutLink.validTo,
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle HTTP error response", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Invalid contract data", 400, "Bad Request")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateSupplierContract(), {
        wrapper,
      });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Invalid contract data");
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
      const { result } = renderHook(() => useCreateSupplierContract(), {
        wrapper,
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePromise!({
        id: "contract-new",
        ...validPayload,
        isActive: false,
        createdAt: "2026-03-09T00:00:00Z",
        updatedAt: "2026-03-09T00:00:00Z",
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });

  describe("Cache Invalidation", () => {
    it("should invalidate supplier-contracts query on success", async () => {
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

      mockApi.post.mockResolvedValueOnce({
        id: "contract-new",
        name: validPayload.name,
        link: validPayload.link,
        validFrom: validPayload.validFrom,
        validTo: validPayload.validTo,
        isActive: false,
        createdAt: "2026-03-09T00:00:00Z",
        updatedAt: "2026-03-09T00:00:00Z",
      });

      const { result } = renderHook(() => useCreateSupplierContract(), {
        wrapper,
      });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["supplier-contracts", "supplier-1"],
      });
    });
  });
});
