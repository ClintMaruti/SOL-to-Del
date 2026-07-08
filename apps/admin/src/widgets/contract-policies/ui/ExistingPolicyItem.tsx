import { getValidationErrors } from "@sol/api-client";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
} from "@sol/ui";
import { MoreVertical, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ContractPolicy } from "@/entities/supplier-contract";
import {
  useEditContractPolicyForm,
  useUpdateContractPolicy,
} from "@/features/edit-contract-policy";

import { PolicyItemLayout } from "./PolicyItemLayout";

interface ExistingPolicyItemProps {
  policy: ContractPolicy;
  supplierId: string;
  contractId: string;
  contractValidFrom?: string;
  contractValidTo?: string;
  onToggleStatus: () => void;
  statusLoading?: boolean;
  onDeleteRequest: () => void;
  onDirtyChange?: (id: string, dirty: boolean) => void;
  keepOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentTitle: string;
}

export function ExistingPolicyItem({
  policy,
  supplierId,
  contractId,
  contractValidFrom,
  contractValidTo,
  onToggleStatus,
  statusLoading,
  onDeleteRequest,
  onDirtyChange,
  keepOpen,
  onOpenChange,
  contentTitle,
}: ExistingPolicyItemProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [schemaError, setSchemaError] = useState<string>();

  const {
    mutate: updatePolicy,
    isPending,
    error: mutationError,
    reset: resetMutation,
  } = useUpdateContractPolicy();

  const networkErrors = useMemo(() => {
    if (!mutationError) return undefined;
    const validation = getValidationErrors(mutationError);
    if (validation) {
      return Object.values(validation.errors).flat();
    }
    return [mutationError.message];
  }, [mutationError]);

  const { form, isDirty, resetForm } = useEditContractPolicyForm(
    policy,
    (data) => {
      updatePolicy(
        {
          supplierId,
          contractId,
          policyId: policy.id,
          isActive: policy.isActive ?? true,
          ...data,
        },
        {
          onSuccess: () => {
            setSchemaError(undefined);
            resetMutation();
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
  }, [resetForm, resetMutation]);

  useEffect(() => {
    onDirtyChange?.(policy.id, isDirty);
  }, [isDirty, policy.id, onDirtyChange]);

  const initialConditions = useMemo(
    () =>
      (policy.conditions ?? []).map((rule) => ({
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
    [policy]
  );

  return (
    <PolicyItemLayout
      form={form}
      isPending={isPending}
      isDirty={isDirty}
      schemaError={schemaError}
      networkErrors={networkErrors}
      onClearErrors={handleClearErrors}
      onCancel={handleCancel}
      initialConditions={initialConditions}
      defaultOpen={keepOpen}
      open={keepOpen ? true : undefined}
      onOpenChange={onOpenChange}
      contentTitle={contentTitle}
      headerContent={
        <>
          <div className="flex-1 flex items-center gap-6">
            <span className="text-base font-semibold text-neutral-900 truncate">
              {policy.policyName}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-neutral-900">
                {t("admin:policies.active")}
              </span>
              <Switch
                checked={policy.isActive ?? true}
                onCheckedChange={onToggleStatus}
                loading={statusLoading}
              />
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDeleteRequest}
              >
                <Trash2 className="size-4 mr-2" />
                {t("common:buttons.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );
}
