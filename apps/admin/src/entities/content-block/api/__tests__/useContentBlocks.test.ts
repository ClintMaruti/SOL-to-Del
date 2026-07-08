import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useContentBlocks } from "../useContentBlocks";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
    },
  };
});

const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useContentBlocks", () => {
  const mockGet = vi.mocked(api.get);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("exposes loading state while fetching", () => {
    mockGet.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        })
    );

    const { result } = renderHook(() => useContentBlocks(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("maps templates to applicableDocumentTypes on success", async () => {
    mockGet.mockResolvedValue([
      {
        id: "1",
        title: "A",
        body: "<p>x</p>",
        templates: ["Quote", "Voucher"],
        version: 1,
      },
    ]);

    const { result } = renderHook(() => useContentBlocks(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: "1",
        title: "A",
        body: "<p>x</p>",
        applicableDocumentTypes: ["Quote", "Voucher"],
        version: 1,
      },
    ]);
  });

  it("returns empty array when API returns empty list", async () => {
    mockGet.mockResolvedValue([]);

    const { result } = renderHook(() => useContentBlocks(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("returns empty array when response is not an array", async () => {
    mockGet.mockResolvedValue(null as unknown as never[]);

    const { result } = renderHook(() => useContentBlocks(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("surfaces API errors", async () => {
    mockGet.mockRejectedValue(
      new ApiError("Server error", 500, "Internal Server Error")
    );

    const { result } = renderHook(() => useContentBlocks(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
