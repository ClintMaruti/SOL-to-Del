import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

export function DatabasePage() {
  const { t } = useTranslation(["admin", "common"]);
  const { childId, innerPageId } = useParams<{
    childId?: string;
    innerPageId?: string;
  }>();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-foreground mb-4">
        {t("admin:pages.database")}
      </h1>
      {childId && (
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {childId}
          </h2>
          {innerPageId && (
            <p className="text-muted-foreground">
              {t("admin:pages.innerPage", { id: innerPageId })}
            </p>
          )}
        </div>
      )}
      <p className="text-muted-foreground">
        {t("admin:pages.databaseDescription")}
      </p>
    </div>
  );
}
