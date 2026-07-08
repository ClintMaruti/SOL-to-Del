import { describe, expect, it } from "vitest";

import {
  CALENDAR_MIN_YEAR,
  getCalendarMaxYear,
  getCalendarYearOptions,
} from "../DatePicker";

describe("getCalendarYearOptions", () => {
  const ref2026 = new Date("2026-06-15T12:00:00");

  it("starts at 1970", () => {
    const years = getCalendarYearOptions(ref2026);
    expect(years[0]).toBe(CALENDAR_MIN_YEAR);
    expect(years[0]).toBe(1970);
  });

  it("includes 2025", () => {
    const years = getCalendarYearOptions(ref2026);
    expect(years).toContain(2025);
  });

  it("ends at max of current+50 and 2100 for reference date 2026", () => {
    expect(getCalendarMaxYear(ref2026)).toBe(2100);
    const years = getCalendarYearOptions(ref2026);
    expect(years[years.length - 1]).toBe(2100);
  });

  it("is contiguous from min to max", () => {
    const years = getCalendarYearOptions(ref2026);
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBe(years[i - 1] + 1);
    }
  });
});
