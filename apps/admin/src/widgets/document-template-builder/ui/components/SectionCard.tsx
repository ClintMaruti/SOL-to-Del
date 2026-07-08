import { Button, Input, Label, cn } from "@sol/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { DocumentTemplateSectionItem } from "@/entities/document-template";

import { BuilderDropZone } from "./BuilderDropZone";
import { HEADER_ROW_CLASS } from "./constants";
import { DragHandle } from "./DragHandle";
import { RowActions } from "./RowActions";
import { SectionEmptyState } from "./SectionEmptyState";
import { SortableItemCard } from "./SortableItemCard";

type SectionCardProps = {
  item: DocumentTemplateSectionItem;
  childIds: string[];
  collapsed: boolean;
  sectionTitleError: boolean;
  sectionItemsError: boolean;
  onToggleCollapsed: () => void;
  onRemove: () => void;
  onSectionTitleChange: (value: string) => void;
  childrenContent: ReactNode;
  isShowingDropIndicator: boolean;
};

export function SectionCard({
  item,
  childIds,
  collapsed,
  sectionTitleError,
  sectionItemsError,
  onToggleCollapsed,
  onRemove,
  onSectionTitleChange,
  childrenContent,
  isShowingDropIndicator,
}: SectionCardProps) {
  const { t } = useTranslation("admin");

  return (
    <SortableItemCard id={item.id}>
      {({ dragHandleProps }) => (
        <div className="w-full border rounded-[6px] border-gray-200 border-l-4 border-l-brand-red">
          <div className="flex items-stretch border-b border-gray-200 bg-white">
            <div className="px-1 border-r border-gray-200 flex items-center justify-center w-7">
              <DragHandle dragHandleProps={dragHandleProps} />
            </div>
            <div
              className={cn(
                HEADER_ROW_CLASS,
                !collapsed ? "rounded-tr-md" : "rounded-r-md"
              )}
            >
              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-5 text-text-secondary">
                  {t("documentTemplates.categories.general")}
                </p>
                <div className="flex items-center gap-1">
                  <p className="truncate text-[14px] font-bold leading-5 text-text-primary">
                    {t("documentTemplates.builder.section")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleCollapsed}
                    className="size-5 shrink-0 rounded-sm p-0 text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                  >
                    {collapsed ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronUp className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              <RowActions onRemove={onRemove} />
            </div>
          </div>

          {!collapsed ? (
            <div className="min-w-0 flex-1 bg-background-secondary px-10 py-2">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`section-title-${item.id}`}
                    className="text-[14px] font-semibold leading-6 text-text-primary"
                  >
                    {t("documentTemplates.builder.sectionTitle")}
                  </Label>
                  <Input
                    id={`section-title-${item.id}`}
                    value={item.sectionTitle}
                    onChange={(event) =>
                      onSectionTitleChange(event.currentTarget.value)
                    }
                    placeholder={t(
                      "documentTemplates.builder.sectionTitlePlaceholder"
                    )}
                    className={cn(
                      "h-8 border-border-tertiary bg-background text-sm font-medium text-text-primary placeholder:text-text-tertiary",
                      sectionTitleError && "border-destructive"
                    )}
                  />
                  {sectionTitleError ? (
                    <p className="text-sm text-destructive">
                      {t("documentTemplates.validation.sectionTitle")}
                    </p>
                  ) : null}
                </div>

                <BuilderDropZone
                  id={`section:${item.id}`}
                  className="space-y-2"
                  overClassName="rounded-md bg-blue-50 outline outline-1 outline-blue-300"
                >
                  {childIds.length ? (
                    <div className="space-y-2">{childrenContent}</div>
                  ) : (
                    <div className="min-h-20">
                      {isShowingDropIndicator ? (
                        <div className="flex min-h-20 items-center">
                          {childrenContent}
                        </div>
                      ) : (
                        <SectionEmptyState hasError={sectionItemsError} />
                      )}
                    </div>
                  )}
                </BuilderDropZone>

                {sectionItemsError && childIds.length ? (
                  <p className="text-sm text-destructive">
                    {t("documentTemplates.validation.sectionItems")}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </SortableItemCard>
  );
}
