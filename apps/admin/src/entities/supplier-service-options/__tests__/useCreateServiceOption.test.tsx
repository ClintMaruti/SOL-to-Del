import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCreateServiceOption } from "../api/useCreateServiceOption";
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

const mockPost = vi.mocked(api.post);

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
    title: "Existing",
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

describe("useCreateServiceOption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prepends the created option to cached lists without invalidating", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 60_000 },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const existing = optionFixture({ id: "opt-1", title: "Existing" });
    queryClient.setQueryData<ServiceOption[]>(
      ["service-options", "svc-1"],
      [existing]
    );
    queryClient.setQueryData(["supplier-service", "svc-1"], {
      id: "svc-1",
      options: [
        {
          id: existing.id,
          name: existing.title,
          isActive: existing.isActive,
          rates: [],
          ratePlans: [],
        },
      ],
    });
    queryClient.setQueryData(
      ["supplier-services", "sup-1"],
      [
        {
          id: "svc-1",
          options: [
            {
              id: existing.id,
              name: existing.title,
              isActive: existing.isActive,
              rates: [],
              ratePlans: [],
            },
          ],
        },
      ]
    );

    const created = optionFixture({
      id: "opt-new",
      title: "New Option",
      isActive: false,
      createdAt: "2025-01-02T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });
    mockPost.mockResolvedValueOnce(created);

    const { wrapper } = createWrapper(queryClient);
    const { result } = renderHook(() => useCreateServiceOption(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        serviceId: "svc-1",
        supplierId: "sup-1",
        title: "New Option",
        suppressSuccessToast: true,
      });
    });

    await waitFor(() => {
      const options = queryClient.getQueryData<ServiceOption[]>([
        "service-options",
        "svc-1",
      ]);
      expect(options?.map((option) => option.id)).toEqual(["opt-new", "opt-1"]);
    });

    expect(
      queryClient
        .getQueryData<{
          options: { id: string }[];
        }>(["supplier-service", "svc-1"])
        ?.options.map((option) => option.id)
    ).toEqual(["opt-new", "opt-1"]);
    expect(
      queryClient
        .getQueryData<{ id: string; options: { id: string }[] }[]>([
          "supplier-services",
          "sup-1",
        ])
        ?.at(0)
        ?.options.map((option) => option.id)
    ).toEqual(["opt-new", "opt-1"]);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
