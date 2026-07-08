import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "@sol/ui";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateSupplierContentBlock } from "../useUpdateSupplierContentBlock";

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

vi.mock("@sol/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/ui")>();
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useUpdateSupplierContentBlock", () => {
  const mockPut = vi.mocked(api.put);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls PUT with body and version", async () => {
    mockPut.mockResolvedValue({
      id: "b1",
      title: "About",
      body: "<p>n</p>",
      version: 2,
      updatedAt: "2025-01-01T00:00:00Z",
      updatedBy: "u1",
    });

    const { result } = renderHook(
      () => useUpdateSupplierContentBlock("sup-1"),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      contentBlockId: "b1",
      body: "<p>n</p>",
      version: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockPut).toHaveBeenCalledWith(
      "/catalog/supplier-content-blocks/b1",
      {
        body: "<p>n</p>",
        version: 1,
      }
    );
  });

  it("does not toast on 409 conflict", async () => {
    const toastError = vi.mocked(toast.error);

    mockPut.mockRejectedValue(
      new ApiError("Conflict", 409, "Conflict", { error: "v" })
    );

    const { result } = renderHook(
      () => useUpdateSupplierContentBlock("sup-1"),
      { wrapper: createWrapper() }
    );

    result.current.mutate({
      contentBlockId: "b1",
      body: "<p>x</p>",
      version: 1,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toastError).not.toHaveBeenCalled();
  });
});
