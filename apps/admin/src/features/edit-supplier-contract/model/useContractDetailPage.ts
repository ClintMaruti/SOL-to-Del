import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import {
  useDeleteSupplierContract,
  useSupplierContract,
  useUpdateSupplierContract,
} from "@/entities/supplier-contract";
import { useSupplier } from "@/entities/suppliers";
import {
  ANY_AGENCY_GROUP_VALUE,
  type AttachContractSubmitData,
  attachContractSubmitSchema,
} from "@/features/create-supplier-contract/model/schema";
import { useUnsavedChangesBlocker } from "@/shared/hooks";
import { safeParseSubmitData } from "@/shared/lib/form";
import { supplierDetailPath } from "@/shared/lib/paths";

import { useContractDetailForm } from "../model/useContractDetailForm";

export function useContractDetailPage() {
  const { supplierId, contractId } = useParams<{
    supplierId: string;
    contractId: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  const [schemaError, setSchemaError] = useState<string | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [validityWarningOpen, setValidityWarningOpen] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] =
    useState<AttachContractSubmitData | null>(null);

  const {
    data: contract,
    isLoading,
    error,
  } = useSupplierContract(supplierId ?? null, contractId ?? null);
  const { data: supplier } = useSupplier(supplierId ?? undefined);

  const initialFormData = useMemo(
    () =>
      contract
        ? {
            name: contract.name,
            link: contract.link ?? "",
            agencyGroupId: contract.agencyGroupId ?? ANY_AGENCY_GROUP_VALUE,
            validFrom: contract.validFrom,
            validTo: contract.validTo,
          }
        : null,
    [contract]
  );

  const {
    form,
    isDirty: isContractFormDirty,
    reset,
  } = useContractDetailForm(initialFormData);
  const [policiesDirty, setPoliciesDirty] = useState(false);
  const handlePoliciesDirtyChange = useCallback((dirty: boolean) => {
    setPoliciesDirty(dirty);
  }, []);

  const isDirty = isContractFormDirty || policiesDirty;

  const { mutate: updateContract, isPending } = useUpdateSupplierContract();
  const {
    mutate: deleteContract,
    isPending: isDeletePending,
    reset: resetDeleteMutation,
  } = useDeleteSupplierContract();

  const exitPath = supplierId
    ? `${supplierDetailPath(supplierId)}?tab=contracts`
    : "/";

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath,
    onPrepareDiscard: () => {
      reset(initialFormData ?? undefined);
    },
  });

  useEffect(() => {
    if (!contract) return;
    reset({
      name: contract.name,
      link: contract.link ?? "",
      agencyGroupId: contract.agencyGroupId ?? ANY_AGENCY_GROUP_VALUE,
      validFrom: contract.validFrom,
      validTo: contract.validTo,
    });
    // Reset when switching contracts or when the fetched locked scope fills in after cache hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id, contract?.agencyGroupId]);

  const performUpdate = (data: AttachContractSubmitData) => {
    if (!supplierId || !contractId) return;
    updateContract(
      {
        supplierId,
        contractId,
        name: data.name,
        link: data.link || undefined,
        validFrom: data.validFrom,
        validTo: data.validTo,
        version: contract?.version,
      },
      {
        onSuccess: (updated) => {
          setSchemaError(undefined);
          setPendingSubmitData(null);
          if (updated) {
            reset({
              name: updated.name,
              link: updated.link ?? "",
              agencyGroupId: updated.agencyGroupId ?? ANY_AGENCY_GROUP_VALUE,
              validFrom: updated.validFrom,
              validTo: updated.validTo,
            });
          }
        },
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemaError(undefined);

    await form.validateAllFields("submit");
    if (!form.state.isValid) return;

    const result = safeParseSubmitData(
      attachContractSubmitSchema,
      form.state.values
    );
    if (!result.success) {
      setSchemaError(result.message);
      return;
    }

    const data = result.data;
    const validityDatesChanged =
      contract &&
      (data.validFrom !== contract.validFrom ||
        data.validTo !== contract.validTo);

    if (validityDatesChanged) {
      setPendingSubmitData(data);
      setValidityWarningOpen(true);
    } else {
      performUpdate(data);
    }
  };

  const handleValidityWarningConfirm = () => {
    if (pendingSubmitData) {
      setValidityWarningOpen(false);
      performUpdate(pendingSubmitData);
    }
  };

  const handleValidityWarningCancel = () => {
    setPendingSubmitData(null);
    setValidityWarningOpen(false);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!supplierId || !contractId) return;
    deleteContract(
      { supplierId, contractId },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          resetDeleteMutation();
          navigate(exitPath);
        },
      }
    );
  };

  const handleDeleteDialogClose = (open: boolean) => {
    if (!open) {
      setDeleteDialogOpen(false);
      resetDeleteMutation();
    }
  };

  /** Delete button shown only when contract has no dependent entities. */
  const canDelete = contract?.canDelete === true;

  return {
    supplierId,
    contractId,
    contract,
    supplier,
    isLoading,
    error,
    form,
    isPending,
    isDeletePending,
    schemaError,
    canDelete,
    unsavedDialogOpen: showUnsavedDialog,
    deleteDialogOpen,
    validityWarningOpen,
    formId: "contract-detail-form",
    title: contract?.name ?? "",
    submitButtonLabel: t("common:buttons.save"),
    handleCancel,
    handleSubmit,
    handleUnsavedDiscard,
    handleUnsavedStay,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteDialogClose,
    handleValidityWarningConfirm,
    handleValidityWarningCancel,
    originalValidFrom: contract?.validFrom,
    originalValidTo: contract?.validTo,
    handlePoliciesDirtyChange,
  };
}
