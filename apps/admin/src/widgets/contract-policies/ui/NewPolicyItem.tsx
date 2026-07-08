import { getValidationErrors } from "@sol/api-client";
import { Button } from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ContractPolicy } from "@/entities/supplier-contract";
import {
  useCreateContractPolicy,
  useCreateContractPolicyForm,
} from "@/features/create-contract-policy";

import { PolicyItemLayout } from "./PolicyItemLayout";

interface NewPolicyItemProps {
  draftKey: string;
  supplierId: string;
  contractId: string;
  contractValidFrom?: string;
  contractValidTo?: string;
  existingPolicyIds: ReadonlySet<string>;
  onCreated: (createdPolicy?: ContractPolicy) => void;
  onCancel: () => void;
  onDirtyChange?: (id: string, dirty: boolean) => void;
  contentTitle: string;
}

export function NewPolicyItem({
  draftKey,
  supplierId,
  contractId,
  contractValidFrom,
  contractValidTo,
  existingPolicyIds,
  onCreated,
  onCancel,
  onDirtyChange,
  contentTitle,
}: NewPolicyItemProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [schemaError, setSchemaError] = useState<string>();

  const {
    mutate: createPolicy,
    isPending,
    error: mutationError,
    reset: resetMutation,
  } = useCreateContractPolicy();

  const networkErrors = useMemo(() => {
    if (!mutationError) return undefined;
    const validation = getValidationErrors(mutationError);
    if (validation) {
      return Object.values(validation.errors).flat();
    }
    return [mutationError.message];
  }, [mutationError]);

  const { form, isDirty, resetForm } = useCreateContractPolicyForm(
    (data) => {
      createPolicy(
        { supplierId, contractId, ...data },
        {
          onSuccess: (policies) => {
            setSchemaError(undefined);
            resetMutation();
            const createdPolicy =
              policies.find((policy) => !existingPolicyIds.has(policy.id)) ??
              policies.at(-1);
            onCreated(createdPolicy);
          },
        }
      );
    },
    setSchemaError,
    { contractValidFrom, contractValidTo }
  );

  const handleClearErrors = useCallback(() => {
    setSchemaError(undefined);
    resetMutation();
  }, [resetMutation]);

  const handleCancel = useCallback(() => {
    resetForm();
    setSchemaError(undefined);
    resetMutation();
    onCancel();
  }, [onCancel, resetForm, resetMutation]);

  useEffect(() => {
    onDirtyChange?.(draftKey, isDirty);
    return () => onDirtyChange?.(draftKey, false);
  }, [draftKey, isDirty, onDirtyChange]);

  return (
    <PolicyItemLayout
      form={form}
      isPending={isPending}
      isDirty={isDirty}
      schemaError={schemaError}
      networkErrors={networkErrors}
      onClearErrors={handleClearErrors}
      onCancel={handleCancel}
      defaultOpen
      contentTitle={contentTitle}
      headerContent={
        <>
          <div className="flex-1 flex items-center gap-6">
            <span className="text-base font-semibold text-neutral-400 truncate">
              {t("admin:policies.policyPlaceholder")}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onCancel}
            aria-label={t("common:buttons.delete")}
          >
            <Trash2 className="size-4 text-brand-red" />
          </Button>
        </>
      }
    />
  );
}
