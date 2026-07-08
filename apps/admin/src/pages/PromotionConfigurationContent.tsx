import { Switch } from "@sol/ui";
import { useTranslation } from "react-i18next";
import type { AnyFieldApi } from "@tanstack/react-form";

import type { Supplier } from "@/entities/suppliers";
import { FormPageLayout, type AnyFormApi } from "@/shared/ui";
import { PromotionConfigurationForm } from "@/widgets/promotion-configuration-form";

interface PromotionConfigurationContentProps {
  title: string;
  formId: string;
  submitButtonLabel: string;
  isPending: boolean;
  isSubmitDisabled?: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onUnsavedDiscard: () => void;
  onUnsavedStay: () => void;
  unsavedDialogOpen: boolean;
  form: AnyFormApi;
  suppliers: Supplier[];
}

export function PromotionConfigurationContent({
  title,
  formId,
  submitButtonLabel,
  isPending,
  isSubmitDisabled = false,
  onCancel,
  onSubmit,
  onUnsavedDiscard,
  onUnsavedStay,
  unsavedDialogOpen,
  form,
  suppliers,
}: PromotionConfigurationContentProps) {
  const { t } = useTranslation("admin");

  return (
    <FormPageLayout
      title={title}
      formId={formId}
      submitButtonLabel={submitButtonLabel}
      isPending={isPending}
      isSubmitDisabled={isSubmitDisabled}
      onCancel={onCancel}
      onSubmit={onSubmit}
      sections={[]}
      activeSectionId={null}
      unsavedDialogOpen={unsavedDialogOpen}
      onUnsavedDiscard={onUnsavedDiscard}
      onUnsavedStay={onUnsavedStay}
      showSidebar={false}
      headerExtra={
        <form.Field name="isActive">
          {(field: AnyFieldApi) => (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium leading-6 text-text-primary">
                {t("status.active")}
              </span>
              <Switch
                checked={Boolean(field.state.value)}
                onCheckedChange={(checked) => field.handleChange(checked)}
                aria-label={t("labels.active")}
              />
            </div>
          )}
        </form.Field>
      }
    >
      <PromotionConfigurationForm form={form} suppliers={suppliers} />
    </FormPageLayout>
  );
}
