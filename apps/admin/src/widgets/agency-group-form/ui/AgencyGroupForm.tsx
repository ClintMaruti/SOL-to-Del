import { Switch } from "@sol/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import {
  BlockedActionDialog,
  ConfirmDialog,
  FormPageLayout,
} from "@/shared/ui";

import type { AgencyGroupFormProps } from "../types";

import { AgenciesCard } from "./AgenciesCard";
import { GeneralInformationCard } from "./GeneralInformationCard";

export function AgencyGroupForm(props: AgencyGroupFormProps) {
  const { t } = useTranslation("admin");
  const {
    form,
    isPending,
    activeSectionId,
    onSectionClick,
    sections,
    formId,
    title,
    submitButtonLabel,
    description,
    schemaError,
    handleCancel,
    handleSubmit,
    unsavedDialogOpen,
    handleUnsavedDiscard,
    handleUnsavedStay,
    showActiveToggle,
    isActive,
    onStatusChange,
    statusConfirmDialog,
    blockedStatusDialog,
    isTogglingStatus,
    mode,
  } = props;
  const { agencyGroupId } = useParams<{ agencyGroupId: string }>();
  return (
    <>
      {blockedStatusDialog ? (
        <BlockedActionDialog
          open={blockedStatusDialog.open}
          onOpenChange={blockedStatusDialog.onOpenChange}
          title={blockedStatusDialog.title}
          description={blockedStatusDialog.description}
        />
      ) : null}
      {statusConfirmDialog ? (
        <ConfirmDialog
          open={statusConfirmDialog.open}
          onOpenChange={statusConfirmDialog.onOpenChange}
          title={statusConfirmDialog.title}
          description={statusConfirmDialog.description}
          confirmLabel={statusConfirmDialog.confirmLabel}
          isPending={statusConfirmDialog.isPending}
          onConfirm={statusConfirmDialog.onConfirm}
          confirmVariant={statusConfirmDialog.confirmVariant}
        />
      ) : null}
      <FormPageLayout
        title={title}
        description={description}
        formId={formId}
        submitButtonLabel={submitButtonLabel}
        isPending={isPending}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        sections={sections}
        activeSectionId={activeSectionId}
        onSectionClick={onSectionClick}
        unsavedDialogOpen={unsavedDialogOpen}
        onUnsavedDiscard={handleUnsavedDiscard}
        onUnsavedStay={handleUnsavedStay}
        schemaError={schemaError}
        headerExtra={
          showActiveToggle && onStatusChange ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {t("status.active")}
              </span>
              <Switch
                checked={isActive ?? false}
                onCheckedChange={onStatusChange}
                disabled={isTogglingStatus}
                aria-label={t("aria.toggleActiveStatus", { name: title })}
              />
            </div>
          ) : undefined
        }
      >
        <GeneralInformationCard form={form} />
        {mode === "edit" && (
          <AgenciesCard form={form} agencyGroupId={agencyGroupId} />
        )}
      </FormPageLayout>
    </>
  );
}
