import { Button } from "@sol/ui";
import { FileSearch } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ConfirmDeleteDialog } from "@/shared/ui";

import { LOCAL_ELIG_PREFIX } from "../model/eligibility-drafts";
import type { ServiceEligibilitySectionActions } from "../model/serviceEligibilitySectionTypes";
import { useServiceEligibilitySection } from "../model/useServiceEligibilitySection";

import { EligibilityItem } from "./EligibilityItem";

interface ServiceEligibilitySectionProps {
  serviceId: string | null;
  serviceName: string;
  onActionsChange?: (actions: ServiceEligibilitySectionActions | null) => void;
  onUnsavedChange?: (hasUnsaved: boolean) => void;
}

export function ServiceEligibilitySection({
  serviceId,
  serviceName,
  onActionsChange,
  onUnsavedChange,
}: ServiceEligibilitySectionProps) {
  const { t } = useTranslation("admin");
  const {
    allEligibilities,
    canCreateEligibility,
    deleteEligibilityError,
    eligibilityToDelete,
    error,
    handleAddEligibility,
    handleCloseDeleteDialog,
    handleConfirmDeleteEligibility,
    handleDeleteEligibility,
    handleDuplicateEligibility,
    handleEligibilityDirtyChange,
    handleRegisterHandlers,
    handleSaveEligibility,
    isDeletingEligibility,
    isLoading,
    isSavingAll,
    recentlyCreatedEligibilityIds,
    savingEligibilityId,
  } = useServiceEligibilitySection({
    serviceId,
    serviceName,
    onActionsChange,
    onUnsavedChange,
  });

  return (
    <section className="flex flex-col gap-3 pt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base font-bold text-foreground">
            {t("sections.eligibility")}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {t("sections.eligibilityDescription")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddEligibility}
          disabled={!canCreateEligibility}
          className="border-brand-red text-brand-red hover:text-brand-red"
        >
          {t("buttons.createEligibility")}
        </Button>
      </div>

      {isLoading ? (
        <div className="min-h-[320px] rounded-[6px] border border-border bg-background" />
      ) : error ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-[6px] border border-border bg-background text-destructive">
          {t("errors.failedToLoadEligibilities")}
        </div>
      ) : allEligibilities.length === 0 ? (
        <div className="flex min-h-[430px] flex-col items-center justify-center gap-6 rounded-[6px] border border-border bg-background p-6 text-center">
          <div className="rounded-[6px] bg-sky-100 p-2 text-sky-600">
            <FileSearch className="h-6 w-6" aria-hidden />
          </div>
          <div className="flex max-w-[42rem] flex-col gap-1">
            <h3 className="text-xl font-bold text-foreground">
              {t("empty.noEligibilityYet")}
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              {t("empty.eligibilityWillAppear")}
            </p>
          </div>
          <Button
            onClick={handleAddEligibility}
            disabled={!canCreateEligibility}
          >
            {t("buttons.createEligibility")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-[6px]">
          {allEligibilities.map((eligibility, index) => (
            <EligibilityItem
              key={eligibility.id}
              eligibility={eligibility}
              defaultOpen={
                index < 2 ||
                eligibility.id.startsWith(LOCAL_ELIG_PREFIX) ||
                recentlyCreatedEligibilityIds.has(eligibility.id)
              }
              isNew={eligibility.id.startsWith(LOCAL_ELIG_PREFIX)}
              onDuplicate={handleDuplicateEligibility}
              onDelete={handleDeleteEligibility}
              onSave={handleSaveEligibility}
              onDirtyChange={handleEligibilityDirtyChange}
              registerHandlers={handleRegisterHandlers}
              isSaving={savingEligibilityId === eligibility.id || isSavingAll}
            />
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={eligibilityToDelete !== null}
        onOpenChange={handleCloseDeleteDialog}
        title={
          eligibilityToDelete
            ? t("delete.deleteEligibilityTitle", {
                name: eligibilityToDelete.name,
              })
            : ""
        }
        description={t("delete.deleteEligibilityDescription")}
        confirmLabel={t("delete.deleteEligibility")}
        isPending={isDeletingEligibility}
        error={deleteEligibilityError}
        defaultErrorMessage={t("errors.failedToDeleteEligibility")}
        onConfirm={handleConfirmDeleteEligibility}
      />
    </section>
  );
}
