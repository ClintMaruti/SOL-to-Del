import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useEditPromotionPage } from "@/features/edit-promotion";
import { headOfficeDetailPath, ROUTES } from "@/shared/lib/paths";
import { ResourceNotFound } from "@/shared/ui";
import { PromotionConfigurationSkeleton } from "@/widgets/promotion-configuration-form";

import { PromotionConfigurationContent } from "./PromotionConfigurationContent";

export function PromotionEditPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");
  const props = useEditPromotionPage();

  if (props.isLoading) {
    return <PromotionConfigurationSkeleton />;
  }

  if (
    props.error ||
    !props.headOffice ||
    !props.promotion ||
    !props.headOfficeId
  ) {
    return (
      <div className="px-6 py-6">
        <ResourceNotFound
          title={t("notFound.promotion")}
          description={t("notFound.promotionDescription")}
          actionLabel={t("buttons.backToHeadOffice")}
          onAction={() =>
            navigate(
              props.headOfficeId
                ? headOfficeDetailPath(props.headOfficeId)
                : ROUTES.SUPPLIER_HEAD_OFFICES
            )
          }
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
      isSubmitDisabled={props.isSubmitDisabled}
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
