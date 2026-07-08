import { describe, expect, it } from "vitest";

import { parseStarRating } from "../model/types";

describe("parseStarRating", () => {
  it("returns 0 for nullish or empty", () => {
    expect(parseStarRating(undefined)).toBe(0);
    expect(parseStarRating(null)).toBe(0);
    expect(parseStarRating("")).toBe(0);
  });

  it("accepts valid numbers", () => {
    expect(parseStarRating(0)).toBe(0);
    expect(parseStarRating(5)).toBe(5);
    expect(parseStarRating(3.7)).toBe(4);
  });

  it("coerces numeric strings from API", () => {
    expect(parseStarRating("0")).toBe(0);
    expect(parseStarRating(" 5 ")).toBe(5);
    expect(parseStarRating("3")).toBe(3);
  });

  it("maps C# StarRating enum names when serialized as strings", () => {
    expect(parseStarRating("NotRated")).toBe(0);
    expect(parseStarRating("OneStar")).toBe(1);
    expect(parseStarRating("FiveStars")).toBe(5);
  });

  it("returns 0 for out-of-range or invalid values", () => {
    expect(parseStarRating(99)).toBe(0);
    expect(parseStarRating(-1)).toBe(0);
    expect(parseStarRating("nope")).toBe(0);
    expect(parseStarRating(Number.NaN)).toBe(0);
  });
});
