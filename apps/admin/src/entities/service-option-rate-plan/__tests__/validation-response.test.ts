import { normalizeValidationErrorsFromBody } from "@sol/api-client";
import { describe, expect, it } from "vitest";

describe("normalizeValidationErrorsFromBody", () => {
  it("normalizes ASP.NET errors dictionary with string arrays", () => {
    expect(
      normalizeValidationErrorsFromBody({
        errors: { Name: ["Required", "Too short"] },
      })
    ).toEqual({ Name: ["Required", "Too short"] });
  });

  it("normalizes string values in errors map", () => {
    expect(
      normalizeValidationErrorsFromBody({
        errors: { Field: "Single message" },
      })
    ).toEqual({ Field: ["Single message"] });
  });

  it("normalizes legacy array of propertyName / errorMessage", () => {
    expect(
      normalizeValidationErrorsFromBody([
        { propertyName: "Min", errorMessage: "Invalid" },
        { propertyName: "Max", errorMessage: "Also bad" },
      ])
    ).toEqual({
      Min: ["Invalid"],
      Max: ["Also bad"],
    });
  });

  it("returns undefined for empty input", () => {
    expect(normalizeValidationErrorsFromBody(null)).toBeUndefined();
    expect(normalizeValidationErrorsFromBody({})).toBeUndefined();
  });
});
