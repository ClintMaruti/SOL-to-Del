import { getErrorMessage, getValidationErrors } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { useForm } from "@tanstack/react-form";
import { toast } from "@sol/ui";
import { useEffect, useRef } from "react";

import {
  useCreateServiceRate,
  useUpdateServiceRate,
  type ServiceRate,
} from "@/entities/service-rate";
import { clearFormScopedOnSubmitFieldErrors } from "@/shared/lib/form";

import {
  applyServiceRateApiValidationErrors,
  zodFieldErrorsToTanStackFields,
} from "./serviceRateFormErrors";
import {
  DEFAULT_SERVICE_RATE_FORM,
  serviceRateFormSchema,
  type ServiceRateFormValues,
} from "./schema";

export function serviceRateToFormValues(
  rate: ServiceRate
): ServiceRateFormValues {
  return {
    name: rate.name,
    chargeType: rate.chargeType,
    timeUnit: rate.timeUnit,
  };
}

interface UseServiceRateFormOptions {
  open: boolean;
  serviceId: string;
  rate?: ServiceRate | null;
  initialValues?: ServiceRateFormValues;
  onSuccess?: () => void;
}

function resolveFormValues(
  rate: ServiceRate | null | undefined,
  initialValues: ServiceRateFormValues | undefined
): ServiceRateFormValues {
  if (rate) {
    return serviceRateToFormValues(rate);
  }
  return initialValues ?? DEFAULT_SERVICE_RATE_FORM;
}

export function useServiceRateForm({
  open,
  serviceId,
  rate,
  initialValues,
  onSuccess,
}: UseServiceRateFormOptions) {
  const isEdit = Boolean(rate?.id);
  const createMutation = useCreateServiceRate(serviceId, {
    suppressErrorToast: true,
  });
  const updateMutation = useUpdateServiceRate(serviceId, {
    suppressErrorToast: true,
  });

  const form = useForm({
    defaultValues: rate
      ? serviceRateToFormValues(rate)
      : (initialValues ?? DEFAULT_SERVICE_RATE_FORM),
    validators: {
      onSubmit: ({ value }) => {
        const parsed = serviceRateFormSchema.safeParse(value);
        if (!parsed.success) {
          const fields = zodFieldErrorsToTanStackFields(
            parsed.error.flatten().fieldErrors
          );
          return Object.keys(fields).length > 0 ? { fields } : undefined;
        }
      },
    },
    onSubmit: async ({ value }) => {
      clearFormScopedOnSubmitFieldErrors(form);

      try {
        if (isEdit && rate) {
          await updateMutation.mutateAsync({
            id: rate.id,
            name: value.name.trim(),
            chargeType: value.chargeType,
            timeUnit: value.timeUnit,
            version: rate.version ?? 1,
          });
        } else {
          await createMutation.mutateAsync({
            name: value.name.trim(),
            chargeType: value.chargeType,
            timeUnit: value.timeUnit,
          });
        }
        onSuccess?.();
      } catch (error) {
        const validation = getValidationErrors(error);
        if (validation) {
          const applied = applyServiceRateApiValidationErrors(
            form,
            validation.errors
          );
          if (applied) {
            toast.error(
              Object.values(validation.errors)[0]?.[0] ?? validation.message
            );
            return;
          }
        }

        toast.error(
          getErrorMessage(
            error,
            i18n.t(
              isEdit
                ? "errors.failedToUpdateRate"
                : "errors.failedToCreateRate",
              { ns: "admin" }
            )
          )
        );
      }
    },
  });

  const prevOpenRef = useRef(open);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    const justOpened = open && !wasOpen;
    const justClosed = !open && wasOpen;
    prevOpenRef.current = open;

    if (justClosed) {
      form.reset(DEFAULT_SERVICE_RATE_FORM);
      createMutation.reset();
      updateMutation.reset();
      return;
    }

    if (justOpened) {
      form.reset(resolveFormValues(rate, initialValues));
    }
  }, [open, rate, initialValues, form, createMutation, updateMutation]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return { form, isEdit, isPending };
}
