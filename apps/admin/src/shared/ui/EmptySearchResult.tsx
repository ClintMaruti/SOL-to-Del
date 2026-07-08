import { SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

export function EmptySearchResult() {
  const { t } = useTranslation("admin");

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-[6px]">
      <div className="flex items-center justify-center w-10 h-10 rounded-[6px] bg-sky-100 mb-6">
        <SearchX className="h-6 w-6 text-sky-600" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 leading-8">
        {t("empty.noMatch")}
      </h3>
      <p className="text-sm text-center leading-6 font-medium text-neutral-600">
        {t("empty.noMatchDescription")}
      </p>
    </div>
  );
}
