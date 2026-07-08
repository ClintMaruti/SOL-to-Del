import { describe, expect, it } from "vitest";

import { createSupplierHeadOfficeSubmitSchema } from "../model/schema";

const validBase = {
  name: "Serengeti Head Office",
  email: "office@example.com",
  phoneNumber: "+255712345678",
  additionalEmail: "",
  website: "",
  city: "",
  postalCode: "",
  streetAddress: "",
};

describe("createSupplierHeadOfficeSubmitSchema", () => {
  it("accepts catalog country labels normalized to ISO official names", () => {
    const result = createSupplierHeadOfficeSubmitSchema.safeParse({
      ...validBase,
      country: "Tanzania",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe("United Republic of Tanzania");
    }
  });

  it("rejects unknown country values", () => {
    const result = createSupplierHeadOfficeSubmitSchema.safeParse({
      ...validBase,
      country: "NotACountry",
    });

    expect(result.success).toBe(false);
  });
});
