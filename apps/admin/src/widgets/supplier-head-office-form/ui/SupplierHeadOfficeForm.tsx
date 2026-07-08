import { FormPageLayout } from "@/shared/ui";
import { PromotionsList } from "@/widgets/promotions-list";

import type { SupplierHeadOfficeFormProps } from "../types";

import { ContactsAndAddressCard } from "./ContactsAndAddressCard";
import { GeneralInformationCard } from "./GeneralInformationCard";
import { SuppliersCard } from "./SuppliersCard";

export function SupplierHeadOfficeForm({
  form,
  headOfficeId,
  mode,
  schemaError,
  isPending,
  activeSectionId,
  onSectionClick,
  sections,
  unsavedDialogOpen,
  handleCancel,
  handleSubmit,
  handleUnsavedDiscard,
  handleUnsavedStay,
  formId,
  title,
  submitButtonLabel,
  description,
  headerExtra,
  suppliers,
  onSupplierNameClick,
  onToggleSupplierStatus,
  onDeleteSupplier,
  canDelete,
  isDeletePending,
  deleteError,
  resetDeleteError,
}: SupplierHeadOfficeFormProps) {
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
      schemaError={schemaError}
      headerExtra={headerExtra}
    >
      <GeneralInformationCard form={form} />
      <ContactsAndAddressCard form={form} />
      <SuppliersCard
        suppliers={suppliers}
        onSupplierNameClick={onSupplierNameClick}
        onToggleSupplierStatus={onToggleSupplierStatus}
        onDeleteSupplier={onDeleteSupplier}
        canDelete={canDelete}
        isDeletePending={isDeletePending}
        deleteError={deleteError}
        resetDeleteError={resetDeleteError}
      />
      {mode === "edit" && headOfficeId ? (
        <PromotionsList headOfficeId={headOfficeId} />
      ) : null}
    </FormPageLayout>
  );
}
