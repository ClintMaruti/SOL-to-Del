import { useForm, useStore } from "@tanstack/react-form";
import { useCallback, useEffect, useMemo, useRef } from "react";

import type {
  ContractPolicy,
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
  buildUpdateContractPolicySchema,
  type UpdateContractPolicySubmitData,
} from "./schema";

export interface EditContractPolicyFormValues {
  policyName: string;
  description: string;
  travelDates: {
    id?: string;
    version?: number;
    from: string;
    to: string;
  }[];
  refundable: boolean;
  conditions: {
    id?: string;
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

function policyToFormValues(
  policy: ContractPolicy
): EditContractPolicyFormValues {
  return {
    policyName: policy.policyName,
    description: policy.description ?? "",
    travelDates:
      policy.travelDates && policy.travelDates.length > 0
        ? policy.travelDates.map((range) => ({
            id: range.id,
            version: range.version,
            from: range.from,
            to: range.to ?? "",
          }))
        : [{ from: "", to: "" }],
    refundable: policy.refundable ?? false,
    conditions: (policy.conditions ?? []).map((rule) => ({
      id: rule.id,
      starts: rule.starts,
      referenceEvent: rule.referenceEvent,
      startDay: rule.startDay,
      startTime: rule.startTime,
      endDay: rule.endDay,
      endTime: rule.endTime,
      penaltyValue: rule.penaltyValue,
      penaltyType: rule.penaltyType,
    })),
  };
}

function formValuesEqual(
  a: EditContractPolicyFormValues,
  b: EditContractPolicyFormValues
): boolean {
  return (
    a.policyName === b.policyName &&
    a.description === b.description &&
    a.travelDates.length === b.travelDates.length &&
    a.travelDates.every(
      (range, i) =>
        range.id === b.travelDates[i].id &&
        range.version === b.travelDates[i].version &&
        range.from === b.travelDates[i].from &&
        range.to === b.travelDates[i].to
    ) &&
    a.refundable === b.refundable &&
    a.conditions.length === b.conditions.length &&
    a.conditions.every(
      (rule, i) =>
        rule.id === b.conditions[i].id &&
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

export function useEditContractPolicyForm(
  policy: ContractPolicy,
  onSubmit: (data: UpdateContractPolicySubmitData) => void,
  onSchemaError?: (message: string) => void,
  validationContext?: ContractPolicyTravelDateValidationContext
) {
  const defaultValues = useMemo(() => policyToFormValues(policy), [policy]);
  const prevFormValuesRef = useRef(defaultValues);
  const schema = useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => buildUpdateContractPolicySchema(validationContext),
    [validationContext?.contractValidFrom, validationContext?.contractValidTo]
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      clearFormScopedOnSubmitFieldErrors(form);
      const payload = {
        ...value,
        travelDates: value.travelDates.map((range) => ({
          ...range,
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

  useEffect(() => {
    if (!formValuesEqual(prevFormValuesRef.current, defaultValues)) {
      prevFormValuesRef.current = defaultValues;
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);

  const resetForm = useCallback(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const isDirty = useStore(
    form.store,
    (state) =>
      !formValuesEqual(
        state.values as EditContractPolicyFormValues,
        defaultValues
      )
  );

  return { form, isDirty, resetForm };
}
