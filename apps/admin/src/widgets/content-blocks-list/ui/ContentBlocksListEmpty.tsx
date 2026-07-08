import { Button } from "@sol/ui";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ContentBlocksListEmptyProps {
  onCreateContentBlock?: () => void;
}

export function ContentBlocksListEmpty({
  onCreateContentBlock,
}: ContentBlocksListEmptyProps) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
      <FileText className="mb-4 size-12 text-muted-foreground" aria-hidden />
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        {t("admin:contentBlocks.emptyTitle")}
      </h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        {t("admin:contentBlocks.emptyDescription")}
      </p>
      {onCreateContentBlock ? (
        <Button variant="primary" onClick={onCreateContentBlock}>
          {t("common:buttons.create")}
        </Button>
      ) : null}
    </div>
  );
}
