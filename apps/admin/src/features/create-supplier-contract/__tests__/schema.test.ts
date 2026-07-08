import { describe, expect, it } from "vitest";

import {
  ANY_AGENCY_GROUP_VALUE,
  attachContractSubmitSchema,
} from "../model/schema";

describe("attachContractSubmitSchema", () => {
  const baseInput = {
    name: "Contract 2025",
    link: "",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
  };

  describe("Name", () => {
    it("should trim whitespace from name", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        name: "  Contract 2025  ",
      });

      expect(result.name).toBe("Contract 2025");
    });

    it("should reject empty name", () => {
      expect(() =>
        attachContractSubmitSchema.parse({
          ...baseInput,
          name: "",
        })
      ).toThrow();
    });

    it("should reject whitespace-only name", () => {
      expect(() =>
        attachContractSubmitSchema.parse({
          ...baseInput,
          name: "   ",
        })
      ).toThrow();
    });
  });

  describe("Link", () => {
    it("should return undefined for empty link", () => {
      const result = attachContractSubmitSchema.parse(baseInput);
      expect(result.link).toBeUndefined();
    });

    it("should return undefined for whitespace-only link", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        link: "   ",
      });
      expect(result.link).toBeUndefined();
    });

    it("should trim and preserve non-empty link", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        link: "  https://drive.google.com/file/link.pdf  ",
      });
      expect(result.link).toBe("https://drive.google.com/file/link.pdf");
    });

    it("should accept URL without protocol (e.g. drive.google.com/file/link.pdf)", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        link: "drive.google.com/file/link.pdf",
      });
      expect(result.link).toBe("drive.google.com/file/link.pdf");
    });

    it("should reject invalid URL", () => {
      expect(() =>
        attachContractSubmitSchema.parse({
          ...baseInput,
          link: "not a valid url!!!",
        })
      ).toThrow();
    });
  });

  describe("Valid From / Valid To", () => {
    it("should reject empty validFrom", () => {
      expect(() =>
        attachContractSubmitSchema.parse({
          ...baseInput,
          validFrom: "",
        })
      ).toThrow();
    });

    it("should reject empty validTo", () => {
      expect(() =>
        attachContractSubmitSchema.parse({
          ...baseInput,
          validTo: "",
        })
      ).toThrow();
    });

    it("should pass when validTo equals validFrom", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        validFrom: "2025-06-15",
        validTo: "2025-06-15",
      });
      expect(result.validFrom).toBe("2025-06-15");
      expect(result.validTo).toBe("2025-06-15");
    });

    it("should pass when validTo is after validFrom", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        validFrom: "2025-01-01",
        validTo: "2025-12-31",
      });
      expect(result.validFrom).toBe("2025-01-01");
      expect(result.validTo).toBe("2025-12-31");
    });

    it("should reject when validTo is before validFrom", () => {
      expect(() =>
        attachContractSubmitSchema.parse({
          ...baseInput,
          validFrom: "2025-12-31",
          validTo: "2025-01-01",
        })
      ).toThrow(/Valid To must be on or after Valid From/i);
    });
  });

  describe("Full payload", () => {
    it("should produce correct output for minimal payload", () => {
      const result = attachContractSubmitSchema.parse(baseInput);

      expect(result).toEqual({
        name: "Contract 2025",
        link: undefined,
        agencyGroupId: null,
        validFrom: "2025-01-01",
        validTo: "2025-12-31",
      });
    });

    it("should produce correct output with link", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        link: "https://example.com/contract.pdf",
      });

      expect(result).toEqual({
        name: "Contract 2025",
        link: "https://example.com/contract.pdf",
        agencyGroupId: null,
        validFrom: "2025-01-01",
        validTo: "2025-12-31",
      });
    });

    it("should submit the selected agency group id", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        agencyGroupId: "ag-1",
      });

      expect(result.agencyGroupId).toBe("ag-1");
    });

    it("should submit null for ANY agency group", () => {
      const result = attachContractSubmitSchema.parse({
        ...baseInput,
        agencyGroupId: ANY_AGENCY_GROUP_VALUE,
      });

      expect(result.agencyGroupId).toBeNull();
    });
  });
});
