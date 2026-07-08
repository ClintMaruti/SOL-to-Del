import { RichTextEditor, type RichTextEditorLabels } from "@sol/ui";
import { useTranslation } from "react-i18next";

import {
  stripHtmlToPlainText,
  type DocumentTemplateStaticTextItem,
} from "@/entities/document-template";

import { CanvasRow } from "./CanvasRow";
import { SortableItemCard } from "./SortableItemCard";

type SortableStaticTextRowProps = {
  item: DocumentTemplateStaticTextItem;
  collapsed: boolean;
  hasError: boolean;
  isEditing: boolean;
  editorLabels: Partial<RichTextEditorLabels>;
  onToggleCollapsed: () => void;
  onRemove: () => void;
  onChange: (value: string) => void;
  onStartEditing: () => void;
  accent?: boolean;
};

export function SortableStaticTextRow({
  item,
  collapsed,
  hasError,
  isEditing,
  editorLabels,
  onToggleCollapsed,
  onRemove,
  onChange,
  onStartEditing,
  accent = false,
}: SortableStaticTextRowProps) {
  const { t } = useTranslation("admin");
  const preview =
    stripHtmlToPlainText(item.staticTextBody) ||
    t("documentTemplates.builder.staticTextPreview");

  return (
    <SortableItemCard id={item.id}>
      {({ dragHandleProps }) => (
        <CanvasRow
          dragHandleProps={dragHandleProps}
          categoryLabel={t("documentTemplates.categories.global")}
          title={t("documentTemplates.builder.staticText")}
          accent={accent}
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          onRemove={onRemove}
          body={
            <div className="min-w-0 space-y-2 px-10 py-4">
              {isEditing ? (
                <RichTextEditor
                  value={item.staticTextBody}
                  onChange={onChange}
                  placeholder={t(
                    "documentTemplates.builder.staticTextPlaceholder"
                  )}
                  labels={editorLabels}
                  className="min-h-[132px]"
                />
              ) : (
                <button
                  type="button"
                  onClick={onStartEditing}
                  className="block w-full truncate text-left text-sm font-medium leading-6 text-text-tertiary"
                >
                  {preview}
                </button>
              )}
              {hasError ? (
                <p className="text-sm text-destructive">
                  {t("documentTemplates.validation.staticTextBody")}
                </p>
              ) : null}
            </div>
          }
        />
      )}
    </SortableItemCard>
  );
}
