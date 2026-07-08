import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ServiceRate } from "@/entities/service-rate";

import { useServiceRatesIdentitySort } from "../model/useServiceRatesIdentitySort";

const rates: ServiceRate[] = [
  {
    id: "1",
    serviceId: "svc",
    name: "Zebra",
    chargeType: "Unit",
    timeUnit: "Night",
    currency: "USD",
    version: 1,
  },
  {
    id: "2",
    serviceId: "svc",
    name: "Alpha",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    version: 1,
  },
];

describe("useServiceRatesIdentitySort", () => {
  it("preserves server order when no sort field is active", () => {
    const { result } = renderHook(() => useServiceRatesIdentitySort(rates));
    expect(result.current.sortedRates.map((r) => r.name)).toEqual([
      "Zebra",
      "Alpha",
    ]);
  });

  it("sorts by name ascending then descending", () => {
    const { result } = renderHook(() => useServiceRatesIdentitySort(rates));

    act(() => {
      result.current.handleSort("name", "asc");
    });
    expect(result.current.sortedRates.map((r) => r.name)).toEqual([
      "Alpha",
      "Zebra",
    ]);

    act(() => {
      result.current.handleSort("name", "desc");
    });
    expect(result.current.sortedRates.map((r) => r.name)).toEqual([
      "Zebra",
      "Alpha",
    ]);
  });

  it("sorts by charge type", () => {
    const { result } = renderHook(() => useServiceRatesIdentitySort(rates));

    act(() => {
      result.current.handleSort("chargeType", "asc");
    });
    expect(result.current.sortedRates.map((r) => r.chargeType)).toEqual([
      "Person",
      "Unit",
    ]);
  });
});
