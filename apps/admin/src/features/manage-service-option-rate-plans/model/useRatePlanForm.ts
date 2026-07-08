import { i18n } from "@sol/i18n";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";

import {
  useCreateRatePlan,
  useUpdateRatePlan,
  type CreateRatePlanRequestPayload,
  type RatePlan,
  type UpdateRatePlanPayload,
} from "@/entities/service-option-rate-plan";
import { clearFormScopedOnSubmitFieldErrors } from "@/shared/lib/form";

export type RatePlanFormValues = Pick<
  RatePlan,
  | "name"
  | "validityDateFrom"
  | "validityDateTo"
  | "payAtProperty"
  | "isActive"
  | "version"
>;

export interface UseRatePlanFormOptions {
  /** Called after successful POST create (draft row can be removed from local list). */
  onRatePlanCreated?: (ratePlan: RatePlan) => void;
  /** Optional uniqueness guard for rate plan names. */
  isNameUnique?: (name: string) => boolean;
}

export const INITIAL_RATE_PLAN: RatePlanFormValues = {
  name: "",
  validityDateFrom: "",
  validityDateTo: null,
  payAtProperty: false,
  isActive: false,
  version: 0,
};

/** Maps API rate plan to header-only form values. */
export function toFormValues(rp: RatePlan): RatePlanFormValues {
  return {
    name: rp.name,
    validityDateFrom: rp.validityDateFrom,
    validityDateTo: rp.validityDateTo,
    payAtProperty: rp.payAtProperty,
    isActive: rp.isActive,
    version: rp.version,
  };
}

function buildCreateRequestPayload(
  value: RatePlanFormValues
): CreateRatePlanRequestPayload {
  return {
    name: value.name.trim(),
    validityDateFrom: value.validityDateFrom,
    ...(value.validityDateTo ? { validityDateTo: value.validityDateTo } : {}),
    payAtProperty: value.payAtProperty,
    isActive: value.isActive,
  };
}

export function useRatePlanForm(
  initialData?: RatePlan | null,
  serviceId?: string | null,
  ratePlanId?: string | null,
  initialFormValues?: RatePlanFormValues | null,
  options?: UseRatePlanFormOptions
) {
  const prevRef = useRef<RatePlan | null | undefined>(initialData);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const createMutation = useCreateRatePlan(serviceId as string);
  const updateMutation = useUpdateRatePlan(
    serviceId as string,
    ratePlanId as string
  );

  const defaultValues: RatePlanFormValues = initialData
    ? toFormValues(initialData)
    : (initialFormValues ?? INITIAL_RATE_PLAN);

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: ({ value }) => {
        const fields: Record<string, string> = {};

        if (!value.name.trim()) {
          fields.name = i18n.t("validation.required", {
            ns: "admin",
            field: i18n.t("labels.ratePlanName", { ns: "admin" }),
          });
        }
        if (value.name.trim() && options?.isNameUnique) {
          const isUnique = options.isNameUnique(value.name.trim());
          if (!isUnique) {
            fields.name = i18n.t("validation.ratePlanForm.nameMustBeUnique", {
              ns: "admin",
            });
          }
        }
        if (!value.validityDateFrom) {
          fields.validityDateFrom = i18n.t("validation.required", {
            ns: "admin",
            field: i18n.t("labels.validityDateFrom", { ns: "admin" }),
          });
        }
        // validityDateTo is optional; only validate ordering when both are set
        if (
          value.validityDateFrom &&
          value.validityDateTo &&
          value.validityDateFrom > value.validityDateTo
        ) {
          fields.validityDateFrom = i18n.t(
            "validation.ratePlanForm.validityStartBeforeEnd",
            { ns: "admin" }
          );
        }

        return Object.keys(fields).length > 0 ? { fields } : undefined;
      },
    },
    onSubmit: async ({ value }) => {
      if (ratePlanId) {
        const payload: UpdateRatePlanPayload = {
          name: value.name.trim(),
          validityDateFrom: value.validityDateFrom,
          ...(value.validityDateTo
            ? { validityDateTo: value.validityDateTo }
            : { validityDateTo: null }),
          payAtProperty: value.payAtProperty,
          version: value.version,
        };
        const updated = await updateMutation.mutateAsync(payload);
        form.reset(toFormValues(updated));
      } else {
        const created = await createMutation.mutateAsync(
          buildCreateRequestPayload(value)
        );
        form.reset(toFormValues(created));
        options?.onRatePlanCreated?.(created);
      }
      setHasAttemptedSave(false);
    },
  });

  useEffect(() => {
    if (!initialData) return;
    if (prevRef.current !== initialData) {
      prevRef.current = initialData;
      form.reset(toFormValues(initialData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const isDirty = useStore(form.store, (state) => state.isDirty);

  const handleSave = () => {
    setHasAttemptedSave(true);
    clearFormScopedOnSubmitFieldErrors(form);
    form.handleSubmit();
  };

  return {
    form,
    isDirty,
    handleSave,
    hasAttemptedSave,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
  };
}
