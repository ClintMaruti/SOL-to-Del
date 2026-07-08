import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCreateSupplierServiceForm } from "../model/useCreateSupplierServiceForm";

describe("useCreateSupplierServiceForm", () => {
  const noop = vi.fn();

  describe("Initialization", () => {
    it("should initialize with default form values", () => {
      const { result } = renderHook(() => useCreateSupplierServiceForm(noop));

      expect(result.current.form.state.values).toEqual({
        name: "",
        alternativeName: "",
        serviceTypeId: "",
        serviceTypeName: "",
        locationId: "",
        fromLocationId: "",
        toLocationId: "",
        description: "",
      });
    });
  });

  describe("Field updates", () => {
    it("should update name via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierServiceForm(noop));

      act(() => {
        result.current.form.setFieldValue("name", "Safari Camp");
      });

      expect(result.current.form.state.values.name).toBe("Safari Camp");
    });

    it("should update serviceTypeId via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierServiceForm(noop));

      act(() => {
        result.current.form.setFieldValue(
          "serviceTypeId",
          "a5d4151d-d125-4fca-af9d-3e05f5699d5c"
        );
      });

      expect(result.current.form.state.values.serviceTypeId).toBe(
        "a5d4151d-d125-4fca-af9d-3e05f5699d5c"
      );
    });

    it("should update serviceTypeName via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierServiceForm(noop));

      act(() => {
        result.current.form.setFieldValue("serviceTypeName", "flight");
      });

      expect(result.current.form.state.values.serviceTypeName).toBe("flight");
    });

    it("should update locationId via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierServiceForm(noop));

      act(() => {
        result.current.form.setFieldValue("locationId", "loc-123");
      });

      expect(result.current.form.state.values.locationId).toBe("loc-123");
    });

    it("should update from/to fields via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierServiceForm(noop));

      act(() => {
        result.current.form.setFieldValue("fromLocationId", "from-123");
        result.current.form.setFieldValue("toLocationId", "to-456");
      });

      expect(result.current.form.state.values.fromLocationId).toBe("from-123");
      expect(result.current.form.state.values.toLocationId).toBe("to-456");
    });
  });

  describe("Reset", () => {
    it("should reset form to initial state", () => {
      const { result } = renderHook(() => useCreateSupplierServiceForm(noop));

      act(() => {
        result.current.form.setFieldValue("name", "Safari Camp");
        result.current.form.setFieldValue("alternativeName", "Dunia Camp");
        result.current.form.setFieldValue(
          "serviceTypeId",
          "14eeea9e-603e-41da-b77d-3c745e1e5da9"
        );
        result.current.form.setFieldValue("serviceTypeName", "accommodation");
        result.current.form.setFieldValue("locationId", "loc-123");
        result.current.form.setFieldValue("fromLocationId", "from-123");
        result.current.form.setFieldValue("toLocationId", "to-456");
        result.current.form.setFieldValue("description", "A description");
      });

      act(() => {
        result.current.form.reset();
      });

      expect(result.current.form.state.values).toEqual({
        name: "",
        alternativeName: "",
        serviceTypeId: "",
        serviceTypeName: "",
        locationId: "",
        fromLocationId: "",
        toLocationId: "",
        description: "",
      });
    });
  });
});
