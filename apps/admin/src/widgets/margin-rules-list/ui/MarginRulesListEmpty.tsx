import { Button, cn } from "@sol/ui";
import { FileText, Plus } from "lucide-react";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";

interface MarginRulesListEmptyProps {
  onCreate: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function MarginRulesListEmpty({
  onCreate,
  className,
}: MarginRulesListEmptyProps) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center rounded-md border border-border-tertiary bg-white px-6 py-20",
        className
      )}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-10 items-center justify-center rounded-md bg-sky-100">
          <FileText className="size-5 text-sky-600" />
        </div>
        <h2 className="text-xl font-bold leading-8 text-text-primary">
          {t("empty.noMarginRules")}
        </h2>
        <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">
          {t("empty.noMarginRulesDescription")}
        </p>
        <Button
          variant="primary"
          className="mt-6"
          onClick={onCreate}
          aria-label={t("common:buttons.create")}
        >
          <Plus className="size-4" />
          {t("common:buttons.create")}
        </Button>
      </div>
    </div>
  );
}
