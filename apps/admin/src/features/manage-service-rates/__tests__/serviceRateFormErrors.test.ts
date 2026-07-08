import { describe, expect, it } from "vitest";

import { zodFieldErrorsToTanStackFields } from "../model/serviceRateFormErrors";
import { serviceRateFormSchema } from "../model/schema";

describe("serviceRateFormErrors", () => {
  it("maps zod field errors to tanstack form fields shape", () => {
    const parsed = serviceRateFormSchema.safeParse({
      name: "",
      chargeType: "Person",
      timeUnit: "Night",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) {
      return;
    }

    const fields = zodFieldErrorsToTanStackFields(
      parsed.error.flatten().fieldErrors
    );
    expect(fields.name).toBeTruthy();
    expect(typeof fields.name).toBe("string");
  });
});
