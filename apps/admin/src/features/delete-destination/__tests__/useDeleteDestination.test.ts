import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDeleteDestination } from "../api/useDeleteDestination";

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

// Create a wrapper with QueryClientProvider for testing hooks that use React Query
const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useDeleteDestination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const destinationId = "dest-123";

  describe("Successful Mutations", () => {
    it("should delete destination successfully with 204 No Content", async () => {
      mockApi.delete.mockResolvedValueOnce(null);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteDestination(), { wrapper });

      result.current.mutate(destinationId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.delete).toHaveBeenCalledWith(
        `/catalog/locations/${destinationId}`
      );
    });
  });

  describe("Error Handling", () => {
    describe("404 Not Found - Resource Not Found", () => {
      it("should handle 404 error with error details", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Entity not found", 404, "Not Found")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("Entity not found");
      });

      it("should handle 404 error without JSON body", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Request failed: Not Found", 404, "Not Found")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe("Request failed: Not Found");
      });
    });

    describe("400 Bad Request - Validation Failed", () => {
      it("should handle 400 error with validation details", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Invalid destination ID format", 400, "Bad Request")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "Invalid destination ID format"
        );
      });

      it("should handle 400 error without JSON body", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Request failed: Bad Request", 400, "Bad Request")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "Request failed: Bad Request"
        );
      });
    });

    describe("409 Conflict - Business Rule Violation", () => {
      it("should handle 409 error with business rule details", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError(
            "Cannot delete destination with active bookings",
            409,
            "Conflict"
          )
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "Cannot delete destination with active bookings"
        );
      });

      it("should handle 409 error with child destinations conflict", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError(
            "Cannot delete destination with active child destinations",
            409,
            "Conflict"
          )
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "Cannot delete destination with active child destinations"
        );
      });

      it("should handle 409 error without JSON body", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Request failed: Conflict", 409, "Conflict")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe("Request failed: Conflict");
      });
    });

    describe("401 Unauthorized", () => {
      it("should handle 401 error with error details", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Authentication required", 401, "Unauthorized")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe("Authentication required");
      });

      it("should handle 401 error without JSON body", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Request failed: Unauthorized", 401, "Unauthorized")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "Request failed: Unauthorized"
        );
      });
    });

    describe("403 Forbidden", () => {
      it("should handle 403 error with permission details", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError(
            "You do not have permission to delete this destination",
            403,
            "Forbidden"
          )
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "You do not have permission to delete this destination"
        );
      });

      it("should handle 403 error without JSON body", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Request failed: Forbidden", 403, "Forbidden")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe("Request failed: Forbidden");
      });
    });

    describe("500 Internal Server Error", () => {
      it("should handle 500 error with error details", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError(
            "An unexpected error occurred",
            500,
            "Internal Server Error"
          )
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "An unexpected error occurred"
        );
      });

      it("should handle 500 error without JSON body", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError(
            "Request failed: Internal Server Error",
            500,
            "Internal Server Error"
          )
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "Request failed: Internal Server Error"
        );
      });
    });

    describe("Network Errors", () => {
      it("should handle network error", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError(
            "Network error: Unable to reach the server",
            0,
            "Network Error"
          )
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe(
          "Network error: Unable to reach the server"
        );
      });

      it("should handle timeout error", async () => {
        mockApi.delete.mockRejectedValueOnce(
          new ApiError("Request timeout", 0, "Timeout")
        );

        const wrapper = createQueryWrapper();
        const { result } = renderHook(() => useDeleteDestination(), {
          wrapper,
        });

        result.current.mutate(destinationId);

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error?.message).toBe("Request timeout");
      });
    });
  });

  describe("Loading States", () => {
    it("should set isPending while mutation is in progress", async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.delete.mockReturnValueOnce(promise);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useDeleteDestination(), { wrapper });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(destinationId);

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      resolvePromise!(null);

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });
  });
});
