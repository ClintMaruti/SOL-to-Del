import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useServiceExtras } from "../api/useServiceExtras";
import type { CatalogExtra } from "../model/types";

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

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const mockExtras: CatalogExtra[] = [
  {
    id: "extra-1",
    title: "Lunch",
    serviceId: "service-1",
    serviceName: "Camp",
    description: "Bush lunch",
    isActive: true,
  },
];

describe("useServiceExtras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch extras when serviceId is provided", async () => {
    mockApi.get.mockResolvedValueOnce(mockExtras);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceExtras("service-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/services/service-1/extras"
    );
    expect(result.current.data).toEqual(mockExtras);
  });

  it("should not fetch when serviceId is null", () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useServiceExtras(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi.get).not.toHaveBeenCalled();
  });
});
