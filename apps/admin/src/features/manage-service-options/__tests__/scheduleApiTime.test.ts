import { describe, expect, it } from "vitest";

import {
  backendScheduleTimeToForm,
  canonicalize12HourTime,
  toApi12HourTime,
} from "../model/scheduleApiTime";

describe("canonicalize12HourTime", () => {
  it("returns empty for whitespace-only", () => {
    expect(canonicalize12HourTime("")).toBe("");
    expect(canonicalize12HourTime("   ")).toBe("");
  });

  it("normalizes API-style 12h strings", () => {
    expect(canonicalize12HourTime("10:00 PM")).toBe("10:00 PM");
    expect(canonicalize12HourTime("11:34 PM")).toBe("11:34 PM");
    expect(canonicalize12HourTime("9:05 AM")).toBe("9:05 AM");
  });

  it("accepts lowercase period and extra spaces before AM/PM", () => {
    expect(canonicalize12HourTime("10:00 pm")).toBe("10:00 PM");
    expect(canonicalize12HourTime("11:34  PM")).toBe("11:34 PM");
  });

  it("rejects invalid 12h values", () => {
    expect(canonicalize12HourTime("0:15 AM")).toBe("");
    expect(canonicalize12HourTime("13:00 PM")).toBe("");
    expect(canonicalize12HourTime("12:60 AM")).toBe("");
    expect(canonicalize12HourTime("09:00")).toBe("");
    expect(canonicalize12HourTime("not-a-time")).toBe("");
  });
});

describe("backendScheduleTimeToForm", () => {
  it("returns empty for null, undefined, or whitespace-only", () => {
    expect(backendScheduleTimeToForm(null)).toBe("");
    expect(backendScheduleTimeToForm(undefined)).toBe("");
    expect(backendScheduleTimeToForm("")).toBe("");
    expect(backendScheduleTimeToForm("   ")).toBe("");
  });

  it("passes through canonical 12h API strings", () => {
    expect(backendScheduleTimeToForm("10:00 PM")).toBe("10:00 PM");
    expect(backendScheduleTimeToForm("11:34 pm")).toBe("11:34 PM");
  });

  it("converts legacy 24h local times to 12h", () => {
    expect(backendScheduleTimeToForm("08:15:00")).toBe("8:15 AM");
    expect(backendScheduleTimeToForm("9:05:00")).toBe("9:05 AM");
    expect(backendScheduleTimeToForm("17:45:30")).toBe("5:45 PM");
    expect(backendScheduleTimeToForm("23:59")).toBe("11:59 PM");
    expect(backendScheduleTimeToForm("00:15")).toBe("12:15 AM");
    expect(backendScheduleTimeToForm("12:00:00")).toBe("12:00 PM");
    expect(backendScheduleTimeToForm("00:00:00")).toBe("12:00 AM");
  });

  it("handles fractional seconds on legacy 24h", () => {
    expect(backendScheduleTimeToForm("23:59:59.123")).toBe("11:59 PM");
  });

  it("returns empty for unparseable strings", () => {
    expect(backendScheduleTimeToForm("09:30:00Z")).toBe("");
    expect(backendScheduleTimeToForm("not-a-time")).toBe("");
  });
});

describe("toApi12HourTime", () => {
  it("canonicalizes trimmed 12h for payloads", () => {
    expect(toApi12HourTime("10:00 pm")).toBe("10:00 PM");
    expect(toApi12HourTime("")).toBe("");
  });
});
