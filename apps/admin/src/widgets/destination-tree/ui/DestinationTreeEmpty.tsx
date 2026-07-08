import { Button } from "@sol/ui";
import { FileX, Plus, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DestinationTreeEmptyProps {
  searchQuery?: string;
  /** When provided and there is no search query, shows "+ Create" button (empty state) */
  onCreate?: () => void;
}

export function DestinationTreeEmpty({
  searchQuery,
  onCreate,
}: DestinationTreeEmptyProps) {
  const { t } = useTranslation(["admin", "common"]);
  const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;

  if (hasSearchQuery) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-sky-100">
          <SearchX className="h-6 w-6 text-sky-600" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-foreground">
          {t("admin:empty.noMatchingDestinations")}
        </h3>
        <p className="max-w-lg text-center text-sm text-muted-foreground font-medium">
          {t("admin:empty.noDestinationsDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-md bg-sky-100">
        <FileX className="h-6 w-6 text-sky-600" />
      </div>
      <h3 className="mb-2 text-lg font-bold text-foreground">
        {t("admin:empty.noDestinations")}
      </h3>
      <p className="text-center text-sm text-muted-foreground font-medium leading-6 mb-6">
        {t("admin:empty.noDestinationsCreate")}
      </p>
      {onCreate && (
        <Button variant="primary" onClick={onCreate} className="min-w-4">
          <Plus className="size-4" />
          <span className="hidden sm:inline">{t("common:buttons.create")}</span>
        </Button>
      )}
    </div>
  );
}
