import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Promotion, PromotionDetail } from "@/entities/promotion";

import { useCreatePromotion } from "../api/useCreatePromotion";

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

function createPromotionDetail(
  overrides?: Partial<PromotionDetail>
): PromotionDetail {
  return {
    id: "promo-2",
    name: "Stay 4 Pay 3",
    headOfficeId: "sho-1",
    isPartiallySupported: false,
    note: null,
    travelDates: [
      {
        id: "travel-1",
        from: "2027-01-01",
        to: "2027-12-31",
        version: 1,
      },
    ],
    bookingWindow: {
      from: "2027-01-01",
      to: "2027-12-31",
    },
    bookingWindowRelative: null,
    conditions: [],
    actions: [],
    isActive: false,
    version: 1,
    ...overrides,
  };
}

describe("useCreatePromotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the promotion create endpoint", async () => {
    mockApi.post.mockResolvedValueOnce(createPromotionDetail());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatePromotion("sho-1"), {
      wrapper,
    });

    const payload = {
      name: "Stay 4 Pay 3",
      isPartiallySupported: false,
      note: null,
      travelDates: [],
      bookingWindow: { from: "2027-01-01", to: "2027-12-31" },
      bookingWindowRelative: null,
      conditions: [],
      actions: [],
      isActive: false,
    };

    act(() => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.post).toHaveBeenCalledWith(
      "/catalog/head-offices/sho-1/promotions",
      payload
    );
  });

  it("updates detail and matching promotions list caches without invalidating them", async () => {
    const createdPromotion = createPromotionDetail();
    mockApi.post.mockResolvedValueOnce(createdPromotion);

    const { wrapper, queryClient } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    queryClient.setQueryData<Promotion[]>(
      ["promotions"],
      [
        {
          id: "promo-1",
          name: "Existing Promotion",
          headOfficeId: "sho-1",
          bookingWindowFrom: "2027-02-01",
          bookingWindowTo: "2027-12-31",
          isActive: true,
        },
      ]
    );
    queryClient.setQueryData<Promotion[]>(
      ["promotions", "sho-1"],
      [
        {
          id: "promo-1",
          name: "Existing Promotion",
          headOfficeId: "sho-1",
          bookingWindowFrom: "2027-02-01",
          bookingWindowTo: "2027-12-31",
          isActive: true,
        },
      ]
    );
    queryClient.setQueryData<Promotion[]>(
      ["promotions", "sho-2"],
      [
        {
          id: "promo-3",
          name: "Other Head Office Promotion",
          headOfficeId: "sho-2",
          bookingWindowFrom: "2027-03-01",
          bookingWindowTo: "2027-12-31",
          isActive: true,
        },
      ]
    );

    const { result } = renderHook(() => useCreatePromotion("sho-1"), {
      wrapper,
    });

    act(() => {
      result.current.mutate({
        name: "Stay 4 Pay 3",
        isPartiallySupported: false,
        note: null,
        travelDates: [],
        bookingWindow: { from: "2027-01-01", to: "2027-12-31" },
        bookingWindowRelative: null,
        conditions: [],
        actions: [],
        isActive: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData<PromotionDetail>(["promotion", "promo-2"])
    ).toEqual(createdPromotion);
    expect(queryClient.getQueryData<Promotion[]>(["promotions"])).toEqual([
      {
        id: "promo-2",
        name: "Stay 4 Pay 3",
        headOfficeId: "sho-1",
        bookingWindowFrom: "2027-01-01",
        bookingWindowTo: "2027-12-31",
        isActive: false,
      },
      {
        id: "promo-1",
        name: "Existing Promotion",
        headOfficeId: "sho-1",
        bookingWindowFrom: "2027-02-01",
        bookingWindowTo: "2027-12-31",
        isActive: true,
      },
    ]);
    expect(
      queryClient.getQueryData<Promotion[]>(["promotions", "sho-1"])
    ).toEqual([
      {
        id: "promo-2",
        name: "Stay 4 Pay 3",
        headOfficeId: "sho-1",
        bookingWindowFrom: "2027-01-01",
        bookingWindowTo: "2027-12-31",
        isActive: false,
      },
      {
        id: "promo-1",
        name: "Existing Promotion",
        headOfficeId: "sho-1",
        bookingWindowFrom: "2027-02-01",
        bookingWindowTo: "2027-12-31",
        isActive: true,
      },
    ]);
    expect(
      queryClient.getQueryData<Promotion[]>(["promotions", "sho-2"])
    ).toEqual([
      {
        id: "promo-3",
        name: "Other Head Office Promotion",
        headOfficeId: "sho-2",
        bookingWindowFrom: "2027-03-01",
        bookingWindowTo: "2027-12-31",
        isActive: true,
      },
    ]);
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });
});
