import { Button } from "@sol/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBlocker, useNavigate } from "react-router-dom";

import {
  ServiceEligibilitySection,
  type ServiceEligibilitySectionActions,
} from "@/features/manage-service-eligibility";
import { generateRoutePath } from "@/shared/lib";
import { FORM_PAGE_FOOTER_HEIGHT, UnsavedChangesDialog } from "@/shared/ui";

export interface ServiceEligibilityTabActions {
  submitButtonLabel: string;
  onCancel: () => void;
  onSave: () => void;
  onSaveAndCreateNew: () => void;
  isPending: boolean;
  disableSave: boolean;
}

interface ServiceEligibilityTabProps {
  serviceId: string | null;
  serviceName: string;
  supplierId: string | null;
  onActionsChange?: (actions: ServiceEligibilityTabActions | null) => void;
}

export function ServiceEligibilityTab({
  serviceId,
  serviceName,
  supplierId,
  onActionsChange,
}: ServiceEligibilityTabProps) {
  const { t } = useTranslation(["admin", "common"]);
  const navigate = useNavigate();
  const [sectionActions, setSectionActions] =
    useState<ServiceEligibilitySectionActions | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingExitPath, setPendingExitPath] = useState<string | null>(null);

  const suppliersPath = generateRoutePath(
    "database",
    "destinations",
    "suppliers"
  );
  const exitPath = supplierId
    ? `${suppliersPath}/${supplierId}?tab=services`
    : suppliersPath;

  const blocker = useBlocker(() => hasUnsavedChanges);

  const discardChanges = useCallback(() => {
    sectionActions?.onDiscard();
  }, [sectionActions]);

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingExitPath(exitPath);
      setUnsavedDialogOpen(true);
      return;
    }

    navigate(exitPath);
  }, [exitPath, hasUnsavedChanges, navigate]);

  const handleUnsavedDiscard = useCallback(() => {
    setUnsavedDialogOpen(false);
    discardChanges();

    if (blocker.state === "blocked") {
      blocker.proceed();
      return;
    }

    if (pendingExitPath) {
      const path = pendingExitPath;
      setPendingExitPath(null);
      navigate(path);
    }
  }, [blocker, discardChanges, navigate, pendingExitPath]);

  const handleUnsavedStay = useCallback(() => {
    setUnsavedDialogOpen(false);
    setPendingExitPath(null);
    if (blocker.state === "blocked") {
      blocker.reset();
    }
  }, [blocker]);

  useEffect(() => {
    if (blocker.state === "blocked") {
      setUnsavedDialogOpen(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (!hasUnsavedChanges && pendingExitPath) {
      const path = pendingExitPath;
      setPendingExitPath(null);
      navigate(path);
    }
  }, [hasUnsavedChanges, navigate, pendingExitPath]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const actions = useMemo<ServiceEligibilityTabActions | null>(() => {
    if (!sectionActions) return null;

    return {
      submitButtonLabel: sectionActions.submitButtonLabel,
      onCancel: handleCancel,
      onSave: sectionActions.onSave,
      onSaveAndCreateNew: sectionActions.onSaveAndCreateNew,
      isPending: sectionActions.isPending,
      disableSave: sectionActions.disableSave,
    };
  }, [handleCancel, sectionActions]);

  useEffect(() => {
    onActionsChange?.(actions);
  }, [actions, onActionsChange]);

  useEffect(() => {
    return () => onActionsChange?.(null);
  }, [onActionsChange]);

  return (
    <>
      <div
        className="flex flex-col gap-3"
        style={{ paddingBottom: `calc(1.5rem + ${FORM_PAGE_FOOTER_HEIGHT}px)` }}
      >
        <ServiceEligibilitySection
          serviceId={serviceId}
          serviceName={serviceName}
          onActionsChange={setSectionActions}
          onUnsavedChange={setHasUnsavedChanges}
        />
      </div>

      <footer
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background"
        aria-label={t("common:aria.formActions", {
          defaultValue: "Form actions",
        })}
      >
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={sectionActions?.isPending}
          >
            {t("common:buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={sectionActions?.onSaveAndCreateNew}
            isLoading={sectionActions?.isPending}
            disabled={!sectionActions || sectionActions.disableSave}
            className="border-brand-red text-brand-red hover:text-brand-red"
          >
            {t("buttons.saveAndCreateNew")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={sectionActions?.onSave}
            isLoading={sectionActions?.isPending}
            disabled={!sectionActions || sectionActions.disableSave}
          >
            {sectionActions?.submitButtonLabel ?? t("buttons.save")}
          </Button>
        </div>
      </footer>

      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleUnsavedStay();
        }}
        onStay={handleUnsavedStay}
        onDiscard={handleUnsavedDiscard}
      />
    </>
  );
}
