import {
  ApiError,
  QueryClient,
  QueryClientProvider,
  api,
} from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPromotion } from "@/entities/promotion/testing/factories";
import { useLoadingStates } from "@/shared/stores/loadingStates";

import { useTogglePromotionStatus } from "../api/useTogglePromotionStatus";
import type { Promotion } from "../model/types";

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

vi.mock("@sol/ui", () => ({
  toast: {
    error: vi.fn(),
  },
}));

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
      queries: { retry: false, gcTime: 60_000 },
      mutations: { retry: false },
    },
  });

  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe("useTogglePromotionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLoadingStates.setState({
      promotionsStatus: {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the activate endpoint when activate is true", async () => {
    mockApi.patch.mockResolvedValueOnce(
      createPromotion("promo-1", "Stay 4 Pay 3", {
        isActive: true,
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTogglePromotionStatus(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        headOfficeId: "sho-1",
        promotionId: "promo-1",
        activate: true,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.patch).toHaveBeenCalledWith(
      "/catalog/promotions/promo-1/activate"
    );
  });

  it("calls the deactivate endpoint when activate is false", async () => {
    mockApi.patch.mockResolvedValueOnce(
      createPromotion("promo-1", "Stay 4 Pay 3", {
        isActive: false,
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTogglePromotionStatus(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        headOfficeId: "sho-1",
        promotionId: "promo-1",
        activate: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.patch).toHaveBeenCalledWith(
      "/catalog/promotions/promo-1/deactivate"
    );
  });

  it("tracks row loading while the mutation is in flight", async () => {
    let resolvePromise: (value: Promotion) => void;
    mockApi.patch.mockReturnValueOnce(
      new Promise<Promotion>((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTogglePromotionStatus(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        headOfficeId: "sho-1",
        promotionId: "promo-1",
        activate: false,
      });
    });

    await waitFor(() => {
      expect(useLoadingStates.getState().promotionsStatus["promo-1"]).toBe(
        true
      );
    });

    act(() => {
      resolvePromise!(
        createPromotion("promo-1", "Stay 4 Pay 3", {
          isActive: false,
        })
      );
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useLoadingStates.getState().promotionsStatus["promo-1"]).toBe(false);
  });

  it("updates promotions caches without invalidating the scoped list on success", async () => {
    mockApi.patch.mockResolvedValueOnce(
      createPromotion("promo-1", "Stay 4 Pay 3", {
        isActive: false,
      })
    );

    const { wrapper, queryClient } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");
    const initialPromotion = createPromotion("promo-1", "Stay 4 Pay 3", {
      isActive: true,
    });

    queryClient.setQueryData<Promotion[]>(["promotions"], [initialPromotion]);
    queryClient.setQueryData<Promotion[]>(
      ["promotions", "sho-1"],
      [initialPromotion]
    );

    const { result } = renderHook(() => useTogglePromotionStatus(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        headOfficeId: "sho-1",
        promotionId: "promo-1",
        activate: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData<Promotion[]>(["promotions"])).toEqual([
      {
        ...initialPromotion,
        isActive: false,
      },
    ]);
    expect(
      queryClient.getQueryData<Promotion[]>(["promotions", "sho-1"])
    ).toEqual([
      {
        ...initialPromotion,
        isActive: false,
      },
    ]);
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it("shows an error toast and clears loading when the mutation fails", async () => {
    const { toast } = await import("@sol/ui");

    mockApi.patch.mockRejectedValueOnce(
      new ApiError("Server error", 500, "Internal Server Error")
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTogglePromotionStatus(), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        headOfficeId: "sho-1",
        promotionId: "promo-1",
        activate: true,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(useLoadingStates.getState().promotionsStatus["promo-1"]).toBe(false);
  });
});
