import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSupplierContentBlock } from "../useSupplierContentBlock";

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

describe("useSupplierContentBlock", () => {
  const mockGet = vi.mocked(api.get);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not fetch when supplierId is missing", () => {
    const { result } = renderHook(
      () => useSupplierContentBlock(undefined, "block-1"),
      { wrapper: createQueryWrapper() }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("maps detail fields on success", async () => {
    mockGet.mockResolvedValue({
      id: "block-1",
      contentType: "Terms",
      body: "<p>t</p>",
      version: 3,
    });

    const { result } = renderHook(
      () => useSupplierContentBlock("sup-1", "block-1"),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      id: "block-1",
      title: "Terms",
      body: "<p>t</p>",
      version: 3,
    });
    expect(mockGet).toHaveBeenCalledWith(
      "/catalog/suppliers/sup-1/content-blocks/block-1"
    );
  });

  it("surfaces 404 as error", async () => {
    mockGet.mockRejectedValue(new ApiError("Not found", 404, "Not Found"));

    const { result } = renderHook(
      () => useSupplierContentBlock("sup-1", "missing"),
      { wrapper: createQueryWrapper() }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
