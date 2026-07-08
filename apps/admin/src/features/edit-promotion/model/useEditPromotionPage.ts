import { getErrorMessage, getValidationErrors } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import type { ZodIssue } from "zod";

import {
  type PromotionFormValues,
  promotionDetailToFormValues,
  usePromotion,
  useUpdatePromotion,
} from "@/entities/promotion";
import { useSupplierHeadOffice } from "@/entities/supplier-head-office";
import { useSuppliers } from "@/entities/suppliers";
import { useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import {
  clearFormScopedOnSubmitFieldErrors,
  getFieldNamesFromZodError,
  safeParseSubmitData,
} from "@/shared/lib/form";
import { headOfficeDetailPath } from "@/shared/lib/paths";

import { mapPromotionFormValuesToPayload } from "@/features/create-promotion/model/mapPromotionFormValuesToPayload";
import {
  getPromotionErrorFieldNames,
  toPromotionFormErrors,
} from "@/features/create-promotion/model/promotionApiValidationErrors";
import { createPromotionSubmitSchema } from "@/features/create-promotion/model/schema";
import { usePromotionForm } from "@/features/create-promotion/model/usePromotionForm";

type PromotionFormSectionId = "general-information" | "promotion-rules";

const ERROR_KEY_TO_SECTION: Record<string, PromotionFormSectionId> = {
  name: "general-information",
  note: "general-information",
  travelDates: "general-information",
  bookingWindow: "general-information",
  bookingWindowRelative: "general-information",
  conditions: "promotion-rules",
  actions: "promotion-rules",
};

type PromotionFormApi = ReturnType<typeof usePromotionForm>["form"];

function getFirstPromotionSectionWithError(
  errorFieldNames: string[]
): PromotionFormSectionId | null {
  for (const key of errorFieldNames) {
    const sectionId = ERROR_KEY_TO_SECTION[key];
    if (sectionId) {
      return sectionId;
    }
  }

  return null;
}

function pathToFieldName(path: Array<string | number>) {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }

    return result ? `${result}.${segment}` : segment;
  }, "");
}

function setFieldSubmitError(
  form: PromotionFormApi,
  path: string,
  message: string
) {
  form.setFieldMeta(path as never, (previous) => {
    const meta = (previous ?? {}) as {
      isTouched?: boolean;
      isBlurred?: boolean;
      isDirty?: boolean;
      isValidating?: boolean;
      errorMap?: Record<string, unknown>;
      errorSourceMap?: Record<string, string | undefined>;
    };

    return {
      ...meta,
      errorMap: {
        ...meta.errorMap,
        onSubmit: message,
      },
      errorSourceMap: {
        ...meta.errorSourceMap,
        onSubmit: "form",
      },
    } as never;
  });
}

function applyZodIssuesToForm(form: PromotionFormApi, issues: ZodIssue[]) {
  for (const issue of issues) {
    const fieldName = pathToFieldName(
      issue.path.filter(
        (segment): segment is string | number =>
          typeof segment === "string" || typeof segment === "number"
      )
    );
    if (!fieldName) continue;
    setFieldSubmitError(form, fieldName, issue.message);
  }
}

function applyApiValidationErrors(
  form: PromotionFormApi,
  errors: Record<string, string[]>
) {
  const formErrors = toPromotionFormErrors(
    errors,
    form.state.values as PromotionFormValues
  );

  for (const [fieldName, message] of Object.entries(formErrors)) {
    if (!message) continue;
    setFieldSubmitError(form, fieldName, message);
  }

  return formErrors;
}

export function useEditPromotionPage() {
  const { headOfficeId, promotionId } = useParams<{
    headOfficeId: string;
    promotionId: string;
  }>();

  const {
    data: headOffice,
    isLoading: isHeadOfficeLoading,
    error: headOfficeError,
  } = useSupplierHeadOffice(headOfficeId ?? null);
  const {
    data: promotion,
    isLoading: isPromotionLoading,
    error: promotionError,
  } = usePromotion(headOfficeId ?? null, promotionId ?? null);
  const { data: suppliers = [] } = useSuppliers(headOfficeId ?? null);
  const submitSchema = useMemo(
    () =>
      createPromotionSubmitSchema({
        supplierIds: suppliers.map((supplier) => supplier.id),
        supplierCount: suppliers.length,
      }),
    [suppliers]
  );

  const initialFormValues = useMemo(
    () => (promotion ? promotionDetailToFormValues(promotion) : null),
    [promotion]
  );

  const { form, isDirty, reset } = usePromotionForm(initialFormValues);
  const { mutate: updatePromotion, isPending } = useUpdatePromotion(
    headOfficeId ?? "",
    promotionId ?? ""
  );

  const exitPath = headOfficeId
    ? `${headOfficeDetailPath(headOfficeId)}#promotions`
    : "";

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath,
    onPrepareDiscard: () => {
      reset(initialFormValues);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headOfficeId || !promotionId || !promotion) {
      return;
    }

    clearFormScopedOnSubmitFieldErrors(form);

    const result = safeParseSubmitData(submitSchema, form.state.values);

    if (!result.success) {
      applyZodIssuesToForm(form, result.error.issues);

      const firstSection = getFirstPromotionSectionWithError(
        getFieldNamesFromZodError(result.error)
      );
      if (firstSection) {
        scrollToSection(firstSection);
      }
      return;
    }

    const version = result.data.version ?? promotion.version;

    if (!version) {
      toast.error(i18n.t("errors.failedToUpdatePromotion", { ns: "admin" }));
      return;
    }

    updatePromotion(
      {
        ...mapPromotionFormValuesToPayload(result.data, "update"),
        version,
      },
      {
        onSuccess: (updatedPromotion) => {
          reset(promotionDetailToFormValues(updatedPromotion));
          toast.success(
            i18n.t("modals.promotionUpdatedSuccess", { ns: "admin" })
          );
        },
        onError: (error) => {
          const validation = getValidationErrors(error);

          if (validation) {
            const formErrors = applyApiValidationErrors(
              form,
              validation.errors
            );

            const firstSection = getFirstPromotionSectionWithError(
              getPromotionErrorFieldNames(Object.keys(formErrors))
            );
            if (firstSection) {
              scrollToSection(firstSection);
            }
            return;
          }

          toast.error(
            getErrorMessage(
              error,
              i18n.t("errors.failedToUpdatePromotion", { ns: "admin" })
            )
          );
        },
      }
    );
  };

  return {
    headOfficeId,
    promotionId,
    headOffice,
    promotion,
    isLoading: isHeadOfficeLoading || isPromotionLoading,
    error: headOfficeError ?? promotionError,
    suppliers,
    form,
    isPending,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    unsavedDialogOpen: showUnsavedDialog,
    formId: "edit-promotion-form",
    submitButtonLabel: i18n.t("buttons.save", { ns: "common" }),
    isSubmitDisabled: !isDirty,
    title:
      headOffice?.name ?? i18n.t("sections.createPromotion", { ns: "admin" }),
  };
}
