import type { SupplierDetail } from "@/entities/suppliers";
import { useSupplierOverviewTab } from "@/features/edit-supplier";
import type { TabController } from "@/features/edit-supplier/model/types";
import { FormPageActionButtons, type AnyFormApi } from "@/shared/ui";
import { SupplierForm } from "@/widgets/supplier-form";

import { SupplierDetailLayout } from "./SupplierDetailLayout";

export type SupplierOverviewProps = {
  supplier: SupplierDetail;
  supplierId: string | undefined;
  title: string;
  description: string;
  subHeader: React.ReactNode;
  tabs: React.ReactNode;
  headerExtra: React.ReactNode;
  /** When provided (e.g. undefined to avoid duplicating buttons in headerExtra), overrides default header actions. */
  headerActions?: React.ReactNode;
  /** When provided, use these instead of calling useSupplierOverviewTab (form is owned by parent). */
  form?: AnyFormApi;
  controller?: TabController;
};

/**
 * Inner overview: requires form and controller (provided by either parent or SupplierOverviewWithForm).
 */
function SupplierOverviewInner({
  title,
  description,
  subHeader,
  tabs,
  headerExtra,
  headerActions: headerActionsProp,
  form,
  controller,
}: Omit<SupplierOverviewProps, "supplier" | "supplierId"> & {
  form: AnyFormApi;
  controller: TabController;
}) {
  const defaultHeaderActions = (
    <FormPageActionButtons
      formId={controller.formId}
      submitButtonLabel={controller.submitButtonLabel}
      isPending={controller.isPending}
      onCancel={controller.handleCancel}
    />
  );
  return (
    <SupplierDetailLayout
      title={title}
      description={description}
      subHeader={subHeader}
      tabs={tabs}
      headerExtra={headerExtra}
      headerActions={headerActionsProp ?? defaultHeaderActions}
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
        suppressUnsavedDialog
        {...controller}
        form={form}
      />
    </SupplierDetailLayout>
  );
}

/**
 * Overview tab content and chrome. Mounted only when the overview tab is active.
 * When form and controller are passed from parent (e.g. page), uses those; otherwise creates its own.
 */
export function SupplierOverview(props: SupplierOverviewProps) {
  const { form: formProp, controller: controllerProp } = props;

  if (formProp != null && controllerProp != null) {
    return (
      <SupplierOverviewInner
        {...props}
        form={formProp}
        controller={controllerProp}
      />
    );
  }

  return <SupplierOverviewWithForm {...props} />;
}

function SupplierOverviewWithForm(
  props: Omit<SupplierOverviewProps, "form" | "controller">
) {
  const overview = useSupplierOverviewTab(props.supplier, props.supplierId);
  return (
    <SupplierOverviewInner
      {...props}
      form={overview.form as AnyFormApi}
      controller={overview.controller}
    />
  );
}
