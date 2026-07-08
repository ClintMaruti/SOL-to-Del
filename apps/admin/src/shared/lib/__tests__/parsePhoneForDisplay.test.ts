import { describe, expect, it } from "vitest";

import { parsePhoneForDisplay } from "../parsePhoneForDisplay";

describe("parsePhoneForDisplay", () => {
  it("returns empty value and not present for nullish and blank", () => {
    expect(parsePhoneForDisplay(undefined)).toEqual({
      value: "",
      isPresent: false,
    });
    expect(parsePhoneForDisplay(null)).toEqual({
      value: "",
      isPresent: false,
    });
    expect(parsePhoneForDisplay("   ")).toEqual({
      value: "",
      isPresent: false,
    });
  });

  it("treats plus-only strings as not present", () => {
    expect(parsePhoneForDisplay("+")).toEqual({
      value: "+",
      isPresent: false,
    });
    expect(parsePhoneForDisplay("  +  ")).toEqual({
      value: "+",
      isPresent: false,
    });
  });

  it("trims and marks present when digits exist", () => {
    expect(parsePhoneForDisplay("  +254 700 000 000  ")).toEqual({
      value: "+254 700 000 000",
      isPresent: true,
    });
  });
});
