import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateServiceOption } from "../api/useUpdateServiceOption";
import type { ServiceOption } from "../model/types";

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

const mockPut = vi.mocked(api.put);

function createWrapper(queryClient: QueryClient) {
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

function optionFixture(overrides: Partial<ServiceOption> = {}): ServiceOption {
  return {
    id: "opt-1",
    serviceId: "svc-1",
    title: "A",
    includes: "",
    excludes: "",
    contractId: null,
    isActive: true,
    version: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("useUpdateServiceOption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges PUT response into service-options cache without moving or invalidating", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 60_000 },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const existing = optionFixture({ id: "opt-1", title: "Old" });
    const other = optionFixture({
      id: "opt-2",
      title: "Other",
      version: 1,
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });
    queryClient.setQueryData<ServiceOption[]>(
      ["service-options", "svc-1"],
      [existing, other]
    );

    const updated = optionFixture({
      title: "New",
      version: 2,
      updatedAt: "2025-01-03T00:00:00Z",
    });
    mockPut.mockResolvedValueOnce(updated);

    const { wrapper } = createWrapper(queryClient);
    const { result } = renderHook(() => useUpdateServiceOption(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        optionId: "opt-1",
        serviceId: "svc-1",
        payload: {
          title: "New",
          version: 1,
        },
      });
    });

    await waitFor(() => {
      const list = queryClient.getQueryData<ServiceOption[]>([
        "service-options",
        "svc-1",
      ]);
      expect(list?.[0]).toEqual(updated);
      expect(list?.[1]).toEqual(other);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
