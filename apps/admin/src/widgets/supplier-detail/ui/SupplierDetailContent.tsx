import { Switch } from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { SupplierDetail } from "@/entities/suppliers";
import {
  SupplierDetailMetaStrip,
  useSupplierDetailTabs,
  type UseSupplierNotesTabResult,
} from "@/features/edit-supplier";
import type { TabController } from "@/features/edit-supplier/model/types";
import { SupplierContentEditor } from "@/features/edit-supplier-content-block";
import { UnsavedChangesDialog, type AnyFormApi } from "@/shared/ui";
import { SupplierContractsList } from "@/widgets/supplier-contracts-list/ui/SupplierContractsList";
import { SupplierConfigurationPanel } from "@/widgets/supplier-configuration";
import { SupplierExtrasList } from "@/widgets/supplier-extras-list";
import { SupplierServicesList } from "@/widgets/supplier-services-list";

import { SupplierDetailLayout } from "./SupplierDetailLayout";
import { SupplierNotesPanel } from "./SupplierNotesPanel";
import { SupplierOverview } from "./SupplierOverview";

export type SupplierDetailContentProps = {
  supplier: SupplierDetail;
  supplierId: string | undefined;
  title: string;
  description: string;
  supplierStatusActive: boolean;
  /** Overview tab form/controller (owned by SupplierDetailPage). */
  overviewForm: AnyFormApi;
  overviewController: TabController;
  notesTab: UseSupplierNotesTabResult;
  onToggleSupplierStatus: (checked: boolean) => void;
  supplierStatusToggleLoading?: boolean;
};

/**
 * Rendered only when supplier is loaded. Overview tab content is rendered via
 * SupplierOverview (mounted only when overview is active) so that
 * useSupplierOverviewTab runs only for that tab.
 */
export function SupplierDetailContent({
  supplier,
  supplierId,
  title,
  description,
  supplierStatusActive,
  onToggleSupplierStatus,
  supplierStatusToggleLoading,
  overviewForm,
  overviewController,
  notesTab,
}: SupplierDetailContentProps) {
  const { t } = useTranslation("admin");
  const { activeTab, tabBar } = useSupplierDetailTabs();
  const isOverview = activeTab === "overview";
  const isConfiguration = activeTab === "configuration";
  const isContracts = activeTab === "contracts";
  const isServices = activeTab === "services";
  const isExtras = activeTab === "extras";
  const isNotes = activeTab === "notes";
  const isContent = activeTab === "content";

  const headerExtra = (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">
        {t("status.active")}
      </span>
      <Switch
        checked={supplierStatusActive}
        onCheckedChange={onToggleSupplierStatus}
        aria-label={t("aria.toggleActiveStatus", { name: title })}
        loading={supplierStatusToggleLoading}
      />
    </div>
  );

  const subHeader = <SupplierDetailMetaStrip supplier={supplier} />;

  const unsavedDialog = (
    <UnsavedChangesDialog
      open={overviewController.unsavedDialogOpen}
      onOpenChange={(open) => !open && overviewController.handleUnsavedStay()}
      onStay={overviewController.handleUnsavedStay}
      onDiscard={overviewController.handleUnsavedDiscard}
    />
  );

  if (isOverview) {
    return (
      <>
        <SupplierOverview
          supplier={supplier}
          supplierId={supplierId}
          title={title}
          description={description}
          subHeader={subHeader}
          tabs={tabBar}
          headerExtra={headerExtra}
          form={overviewForm}
          controller={overviewController}
        />
        {unsavedDialog}
      </>
    );
  }

  if (isContent) {
    return (
      <>
        {supplierId ? (
          <SupplierDetailLayout
            title={title}
            description={description}
            subHeader={subHeader}
            tabs={tabBar}
            headerExtra={undefined}
            headerActions={undefined}
            footerActions={undefined}
          >
            <SupplierContentEditor supplierId={supplierId} />
          </SupplierDetailLayout>
        ) : (
          <SupplierDetailLayout
            title={title}
            description={description}
            subHeader={subHeader}
            tabs={tabBar}
            headerExtra={undefined}
            headerActions={undefined}
            footerActions={undefined}
          >
            <div className="flex min-h-[200px] items-center justify-center pt-6 text-muted-foreground">
              {t("empty.comingSoon")}
            </div>
          </SupplierDetailLayout>
        )}
        {unsavedDialog}
      </>
    );
  }

  if (isNotes) {
    return (
      <>
        {supplierId ? (
          <SupplierNotesPanel
            title={title}
            description={description}
            subHeader={subHeader}
            tabs={tabBar}
            notesTab={notesTab}
            onCancel={overviewController.handleCancel}
          />
        ) : (
          <SupplierDetailLayout
            title={title}
            description={description}
            subHeader={subHeader}
            tabs={tabBar}
            headerExtra={undefined}
            headerActions={undefined}
            footerActions={undefined}
          >
            <div className="flex min-h-[200px] items-center justify-center pt-6 text-muted-foreground">
              {t("empty.comingSoon")}
            </div>
          </SupplierDetailLayout>
        )}
        {unsavedDialog}
      </>
    );
  }

  return (
    <>
      <SupplierDetailLayout
        title={title}
        description={description}
        subHeader={subHeader}
        tabs={tabBar}
        headerExtra={undefined}
        headerActions={undefined}
        footerActions={undefined}
      >
        {isConfiguration && supplierId ? (
          <SupplierConfigurationPanel supplierId={supplierId} />
        ) : isContracts && supplierId ? (
          <SupplierContractsList supplierId={supplierId} />
        ) : isServices ? (
          <SupplierServicesList supplierId={supplierId} />
        ) : isExtras && supplierId ? (
          <SupplierExtrasList supplierId={supplierId} />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center pt-6 text-muted-foreground">
            {t("empty.comingSoon")}
          </div>
        )}
      </SupplierDetailLayout>
      {unsavedDialog}
    </>
  );
}
