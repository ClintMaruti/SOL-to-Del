import { describe, expect, it } from "vitest";

import {
  parseFutureUpliftNumber,
  validateFutureUpliftInput,
} from "../validation";

describe("validateFutureUpliftInput", () => {
  it("returns error for empty string", () => {
    expect(validateFutureUpliftInput("")).toBeDefined();
    expect(validateFutureUpliftInput("   ")).toBeDefined();
  });

  it("returns error for non-numeric", () => {
    expect(validateFutureUpliftInput("abc")).toBeDefined();
  });

  it("returns error for zero or negative", () => {
    expect(validateFutureUpliftInput("0")).toBeDefined();
    expect(validateFutureUpliftInput("-1")).toBeDefined();
  });

  it("returns undefined for valid positive decimals", () => {
    expect(validateFutureUpliftInput("15")).toBeUndefined();
    expect(validateFutureUpliftInput("0.5")).toBeUndefined();
    expect(validateFutureUpliftInput("12.25")).toBeUndefined();
  });
});

describe("parseFutureUpliftNumber", () => {
  it("returns null for empty", () => {
    expect(parseFutureUpliftNumber("")).toBeNull();
  });

  it("parses finite numbers", () => {
    expect(parseFutureUpliftNumber("15")).toBe(15);
    expect(parseFutureUpliftNumber("3.14")).toBeCloseTo(3.14);
  });
});
