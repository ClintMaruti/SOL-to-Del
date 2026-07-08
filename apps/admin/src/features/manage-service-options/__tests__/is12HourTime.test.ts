import { describe, expect, it } from "vitest";

import { isValid12HourTime } from "../model/is12HourTime";

describe("isValid12HourTime", () => {
  it("accepts canonical 12-hour times", () => {
    expect(isValid12HourTime("12:00 AM")).toBe(true);
    expect(isValid12HourTime("9:00 AM")).toBe(true);
    expect(isValid12HourTime("10:00 PM")).toBe(true);
    expect(isValid12HourTime("11:34 PM")).toBe(true);
    expect(isValid12HourTime("12:00 PM")).toBe(true);
  });

  it("accepts case-insensitive period", () => {
    expect(isValid12HourTime("10:00 pm")).toBe(true);
  });

  it("rejects 24-hour-only strings and invalid values", () => {
    expect(isValid12HourTime("00:00")).toBe(false);
    expect(isValid12HourTime("09:00")).toBe(false);
    expect(isValid12HourTime("23:59")).toBe(false);
    expect(isValid12HourTime("24:00")).toBe(false);
    expect(isValid12HourTime("13:00 PM")).toBe(false);
    expect(isValid12HourTime("")).toBe(false);
    expect(isValid12HourTime(" 10:00 PM ")).toBe(true);
  });
});
