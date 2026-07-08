import { FormPageLayout } from "@/shared/ui";

import type { EditSupplierServiceFormProps } from "../types";

import { BestForCard } from "./BestForCard";
import { FinanceCard } from "./FinanceCard";
import { GeneralInformationCard } from "./GeneralInformationCard";

export function EditSupplierServiceForm({
  form,
  supplierService,
  schemaError,
  isPending,
  activeSectionId,
  sections,
  unsavedDialogOpen,
  handleCancel,
  handleSubmit,
  handleUnsavedDiscard,
  handleUnsavedStay,
  formId,
  title,
  submitButtonLabel,
  headerExtra,
  tabs,
  contentOnly,
}: EditSupplierServiceFormProps) {
  return (
    <FormPageLayout
      title={title}
      formId={formId}
      submitButtonLabel={submitButtonLabel}
      isPending={isPending}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      sections={sections}
      activeSectionId={activeSectionId}
      unsavedDialogOpen={unsavedDialogOpen}
      onUnsavedDiscard={handleUnsavedDiscard}
      onUnsavedStay={handleUnsavedStay}
      schemaError={schemaError}
      headerExtra={headerExtra}
      tabs={tabs}
      showSidebar={false}
      contentOnly={contentOnly}
    >
      <GeneralInformationCard form={form} supplierService={supplierService} />
      <BestForCard form={form} />
      <FinanceCard supplierService={supplierService} />
    </FormPageLayout>
  );
}
