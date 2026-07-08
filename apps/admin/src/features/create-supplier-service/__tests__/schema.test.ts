import { describe, expect, it } from "vitest";

import {
  createSupplierServiceSubmitSchema,
  hasFromToFields,
  hasLocationField,
  isToFieldRequired,
} from "../model/schema";

describe("hasLocationField", () => {
  it.each(["accommodation", "fee", "other"])(
    "should return true for %s",
    (type) => {
      expect(hasLocationField(type)).toBe(true);
    }
  );

  it.each(["flight", "transportation", "activity", ""])(
    "should return false for %s",
    (type) => {
      expect(hasLocationField(type)).toBe(false);
    }
  );
});

describe("hasFromToFields", () => {
  it.each(["flight", "transportation", "activity"])(
    "should return true for %s",
    (type) => {
      expect(hasFromToFields(type)).toBe(true);
    }
  );

  it.each(["accommodation", "fee", "other", ""])(
    "should return false for %s",
    (type) => {
      expect(hasFromToFields(type)).toBe(false);
    }
  );
});

describe("isToFieldRequired", () => {
  it("should return true for flight", () => {
    expect(isToFieldRequired("flight")).toBe(true);
  });

  it.each(["accommodation", "activity", "transportation", "fee", "other", ""])(
    "should return false for %s",
    (type) => {
      expect(isToFieldRequired(type)).toBe(false);
    }
  );
});

describe("createSupplierServiceSubmitSchema", () => {
  const baseInput = {
    name: "Safari Camp",
    alternativeName: "",
    serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
    serviceTypeName: "accommodation",
    locationId: "",
    fromLocationId: "",
    toLocationId: "",
    description: "",
  };

  describe("Name handling", () => {
    it("should trim whitespace from name", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        ...baseInput,
        name: "  Safari Camp  ",
      });

      expect(result.name).toBe("Safari Camp");
    });

    it("should reject empty name", () => {
      expect(() =>
        createSupplierServiceSubmitSchema.parse({ ...baseInput, name: "" })
      ).toThrow("Service Name is required");
    });

    it("should reject whitespace-only name", () => {
      expect(() =>
        createSupplierServiceSubmitSchema.parse({ ...baseInput, name: "   " })
      ).toThrow("Service Name is required");
    });

    it("should reject name shorter than 3 characters", () => {
      expect(() =>
        createSupplierServiceSubmitSchema.parse({ ...baseInput, name: "AB" })
      ).toThrow("Service Name must be at least 3 characters");
    });

    it("should accept name with exactly 3 characters", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        ...baseInput,
        name: "ABC",
      });
      expect(result.name).toBe("ABC");
    });

    it("should accept name with exactly 64 characters", () => {
      const longName = "A".repeat(64);
      const result = createSupplierServiceSubmitSchema.parse({
        ...baseInput,
        name: longName,
      });
      expect(result.name).toBe(longName);
    });

    it("should reject name longer than 64 characters", () => {
      expect(() =>
        createSupplierServiceSubmitSchema.parse({
          ...baseInput,
          name: "A".repeat(65),
        })
      ).toThrow("Service Name must be at most 64 characters");
    });
  });

  describe("Alternative name", () => {
    it("should return undefined for empty alternativeName", () => {
      const result = createSupplierServiceSubmitSchema.parse(baseInput);
      expect(result.alternativeName).toBeUndefined();
    });

    it("should return undefined for whitespace-only alternativeName", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        ...baseInput,
        alternativeName: "   ",
      });
      expect(result.alternativeName).toBeUndefined();
    });

    it("should trim and preserve non-empty alternativeName", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        ...baseInput,
        alternativeName: "  Dunia Camp  ",
      });
      expect(result.alternativeName).toBe("Dunia Camp");
    });
  });

  describe("Location field — Accommodation, Fee, Other", () => {
    it.each(["accommodation", "fee", "other"])(
      "should include locationId when serviceTypeName is %s",
      (type) => {
        const result = createSupplierServiceSubmitSchema.parse({
          ...baseInput,
          serviceTypeName: type,
          locationId: "loc-123",
        });

        expect(result.locationId).toBe("loc-123");
      }
    );

    it.each(["accommodation", "fee", "other"])(
      "should return undefined locationId when empty for %s",
      (type) => {
        const result = createSupplierServiceSubmitSchema.parse({
          ...baseInput,
          serviceTypeName: type,
          locationId: "",
        });

        expect(result.locationId).toBeUndefined();
      }
    );

    it.each(["flight", "transportation", "activity"])(
      "should strip locationId when serviceTypeName is %s",
      (type) => {
        const result = createSupplierServiceSubmitSchema.parse({
          ...baseInput,
          serviceTypeName: type,
          locationId: "loc-123",
        });

        expect(result.locationId).toBeUndefined();
      }
    );
  });

  describe("From/To fields — Flight, Transportation, Activity", () => {
    it.each(["flight", "transportation", "activity"])(
      "should include fromLocationId and toLocationId for %s",
      (type) => {
        const result = createSupplierServiceSubmitSchema.parse({
          ...baseInput,
          serviceTypeName: type,
          fromLocationId: "from-123",
          toLocationId: "to-456",
        });

        expect(result.fromLocationId).toBe("from-123");
        expect(result.toLocationId).toBe("to-456");
      }
    );

    it.each(["flight", "transportation", "activity"])(
      "should return undefined for empty from/to on %s",
      (type) => {
        const result = createSupplierServiceSubmitSchema.parse({
          ...baseInput,
          serviceTypeName: type,
          fromLocationId: "",
          toLocationId: "",
        });

        expect(result.fromLocationId).toBeUndefined();
        expect(result.toLocationId).toBeUndefined();
      }
    );

    it.each(["accommodation", "fee", "other"])(
      "should strip from/to when serviceTypeName is %s",
      (type) => {
        const result = createSupplierServiceSubmitSchema.parse({
          ...baseInput,
          serviceTypeName: type,
          fromLocationId: "from-123",
          toLocationId: "to-456",
        });

        expect(result.fromLocationId).toBeUndefined();
        expect(result.toLocationId).toBeUndefined();
      }
    );
  });

  describe("Description", () => {
    it("should return undefined for empty description", () => {
      const result = createSupplierServiceSubmitSchema.parse(baseInput);
      expect(result.description).toBeUndefined();
    });

    it("should return undefined for whitespace-only description", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        ...baseInput,
        description: "   ",
      });
      expect(result.description).toBeUndefined();
    });

    it("should trim and preserve non-empty description", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        ...baseInput,
        description: "  A great safari camp  ",
      });
      expect(result.description).toBe("A great safari camp");
    });
  });

  describe("serviceTypeId output", () => {
    it("should include serviceTypeId in the output", () => {
      const result = createSupplierServiceSubmitSchema.parse(baseInput);
      expect(result.serviceTypeId).toBe("14eeea9e-603e-41da-b77d-3c745e1e5da9");
    });

    it("should not include serviceTypeName in the output", () => {
      const result = createSupplierServiceSubmitSchema.parse(baseInput);
      expect(result).not.toHaveProperty("serviceTypeName");
    });
  });

  describe("Full payload — Accommodation", () => {
    it("should produce correct output for accommodation", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        name: "Safari Camp",
        alternativeName: "Dunia Camp",
        serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
        serviceTypeName: "accommodation",
        locationId: "loc-serengeti",
        fromLocationId: "ignored-from",
        toLocationId: "ignored-to",
        description: "Luxury tented camp",
      });

      expect(result).toEqual({
        name: "Safari Camp",
        alternativeName: "Dunia Camp",
        serviceTypeId: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
        locationId: "loc-serengeti",
        fromLocationId: undefined,
        toLocationId: undefined,
        description: "Luxury tented camp",
      });
    });
  });

  describe("Full payload — Flight", () => {
    it("should produce correct output for flight", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        name: "NBO to ARK",
        alternativeName: "",
        serviceTypeId: "a5d4151d-d125-4fca-af9d-3e05f5699d5c",
        serviceTypeName: "flight",
        locationId: "ignored-loc",
        fromLocationId: "nbo-id",
        toLocationId: "ark-id",
        description: "Domestic flight",
      });

      expect(result).toEqual({
        name: "NBO to ARK",
        alternativeName: undefined,
        serviceTypeId: "a5d4151d-d125-4fca-af9d-3e05f5699d5c",
        locationId: undefined,
        fromLocationId: "nbo-id",
        toLocationId: "ark-id",
        description: "Domestic flight",
      });
    });
  });

  describe("Full payload — Transportation", () => {
    it("should include fromLocationId and toLocationId when both provided", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        name: "Airport Transfer",
        alternativeName: "JRO to Arusha",
        serviceTypeId: "aff9c2d3-cdf2-4100-b9d2-dcf238265c96",
        serviceTypeName: "transportation",
        locationId: "ignored-loc",
        fromLocationId: "jro-id",
        toLocationId: "arusha-id",
        description: "Private transfer",
      });

      expect(result).toEqual({
        name: "Airport Transfer",
        alternativeName: "JRO to Arusha",
        serviceTypeId: "aff9c2d3-cdf2-4100-b9d2-dcf238265c96",
        locationId: undefined,
        fromLocationId: "jro-id",
        toLocationId: "arusha-id",
        description: "Private transfer",
      });
    });

    it("should allow empty toLocationId (optional)", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        name: "Airport Transfer",
        alternativeName: "",
        serviceTypeId: "aff9c2d3-cdf2-4100-b9d2-dcf238265c96",
        serviceTypeName: "transportation",
        locationId: "",
        fromLocationId: "jro-id",
        toLocationId: "",
        description: "",
      });

      expect(result.fromLocationId).toBe("jro-id");
      expect(result.toLocationId).toBeUndefined();
    });
  });

  describe("Full payload — Activity", () => {
    it("should include fromLocationId and toLocationId when both provided", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        name: "Game Drive",
        alternativeName: "Morning Drive",
        serviceTypeId: "b1c2d3e4-f5a6-7890-abcd-ef1234567890",
        serviceTypeName: "activity",
        locationId: "ignored-loc",
        fromLocationId: "lodge-id",
        toLocationId: "park-id",
        description: "Full day game drive",
      });

      expect(result).toEqual({
        name: "Game Drive",
        alternativeName: "Morning Drive",
        serviceTypeId: "b1c2d3e4-f5a6-7890-abcd-ef1234567890",
        locationId: undefined,
        fromLocationId: "lodge-id",
        toLocationId: "park-id",
        description: "Full day game drive",
      });
    });

    it("should allow empty toLocationId (optional)", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        name: "Game Drive",
        alternativeName: "",
        serviceTypeId: "b1c2d3e4-f5a6-7890-abcd-ef1234567890",
        serviceTypeName: "activity",
        locationId: "",
        fromLocationId: "lodge-id",
        toLocationId: "",
        description: "",
      });

      expect(result.fromLocationId).toBe("lodge-id");
      expect(result.toLocationId).toBeUndefined();
    });
  });

  describe("Full payload — Other", () => {
    it("should include locationId and strip from/to for other", () => {
      const result = createSupplierServiceSubmitSchema.parse({
        name: "Misc Service",
        alternativeName: "",
        serviceTypeId: "ad54d130-a599-4cef-8602-2f6ab1cb6322",
        serviceTypeName: "other",
        locationId: "loc-123",
        fromLocationId: "ignored",
        toLocationId: "ignored",
        description: "",
      });

      expect(result).toEqual({
        name: "Misc Service",
        alternativeName: undefined,
        serviceTypeId: "ad54d130-a599-4cef-8602-2f6ab1cb6322",
        locationId: "loc-123",
        fromLocationId: undefined,
        toLocationId: undefined,
        description: undefined,
      });
    });
  });
});
