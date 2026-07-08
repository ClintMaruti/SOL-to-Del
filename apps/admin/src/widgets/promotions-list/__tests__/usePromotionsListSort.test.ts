import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createPromotion } from "@/entities/promotion/testing/factories";

import { usePromotionsListSort } from "../model/usePromotionsListSort";

const promotions = [
  createPromotion("promo-1", "Gamma Offer", {
    bookingWindowFrom: "2027-03-01",
    bookingWindowTo: "2027-06-30",
    isActive: true,
  }),
  createPromotion("promo-2", "Alpha Offer", {
    bookingWindowFrom: "2027-05-01",
    bookingWindowTo: "2027-08-31",
    isActive: false,
  }),
  createPromotion("promo-3", "Beta Offer", {
    bookingWindowFrom: "2027-01-01",
    bookingWindowTo: "2027-04-30",
    isActive: true,
  }),
  createPromotion("promo-4", "Delta Offer", {
    bookingWindowFrom: "2026-12-01",
    bookingWindowTo: "2027-01-31",
    isActive: false,
  }),
];

describe("usePromotionsListSort", () => {
  it("returns promotions in their incoming order by default", () => {
    const { result } = renderHook(() => usePromotionsListSort(promotions));

    expect(result.current.sortState.field).toBeNull();
    expect(result.current.sortState.direction).toBe("asc");
    expect(
      result.current.sortedPromotions.map((promotion) => promotion.id)
    ).toEqual(["promo-1", "promo-2", "promo-3", "promo-4"]);
  });

  it("sorts by promotion name and toggles direction on repeated clicks", () => {
    const { result } = renderHook(() => usePromotionsListSort(promotions));

    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.sortState.field).toBe("name");
    expect(result.current.sortState.direction).toBe("asc");
    expect(
      result.current.sortedPromotions.map((promotion) => promotion.name)
    ).toEqual(["Alpha Offer", "Beta Offer", "Delta Offer", "Gamma Offer"]);

    act(() => {
      result.current.toggleSort("name");
    });

    expect(result.current.sortState.direction).toBe("desc");
    expect(
      result.current.sortedPromotions.map((promotion) => promotion.name)
    ).toEqual(["Gamma Offer", "Delta Offer", "Beta Offer", "Alpha Offer"]);
  });

  it("sorts by bookingWindowFrom", () => {
    const { result } = renderHook(() => usePromotionsListSort(promotions));

    act(() => {
      result.current.toggleSort("bookingWindowFrom");
    });

    expect(
      result.current.sortedPromotions.map(
        (promotion) => promotion.bookingWindowFrom
      )
    ).toEqual(["2026-12-01", "2027-01-01", "2027-03-01", "2027-05-01"]);
  });

  it("sorts by bookingWindowTo", () => {
    const { result } = renderHook(() => usePromotionsListSort(promotions));

    act(() => {
      result.current.toggleSort("bookingWindowTo");
    });

    expect(
      result.current.sortedPromotions.map(
        (promotion) => promotion.bookingWindowTo
      )
    ).toEqual(["2027-01-31", "2027-04-30", "2027-06-30", "2027-08-31"]);
  });

  it("sorts by active status", () => {
    const { result } = renderHook(() => usePromotionsListSort(promotions));

    act(() => {
      result.current.toggleSort("isActive");
    });

    expect(
      result.current.sortedPromotions.map((promotion) => promotion.id)
    ).toEqual(["promo-1", "promo-3", "promo-2", "promo-4"]);

    act(() => {
      result.current.toggleSort("isActive");
    });

    expect(
      result.current.sortedPromotions.map((promotion) => promotion.id)
    ).toEqual(["promo-2", "promo-4", "promo-1", "promo-3"]);
  });

  it("keeps the incoming row order as a tie-breaker for non-status sorts", () => {
    const tiedPromotions = [
      createPromotion("promo-a", "Same End Date", {
        bookingWindowFrom: "2027-03-01",
        bookingWindowTo: "2027-12-31",
        isActive: true,
      }),
      createPromotion("promo-b", "Same End Date", {
        bookingWindowFrom: "2027-05-01",
        bookingWindowTo: "2027-12-31",
        isActive: false,
      }),
      createPromotion("promo-c", "Same End Date", {
        bookingWindowFrom: "2027-01-01",
        bookingWindowTo: "2027-12-31",
        isActive: true,
      }),
    ];

    const { result } = renderHook(() => usePromotionsListSort(tiedPromotions));

    act(() => {
      result.current.toggleSort("bookingWindowTo");
    });

    expect(
      result.current.sortedPromotions.map((promotion) => promotion.id)
    ).toEqual(["promo-a", "promo-b", "promo-c"]);
  });

  it("keeps the incoming row order as a tie-breaker when sorting by status", () => {
    const tiedPromotions = [
      createPromotion("promo-a", "Zulu", {
        bookingWindowFrom: "2027-03-01",
        isActive: true,
      }),
      createPromotion("promo-b", "Alpha", {
        bookingWindowFrom: "2027-05-01",
        isActive: true,
      }),
      createPromotion("promo-c", "Bravo", {
        bookingWindowFrom: "2027-01-01",
        isActive: false,
      }),
    ];

    const { result } = renderHook(() => usePromotionsListSort(tiedPromotions));

    act(() => {
      result.current.toggleSort("isActive");
    });

    expect(
      result.current.sortedPromotions.map((promotion) => promotion.id)
    ).toEqual(["promo-a", "promo-b", "promo-c"]);
  });
});
