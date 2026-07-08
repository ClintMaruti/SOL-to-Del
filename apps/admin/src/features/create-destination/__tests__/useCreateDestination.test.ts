import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  useCreateDestination,
  type CreateDestinationPayload,
} from "../api/useCreateDestination";

// Import the mocked api

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

describe("useCreateDestination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const validPayload: CreateDestinationPayload = {
    parentId: null,
    name: "Kenya",
    type: "Country",
    code: "KEN",
    latitude: -0.0236,
    longitude: 37.9062,
  };

  describe("Successful Mutations", () => {
    it("should create destination successfully", async () => {
      const mockDestination = {
        id: "new-dest-123",
        ...validPayload,
      };

      mockApi.post.mockResolvedValueOnce(mockDestination);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/locations",
        validPayload
      );
      expect(result.current.data).toEqual(mockDestination);
    });

    it("should create destination with minimal required fields", async () => {
      const minimalPayload: CreateDestinationPayload = {
        parentId: null,
        name: "Kenya",
        type: "Country",
      };

      const mockDestination = {
        id: "new-dest-456",
        ...minimalPayload,
      };

      mockApi.post.mockResolvedValueOnce(mockDestination);

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(minimalPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/locations",
        minimalPayload
      );
    });

    it("should create destination with parent ID", async () => {
      const payloadWithParent: CreateDestinationPayload = {
        parentId: "kenya-123",
        name: "Nairobi",
        type: "City",
        code: "NBI",
      };

      mockApi.post.mockResolvedValueOnce({
        id: "city-123",
        ...payloadWithParent,
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(payloadWithParent);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/locations",
        payloadWithParent
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle HTTP error response", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Invalid destination data", 400, "Bad Request")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Invalid destination data");
    });

    it("should handle HTTP error without JSON body", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError(
          "Request failed: Internal Server Error",
          500,
          "Internal Server Error"
        )
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain("Internal Server Error");
    });

    it("should handle API response with success: false", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Destination name already exists", 200, "OK")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(
        "Destination name already exists"
      );
    });

    it("should handle API response with success: false but no error message", async () => {
      mockApi.post.mockRejectedValueOnce(
        new ApiError("Request failed", 200, "OK")
      );

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(validPayload);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Request failed");
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
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

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
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

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

  describe("Payload Types", () => {
    it("should handle Airport type with IATA code", async () => {
      const airportPayload: CreateDestinationPayload = {
        parentId: "nairobi-city",
        name: "Jomo Kenyatta International Airport",
        type: "Airport",
        code: "NBO",
        latitude: -1.3192,
        longitude: 36.9275,
      };

      mockApi.post.mockResolvedValueOnce({
        id: "airport-123",
        ...airportPayload,
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(airportPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApi.post).toHaveBeenCalledWith(
        "/catalog/locations",
        airportPayload
      );
    });

    it("should handle Region type", async () => {
      const regionPayload: CreateDestinationPayload = {
        parentId: null,
        name: "East Africa",
        type: "Region",
      };

      mockApi.post.mockResolvedValueOnce({
        id: "region-123",
        ...regionPayload,
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(regionPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it("should handle Area type", async () => {
      const areaPayload: CreateDestinationPayload = {
        parentId: "kenya-123",
        name: "Masai Mara",
        type: "Area",
        code: "MSM",
      };

      mockApi.post.mockResolvedValueOnce({
        id: "area-123",
        ...areaPayload,
      });

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateDestination(), { wrapper });

      result.current.mutate(areaPayload);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });
});
