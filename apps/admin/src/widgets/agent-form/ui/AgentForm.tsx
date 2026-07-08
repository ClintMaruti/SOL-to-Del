import { Switch } from "@sol/ui";
import { useTranslation } from "react-i18next";

import { FormPageLayout } from "@/shared/ui";

import type { AgentFormProps } from "../types";

import { ContactsAddressCard } from "./ContactsAddressCard";
import { GeneralInformationCard } from "./GeneralInformationCard";
import { OtherCard } from "./OtherCard";

export function AgentForm(props: AgentFormProps) {
  const {
    formData,
    errors,
    updateField,
    isPending,
    activeSectionId,
    sections,
    formId,
    title,
    submitButtonLabel,
    description,
    handleCancel,
    handleSubmit,
    agencies,
    agencyName,
    unsavedDialogOpen,
    handleUnsavedDiscard,
    handleUnsavedStay,
    showActiveToggle,
    isActive,
    onStatusChange,
    onSectionClick,
  } = props;
  const { t } = useTranslation("admin");

  return (
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
      headerExtra={
        showActiveToggle && onStatusChange ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground leading-none">
              {t("status.active")}
            </span>
            <Switch
              checked={isActive ?? false}
              onCheckedChange={onStatusChange}
              aria-label={t("aria.toggleActiveStatus", { name: title })}
            />
          </div>
        ) : undefined
      }
    >
      <GeneralInformationCard
        formData={formData}
        errors={errors}
        updateField={updateField}
        agencyName={agencyName}
        agencies={agencies}
      />
      <ContactsAddressCard
        formData={formData}
        errors={errors}
        updateField={updateField}
      />
      <OtherCard formData={formData} updateField={updateField} />
    </FormPageLayout>
  );
}
