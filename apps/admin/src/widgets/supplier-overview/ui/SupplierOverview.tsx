import type { SupplierDetail } from "@/entities/suppliers";
import { useSupplierOverviewTab } from "@/features/edit-supplier";
import { FormPageActionButtons } from "@/shared/ui";
import { SupplierDetailLayout } from "@/widgets/supplier-detail";
import { SupplierForm } from "@/widgets/supplier-form";

export type SupplierOverviewProps = {
  supplier: SupplierDetail;
  supplierId: string | undefined;
  title: string;
  description: string;
  subHeader: React.ReactNode;
  tabs: React.ReactNode;
  headerExtra: React.ReactNode;
};

/**
 * Overview tab content and chrome. Mounted only when the overview tab is active,
 * so useSupplierOverviewTab runs only for that tab.
 */
export function SupplierOverview({
  supplier,
  supplierId,
  title,
  description,
  subHeader,
  tabs,
  headerExtra,
}: SupplierOverviewProps) {
  const overview = useSupplierOverviewTab(supplier, supplierId);
  const { controller } = overview;

  return (
    <SupplierDetailLayout
      title={title}
      description={description}
      subHeader={subHeader}
      tabs={tabs}
      headerExtra={headerExtra}
      headerActions={
        <FormPageActionButtons
          formId={controller.formId}
          submitButtonLabel={controller.submitButtonLabel}
          isPending={controller.isPending}
          onCancel={controller.handleCancel}
        />
      }
      footerActions={
        <FormPageActionButtons
          formId={controller.formId}
          submitButtonLabel={controller.submitButtonLabel}
          isPending={controller.isPending}
          onCancel={controller.handleCancel}
        />
      }
    >
      <SupplierForm
        mode="edit"
        contentOnly
        {...controller}
        form={overview.form}
      />
    </SupplierDetailLayout>
  );
}
