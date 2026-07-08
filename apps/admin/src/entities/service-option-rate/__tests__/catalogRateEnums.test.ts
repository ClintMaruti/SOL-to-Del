import { describe, expect, it } from "vitest";

import {
  normalizeWeekdaysFromApi,
  weekdaysForUiDisplay,
  weekdaysToApiArray,
} from "../model/catalogRateEnums";

describe("catalog rate weekdays helpers", () => {
  it("normalizeWeekdaysFromApi joins arrays and keeps non-empty strings", () => {
    expect(normalizeWeekdaysFromApi(["MON", "TUE"])).toBe("MON,TUE");
    expect(normalizeWeekdaysFromApi("MON,TUE")).toBe("MON,TUE");
    expect(normalizeWeekdaysFromApi([])).toBeUndefined();
    expect(normalizeWeekdaysFromApi("")).toBeUndefined();
    expect(normalizeWeekdaysFromApi(undefined)).toBeUndefined();
  });

  it("weekdaysToApiArray splits comma-separated codes", () => {
    expect(weekdaysToApiArray("MON,WED")).toEqual(["MON", "WED"]);
    expect(weekdaysToApiArray("")).toEqual([]);
    expect(weekdaysToApiArray(undefined)).toEqual([]);
  });

  it("weekdaysForUiDisplay hides all seven days (API default / unrestricted)", () => {
    expect(weekdaysForUiDisplay("MON,TUE,WED,THU,FRI,SAT,SUN")).toEqual([]);
    expect(weekdaysForUiDisplay("MON, TUE, WED, THU, FRI, SAT, SUN")).toEqual(
      []
    );
  });

  it("weekdaysForUiDisplay shows a proper subset", () => {
    expect(weekdaysForUiDisplay("MON,WED,FRI")).toEqual(["MON", "WED", "FRI"]);
  });
});
