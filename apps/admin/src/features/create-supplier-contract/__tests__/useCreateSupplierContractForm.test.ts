import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCreateSupplierContractForm } from "../model/useCreateSupplierContractForm";
import { ANY_AGENCY_GROUP_VALUE } from "../model/schema";

describe("useCreateSupplierContractForm", () => {
  const noop = vi.fn();

  describe("Initialization", () => {
    it("should initialize with default form values", () => {
      const { result } = renderHook(() => useCreateSupplierContractForm(noop));

      expect(result.current.form.state.values).toEqual({
        name: "",
        link: "",
        agencyGroupId: ANY_AGENCY_GROUP_VALUE,
        validFrom: "",
        validTo: "",
      });
    });
  });

  describe("Field updates", () => {
    it("should update name via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierContractForm(noop));

      act(() => {
        result.current.form.setFieldValue("name", "Contract 2025");
      });

      expect(result.current.form.state.values.name).toBe("Contract 2025");
    });

    it("should update link via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierContractForm(noop));

      act(() => {
        result.current.form.setFieldValue(
          "link",
          "https://drive.google.com/file/link.pdf"
        );
      });

      expect(result.current.form.state.values.link).toBe(
        "https://drive.google.com/file/link.pdf"
      );
    });

    it("should update validFrom and validTo via setFieldValue", () => {
      const { result } = renderHook(() => useCreateSupplierContractForm(noop));

      act(() => {
        result.current.form.setFieldValue("validFrom", "2025-01-01");
        result.current.form.setFieldValue("validTo", "2025-12-31");
      });

      expect(result.current.form.state.values.validFrom).toBe("2025-01-01");
      expect(result.current.form.state.values.validTo).toBe("2025-12-31");
    });
  });

  describe("Reset", () => {
    it("should reset form to initial state", () => {
      const { result } = renderHook(() => useCreateSupplierContractForm(noop));

      act(() => {
        result.current.form.setFieldValue("name", "Contract 2025");
        result.current.form.setFieldValue("link", "https://example.com");
        result.current.form.setFieldValue("validFrom", "2025-01-01");
        result.current.form.setFieldValue("validTo", "2025-12-31");
      });

      act(() => {
        result.current.form.reset();
      });

      expect(result.current.form.state.values).toEqual({
        name: "",
        link: "",
        agencyGroupId: ANY_AGENCY_GROUP_VALUE,
        validFrom: "",
        validTo: "",
      });
    });
  });

  describe("Submit and validation", () => {
    it("should call onSchemaError when name is empty", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateSupplierContractForm(noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("validFrom", "2025-01-01");
        result.current.form.setFieldValue("validTo", "2025-12-31");
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when validTo is before validFrom", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateSupplierContractForm(noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("name", "Contract 2025");
        result.current.form.setFieldValue("validFrom", "2025-12-31");
        result.current.form.setFieldValue("validTo", "2025-01-01");
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalledWith(
        expect.stringMatching(/Valid To must be on or after Valid From/i)
      );
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSubmit with parsed data when valid", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useCreateSupplierContractForm(onSubmit)
      );

      act(() => {
        result.current.form.setFieldValue("name", "Contract 2025");
        result.current.form.setFieldValue(
          "link",
          "https://drive.google.com/file/link.pdf"
        );
        result.current.form.setFieldValue("validFrom", "2025-01-01");
        result.current.form.setFieldValue("validTo", "2025-12-31");
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({
        name: "Contract 2025",
        link: "https://drive.google.com/file/link.pdf",
        agencyGroupId: null,
        validFrom: "2025-01-01",
        validTo: "2025-12-31",
      });
    });
  });
});
