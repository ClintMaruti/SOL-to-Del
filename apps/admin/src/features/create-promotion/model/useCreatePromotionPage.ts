import { getErrorMessage, getValidationErrors } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import type { ZodIssue } from "zod";

import { useSupplierHeadOffice } from "@/entities/supplier-head-office";
import {
  useCreatePromotion,
  type PromotionFormValues,
} from "@/entities/promotion";
import { useSuppliers } from "@/entities/suppliers";
import { useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import {
  clearFormScopedOnSubmitFieldErrors,
  getFieldNamesFromZodError,
  safeParseSubmitData,
} from "@/shared/lib/form";
import {
  headOfficeDetailPath,
  headOfficePromotionDetailPath,
} from "@/shared/lib/paths";

import { mapPromotionFormValuesToPayload } from "./mapPromotionFormValuesToPayload";
import {
  getPromotionErrorFieldNames,
  toPromotionFormErrors,
} from "./promotionApiValidationErrors";
import { createPromotionSubmitSchema } from "./schema";
import { usePromotionForm } from "./usePromotionForm";

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
  form: ReturnType<typeof usePromotionForm>["form"],
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

function applyZodIssuesToForm(
  form: ReturnType<typeof usePromotionForm>["form"],
  issues: ZodIssue[]
) {
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
  form: ReturnType<typeof usePromotionForm>["form"],
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

export function useCreatePromotionPage() {
  const { headOfficeId } = useParams<{ headOfficeId: string }>();
  const [schemaError, setSchemaError] = useState<string | undefined>();

  const {
    data: headOffice,
    isLoading: isHeadOfficeLoading,
    error: headOfficeError,
  } = useSupplierHeadOffice(headOfficeId ?? null);
  const { data: suppliers = [] } = useSuppliers(headOfficeId ?? null);
  const submitSchema = useMemo(
    () =>
      createPromotionSubmitSchema({
        supplierIds: suppliers.map((supplier) => supplier.id),
        supplierCount: suppliers.length,
      }),
    [suppliers]
  );

  const { form, isDirty, reset } = usePromotionForm();
  const { mutate: createPromotion, isPending } = useCreatePromotion(
    headOfficeId ?? ""
  );

  const exitPath = headOfficeId
    ? `${headOfficeDetailPath(headOfficeId)}#promotions`
    : "";

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
    scheduleNavigateAfterSave,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath,
    onPrepareDiscard: () => {
      reset();
      setSchemaError(undefined);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headOfficeId) {
      return;
    }

    clearFormScopedOnSubmitFieldErrors(form);
    setSchemaError(undefined);

    const result = safeParseSubmitData(submitSchema, form.state.values);

    if (!result.success) {
      applyZodIssuesToForm(form, result.error.issues);
      setSchemaError(result.message);

      const firstSection = getFirstPromotionSectionWithError(
        getFieldNamesFromZodError(result.error)
      );
      if (firstSection) {
        scrollToSection(firstSection);
      }
      return;
    }

    const payload = mapPromotionFormValuesToPayload(result.data, "create");

    createPromotion(payload, {
      onSuccess: (promotion) => {
        reset();
        setSchemaError(undefined);
        scheduleNavigateAfterSave(
          headOfficePromotionDetailPath(headOfficeId, promotion.id)
        );
        toast.success(
          i18n.t("modals.promotionCreatedSuccess", { ns: "admin" })
        );
      },
      onError: (error) => {
        const validation = getValidationErrors(error);

        if (validation) {
          const formErrors = applyApiValidationErrors(form, validation.errors);
          setSchemaError(validation.message);

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
            i18n.t("errors.failedToCreatePromotion", { ns: "admin" })
          )
        );
      },
    });
  };

  return {
    headOfficeId,
    headOffice,
    isLoading: isHeadOfficeLoading,
    error: headOfficeError,
    suppliers,
    form,
    schemaError,
    isPending,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    unsavedDialogOpen: showUnsavedDialog,
    formId: "create-promotion-form",
    submitButtonLabel: i18n.t("buttons.save", { ns: "common" }),
    title:
      headOffice?.name ?? i18n.t("sections.createPromotion", { ns: "admin" }),
  };
}
