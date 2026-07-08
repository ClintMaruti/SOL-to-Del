import { QueryClient, QueryClientProvider, api } from "@sol/api-client";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Promotion, PromotionDetail } from "@/entities/promotion";

import { useUpdatePromotion } from "../api/useUpdatePromotion";

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
    id: "promo-1",
    name: "Long Stay Discount",
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
    bookingWindowRelative: {
      fromDays: 0,
      toDays: 0,
    },
    conditions: [
      {
        id: "condition-1",
        type: "SupplierNights",
        supplierId: "sup-1",
        serviceId: null,
        optionText: null,
        paxType: "Any",
        nights: {
          min: 5,
          max: 0,
        },
        suppliers: {
          min: 0,
          max: 0,
        },
        nightsTotal: {
          min: 0,
          max: 0,
        },
        paxCount: {
          min: 0,
          max: 0,
        },
        age: {
          min: 0,
          max: 0,
        },
        version: 1,
      },
    ],
    actions: [
      {
        id: "action-1",
        type: "DiscountPercentage",
        addOn: null,
        discount: {
          id: "discount-row-1",
          discountPercent: 15,
          targetType: "Nights",
          paxType: "Any",
          paxIndexFrom: 0,
          paxIndexTo: 0,
          targetNightsType: "Cheapest",
          nightsIndexFrom: 0,
          nightsIndexTo: 0,
          version: 1,
        },
        version: 1,
      },
    ],
    isActive: true,
    version: 1,
    createdAt: "2026-04-06T09:30:00.000Z",
    updatedAt: "2026-04-06T09:30:00.000Z",
    createdBy: "Amelia Earhart",
    updatedBy: "Amelia Earhart",
    ...overrides,
  };
}

describe("useUpdatePromotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the promotion update endpoint", async () => {
    mockApi.put.mockResolvedValueOnce(createPromotionDetail({ version: 2 }));

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useUpdatePromotion("sho-1", "promo-1"),
      { wrapper }
    );

    const payload = {
      version: 1,
      name: "Updated Long Stay Discount",
      isPartiallySupported: false,
      note: null,
      travelDates: [
        {
          id: "travel-1",
          version: 1,
          from: "2027-03-01",
          to: "2027-11-30",
        },
      ],
      bookingWindow: { from: "2027-01-15", to: "2027-09-30" },
      bookingWindowRelative: null,
      conditions: [],
      actions: [],
      isActive: false,
    };

    act(() => {
      result.current.mutate(payload);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi.put).toHaveBeenCalledWith(
      "/catalog/promotions/promo-1",
      payload
    );
  });

  it("updates detail and list caches without invalidating them", async () => {
    const updatedPromotion = createPromotionDetail({
      name: "Updated Long Stay Discount",
      bookingWindow: {
        from: "2027-01-15",
        to: "2027-09-30",
      },
      isActive: false,
      version: 2,
    });
    mockApi.put.mockResolvedValueOnce(updatedPromotion);

    const { wrapper, queryClient } = createWrapper();
    const invalidateQueriesSpy = vi.spyOn(queryClient, "invalidateQueries");

    queryClient.setQueryData<PromotionDetail>(
      ["promotion", "promo-1"],
      createPromotionDetail()
    );
    queryClient.setQueryData<Promotion[]>(
      ["promotions", "sho-1"],
      [
        {
          id: "promo-1",
          name: "Long Stay Discount",
          headOfficeId: "sho-1",
          bookingWindowFrom: "2027-01-01",
          bookingWindowTo: "2027-12-31",
          isActive: true,
        },
      ]
    );
    queryClient.setQueryData<Promotion[]>(
      ["promotions"],
      [
        {
          id: "promo-1",
          name: "Long Stay Discount",
          headOfficeId: "sho-1",
          bookingWindowFrom: "2027-01-01",
          bookingWindowTo: "2027-12-31",
          isActive: true,
        },
      ]
    );

    const { result } = renderHook(
      () => useUpdatePromotion("sho-1", "promo-1"),
      { wrapper }
    );

    act(() => {
      result.current.mutate({
        version: 1,
        name: "Updated Long Stay Discount",
        isPartiallySupported: false,
        note: null,
        travelDates: [
          {
            id: "travel-1",
            version: 1,
            from: "2027-03-01",
            to: "2027-11-30",
          },
        ],
        bookingWindow: { from: "2027-01-15", to: "2027-09-30" },
        bookingWindowRelative: null,
        conditions: [],
        actions: [],
        isActive: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryData<PromotionDetail>(["promotion", "promo-1"])
    ).toEqual(updatedPromotion);
    expect(
      queryClient.getQueryData<Promotion[]>(["promotions", "sho-1"])
    ).toEqual([
      {
        id: "promo-1",
        name: "Updated Long Stay Discount",
        headOfficeId: "sho-1",
        bookingWindowFrom: "2027-01-15",
        bookingWindowTo: "2027-09-30",
        isActive: false,
      },
    ]);
    expect(queryClient.getQueryData<Promotion[]>(["promotions"])).toEqual([
      {
        id: "promo-1",
        name: "Updated Long Stay Discount",
        headOfficeId: "sho-1",
        bookingWindowFrom: "2027-01-15",
        bookingWindowTo: "2027-09-30",
        isActive: false,
      },
    ]);
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });
});
