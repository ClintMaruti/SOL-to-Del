import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCreateContractPolicyForm } from "../model/useCreateContractPolicyForm";

describe("useCreateContractPolicyForm", () => {
  const noop = vi.fn();
  const contractValidity = {
    contractValidFrom: "2026-01-01",
    contractValidTo: "2026-12-31",
  };

  describe("Initialization", () => {
    it("should initialize with default form values", () => {
      const { result } = renderHook(() => useCreateContractPolicyForm(noop));

      expect(result.current.form.state.values).toEqual({
        policyName: "",
        description: "",
        travelDates: [{ from: "", to: "" }],
        refundable: false,
        conditions: [],
      });
    });
  });

  describe("Field updates", () => {
    it("should update policyName via setFieldValue", () => {
      const { result } = renderHook(() => useCreateContractPolicyForm(noop));

      act(() => {
        result.current.form.setFieldValue("policyName", "Cancellation Policy");
      });

      expect(result.current.form.state.values.policyName).toBe(
        "Cancellation Policy"
      );
    });

    it("should update description via setFieldValue", () => {
      const { result } = renderHook(() => useCreateContractPolicyForm(noop));

      act(() => {
        result.current.form.setFieldValue("description", "A test description");
      });

      expect(result.current.form.state.values.description).toBe(
        "A test description"
      );
    });

    it("should update refundable via setFieldValue", () => {
      const { result } = renderHook(() => useCreateContractPolicyForm(noop));

      act(() => {
        result.current.form.setFieldValue("refundable", true);
      });

      expect(result.current.form.state.values.refundable).toBe(true);
    });
  });

  describe("Reset", () => {
    it("should reset form to initial state", () => {
      const { result } = renderHook(() => useCreateContractPolicyForm(noop));

      act(() => {
        result.current.form.setFieldValue("policyName", "Test Policy");
        result.current.form.setFieldValue("description", "Description");
        result.current.form.setFieldValue("refundable", true);
      });

      act(() => {
        result.current.form.reset();
      });

      expect(result.current.form.state.values).toEqual({
        policyName: "",
        description: "",
        travelDates: [{ from: "", to: "" }],
        refundable: false,
        conditions: [],
      });
    });
  });

  describe("Submit and validation", () => {
    it("should call onSchemaError when policyName is missing", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("description", "Some description");
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when description is missing", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Policy Name");
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when refundable but no penalty rules", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Refundable Policy");
        result.current.form.setFieldValue("description", "A description");
        result.current.form.setFieldValue("refundable", true);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when travel date from is missing", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Policy Name");
        result.current.form.setFieldValue("description", "Some description");
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when travel date to is before from", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Policy Name");
        result.current.form.setFieldValue("description", "Some description");
        result.current.form.setFieldValue("travelDates", [
          { from: "2026-02-01", to: "2026-01-01" },
        ]);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when travel dates are outside contract validity", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(noop, onSchemaError, contractValidity)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Policy Name");
        result.current.form.setFieldValue("description", "Some description");
        result.current.form.setFieldValue("travelDates", [
          { from: "2025-12-31", to: "2026-01-15" },
        ]);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalledWith(
        expect.stringMatching(/within contract validity period/i)
      );
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when travel date ranges overlap", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(noop, onSchemaError, contractValidity)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Policy Name");
        result.current.form.setFieldValue("description", "Some description");
        result.current.form.setFieldValue("travelDates", [
          { from: "2026-01-01", to: "2026-03-31" },
          { from: "2026-03-15", to: "" },
        ]);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      const message = onSchemaError.mock.calls[0]?.[0] as string;
      expect(message.match(/must not overlap/gi)).toHaveLength(1);
      expect(
        result.current.form.getFieldMeta("travelDates[0].from")?.errors ?? []
      ).toHaveLength(1);
      expect(
        result.current.form.getFieldMeta("travelDates[0].to")?.errors ?? []
      ).toHaveLength(1);
      expect(
        result.current.form.getFieldMeta("travelDates[1].from")?.errors ?? []
      ).toHaveLength(1);
      expect(
        result.current.form.getFieldMeta("travelDates[1].to")?.errors ?? []
      ).toHaveLength(1);
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSubmit with transformed data for a valid non-refundable policy", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(onSubmit)
      );

      act(() => {
        result.current.form.setFieldValue(
          "policyName",
          "  Standard Cancellation  "
        );
        result.current.form.setFieldValue(
          "description",
          "  Cancel up to 30 days  "
        );
        result.current.form.setFieldValue("refundable", false);
        result.current.form.setFieldValue("travelDates", [
          { from: "2026-01-01", to: "" },
        ]);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith({
        policyName: "Standard Cancellation",
        description: "Cancel up to 30 days",
        travelDates: [{ from: "2026-01-01", to: null }],
        refundable: false,
        conditions: [],
      });
    });

    it("should allow non-refundable policy without penalty rules", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(onSubmit)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "No Refund");
        result.current.form.setFieldValue("description", "Non-refundable");
        result.current.form.setFieldValue("travelDates", [
          { from: "2026-01-01", to: "2026-12-31" },
        ]);
        result.current.form.setFieldValue("refundable", false);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          refundable: false,
          travelDates: [{ from: "2026-01-01", to: "2026-12-31" }],
          conditions: [],
        })
      );
    });

    it("should allow non-overlapping travel date ranges within contract validity", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useCreateContractPolicyForm(onSubmit, undefined, contractValidity)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Seasonal Policy");
        result.current.form.setFieldValue("description", "Seasonal rules");
        result.current.form.setFieldValue("travelDates", [
          { from: "2026-01-01", to: "2026-03-31" },
          { from: "2026-04-01", to: "" },
        ]);
        result.current.form.setFieldValue("refundable", false);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          travelDates: [
            { from: "2026-01-01", to: "2026-03-31" },
            { from: "2026-04-01", to: null },
          ],
        })
      );
    });
  });
});
