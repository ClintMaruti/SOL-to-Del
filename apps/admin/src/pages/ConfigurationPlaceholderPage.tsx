import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { ROUTES } from "@/shared/lib/paths";

export function ConfigurationPlaceholderPage() {
  const { t } = useTranslation("admin");
  const { pathname } = useLocation();

  const title =
    pathname === ROUTES.CONFIGURATION_SETTINGS_USERS
      ? t("pageTitles.configurationUserManagement")
      : t("pageTitles.configurationSystemSettings");

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <h1 className="text-2xl font-bold leading-10 text-text-primary">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-text-secondary">
        {t("pageDescriptions.configurationPlaceholder")}
      </p>
    </div>
  );
}
