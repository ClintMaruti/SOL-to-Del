import { describe, expect, it } from "vitest";

import { emptyEditExtraFormValues } from "../../model/schema";
import { travelDatesHaveZeroPrice } from "../travel-dates-has-zero-price";

describe("travelDatesHaveZeroPrice", () => {
  it("returns false when contracted extra is not configured", () => {
    const values = emptyEditExtraFormValues();
    expect(travelDatesHaveZeroPrice(values.contracted)).toBe(false);
  });

  it("returns true when any money field is explicitly zero", () => {
    const values = emptyEditExtraFormValues();
    values.contracted.contractId = "contract-1";
    values.contracted.travelDates[0].sell = "0";
    expect(travelDatesHaveZeroPrice(values.contracted)).toBe(true);
  });
});
