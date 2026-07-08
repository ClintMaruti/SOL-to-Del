import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSuppliers } from "../api/useSuppliers";
import type { Supplier } from "../model/types";

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockSupplier = (id: string, headOfficeName = "HO"): Supplier =>
  ({
    id,
    name: `Supplier ${id}`,
    headOfficeName,
    locationName: "Nairobi",
    code: `C-${id}`,
    email: `${id}@test.com`,
    phone: "+255 000",
    isActive: true,
  }) as Supplier;

describe("useSuppliers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call unfiltered endpoint when headOfficeId is not provided", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useSuppliers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith("/catalog/suppliers");
  });

  it("should call filtered endpoint when headOfficeId is provided", async () => {
    mockApi.get.mockResolvedValueOnce([mockSupplier("sup-1")]);

    const { result } = renderHook(() => useSuppliers("sho-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith(
      "/catalog/suppliers?headOfficeId=sho-1"
    );
  });

  it("should call unfiltered endpoint when headOfficeId is null", async () => {
    mockApi.get.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useSuppliers(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.get).toHaveBeenCalledWith("/catalog/suppliers");
  });

  it("should surface errors from the API", async () => {
    mockApi.get.mockRejectedValueOnce(new ApiError("Failed", 500, ""));

    const { result } = renderHook(() => useSuppliers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
