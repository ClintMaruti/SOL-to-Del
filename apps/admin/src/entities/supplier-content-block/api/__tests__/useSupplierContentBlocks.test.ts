import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierContentBlocks } from "../useSupplierContentBlocks";

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

describe("useSupplierContentBlocks", () => {
  const mockGet = vi.mocked(api.get);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("maps contentType to title when title is absent", async () => {
    mockGet.mockResolvedValue([
      {
        id: "b1",
        contentType: "About",
        bodyPreview: "<p>x</p>",
        version: 1,
      },
    ]);

    const { result } = renderHook(() => useSupplierContentBlocks("sup-1"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]).toMatchObject({
      id: "b1",
      title: "About",
      bodyPreview: "<p>x</p>",
      version: 1,
    });
  });

  it("returns empty array when response is not an array", async () => {
    mockGet.mockResolvedValue(null as unknown as never[]);

    const { result } = renderHook(() => useSupplierContentBlocks("sup-1"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("surfaces API errors", async () => {
    mockGet.mockRejectedValue(
      new ApiError("Server error", 500, "Internal Server Error")
    );

    const { result } = renderHook(() => useSupplierContentBlocks("sup-1"), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
