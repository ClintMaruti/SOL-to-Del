import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContractPolicy } from "@/entities/supplier-contract";

import { useEditContractPolicyForm } from "../model/useEditContractPolicyForm";

const basePenaltyRule = {
  id: "rule-1",
  starts: "Before" as const,
  referenceEvent: "TravelDate" as const,
  startDay: 30,
  startTime: "00:00",
  endDay: 15,
  endTime: "23:59",
  penaltyValue: 50,
  penaltyType: "Percent" as const,
};

const basePolicy: ContractPolicy = {
  id: "pol-1",
  policyName: "Standard Cancellation",
  description: "Standard cancellation policy",
  refundable: true,
  isActive: true,
  travelDates: [
    {
      id: "range-1",
      version: 3,
      from: "2026-01-01",
      to: null,
    },
  ],
  conditions: [basePenaltyRule],
};

describe("useEditContractPolicyForm", () => {
  const noop = vi.fn();
  const contractValidity = {
    contractValidFrom: "2026-01-01",
    contractValidTo: "2026-12-31",
  };

  describe("Initialization", () => {
    it("should initialize form values from policy", () => {
      const { result } = renderHook(() =>
        useEditContractPolicyForm(basePolicy, noop)
      );

      expect(result.current.form.state.values).toEqual({
        policyName: "Standard Cancellation",
        description: "Standard cancellation policy",
        travelDates: [
          {
            id: "range-1",
            version: 3,
            from: "2026-01-01",
            to: "",
          },
        ],
        refundable: true,
        conditions: [
          {
            id: "rule-1",
            starts: "Before",
            referenceEvent: "TravelDate",
            startDay: 30,
            startTime: "00:00",
            endDay: 15,
            endTime: "23:59",
            penaltyValue: 50,
            penaltyType: "Percent",
          },
        ],
      });
    });

    it("should initialize with empty penalty rules when policy has none", () => {
      const policyNoRules: ContractPolicy = {
        ...basePolicy,
        refundable: false,
        conditions: [],
      };
      const { result } = renderHook(() =>
        useEditContractPolicyForm(policyNoRules, noop)
      );

      expect(result.current.form.state.values.conditions).toEqual([]);
    });

    it("should initialize one empty travel date row when policy has none", () => {
      const policyNoRanges: ContractPolicy = {
        ...basePolicy,
        travelDates: [],
      };
      const { result } = renderHook(() =>
        useEditContractPolicyForm(policyNoRanges, noop)
      );

      expect(result.current.form.state.values.travelDates).toEqual([
        { from: "", to: "" },
      ]);
    });
  });

  describe("Field updates", () => {
    it("should update policyName via setFieldValue", () => {
      const { result } = renderHook(() =>
        useEditContractPolicyForm(basePolicy, noop)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "Updated Name");
      });

      expect(result.current.form.state.values.policyName).toBe("Updated Name");
    });

    it("should update refundable via setFieldValue", () => {
      const { result } = renderHook(() =>
        useEditContractPolicyForm(basePolicy, noop)
      );

      act(() => {
        result.current.form.setFieldValue("refundable", false);
      });

      expect(result.current.form.state.values.refundable).toBe(false);
    });
  });

  describe("Form reset on policy change", () => {
    it("should reset form when form-relevant policy data changes", () => {
      const { result, rerender } = renderHook(
        ({ policy }) => useEditContractPolicyForm(policy, noop),
        { initialProps: { policy: basePolicy } }
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "User Edit");
      });

      expect(result.current.form.state.values.policyName).toBe("User Edit");

      const updatedPolicy: ContractPolicy = {
        ...basePolicy,
        policyName: "Server Updated Name",
      };

      rerender({ policy: updatedPolicy });

      expect(result.current.form.state.values.policyName).toBe(
        "Server Updated Name"
      );
    });

    it("should NOT reset form when only isActive changes", () => {
      const { result, rerender } = renderHook(
        ({ policy }) => useEditContractPolicyForm(policy, noop),
        { initialProps: { policy: basePolicy } }
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "User Edit");
      });

      expect(result.current.form.state.values.policyName).toBe("User Edit");

      const toggledPolicy: ContractPolicy = {
        ...basePolicy,
        isActive: false,
      };

      rerender({ policy: toggledPolicy });

      expect(result.current.form.state.values.policyName).toBe("User Edit");
    });

    it("should preserve refundable when isActive toggles", () => {
      const { result, rerender } = renderHook(
        ({ policy }) => useEditContractPolicyForm(policy, noop),
        { initialProps: { policy: basePolicy } }
      );

      act(() => {
        result.current.form.setFieldValue("refundable", false);
      });

      expect(result.current.form.state.values.refundable).toBe(false);

      const toggledPolicy: ContractPolicy = {
        ...basePolicy,
        isActive: false,
      };

      rerender({ policy: toggledPolicy });

      expect(result.current.form.state.values.refundable).toBe(false);
    });
  });

  describe("Submit and validation", () => {
    it("should call onSchemaError when policyName is empty", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useEditContractPolicyForm(basePolicy, noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("policyName", "");
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when refundable but no penalty rules", async () => {
      const policyNoRules: ContractPolicy = {
        ...basePolicy,
        conditions: [],
      };
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useEditContractPolicyForm(policyNoRules, noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("refundable", true);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when travel date from is missing", async () => {
      const policyNoRanges: ContractPolicy = {
        ...basePolicy,
        travelDates: [],
      };
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useEditContractPolicyForm(policyNoRanges, noop, onSchemaError)
      );

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSchemaError).toHaveBeenCalled();
      expect(noop).not.toHaveBeenCalled();
    });

    it("should call onSchemaError when travel date to is before from", async () => {
      const onSchemaError = vi.fn();
      const { result } = renderHook(() =>
        useEditContractPolicyForm(basePolicy, noop, onSchemaError)
      );

      act(() => {
        result.current.form.setFieldValue("travelDates", [
          {
            id: "range-1",
            version: 3,
            from: "2026-02-01",
            to: "2026-01-01",
          },
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
        useEditContractPolicyForm(
          basePolicy,
          noop,
          onSchemaError,
          contractValidity
        )
      );

      act(() => {
        result.current.form.setFieldValue("travelDates", [
          {
            id: "range-1",
            version: 3,
            from: "2026-12-15",
            to: "2027-01-15",
          },
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
        useEditContractPolicyForm(
          basePolicy,
          noop,
          onSchemaError,
          contractValidity
        )
      );

      act(() => {
        result.current.form.setFieldValue("travelDates", [
          {
            id: "range-1",
            version: 3,
            from: "2026-01-01",
            to: "2026-06-30",
          },
          { id: "range-2", from: "2026-06-01", to: "" },
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

    it("should call onSubmit with transformed data for valid policy", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useEditContractPolicyForm(basePolicy, onSubmit)
      );

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          policyName: "Standard Cancellation",
          description: "Standard cancellation policy",
          travelDates: [
            {
              id: "range-1",
              version: 3,
              from: "2026-01-01",
              to: null,
            },
          ],
          refundable: true,
          conditions: expect.arrayContaining([
            expect.objectContaining({
              startDay: 30,
              penaltyValue: 50,
            }),
          ]),
        })
      );
    });

    it("should allow non-overlapping travel date ranges within contract validity", async () => {
      const onSubmit = vi.fn();
      const { result } = renderHook(() =>
        useEditContractPolicyForm(
          basePolicy,
          onSubmit,
          undefined,
          contractValidity
        )
      );

      act(() => {
        result.current.form.setFieldValue("travelDates", [
          {
            id: "range-1",
            version: 3,
            from: "2026-01-01",
            to: "2026-06-30",
          },
          { id: "range-2", from: "2026-07-01", to: "" },
        ]);
      });

      await act(async () => {
        result.current.form.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          travelDates: [
            {
              id: "range-1",
              version: 3,
              from: "2026-01-01",
              to: "2026-06-30",
            },
            { id: "range-2", from: "2026-07-01", to: null },
          ],
        })
      );
    });
  });
});
