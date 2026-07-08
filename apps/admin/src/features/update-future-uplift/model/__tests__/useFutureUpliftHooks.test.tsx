import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { futureUpliftQueryKeys } from "@/entities/future-uplift";

import { useFutureUpliftConfig } from "../useFutureUpliftConfig";
import { useUpdateFutureUplift } from "../useUpdateFutureUplift";

vi.mock("@sol/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/api-client")>();
  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn(),
      patch: vi.fn(),
    },
  };
});

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("useFutureUpliftConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads null percentage with version", async () => {
    mockApi.get.mockResolvedValueOnce({
      futureUpliftPercent: null,
      version: 3,
    });
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useFutureUpliftConfig(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual({
      futureUpliftPercent: null,
      version: 3,
    });
  });

  it("loads numeric percentage with version", async () => {
    mockApi.get.mockResolvedValueOnce({
      futureUpliftPercent: 15,
      version: 12,
    });
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useFutureUpliftConfig(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.futureUpliftPercent).toBe(15);
    expect(result.current.data?.version).toBe(12);
  });
});

describe("useUpdateFutureUplift", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("patches with version and invalidates config query", async () => {
    mockApi.patch.mockResolvedValueOnce({
      futureUpliftPercent: 20,
      version: 13,
    });
    mockApi.get.mockResolvedValue({
      futureUpliftPercent: null,
      version: 12,
    });

    const { queryClient, Wrapper } = createWrapper();

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateFutureUplift(), {
      wrapper: Wrapper,
    });

    await result.current.mutateAsync({
      futureUpliftPercent: 20,
      version: 12,
    });

    expect(mockApi.patch).toHaveBeenCalledWith("/catalog/future-uplift", {
      futureUpliftPercent: 20,
      version: 12,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: futureUpliftQueryKeys.config(),
    });
  });
});
