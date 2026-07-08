import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleAgencyStatus } from "../api/useToggleAgencyStatus";
import type { Agency } from "../model/types";
import { createAgency } from "../testing/factories";

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

// Helper to create a wrapper with QueryClient
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

describe("useToggleAgencyStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Toggle", () => {
    it("should activate agency successfully", async () => {
      const updatedAgency = createAgency("agency-1", "Test Agency", {
        isActive: true,
      });

      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      // Should not be pending initially
      expect(result.current.isPending).toBe(false);

      // Trigger mutation
      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });

      // Wait for success
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify api was called with correct endpoint
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agencies/agency-1/activate"
      );
      expect(mockApi.patch).toHaveBeenCalledTimes(1);

      // Hook uses optimistic updates via setQueryData (no invalidateQueries)
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["agencies"],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["agency", "agency-1"],
        expect.any(Function)
      );
    });

    it("should return updated agency on success", async () => {
      const updatedAgency = createAgency("agency-1", "Test Agency", {
        isActive: false,
      });

      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: false });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(updatedAgency);
      expect(result.current.data?.isActive).toBe(false);
    });

    it("should deactivate agency", async () => {
      const updatedAgency = createAgency("agency-1", "Test Agency", {
        isActive: false,
      });

      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: false });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agencies/agency-1/deactivate"
      );
    });

    it("should call onSuccess callback when provided", async () => {
      const updatedAgency = createAgency("agency-1", "Test Agency");

      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      const onSuccess = vi.fn();

      act(() => {
        result.current.mutate(
          { agencyId: "agency-1", activate: true },
          { onSuccess }
        );
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccess).toHaveBeenCalledWith(
        updatedAgency,
        { agencyId: "agency-1", activate: true },
        undefined, // context
        expect.anything() // mutation object
      );
    });

    it("should handle different agencies with activate/deactivate", async () => {
      const agency1 = createAgency("agency-1", "Agency One", {
        isActive: true,
      });
      const agency2 = createAgency("agency-2", "Agency Two", {
        isActive: false,
      });

      mockApi.patch
        .mockResolvedValueOnce(agency1)
        .mockResolvedValueOnce(agency2);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.id).toBe("agency-1");

      act(() => {
        result.current.mutate({ agencyId: "agency-2", activate: false });
      });
      await waitFor(() => expect(result.current.data?.id).toBe("agency-2"));

      expect(mockApi.patch).toHaveBeenCalledTimes(2);
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        1,
        "/catalog/agencies/agency-1/activate"
      );
      expect(mockApi.patch).toHaveBeenNthCalledWith(
        2,
        "/catalog/agencies/agency-2/deactivate"
      );
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
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe(
        "Network error: Unable to reach the server"
      );
    });

    it("should handle HTTP 404 error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Agency not found", 404, "Not Found")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({
          agencyId: "non-existent-agency",
          activate: true,
        });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Agency not found");
    });

    it("should handle HTTP 500 error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Internal Server Error", 500, "Server Error")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: false });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe("Internal Server Error");
    });

    it("should handle forbidden error", async () => {
      mockApi.patch.mockRejectedValueOnce(
        new ApiError("Forbidden: Insufficient permissions", 403, "Forbidden")
      );

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error?.message).toBe(
        "Forbidden: Insufficient permissions"
      );
    });

    it("should call onError callback when provided", async () => {
      const error = new Error("Toggle failed");
      mockApi.patch.mockRejectedValueOnce(error);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      const onError = vi.fn();

      act(() => {
        result.current.mutate(
          { agencyId: "agency-1", activate: true },
          { onError }
        );
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // React Query v5 calls onError with (error, variables, context, mutation)
      expect(onError).toHaveBeenCalledWith(
        error,
        { agencyId: "agency-1", activate: true },
        undefined, // context
        expect.anything() // mutation object
      );
    });

    it("should not update query cache on error", async () => {
      mockApi.patch.mockRejectedValueOnce(new Error("Toggle failed"));

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      // setQueryData should not be called on error
      expect(setQueryDataSpy).not.toHaveBeenCalled();
    });
  });

  describe("Pending State", () => {
    it("should track pending state correctly", async () => {
      let resolvePromise: (value: Agency) => void;
      const promise = new Promise<Agency>((resolve) => {
        resolvePromise = resolve;
      });

      mockApi.patch.mockReturnValueOnce(promise);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      expect(result.current.isPending).toBe(false);

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });

      // Wait for pending state to be true
      await waitFor(() => expect(result.current.isPending).toBe(true));

      const updatedAgency = createAgency("agency-1", "Test Agency");
      resolvePromise!(updatedAgency);

      await waitFor(() => expect(result.current.isPending).toBe(false));

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe("Query cache update", () => {
    it("should update agencies and single-agency cache on success", async () => {
      const updatedAgency = createAgency("agency-1", "Test Agency");
      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper, queryClient } = createWrapper();
      const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Hook uses setQueryData for optimistic updates (agencies list + single agency)
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["agencies"],
        expect.any(Function)
      );
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ["agency", "agency-1"],
        expect.any(Function)
      );
    });
  });

  describe("Reset State", () => {
    it("should reset mutation state", async () => {
      const updatedAgency = createAgency("agency-1", "Test Agency");
      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-1", activate: true });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(false);
        expect(result.current.isError).toBe(false);
        expect(result.current.isPending).toBe(false);
        expect(result.current.data).toBeUndefined();
      });
    });
  });

  describe("API Endpoint", () => {
    it("should call activate endpoint when activate is true", async () => {
      const updatedAgency = createAgency("agency-123", "Test Agency");
      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-123", activate: true });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agencies/agency-123/activate"
      );
    });

    it("should call deactivate endpoint when activate is false", async () => {
      const updatedAgency = createAgency("agency-123", "Test Agency", {
        isActive: false,
      });
      mockApi.patch.mockResolvedValueOnce(updatedAgency);

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useToggleAgencyStatus(), { wrapper });

      act(() => {
        result.current.mutate({ agencyId: "agency-123", activate: false });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockApi.patch).toHaveBeenCalledWith(
        "/catalog/agencies/agency-123/deactivate"
      );
    });
  });
});
