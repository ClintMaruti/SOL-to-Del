import { FormPageLayout, UnsavedChangesDialog } from "@/shared/ui";

import type { SupplierFormProps } from "../types";

import { AddressLocationCard } from "./AddressLocationCard";
import { AgentZoneCard } from "./AgentZoneCard";
import { ContactsCard } from "./ContactsCard";
import { FinanceCard } from "./FinanceCard";
import { GeneralInformationCard } from "./GeneralInformationCard";
import { GeneralPolicyCard } from "./GeneralPolicyCard";
import { PaymentTermsCard } from "./PaymentTermsCard";

export const SupplierForm: React.FC<SupplierFormProps> = ({
  form,
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
  subHeader,
  tabs,
  headerExtra,
  showSidebar,
  wrapInForm,
  contentOnly = false,
  mode,
  suppressUnsavedDialog = false,
}) => {
  const overviewCards = form ? (
    <>
      <GeneralInformationCard form={form} mode={mode} />
      <ContactsCard form={form} />
      <AddressLocationCard form={form} />
      <GeneralPolicyCard form={form} />
      <FinanceCard form={form} />
      <PaymentTermsCard form={form} />
      <AgentZoneCard form={form} />

      {!suppressUnsavedDialog && (
        <UnsavedChangesDialog
          open={unsavedDialogOpen}
          onOpenChange={(open) => !open && handleUnsavedStay()}
          onStay={handleUnsavedStay}
          onDiscard={handleUnsavedDiscard}
        />
      )}
    </>
  ) : null;

  const layoutProps = {
    formId,
    submitButtonLabel,
    isPending,
    onCancel: handleCancel,
    onSubmit: handleSubmit,
    sections,
    activeSectionId,
    onSectionClick,
    unsavedDialogOpen,
    onUnsavedDiscard: handleUnsavedDiscard,
    onUnsavedStay: handleUnsavedStay,
    schemaError,
    showSidebar,
    wrapInForm,
    children: overviewCards,
  };

  if (contentOnly) {
    return <FormPageLayout {...layoutProps} contentOnly />;
  }

  return (
    <FormPageLayout
      title={title}
      description={description}
      subHeader={subHeader}
      tabs={tabs}
      headerExtra={headerExtra}
      {...layoutProps}
    />
  );
};
