import { Button } from "@sol/ui";
import { CircleAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type DocumentTemplateInfoBannerProps = {
  onDismiss: () => void;
};

export function DocumentTemplateInfoBanner({
  onDismiss,
}: DocumentTemplateInfoBannerProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-md bg-sky-100 px-4 py-3 text-sky-900">
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-sky-600" />
        <div className="space-y-0.5">
          <p className="text-[14px] font-bold leading-5 text-[color:var(--text-info-bold,#0084D1)]">
            {t("documentTemplates.builder.bookingRelatedDataTitle")}
          </p>
          <p className="text-sm font-medium leading-6 text-[color:var(--text-info-bold,#0084D1)] opacity-80">
            {t("documentTemplates.builder.infoBanner")}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onDismiss}
        className="size-5 rounded-sm p-0 text-sky-600 hover:bg-sky-200 hover:text-sky-700"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
