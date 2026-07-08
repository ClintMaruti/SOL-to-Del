import { describe, expect, it } from "vitest";

import {
  hasOptionFormErrors,
  toOptionFormErrors,
} from "../model/apiValidationErrors";

describe("option API validation errors", () => {
  it("maps ServiceOption_TitleMinLength to the option title field", () => {
    const formErrors = toOptionFormErrors({
      ServiceOption_TitleMinLength: ["Title must be at least 2 characters"],
    });

    expect(formErrors.title).toBe("Title must be at least 2 characters");
    expect(hasOptionFormErrors(formErrors)).toBe(true);
  });

  it("maps normalized title keys to the option title field", () => {
    const formErrors = toOptionFormErrors({
      ServiceOption_Title: ["Title already exists"],
    });

    expect(formErrors.title).toBe("Title already exists");
  });

  it("ignores unmapped validation keys", () => {
    const formErrors = toOptionFormErrors({
      Unknown_Field: ["No field"],
    });

    expect(hasOptionFormErrors(formErrors)).toBe(false);
  });
});
