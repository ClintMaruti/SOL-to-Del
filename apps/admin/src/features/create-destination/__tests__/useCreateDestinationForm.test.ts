import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDestinationSubmitSchema } from "../model/schema";
import { useCreateDestinationForm } from "../model/useCreateDestination";

describe("useCreateDestinationForm", () => {
  const noop = vi.fn();

  describe("Initialization", () => {
    it("should initialize with default form values", () => {
      const { result } = renderHook(() => useCreateDestinationForm(noop));

      expect(result.current.form.state.values).toEqual({
        type: "Country",
        name: "",
        parentId: "",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
        isPreferred: false,
      });
    });
  });

  describe("Field updates", () => {
    it("should update a field value via setFieldValue", () => {
      const { result } = renderHook(() => useCreateDestinationForm(noop));

      act(() => {
        result.current.form.setFieldValue("name", "Kenya");
      });

      expect(result.current.form.state.values.name).toBe("Kenya");
    });

    it("should update type field", () => {
      const { result } = renderHook(() => useCreateDestinationForm(noop));

      act(() => {
        result.current.form.setFieldValue("type", "City");
      });

      expect(result.current.form.state.values.type).toBe("City");
    });
  });

  describe("Reset", () => {
    it("should reset form to initial state", () => {
      const { result } = renderHook(() => useCreateDestinationForm(noop));

      act(() => {
        result.current.form.setFieldValue("name", "Kenya");
        result.current.form.setFieldValue("type", "City");
        result.current.form.setFieldValue("parentId", "parent-123");
        result.current.form.setFieldValue("iataCode", "NBO");
        result.current.form.setFieldValue("destinationCode", "KEN");
        result.current.form.setFieldValue("latitude", "-0.0236");
        result.current.form.setFieldValue("longitude", "37.9062");
      });

      act(() => {
        result.current.form.reset();
      });

      expect(result.current.form.state.values).toEqual({
        type: "Country",
        name: "",
        parentId: "",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
        isPreferred: false,
      });
    });
  });
});

describe("createDestinationSubmitSchema", () => {
  describe("Country type", () => {
    it("should return correct submit data for Country type", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Kenya",
        parentId: "",
        iataCode: "",
        destinationCode: "KEN",
        latitude: "-0.0236",
        longitude: "37.9062",
        isPreferred: false,
      });

      expect(result).toEqual({
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: -0.0236,
        longitude: 37.9062,
        isPreferred: false,
      });
    });

    it("should set isPreferred true for Country when requested", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Zanzibar",
        parentId: "",
        iataCode: "",
        destinationCode: "ZNZ",
        latitude: "",
        longitude: "",
        isPreferred: true,
      });

      expect(result.isPreferred).toBe(true);
    });

    it("should force isPreferred false for non-Country types", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Region",
        name: "South",
        parentId: "kenya",
        iataCode: "",
        destinationCode: "S",
        latitude: "",
        longitude: "",
        isPreferred: true,
      });

      expect(result.isPreferred).toBe(false);
    });
  });

  describe("Airport type", () => {
    it("should return correct submit data for Airport type with IATA code", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Airport",
        name: "Nairobi Airport",
        parentId: "nairobi-city",
        iataCode: "NBO",
        destinationCode: "",
        latitude: "-1.3192",
        longitude: "36.9275",
      });

      expect(result).toEqual({
        parentId: "nairobi-city",
        name: "Nairobi Airport",
        type: "Airport",
        code: "NBO",
        latitude: -1.3192,
        longitude: 36.9275,
        isPreferred: false,
      });
    });

    it("should use iataCode for Airport type, not destinationCode", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Airport",
        name: "Nairobi Airport",
        parentId: "nairobi",
        iataCode: "NBO",
        destinationCode: "SHOULD_BE_IGNORED",
        latitude: "",
        longitude: "",
      });

      expect(result.code).toBe("NBO");
    });
  });

  describe("Non-Airport types", () => {
    it("should use destinationCode for City type", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "City",
        name: "Nairobi",
        parentId: "kenya",
        iataCode: "",
        destinationCode: "NBI",
        latitude: "",
        longitude: "",
      });

      expect(result.code).toBe("NBI");
    });
  });

  describe("parentId transformation", () => {
    it('should handle "root_id" as null parentId', () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Kenya",
        parentId: "root_id",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
      });

      expect(result.parentId).toBeNull();
    });

    it("should handle empty parentId as null", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Kenya",
        parentId: "",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
      });

      expect(result.parentId).toBeNull();
    });

    it("should preserve valid parentId", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "City",
        name: "Nairobi",
        parentId: "kenya-id",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
      });

      expect(result.parentId).toBe("kenya-id");
    });
  });

  describe("Name trimming", () => {
    it("should trim whitespace from name", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "  Kenya  ",
        parentId: "",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
      });

      expect(result.name).toBe("Kenya");
    });
  });

  describe("Code fields", () => {
    it("should return undefined for empty code fields", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Kenya",
        parentId: "",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
      });

      expect(result.code).toBeUndefined();
    });

    it("should return undefined for whitespace-only code", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Kenya",
        parentId: "",
        iataCode: "",
        destinationCode: "   ",
        latitude: "",
        longitude: "",
      });

      expect(result.code).toBeUndefined();
    });
  });

  describe("Coordinate transformation", () => {
    it("should return undefined for empty coordinates", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Kenya",
        parentId: "",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
      });

      expect(result.latitude).toBeUndefined();
      expect(result.longitude).toBeUndefined();
    });

    it("should convert coordinate strings to numbers", () => {
      const result = createDestinationSubmitSchema.parse({
        type: "Country",
        name: "Kenya",
        parentId: "",
        iataCode: "",
        destinationCode: "",
        latitude: "-0.0236",
        longitude: "37.9062",
      });

      expect(typeof result.latitude).toBe("number");
      expect(typeof result.longitude).toBe("number");
      expect(result.latitude).toBe(-0.0236);
      expect(result.longitude).toBe(37.9062);
    });
  });

  describe("Type mapping", () => {
    it.each(["Country", "Region", "City", "Area", "Airport"] as const)(
      "should pass %s type through as string",
      (destinationType) => {
        const result = createDestinationSubmitSchema.parse({
          type: destinationType,
          name: "Test",
          parentId: "",
          iataCode: "",
          destinationCode: "",
          latitude: "",
          longitude: "",
        });

        expect(result.type).toBe(destinationType);
      }
    );
  });
});
