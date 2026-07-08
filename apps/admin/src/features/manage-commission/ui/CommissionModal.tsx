import {
  getErrorMessage,
  getFieldError,
  getValidationErrors,
} from "@sol/api-client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FieldGroup,
  Input,
  cn,
} from "@sol/ui";
import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  hasCommissionEffectiveFromConflict,
  isCommissionDateTodayOrPast,
  toLocalIsoDateString,
  useAgencyCommissions,
  type Commission,
} from "@/entities/commission";
import { DatePickerGridInput } from "@/shared/ui";

import { useCreateCommission } from "../api/useCreateCommission";
import { useUpdateCommission } from "../api/useUpdateCommission";

type CommissionFieldName = "effectiveFrom" | "commissionPercent";
type CommissionFieldErrors = Partial<Record<CommissionFieldName, string>>;

interface ModalAlertState {
  title: string;
  description?: string;
}

interface CommissionModalProps {
  agencyId: string;
  commission?: Commission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommissionFormValues {
  effectiveFrom: string;
  commissionPercent: string;
}

function getInitialValues(
  commission?: Commission | null
): CommissionFormValues {
  if (!commission) {
    return {
      effectiveFrom: "",
      commissionPercent: "",
    };
  }

  return {
    effectiveFrom: commission.effectiveFrom,
    commissionPercent: String(Number(commission.commissionPercent)),
  };
}

export function CommissionModal({
  agencyId,
  commission,
  open,
  onOpenChange,
}: CommissionModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const isEditMode = commission != null;
  const {
    mutate: createCommission,
    isPending: isCreatingCommission,
    reset: resetCreateCommission,
  } = useCreateCommission();
  const {
    mutate: updateCommission,
    isPending: isUpdatingCommission,
    reset: resetUpdateCommission,
  } = useUpdateCommission();
  const { data: existingCommissions = [] } = useAgencyCommissions(agencyId);
  const [values, setValues] = useState<CommissionFormValues>(() =>
    getInitialValues(commission)
  );
  const [fieldErrors, setFieldErrors] = useState<CommissionFieldErrors>({});
  const [alert, setAlert] = useState<ModalAlertState | null>(null);

  const isPending = isCreatingCommission || isUpdatingCommission;
  const todayIsoDate = useMemo(() => toLocalIsoDateString(), []);
  const duplicateEffectiveFromMessage = t(
    "errors.commissionDuplicateEffectiveFrom"
  );

  const getEffectiveFromAlertDescription = (message?: string) => {
    if (!message) {
      return undefined;
    }

    const commissionPastDateMessages = new Set([
      t("errors.commissionPastDateTitle"),
      "Effective date can not be set as today or a past date",
    ]);

    return commissionPastDateMessages.has(message)
      ? t("errors.commissionPastDateDescription")
      : undefined;
  };

  useEffect(() => {
    setValues(getInitialValues(commission));
    setFieldErrors({});
    setAlert(null);

    if (!open) {
      resetCreateCommission();
      resetUpdateCommission();
    }
  }, [commission, open, resetCreateCommission, resetUpdateCommission]);

  const clearFieldState = (fieldName: CommissionFieldName) => {
    setFieldErrors((previous) => ({
      ...previous,
      [fieldName]: undefined,
    }));
    setAlert(null);
  };

  const handleEffectiveFromChange = (effectiveFrom: string) => {
    clearFieldState("effectiveFrom");
    setValues((previous) => ({
      ...previous,
      effectiveFrom,
    }));
  };

  const handleCommissionPercentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    clearFieldState("commissionPercent");
    setValues((previous) => ({
      ...previous,
      commissionPercent: event.target.value,
    }));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFieldErrors({});
      setAlert(null);
    }

    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  const applyMutationError = (error: unknown) => {
    const validation = getValidationErrors(error);

    if (validation) {
      const effectiveFromError = getFieldError(
        validation.errors,
        "effectiveFrom"
      );
      const commissionPercentError = getFieldError(
        validation.errors,
        "commissionPercent"
      );
      const nextFieldErrors: CommissionFieldErrors = {
        effectiveFrom: effectiveFromError,
        commissionPercent: commissionPercentError,
      };

      setFieldErrors(nextFieldErrors);

      const firstError =
        effectiveFromError ?? commissionPercentError ?? validation.message;

      setAlert({
        title: firstError,
        description: getEffectiveFromAlertDescription(effectiveFromError),
      });

      return;
    }

    setAlert({
      title: getErrorMessage(
        error,
        isEditMode
          ? t("errors.failedToUpdateCommission")
          : t("errors.failedToCreateCommission")
      ),
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const nextFieldErrors: CommissionFieldErrors = {};

    if (!values.effectiveFrom) {
      nextFieldErrors.effectiveFrom = t("validation.required", {
        field: t("tableHeaders.effectiveFrom"),
      });
    } else if (
      isCommissionDateTodayOrPast(values.effectiveFrom, todayIsoDate)
    ) {
      nextFieldErrors.effectiveFrom = t("errors.commissionPastDateTitle");
    } else if (
      hasCommissionEffectiveFromConflict(
        existingCommissions,
        values.effectiveFrom,
        commission?.id
      )
    ) {
      nextFieldErrors.effectiveFrom = duplicateEffectiveFromMessage;
    }

    if (!values.commissionPercent.trim()) {
      nextFieldErrors.commissionPercent = t("validation.required", {
        field: t("tableHeaders.commissionPercent"),
      });
    }

    const parsedCommissionPercent = Number(values.commissionPercent);
    if (
      values.commissionPercent.trim() &&
      (!Number.isFinite(parsedCommissionPercent) || parsedCommissionPercent < 0)
    ) {
      nextFieldErrors.commissionPercent = t(
        "validation.fieldMustBeZeroOrGreater",
        {
          field: t("tableHeaders.commissionPercent"),
        }
      );
    } else if (
      values.commissionPercent.trim() &&
      parsedCommissionPercent > 100
    ) {
      nextFieldErrors.commissionPercent = t("validation.mustBeBetween", {
        min: 0,
        max: 100,
      });
    }

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors);
      setAlert(
        nextFieldErrors.effectiveFrom
          ? {
              title: nextFieldErrors.effectiveFrom,
              description: getEffectiveFromAlertDescription(
                nextFieldErrors.effectiveFrom
              ),
            }
          : null
      );
      return;
    }

    setFieldErrors({});
    setAlert(null);

    if (isEditMode && commission) {
      updateCommission(
        {
          commissionId: commission.id,
          payload: {
            effectiveFrom: values.effectiveFrom,
            commissionPercent: parsedCommissionPercent,
            version: commission.version,
          },
        },
        {
          onSuccess: () => handleOpenChange(false),
          onError: applyMutationError,
        }
      );

      return;
    }

    createCommission(
      {
        agencyId,
        payload: {
          effectiveFrom: values.effectiveFrom,
          commissionPercent: parsedCommissionPercent,
        },
      },
      {
        onSuccess: () => handleOpenChange(false),
        onError: applyMutationError,
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[474px]! gap-4 rounded-[12px] border-black/10 px-5 py-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-1px_rgba(0,0,0,0.06)]">
        <DialogHeader>
          <DialogTitle className="text-lg leading-7 font-bold text-text-primary">
            {isEditMode
              ? t("modals.editCommission")
              : t("modals.createCommission")}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 font-medium text-text-secondary">
            {isEditMode
              ? t("modals.editCommissionDescription")
              : t("modals.createCommissionDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Ideally this error message should not fire since we are already disabling the past dates in the calendar. I'm just keeping it here since it's on figma and just in case. */}
          {alert ? (
            <div
              className="flex gap-3 rounded-[6px] bg-destructive/10 px-4 py-3 text-destructive"
              role="alert"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-red-600"
                aria-hidden
              />
              <div className="flex min-w-0 flex-col">
                <p className="text-sm leading-5 font-bold text-red-600">
                  {alert.title}
                </p>
                {alert.description ? (
                  <p className="text-sm leading-6 font-medium opacity-80 text-red-600">
                    {alert.description}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label={t("tableHeaders.effectiveFrom")} required>
              <DatePickerGridInput
                id="commission-effectiveFrom"
                value={values.effectiveFrom}
                onChange={handleEffectiveFromChange}
                placeholder={t("common:placeholders.selectDate")}
                hasError={Boolean(fieldErrors.effectiveFrom)}
                isDateDisabled={(date) => {
                  const isoDate = toLocalIsoDateString(date);

                  return (
                    isoDate <= todayIsoDate ||
                    hasCommissionEffectiveFromConflict(
                      existingCommissions,
                      isoDate,
                      commission?.id
                    )
                  );
                }}
                className={cn(
                  fieldErrors.effectiveFrom
                    ? "bg-destructive/10"
                    : values.effectiveFrom
                      ? "bg-background-primary"
                      : "bg-white"
                )}
              />
            </FieldGroup>

            <FieldGroup
              label={t("tableHeaders.commissionPercent")}
              required
              error={fieldErrors.commissionPercent}
            >
              <Input
                id="commission-commissionPercent"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.1"
                value={values.commissionPercent}
                onChange={handleCommissionPercentChange}
                placeholder={t("placeholders.typeCommission")}
                aria-invalid={Boolean(fieldErrors.commissionPercent)}
              />
            </FieldGroup>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {t("common:buttons.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
