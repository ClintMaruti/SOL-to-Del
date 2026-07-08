import { describe, expect, it } from "vitest";

import { formatItineraryTableDate } from "../model/formatItineraryTableDate";

describe("formatItineraryTableDate", () => {
  it("formats YYYY-MM-DD without timezone drift", () => {
    expect(formatItineraryTableDate("2026-03-01")).toMatch(/^01 Mar 2026$/);
  });

  it("formats full ISO datetimes without Invalid Date", () => {
    const out = formatItineraryTableDate("2026-05-11T12:09:24.262899Z");
    expect(out).not.toContain("Invalid");
    expect(out).toMatch(/^11 May 2026$/);
  });
});
