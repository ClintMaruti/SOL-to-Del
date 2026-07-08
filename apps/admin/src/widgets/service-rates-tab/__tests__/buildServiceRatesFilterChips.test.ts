import { describe, expect, it } from "vitest";

import { buildServiceRatesFilterChips } from "../lib/buildServiceRatesFilterChips";

const t = ((key: string, opts?: Record<string, string>) => {
  if (opts) {
    return `${key}:${JSON.stringify(opts)}`;
  }
  return key;
}) as Parameters<typeof buildServiceRatesFilterChips>[0]["t"];

describe("buildServiceRatesFilterChips", () => {
  it("builds chips for all active filter dimensions", () => {
    const chips = buildServiceRatesFilterChips({
      filterState: {
        contractId: "c1",
        optionIds: ["opt-1", "opt-2"],
        rateIds: ["rate-1"],
        travelDateFrom: "2025-01-01",
        travelDateTo: "2025-06-30",
        chargeTypes: ["Person"],
      },
      options: [
        { id: "opt-1", title: "FB" },
        { id: "opt-2", title: "GP" },
      ] as never,
      rates: [{ id: "rate-1", name: "Single" }] as never,
      t,
    });

    expect(chips.map((c) => c.key)).toEqual([
      "options",
      "chargeTypes",
      "rates",
      "travelDateFrom",
      "travelDateTo",
    ]);
  });

  it("returns empty array when no filters active", () => {
    const chips = buildServiceRatesFilterChips({
      filterState: {
        contractId: "c1",
        optionIds: [],
        rateIds: [],
        travelDateFrom: null,
        travelDateTo: null,
        chargeTypes: [],
      },
      options: [],
      rates: [],
      t,
    });

    expect(chips).toEqual([]);
  });
});
