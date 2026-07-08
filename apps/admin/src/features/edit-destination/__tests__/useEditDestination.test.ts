import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Destination } from "@/entities/destination/model/types";

import { editDestinationSubmitSchema } from "../model/schema";
import { useEditDestinationForm } from "../model/useEditDestination";

const createDestination = (
  id: string,
  name: string,
  options?: {
    type?: Destination["type"];
    code?: string;
    coordinates?: { lat: number; lng: number };
    isPreferred?: boolean;
  }
): Destination => ({
  id,
  name,
  type: options?.type || "Country",
  code: options?.code,
  coordinates: options?.coordinates,
  ...(typeof options?.isPreferred === "boolean"
    ? { isPreferred: options.isPreferred }
    : {}),
});

describe("useEditDestinationForm", () => {
  describe("Initialization", () => {
    it("should initialize with empty form data when destination is null", () => {
      const { result } = renderHook(() => useEditDestinationForm(null));

      expect(result.current.form.state.values).toEqual({
        name: "",
        type: "Country",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
        isPreferred: false,
      });
    });

    it("should initialize with destination data for Country type", () => {
      const destination = createDestination("kenya", "Kenya", {
        type: "Country",
        code: "KEN",
        coordinates: { lat: -0.0236, lng: 37.9062 },
      });

      const { result } = renderHook(() => useEditDestinationForm(destination));

      expect(result.current.form.state.values).toEqual({
        name: "Kenya",
        type: "Country",
        iataCode: "",
        destinationCode: "KEN",
        latitude: "-0.0236",
        longitude: "37.9062",
        isPreferred: false,
      });
    });

    it("should initialize with destination data for Airport type", () => {
      const destination = createDestination("nbo", "Nairobi Airport", {
        type: "Airport",
        code: "NBO",
        coordinates: { lat: -1.3192, lng: 36.9275 },
      });

      const { result } = renderHook(() => useEditDestinationForm(destination));

      expect(result.current.form.state.values).toEqual({
        name: "Nairobi Airport",
        type: "Airport",
        iataCode: "NBO",
        destinationCode: "",
        latitude: "-1.3192",
        longitude: "36.9275",
        isPreferred: false,
      });
    });

    it("should handle destination without code", () => {
      const destination = createDestination("uganda", "Uganda", {
        type: "Country",
      });

      const { result } = renderHook(() => useEditDestinationForm(destination));

      expect(result.current.form.state.values.destinationCode).toBe("");
      expect(result.current.form.state.values.iataCode).toBe("");
    });

    it("should handle destination without coordinates", () => {
      const destination = createDestination("kenya", "Kenya", {
        type: "Country",
      });

      const { result } = renderHook(() => useEditDestinationForm(destination));

      expect(result.current.form.state.values.latitude).toBe("");
      expect(result.current.form.state.values.longitude).toBe("");
    });
  });

  describe("Form Data Updates", () => {
    it("should update name field", () => {
      const destination = createDestination("kenya", "Kenya");
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("name", "Kenya Updated");
      });

      expect(result.current.form.state.values.name).toBe("Kenya Updated");
    });

    it("should update type field", () => {
      const destination = createDestination("kenya", "Kenya", {
        type: "Country",
      });
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("type", "City");
      });

      expect(result.current.form.state.values.type).toBe("City");
    });

    it("should update iataCode field", () => {
      const destination = createDestination("nbo", "Nairobi Airport", {
        type: "Airport",
      });
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("iataCode", "NBO");
      });

      expect(result.current.form.state.values.iataCode).toBe("NBO");
    });

    it("should update destinationCode field for non-Airport types", () => {
      const destination = createDestination("kenya", "Kenya", {
        type: "Country",
      });
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("destinationCode", "KEN");
      });

      expect(result.current.form.state.values.destinationCode).toBe("KEN");
    });

    it("should update latitude field", () => {
      const destination = createDestination("kenya", "Kenya");
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("latitude", "-0.0236");
      });

      expect(result.current.form.state.values.latitude).toBe("-0.0236");
    });

    it("should update longitude field", () => {
      const destination = createDestination("kenya", "Kenya");
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("longitude", "37.9062");
      });

      expect(result.current.form.state.values.longitude).toBe("37.9062");
    });
  });

  describe("Reset", () => {
    it("should reset form to initial destination data", () => {
      const destination = createDestination("kenya", "Kenya", {
        type: "Country",
        code: "KEN",
        coordinates: { lat: -0.0236, lng: 37.9062 },
      });
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("name", "Modified Name");
        result.current.form.setFieldValue("destinationCode", "MOD");
        result.current.form.setFieldValue("latitude", "10");
      });

      act(() => {
        result.current.form.reset();
      });

      expect(result.current.form.state.values).toEqual({
        name: "Kenya",
        type: "Country",
        iataCode: "",
        destinationCode: "KEN",
        latitude: "-0.0236",
        longitude: "37.9062",
        isPreferred: false,
      });
    });

    it("should reset to empty form when destination is null", () => {
      const { result } = renderHook(() => useEditDestinationForm(null));

      act(() => {
        result.current.form.setFieldValue("name", "Test");
        result.current.form.setFieldValue("type", "City");
      });

      act(() => {
        result.current.form.reset();
      });

      expect(result.current.form.state.values).toEqual({
        name: "",
        type: "Country",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
        isPreferred: false,
      });
    });
  });

  describe("getSubmitData", () => {
    it("should return success result for Airport type with code", () => {
      const destination = createDestination("nbo", "Nairobi Airport", {
        type: "Airport",
        code: "NBO",
      });
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("iataCode", "NBO");
        result.current.form.setFieldValue("latitude", "-1.3192");
        result.current.form.setFieldValue("longitude", "36.9275");
      });

      const parseResult = result.current.getSubmitData("nbo", "parent123");

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      expect(parseResult.data).toEqual({
        id: "nbo",
        parentId: "parent123",
        name: "Nairobi Airport",
        type: "Airport",
        code: "NBO",
        latitude: -1.3192,
        longitude: 36.9275,
        isPreferred: false,
      });
    });

    it("should return success result for non-Airport type with code", () => {
      const destination = createDestination("kenya", "Kenya", {
        type: "Country",
        code: "KEN",
      });
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("destinationCode", "KEN");
        result.current.form.setFieldValue("latitude", "-0.0236");
        result.current.form.setFieldValue("longitude", "37.9062");
      });

      const parseResult = result.current.getSubmitData("kenya", "root_id");

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      expect(parseResult.data).toEqual({
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        latitude: -0.0236,
        longitude: 37.9062,
        isPreferred: false,
      });
    });

    it("should trim whitespace from name", () => {
      const destination = createDestination("kenya", "Kenya");
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("name", "  Kenya  ");
      });

      const parseResult = result.current.getSubmitData("kenya", "parent123");

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      expect(parseResult.data.name).toBe("Kenya");
    });

    it("should return empty string for empty code fields", () => {
      const destination = createDestination("kenya", "Kenya", {
        type: "Country",
      });
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("destinationCode", "");
      });

      const parseResult = result.current.getSubmitData("kenya", "parent123");

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      expect(parseResult.data.code).toBe("");
    });

    it("should return null for empty coordinates", () => {
      const destination = createDestination("kenya", "Kenya");
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("latitude", "");
        result.current.form.setFieldValue("longitude", "");
      });

      const parseResult = result.current.getSubmitData("kenya", "parent123");

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      expect(parseResult.data.latitude).toBeNull();
      expect(parseResult.data.longitude).toBeNull();
    });

    it("should convert coordinate strings to numbers", () => {
      const destination = createDestination("kenya", "Kenya");
      const { result } = renderHook(() => useEditDestinationForm(destination));

      act(() => {
        result.current.form.setFieldValue("latitude", "-0.0236");
        result.current.form.setFieldValue("longitude", "37.9062");
      });

      const parseResult = result.current.getSubmitData("kenya", "parent123");

      expect(parseResult.success).toBe(true);
      if (!parseResult.success) return;
      expect(typeof parseResult.data.latitude).toBe("number");
      expect(typeof parseResult.data.longitude).toBe("number");
      expect(parseResult.data.latitude).toBe(-0.0236);
      expect(parseResult.data.longitude).toBe(37.9062);
    });
  });

  describe("Destination ID Changes", () => {
    it("should update form data when destination ID changes", async () => {
      const destination1 = createDestination("kenya", "Kenya", {
        type: "Country",
        code: "KEN",
      });
      const destination2 = createDestination("uganda", "Uganda", {
        type: "Country",
        code: "UGA",
      });

      const { result, rerender } = renderHook(
        ({ destination }) => useEditDestinationForm(destination),
        {
          initialProps: { destination: destination1 },
        }
      );

      expect(result.current.form.state.values.name).toBe("Kenya");

      rerender({ destination: destination2 });

      await waitFor(() => {
        expect(result.current.form.state.values.name).toBe("Uganda");
        expect(result.current.form.state.values.destinationCode).toBe("UGA");
      });
    });
  });
});

describe("editDestinationSubmitSchema", () => {
  it.each(["Country", "Region", "City", "Area", "Airport"] as const)(
    "should pass %s type through as string",
    (destinationType) => {
      const result = editDestinationSubmitSchema.parse({
        id: "test",
        parentId: null,
        type: destinationType,
        name: "Test",
        iataCode: "",
        destinationCode: "",
        latitude: "",
        longitude: "",
        isPreferred: false,
      });

      expect(result.type).toBe(destinationType);
    }
  );
});
