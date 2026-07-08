import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateAgency } from "../api/useUpdateAgency";
import { createAgency } from "../testing/factories";

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

describe("useUpdateAgency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets detail cache from PUT response before invalidation", async () => {
    const updated = createAgency("agency-1", "Updated", { version: 2 });
    vi.mocked(api.put).mockResolvedValueOnce(updated);

    const { wrapper, queryClient } = createWrapper();
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

    const { result } = renderHook(() => useUpdateAgency(), { wrapper });

    const payload = {
      version: 1,
      isActive: true,
    } as Parameters<typeof result.current.mutate>[0]["payload"];

    act(() => {
      result.current.mutate({
        agencyId: "agency-1",
        payload,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ["agency", "agency-1"],
      expect.any(Function)
    );

    const detailCalls = setQueryDataSpy.mock.calls.filter((c) => {
      const key = c[0] as readonly string[];
      return (
        Array.isArray(key) &&
        key[0] === "agency" &&
        key[1] === "agency-1" &&
        typeof c[1] === "function"
      );
    });
    const updater = detailCalls[detailCalls.length - 1]?.[1] as (
      prev: unknown
    ) => unknown;

    expect(updater).toBeDefined();
    const previous = createAgency("agency-1", "Old", { version: 1 });
    expect(updater(previous)).toEqual(updated);
  });

  it("does not replace detail cache with an older version", async () => {
    const staleResponse = createAgency("agency-1", "Stale", { version: 1 });
    vi.mocked(api.put).mockResolvedValueOnce(staleResponse);

    const { wrapper, queryClient } = createWrapper();
    const setQueryDataSpy = vi.spyOn(queryClient, "setQueryData");

    const newer = createAgency("agency-1", "Newer", { version: 3 });
    queryClient.setQueryData(["agency", "agency-1"], newer);

    const { result } = renderHook(() => useUpdateAgency(), { wrapper });

    const payload = {
      version: 2,
      isActive: true,
    } as Parameters<typeof result.current.mutate>[0]["payload"];

    act(() => {
      result.current.mutate({
        agencyId: "agency-1",
        payload,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const detailCalls = setQueryDataSpy.mock.calls.filter((c) => {
      const key = c[0] as readonly string[];
      return (
        Array.isArray(key) &&
        key[0] === "agency" &&
        key[1] === "agency-1" &&
        typeof c[1] === "function"
      );
    });
    const updater = detailCalls[detailCalls.length - 1]?.[1] as (
      prev: unknown
    ) => unknown;

    expect(updater(newer)).toBe(newer);
  });
});
