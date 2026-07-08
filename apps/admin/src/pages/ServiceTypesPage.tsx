import { useTranslation } from "react-i18next";

export function ServiceTypesPage() {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        {t("admin:pages.serviceTypes")}
      </h1>
      <p className="text-muted-foreground">
        {t("admin:pages.serviceTypesDescription")}
      </p>
    </div>
  );
}
