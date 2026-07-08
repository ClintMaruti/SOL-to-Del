import { useTranslation } from "react-i18next";

import { FutureUpliftSettingsCard } from "@/widgets/future-uplift-settings";

export function FutureUpliftPage() {
  const { t } = useTranslation("admin");

  return (
    <div className="flex min-h-[calc(100vh-var(--layout-reserved-footer-height,0px)-4rem)] flex-col gap-4 p-4">
      <div className="shrink-0">
        <h1 className="text-[length:var(--Headings-L-Bold-Size,24px)] font-[var(--Headings-L-Bold-Weight,700)] leading-[var(--Headings-L-Bold-Line-Height,40px)] tracking-[var(--Headings-L-Bold-Letter-Spacing,-0.4px)] text-[var(--Text-Primary,#171717)]">
          {t("pageTitles.futureUplift")}
        </h1>
        <p className="mt-1 max-w-3xl whitespace-pre-line font-[var(--Text-M-Medium-Weight,500)] text-[length:var(--Text-M-Medium-Size,14px)] leading-[var(--Text-M-Medium-Line-Height,24px)] tracking-[var(--Text-M-Medium-Letter-Spacing,0)] text-[var(--Text-Secondary,#525252)]">
          {t("pageTitles.futureUpliftDescription")}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[6px] border border-border bg-card p-6 shadow-sm">
        <FutureUpliftSettingsCard />
      </div>
    </div>
  );
}
