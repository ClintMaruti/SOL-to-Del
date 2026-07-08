import { getErrorMessage } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  useSupplierService,
  useToggleSupplierServiceStatus,
  useUpdateSupplierService,
} from "@/entities/supplier-services";
import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { generateRoutePath, scrollToSection } from "@/shared/lib";
import { safeParseSubmitData } from "@/shared/lib/form";
import { SUPPLIER_SERVICE_FORM_ANCHOR_SECTIONS } from "@/widgets/supplier-service-form";

import { supplierServiceDetailToFormData } from "../lib/supplierServiceDetailToFormData";

import { editSupplierServiceSubmitSchema } from "./schema";
import { useEditSupplierServiceForm } from "./useEditSupplierServiceForm";
import { useSupplierServiceNotes } from "./useSupplierServiceNotes";

const SECTION_IDS = SUPPLIER_SERVICE_FORM_ANCHOR_SECTIONS.map((s) => s.id);

function getFirstSectionWithError(errorFieldNames: string[]): string | null {
  const generalFields = [
    "name",
    "alternativeName",
    "serviceTypeId",
    "locationId",
    "description",
  ];
  const bestForFields = ["tags"];

  if (errorFieldNames.some((f) => generalFields.includes(f)))
    return "general-information";
  if (errorFieldNames.some((f) => bestForFields.includes(f))) return "best-for";
  return null;
}

export function useSupplierServiceDetailPage() {
  const { supplierId, serviceId } = useParams<{
    supplierId: string;
    serviceId: string;
  }>();
  const { activeSectionId } = useActiveSection(SECTION_IDS);
  const [schemaError, setSchemaError] = useState<string | undefined>();

  const {
    data: supplierService,
    isLoading,
    error,
  } = useSupplierService(serviceId ?? null);

  const initialFormData = useMemo(
    () =>
      supplierService ? supplierServiceDetailToFormData(supplierService) : null,
    [supplierService]
  );

  const {
    form,
    isDirty: formIsDirty,
    reset,
  } = useEditSupplierServiceForm(initialFormData);

  const notes = useSupplierServiceNotes(serviceId, supplierId);

  const { mutate: updateService, isPending } = useUpdateSupplierService();
  const { mutate: toggleStatus } = useToggleSupplierServiceStatus();

  const exitPath = `${generateRoutePath("database", "destinations", "suppliers")}/${supplierId ?? ""}?tab=services`;

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty: formIsDirty || notes.isDirty,
    exitPath,
    onPrepareDiscard: () => {
      reset(initialFormData ?? undefined);
      notes.resetToServer();
    },
  });

  useEffect(() => {
    if (!supplierService) return;
    reset(supplierServiceDetailToFormData(supplierService));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierService?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);

    await form.validateAllFields("submit");
    if (!form.state.isValid || !serviceId || !supplierId) {
      const fieldMeta = form.state.fieldMeta as Record<
        string,
        { errors?: string[] } | undefined
      >;
      const errorFieldNames = Object.keys(fieldMeta).filter(
        (key) => (fieldMeta[key]?.errors?.length ?? 0) > 0
      );
      const firstSection = getFirstSectionWithError(errorFieldNames);
      if (firstSection) scrollToSection(firstSection);
      return;
    }

    const result = safeParseSubmitData(
      editSupplierServiceSubmitSchema,
      form.state.values
    );
    if (!result.success) {
      setSchemaError(result.message);
      return;
    }

    updateService(
      { serviceId, supplierId, payload: result.data },
      {
        onSuccess: (data) => {
          setSchemaError(undefined);
          if (data) reset(supplierServiceDetailToFormData(data));
          toast.success(
            i18n.t("modals.supplierServiceUpdatedSuccess", { ns: "admin" })
          );
        },
        onError: (err) => {
          toast.error(
            getErrorMessage(
              err,
              i18n.t("errors.failedToUpdateSupplierService", { ns: "admin" })
            )
          );
        },
      }
    );
  };

  const handleToggleServiceStatus = () => {
    if (serviceId && supplierId && supplierService) {
      toggleStatus({
        serviceId,
        supplierId,
        isActive: supplierService.isActive,
      });
    }
  };

  const title = supplierService?.name ?? "";

  return {
    supplierId,
    serviceId,
    supplierService,
    isLoading,
    error,
    form,
    isPending,
    activeSectionId,
    sections: SUPPLIER_SERVICE_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "supplier-service-detail-form",
    title,
    submitButtonLabel: i18n.t("buttons.save", { ns: "common" }),
    schemaError,
    showActiveToggle: true,
    serviceStatusActive: supplierService?.isActive ?? false,
    handleToggleServiceStatus,
    notes,
  };
}
