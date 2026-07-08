import { Button, Card, CardContent } from "@sol/ui";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type ContractPolicy,
  useContractPolicies,
  useToggleContractPolicyStatus,
} from "@/entities/supplier-contract";
import { useDeleteContractPolicy } from "@/features/delete-contract-policy";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { ConfirmDeleteDialog } from "@/shared/ui";

import { ExistingPolicyItem } from "./ExistingPolicyItem";
import { NewPolicyItem } from "./NewPolicyItem";

interface PoliciesCardProps {
  supplierId: string;
  contractId: string;
  contractValidFrom?: string;
  contractValidTo?: string;
  onDirtyChange?: (dirty: boolean) => void;
}

interface PolicyDraft {
  draftKey: string;
  createdPolicy?: ContractPolicy;
}

export function PoliciesCard({
  supplierId,
  contractId,
  contractValidFrom,
  contractValidTo,
  onDirtyChange,
}: PoliciesCardProps) {
  const { data: policies = [] } = useContractPolicies(contractId);
  const { t } = useTranslation(["admin", "common"]);
  const [drafts, setDrafts] = useState<PolicyDraft[]>([]);
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [createdOpenPolicyIds, setCreatedOpenPolicyIds] = useState<Set<string>>(
    () => new Set()
  );

  const {
    mutate: deletePolicy,
    isPending: isDeletePending,
    reset: resetDeleteMutation,
  } = useDeleteContractPolicy();

  const { mutate: togglePolicyStatus } = useToggleContractPolicyStatus();
  const policiesStatus = useLoadingStates((state) => state.policiesStatus);

  const handleItemDirtyChange = useCallback((id: string, dirty: boolean) => {
    setDirtyMap((prev) => {
      if (prev[id] === dirty) return prev;
      return { ...prev, [id]: dirty };
    });
  }, []);

  const isPoliciesDirty = useMemo(
    () => Object.values(dirtyMap).some(Boolean),
    [dirtyMap]
  );

  const promotedPolicyIds = useMemo(
    () =>
      new Set(
        drafts
          .map((draft) => draft.createdPolicy?.id)
          .filter((id): id is string => Boolean(id))
      ),
    [drafts]
  );

  const existingPolicyIds = useMemo(() => {
    const ids = new Set(policies.map((policy) => policy.id));
    promotedPolicyIds.forEach((id) => ids.add(id));
    return ids;
  }, [policies, promotedPolicyIds]);

  const visiblePolicies = useMemo(
    () => policies.filter((policy) => !promotedPolicyIds.has(policy.id)),
    [policies, promotedPolicyIds]
  );

  useEffect(() => {
    onDirtyChange?.(isPoliciesDirty);
  }, [isPoliciesDirty, onDirtyChange]);

  useEffect(() => {
    setDrafts((prev) => {
      let changed = false;
      const next = prev.map((draft) => {
        if (!draft.createdPolicy) return draft;

        const refreshedPolicy = policies.find(
          (policy) => policy.id === draft.createdPolicy?.id
        );

        if (!refreshedPolicy || refreshedPolicy === draft.createdPolicy) {
          return draft;
        }

        changed = true;
        return { ...draft, createdPolicy: refreshedPolicy };
      });

      return changed ? next : prev;
    });
  }, [policies]);

  const handleAddDraft = () => {
    setDrafts((prev) => [...prev, { draftKey: crypto.randomUUID() }]);
  };

  const handleDraftCreated = useCallback(
    (draftKey: string, createdPolicy?: ContractPolicy) => {
      if (createdPolicy) {
        setCreatedOpenPolicyIds((prev) => {
          if (prev.has(createdPolicy.id)) return prev;
          const next = new Set(prev);
          next.add(createdPolicy.id);
          return next;
        });
        setDrafts((prev) =>
          prev.map((draft) =>
            draft.draftKey === draftKey ? { ...draft, createdPolicy } : draft
          )
        );
      } else {
        setDrafts((prev) =>
          prev.filter((draft) => draft.draftKey !== draftKey)
        );
      }

      setDirtyMap((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
    },
    []
  );

  const handlePolicyOpenChange = useCallback(
    (policyId: string, open: boolean) => {
      if (open) return;
      setCreatedOpenPolicyIds((prev) => {
        if (!prev.has(policyId)) return prev;
        const next = new Set(prev);
        next.delete(policyId);
        return next;
      });
    },
    []
  );

  const handleDraftCancel = useCallback((draftKey: string) => {
    setDrafts((prev) => prev.filter((draft) => draft.draftKey !== draftKey));
    setDirtyMap((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  }, []);

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const policyId = deleteTarget;
    deletePolicy(
      { supplierId, contractId, policyId },
      {
        onSuccess: () => {
          setCreatedOpenPolicyIds((prev) => {
            if (!prev.has(policyId)) return prev;
            const next = new Set(prev);
            next.delete(policyId);
            return next;
          });
          setDrafts((prev) =>
            prev.filter((draft) => draft.createdPolicy?.id !== policyId)
          );
          setDeleteTarget(null);
          resetDeleteMutation();
        },
      }
    );
  };

  const handleDeleteDialogClose = (open: boolean) => {
    if (!open) {
      setDeleteTarget(null);
      resetDeleteMutation();
    }
  };

  const getPolicyContentTitle = (number: number) =>
    t("admin:policies.policyNumber", { number });

  const renderExistingPolicyItem = (
    policy: ContractPolicy,
    key: string,
    number: number
  ) => (
    <ExistingPolicyItem
      key={key}
      policy={policy}
      supplierId={supplierId}
      contractId={contractId}
      onToggleStatus={() =>
        togglePolicyStatus({
          supplierId,
          contractId,
          policyId: policy.id,
          isActive: policy.isActive ?? true,
        })
      }
      statusLoading={policiesStatus[policy.id]}
      onDeleteRequest={() => setDeleteTarget(policy.id)}
      onDirtyChange={handleItemDirtyChange}
      keepOpen={createdOpenPolicyIds.has(policy.id)}
      onOpenChange={(open) => handlePolicyOpenChange(policy.id, open)}
      contentTitle={getPolicyContentTitle(number)}
      contractValidFrom={contractValidFrom}
      contractValidTo={contractValidTo}
    />
  );

  return (
    <>
      <Card id="policies" className="rounded-[6px]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-bold text-neutral-900 leading-6">
                  {t("admin:policies.title")}
                </h2>
                <p className="text-sm font-medium text-neutral-600 leading-6">
                  {t("admin:policies.subtitle")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddDraft}
              >
                <Plus className="size-4" />
                {t("admin:policies.addPolicy")}
              </Button>
            </div>

            {visiblePolicies.map((policy, index) =>
              renderExistingPolicyItem(policy, policy.id, index + 1)
            )}

            {drafts.map((draft, index) =>
              draft.createdPolicy ? (
                renderExistingPolicyItem(
                  draft.createdPolicy,
                  draft.draftKey,
                  visiblePolicies.length + index + 1
                )
              ) : (
                <NewPolicyItem
                  key={draft.draftKey}
                  draftKey={draft.draftKey}
                  supplierId={supplierId}
                  contractId={contractId}
                  existingPolicyIds={existingPolicyIds}
                  onCreated={(createdPolicy) =>
                    handleDraftCreated(draft.draftKey, createdPolicy)
                  }
                  onCancel={() => handleDraftCancel(draft.draftKey)}
                  onDirtyChange={handleItemDirtyChange}
                  contentTitle={getPolicyContentTitle(
                    visiblePolicies.length + index + 1
                  )}
                  contractValidFrom={contractValidFrom}
                  contractValidTo={contractValidTo}
                />
              )
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={handleDeleteDialogClose}
        title={t("admin:modals.confirmDeletePolicy")}
        description={t("admin:modals.confirmDeletePolicyDescription")}
        confirmLabel={t("common:buttons.delete")}
        isPending={isDeletePending}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
