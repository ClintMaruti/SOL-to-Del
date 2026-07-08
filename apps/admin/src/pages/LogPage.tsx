import { useTranslation } from "react-i18next";

export function LogPage() {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        {t("admin:pages.log")}
      </h1>
      <p className="text-muted-foreground">{t("admin:pages.logDescription")}</p>
    </div>
  );
}
