import { describe, expect, it } from "vitest";

import { DEFAULT_CONTRACTED_RATE_PRIORITY } from "../model/schema";
import {
  createEmptyContractedRate,
  createNewRateDraftInitialData,
  INITIAL_RATE_ENTRY,
} from "../model/useRateForm";

describe("createNewRateDraftInitialData", () => {
  it("includes base rate fields from INITIAL_RATE_ENTRY", () => {
    const data = createNewRateDraftInitialData();
    expect(data.name).toBe(INITIAL_RATE_ENTRY.name);
    expect(data.chargeType).toBe(INITIAL_RATE_ENTRY.chargeType);
    expect(data.timeUnit).toBe(INITIAL_RATE_ENTRY.timeUnit);
  });

  it("starts with no contracted rates until the user adds one", () => {
    const data = createNewRateDraftInitialData();
    expect(data.contractedRates).toHaveLength(0);
  });

  it("createEmptyContractedRate matches schema defaults for a new row", () => {
    const cr = createEmptyContractedRate();
    expect(cr.net.value).toBeNull();
    expect(cr.rack.value).toBeNull();
    expect(cr.priority).toBe(DEFAULT_CONTRACTED_RATE_PRIORITY);
    expect(cr.bookingWindowFrom).toBe("");
    expect(cr.bookingWindowTo).toBe("");
    expect(cr.contractedRateDates).toHaveLength(1);
    expect(cr.contractedRateDates[0]!.travelDates).toHaveLength(1);
    expect(cr.contractedRateDates[0]!.travelDates[0]!.travelDateFrom).toBe("");
    expect(cr.contractedRateDates[0]!.travelDates[0]!.travelDateTo).toBe("");
    expect(typeof cr.clientRowKey).toBe("string");
    expect(cr.clientRowKey!.length).toBeGreaterThan(0);
  });
});
