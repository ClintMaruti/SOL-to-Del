import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useCreatePromotionPage } from "@/features/create-promotion";
import { ROUTES } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";
import { PromotionConfigurationSkeleton } from "@/widgets/promotion-configuration-form";

import { PromotionConfigurationContent } from "./PromotionConfigurationContent";

export function PromotionCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const props = useCreatePromotionPage();

  if (props.isLoading) {
    return <PromotionConfigurationSkeleton />;
  }

  if (props.error || !props.headOffice || !props.headOfficeId) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.headOffice")}
          description={t("notFound.headOfficeDescription")}
          actionLabel={t("buttons.backToHeadOffices")}
          onAction={() => navigate(ROUTES.SUPPLIER_HEAD_OFFICES)}
        />
      </div>
    );
  }

  return (
    <PromotionConfigurationContent
      title={props.title}
      formId={props.formId}
      submitButtonLabel={props.submitButtonLabel}
      isPending={props.isPending}
      onCancel={props.handleCancel}
      onSubmit={props.handleSubmit}
      onUnsavedDiscard={props.handleUnsavedDiscard}
      onUnsavedStay={props.handleUnsavedStay}
      unsavedDialogOpen={props.unsavedDialogOpen}
      form={props.form}
      suppliers={props.suppliers}
    />
  );
}
