import { useForm, useStore } from "@tanstack/react-form";
import { useCallback, useMemo } from "react";

import type {
  ContractPolicyTravelDateValidationContext,
  PenaltyType,
  ReferenceEvent,
  Starts,
} from "@/entities/supplier-contract";
import {
  applyZodIssuesToFormSubmitErrors,
  clearFormScopedOnSubmitFieldErrors,
  safeParseSubmitData,
} from "@/shared/lib/form";

import {
  buildCreateContractPolicySchema,
  type CreateContractPolicySubmitData,
} from "./schema";

export interface CreateContractPolicyFormValues {
  policyName: string;
  description: string;
  travelDates: {
    from: string;
    to: string;
  }[];
  refundable: boolean;
  conditions: {
    starts: Starts;
    referenceEvent: ReferenceEvent;
    startDay: number | "";
    startTime: string;
    endDay: number | "";
    endTime: string;
    penaltyValue: number | "";
    penaltyType: PenaltyType;
  }[];
}

const defaultValues: CreateContractPolicyFormValues = {
  policyName: "",
  description: "",
  travelDates: [{ from: "", to: "" }],
  refundable: false,
  conditions: [],
};

function formValuesEqual(
  a: CreateContractPolicyFormValues,
  b: CreateContractPolicyFormValues
): boolean {
  return (
    a.policyName === b.policyName &&
    a.description === b.description &&
    a.travelDates.length === b.travelDates.length &&
    a.travelDates.every(
      (range, i) =>
        range.from === b.travelDates[i].from && range.to === b.travelDates[i].to
    ) &&
    a.refundable === b.refundable &&
    a.conditions.length === b.conditions.length &&
    a.conditions.every(
      (rule, i) =>
        rule.starts === b.conditions[i].starts &&
        rule.referenceEvent === b.conditions[i].referenceEvent &&
        rule.startDay === b.conditions[i].startDay &&
        rule.startTime === b.conditions[i].startTime &&
        rule.endDay === b.conditions[i].endDay &&
        rule.endTime === b.conditions[i].endTime &&
        rule.penaltyValue === b.conditions[i].penaltyValue &&
        rule.penaltyType === b.conditions[i].penaltyType
    )
  );
}

export function useCreateContractPolicyForm(
  onSubmit: (data: CreateContractPolicySubmitData) => void,
  onSchemaError?: (message: string) => void,
  validationContext?: ContractPolicyTravelDateValidationContext
) {
  const schema = useMemo(
    () => buildCreateContractPolicySchema(validationContext),
    [validationContext]
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      clearFormScopedOnSubmitFieldErrors(form);
      const payload = {
        ...value,
        travelDates: value.travelDates.map((range) => ({
          from: range.from,
          to: range.to || null,
        })),
        conditions: value.conditions.map((rule) => ({
          ...rule,
          startDay: Number(rule.startDay) || 0,
          endDay: Number(rule.endDay) || 0,
          penaltyValue: Number(rule.penaltyValue) || 0,
        })),
      };
      const result = safeParseSubmitData(schema, payload);
      if (!result.success) {
        applyZodIssuesToFormSubmitErrors(form, result.error.issues);
        onSchemaError?.(result.message);
        return;
      }
      onSubmit(result.data);
    },
  });

  const resetForm = useCallback(() => {
    form.reset(defaultValues);
  }, [form]);

  const isDirty = useStore(
    form.store,
    (state) =>
      !formValuesEqual(
        state.values as CreateContractPolicyFormValues,
        defaultValues
      )
  );

  return { form, isDirty, resetForm };
}
