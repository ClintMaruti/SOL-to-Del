import { describe, expect, it } from "vitest";

import {
  areOperatingDaysRequiredForServiceType,
  areTimesRequiredForServiceType,
} from "../model/operating-days";

describe("areTimesRequiredForServiceType", () => {
  it("is true only for flight", () => {
    expect(areTimesRequiredForServiceType("flight")).toBe(true);
    expect(areTimesRequiredForServiceType("activity")).toBe(false);
    expect(areTimesRequiredForServiceType("transportation")).toBe(false);
    expect(areTimesRequiredForServiceType("accommodation")).toBe(false);
    expect(areTimesRequiredForServiceType(undefined)).toBe(false);
  });
});

describe("areOperatingDaysRequiredForServiceType", () => {
  it("is true only for flight", () => {
    expect(areOperatingDaysRequiredForServiceType("flight")).toBe(true);
    expect(areOperatingDaysRequiredForServiceType("activity")).toBe(false);
    expect(areOperatingDaysRequiredForServiceType("transportation")).toBe(
      false
    );
    expect(areOperatingDaysRequiredForServiceType(undefined)).toBe(false);
  });
});
