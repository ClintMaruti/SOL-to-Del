import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdateContractedRatePlan } from "../api/useUpdateContractedRatePlan";

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

vi.mock("@sol/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@sol/ui")>();
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
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
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockUpdated = {
  id: "crp-1",
  ratePlanId: "rp-1",
  name: "Updated Plan",
  validityDateFrom: "2025-10-01",
  validityDateTo: "2025-12-31",
  payAtProperty: true,
  isActive: true,
};

describe("useUpdateContractedRatePlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call PATCH with correct endpoint and body", async () => {
    mockApi.patch.mockResolvedValueOnce(mockUpdated);

    const { result } = renderHook(() => useUpdateContractedRatePlan(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "crp-1",
        ratePlanId: "rp-1",
        name: "Updated Plan",
        validityDateFrom: "2025-10-01",
        validityDateTo: "2025-12-31",
        payAtProperty: true,
        isActive: true,
      });
    });

    expect(mockApi.patch).toHaveBeenCalledWith(
      "/catalog/contracted-rate-plans/crp-1",
      {
        name: "Updated Plan",
        validityDateFrom: "2025-10-01",
        validityDateTo: "2025-12-31",
        payAtProperty: true,
        isActive: true,
      }
    );
  });

  it("should NOT include ratePlanId in the request body", async () => {
    mockApi.patch.mockResolvedValueOnce(mockUpdated);

    const { result } = renderHook(() => useUpdateContractedRatePlan(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "crp-1",
        ratePlanId: "rp-1",
        name: "Updated Plan",
      });
    });

    const callBody = mockApi.patch.mock.calls[0][1];
    expect(callBody).not.toHaveProperty("ratePlanId");
    expect(callBody).not.toHaveProperty("id");
  });

  it("should show success toast on successful update", async () => {
    const { toast } = await import("@sol/ui");
    mockApi.patch.mockResolvedValueOnce(mockUpdated);

    const { result } = renderHook(() => useUpdateContractedRatePlan(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: "crp-1",
        ratePlanId: "rp-1",
        name: "Updated Plan",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("should show error toast on 400 error", async () => {
    const { toast } = await import("@sol/ui");
    mockApi.patch.mockRejectedValueOnce(
      new ApiError("Validation failed", 400, "Bad Request")
    );

    const { result } = renderHook(() => useUpdateContractedRatePlan(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: "crp-1",
          ratePlanId: "rp-1",
          name: "",
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("should show error toast on 404 error", async () => {
    const { toast } = await import("@sol/ui");
    mockApi.patch.mockRejectedValueOnce(
      new ApiError("Not found", 404, "Not Found")
    );

    const { result } = renderHook(() => useUpdateContractedRatePlan(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: "crp-999",
          ratePlanId: "rp-1",
          name: "Updated",
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("should show error toast on 409 conflict error", async () => {
    const { toast } = await import("@sol/ui");
    mockApi.patch.mockRejectedValueOnce(
      new ApiError("Conflict", 409, "Conflict")
    );

    const { result } = renderHook(() => useUpdateContractedRatePlan(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          id: "crp-1",
          ratePlanId: "rp-1",
          name: "Updated",
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
