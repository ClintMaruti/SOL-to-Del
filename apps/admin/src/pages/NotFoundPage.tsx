import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { ROUTES } from "@/shared/lib/paths";

export function NotFoundPage() {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        {t("admin:modals.notFoundTitle")}
      </h1>
      <p className="text-muted-foreground mb-4">
        {t("admin:modals.notFoundDescription")}
      </p>
      <Link to={ROUTES.DESTINATIONS} className="text-brand-red hover:underline">
        {t("common:buttons.goToHome")}
      </Link>
    </div>
  );
}
