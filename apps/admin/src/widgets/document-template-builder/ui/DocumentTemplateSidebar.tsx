import { getErrorMessage } from "@sol/api-client";
import { Skeleton } from "@sol/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PaletteGroupKey, PaletteGroups } from "../model";

import { PaletteItemRow } from "./components";
import { GROUP_HEADING_CLASS } from "./components/constants";

type DocumentTemplateSidebarProps = {
  contentBlocksError: unknown;
  groupedPaletteItems: PaletteGroups;
  isLoadingContentBlocks: boolean;
  onTogglePaletteGroup: (group: PaletteGroupKey) => void;
  paletteOpen: Record<PaletteGroupKey, boolean>;
};

export function DocumentTemplateSidebar({
  contentBlocksError,
  groupedPaletteItems,
  isLoadingContentBlocks,
  onTogglePaletteGroup,
  paletteOpen,
}: DocumentTemplateSidebarProps) {
  const { t } = useTranslation(["admin"]);

  return (
    <aside className="min-h-0 overflow-y-auto rounded-md bg-background p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold leading-7 text-text-primary">
          {t("documentTemplates.builder.sidebarTitle")}
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-text-secondary">
          {t("documentTemplates.builder.sidebarDescription")}
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className={GROUP_HEADING_CLASS}>
              {t("documentTemplates.categories.general")}
            </h3>
          </div>
          {paletteOpen.general ? (
            <div className="space-y-2">
              {groupedPaletteItems.general.map((item) => (
                <PaletteItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            className="mb-2 flex w-full items-center justify-between"
            onClick={() => onTogglePaletteGroup("global")}
          >
            <span className={GROUP_HEADING_CLASS}>
              {t("documentTemplates.categories.global")}
            </span>
            {paletteOpen.global ? (
              <ChevronUp className="size-4 text-text-secondary" />
            ) : (
              <ChevronDown className="size-4 text-text-secondary" />
            )}
          </button>
          {paletteOpen.global ? (
            <div className="space-y-2">
              {isLoadingContentBlocks ? (
                <>
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </>
              ) : null}
              {contentBlocksError ? (
                <p className="text-sm text-destructive" role="alert">
                  {getErrorMessage(
                    contentBlocksError,
                    t("admin:errors.failedToLoadContentBlocks")
                  )}
                </p>
              ) : null}
              {!isLoadingContentBlocks &&
                groupedPaletteItems.global.map((item) => (
                  <PaletteItemRow key={item.id} item={item} />
                ))}
            </div>
          ) : null}
        </div>

        <div>
          <button
            type="button"
            className="mb-2 flex w-full items-center justify-between"
            onClick={() => onTogglePaletteGroup("suppliers")}
          >
            <span className={GROUP_HEADING_CLASS}>
              {t("documentTemplates.categories.suppliers")}
            </span>
            {paletteOpen.suppliers ? (
              <ChevronUp className="size-4 text-text-secondary" />
            ) : (
              <ChevronDown className="size-4 text-text-secondary" />
            )}
          </button>
          {paletteOpen.suppliers ? (
            <div className="space-y-2">
              {groupedPaletteItems.suppliers.map((item) => (
                <PaletteItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
