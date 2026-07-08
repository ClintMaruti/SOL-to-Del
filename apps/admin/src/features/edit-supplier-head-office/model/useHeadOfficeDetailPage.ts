import { getErrorMessage } from "@sol/api-client";
import { i18n } from "@sol/i18n";
import { toast } from "@sol/ui";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  useSupplierHeadOffice,
  useSupplierHeadOffices,
  useToggleSupplierHeadOfficeStatus,
  useUpdateSupplierHeadOffice,
} from "@/entities/supplier-head-office";
import {
  useDeleteSupplier,
  useSuppliers,
  useToggleSupplierStatus,
} from "@/entities/suppliers";
import type { Supplier } from "@/entities/suppliers/model/types";
import { createSupplierHeadOfficeSubmitSchema } from "@/features/create-supplier-head-office/model/schema";
import { getFirstSectionWithError } from "@/features/create-supplier-head-office/model/useCreateNewSupplierHeadOfficePage";
import { useCreateSupplierHeadOfficeForm } from "@/features/create-supplier-head-office/model/useCreateSupplierHeadOfficeForm";
import { useActiveSection, useUnsavedChangesBlocker } from "@/shared/hooks";
import { scrollToSection } from "@/shared/lib";
import { safeParseSubmitData } from "@/shared/lib/form";
import { ROUTES, supplierDetailPath } from "@/shared/lib/paths";
import { SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS } from "@/widgets/supplier-head-office-form";

import { headOfficeDetailToFormData } from "../lib/headOfficeDetailToFormData";

const SECTION_IDS = SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS.map((s) => s.id);
const HEAD_OFFICES_LIST_PATH = ROUTES.SUPPLIER_HEAD_OFFICES;

export function useHeadOfficeDetailPage() {
  const { headOfficeId } = useParams<{ headOfficeId: string }>();
  const navigate = useNavigate();
  const { activeSectionId, onSectionClick } = useActiveSection(SECTION_IDS);

  const [schemaError, setSchemaError] = useState<string | undefined>();
  const [unassignError, setUnassignError] = useState<Error | null>(null);

  const {
    data: headOffice,
    isLoading,
    error,
  } = useSupplierHeadOffice(headOfficeId ?? null);
  const { data: allSuppliers = [] } = useSuppliers(headOfficeId ?? null);
  const { data: headOffices = [] } = useSupplierHeadOffices();
  const { mutate: toggleSupplierStatus } = useToggleSupplierStatus();
  const { mutate: deleteSupplier, isPending: isDeletingSupplier } =
    useDeleteSupplier();
  const initialFormData = useMemo(
    () => (headOffice ? headOfficeDetailToFormData(headOffice) : null),
    [headOffice]
  );

  const {
    form,
    isDirty: formIsDirty,
    reset,
  } = useCreateSupplierHeadOfficeForm(initialFormData);

  const { mutate: updateHeadOffice, isPending } = useUpdateSupplierHeadOffice();
  const { mutate: toggleStatus, isPending: isTogglingStatus } =
    useToggleSupplierHeadOfficeStatus();
  const [pendingToggle, setPendingToggle] = useState(false);

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty: formIsDirty,
    exitPath: HEAD_OFFICES_LIST_PATH,
    onPrepareDiscard: () => {
      reset(initialFormData ?? undefined);
    },
  });

  useEffect(() => {
    if (isLoading) return;
    const hash = window.location.hash.slice(1);
    if (!hash || !SECTION_IDS.includes(hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    scrollToSection(hash);
    onSectionClick(hash);
  }, [isLoading, onSectionClick]);

  useEffect(() => {
    if (!headOffice) return;
    reset(headOfficeDetailToFormData(headOffice));
  }, [headOffice?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- only reset when switching head office

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);

    await form.validateAllFields("submit");
    if (!form.state.isValid || !headOfficeId) {
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
      createSupplierHeadOfficeSubmitSchema,
      form.state.values
    );
    if (!result.success) {
      setSchemaError(result.message);
      return;
    }

    const payload = {
      ...result.data,
      additionalEmail: result.data.additionalEmail || null,
      website: result.data.website || null,
      country: result.data.country || null,
      city: result.data.city || null,
      postalCode: result.data.postalCode || null,
      streetAddress: result.data.streetAddress || null,
      isActive: headOffice?.isActive,
      id: headOffice?.id as string,
    };

    updateHeadOffice(
      { payload },
      {
        onSuccess: (data) => {
          setSchemaError(undefined);
          if (data) reset(headOfficeDetailToFormData(data));
          toast.success(
            i18n.t("modals.headOfficeUpdatedSuccess", { ns: "admin" })
          );
        },
        onError: (err) => {
          toast.error(
            getErrorMessage(
              err,
              i18n.t("errors.failedToUpdateHeadOffice", { ns: "admin" })
            )
          );
        },
      }
    );
  };

  const handleToggleHeadOfficeStatus = () => {
    if (!headOfficeId || !headOffice) return;
    setPendingToggle(true);
  };

  const toggleConfirmDialog = {
    open: pendingToggle,
    onOpenChange: (open: boolean) => !open && setPendingToggle(false),
    title: headOffice?.isActive
      ? i18n.t("modals.confirmDeactivateHeadOffice", { ns: "admin" })
      : i18n.t("modals.confirmActivateHeadOffice", { ns: "admin" }),
    description: headOffice?.isActive
      ? i18n.t("modals.confirmDeactivateHeadOfficeDescription", { ns: "admin" })
      : i18n.t("modals.confirmActivateHeadOfficeDescription", { ns: "admin" }),
    confirmLabel: headOffice?.isActive
      ? i18n.t("buttons.deactivate", { ns: "admin" })
      : i18n.t("buttons.activate", { ns: "admin" }),
    isPending: isTogglingStatus,
    onConfirm: () => {
      if (!headOfficeId || !headOffice) return;
      toggleStatus(
        {
          supplierHeadOfficeId: headOfficeId,
          isActive: headOffice.isActive as boolean,
        },
        { onSuccess: () => setPendingToggle(false) }
      );
    },
  };

  const suppliers = useMemo(() => {
    if (!headOffice?.name) return [];
    const list = Array.isArray(allSuppliers) ? allSuppliers : [];
    return list.filter((s) => s.headOfficeName === headOffice.name);
  }, [headOffice, allSuppliers]);

  const otherHeadOffices = useMemo(() => {
    const list = Array.isArray(headOffices) ? headOffices : [];
    return headOfficeId ? list.filter((h) => h.id !== headOfficeId) : [];
  }, [headOfficeId, headOffices]);
  const unassignTargetHeadOffice = otherHeadOffices[0] ?? null;

  const handleToggleSupplierStatus = (supplier: Supplier) => {
    toggleSupplierStatus({
      supplierId: supplier.id,
      activate: !supplier.isActive,
    });
  };

  const handleDeleteSupplier = (
    supplier: Supplier,
    callbacks?: { onSuccess?: () => void }
  ) => {
    if (!unassignTargetHeadOffice) {
      toast.error("Add another Head Office before deleting.");
      return;
    }
    setUnassignError(null);
    deleteSupplier(supplier.id, {
      onSuccess: () => {
        callbacks?.onSuccess?.();
      },
      onError: (err) => {
        setUnassignError(err instanceof Error ? err : new Error(String(err)));
      },
    });
  };

  const resetDeleteError = () => setUnassignError(null);

  const handleSupplierNameClick = (supplierId: string) => {
    navigate(supplierDetailPath(supplierId));
  };

  const title = headOffice?.name ?? "Head Office";

  return {
    headOfficeId,
    headOffice,
    isLoading,
    error,
    form,
    isPending,
    activeSectionId,
    onSectionClick,
    sections: SUPPLIER_HEAD_OFFICE_FORM_ANCHOR_SECTIONS,
    unsavedDialogOpen: showUnsavedDialog,
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    formId: "head-office-detail-form",
    title,
    submitButtonLabel: "Save",
    description: undefined,
    showActiveToggle: true,
    headOfficeStatusActive: headOffice?.isActive ?? false,
    handleToggleHeadOfficeStatus,
    toggleConfirmDialog,
    suppliers,
    onSupplierNameClick: handleSupplierNameClick,
    schemaError,
    onToggleSupplierStatus: handleToggleSupplierStatus,
    onDeleteSupplier: handleDeleteSupplier,
    deleteTargetHeadOfficeName: unassignTargetHeadOffice?.name ?? null,
    canDelete: Boolean(unassignTargetHeadOffice),
    isDeletePending: isDeletingSupplier,
    deleteError: unassignError,
    resetDeleteError,
  };
}
