import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { RichTextEditorLabels } from "@sol/ui";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID,
  type DocumentTemplateContainerId,
  type DocumentTemplateRootItem,
  type DocumentTemplateSectionChildItem,
  type DocumentTemplateSectionItem,
} from "@/entities/document-template";

import type {
  ContentBlocksById,
  DropIndicatorState,
  ValidationLookup,
} from "../model";
import { SECTION_PREFIX } from "../model";

import {
  BuilderDropZone,
  DropIndicator,
  RootEmptyState,
  SectionCard,
  SortableContentRow,
  SortablePageDividerRow,
  SortableStaticTextRow,
} from "./components";
import { DocumentTemplateInfoBanner } from "./DocumentTemplateInfoBanner";

type DocumentTemplateCanvasProps = {
  collapsedItems: Record<string, boolean>;
  contentBlocksById: ContentBlocksById;
  dropIndicator: DropIndicatorState | null;
  editingStaticTextId: string | null;
  editorLabels: Partial<RichTextEditorLabels>;
  items: DocumentTemplateRootItem[];
  onDismissInfoBanner: () => void;
  onRemove: (itemId: string) => void;
  onSectionTitleChange: (itemId: string, value: string) => void;
  onStartStaticTextEditing: (itemId: string) => void;
  onStaticTextChange: (itemId: string, value: string) => void;
  onToggleCollapsed: (itemId: string) => void;
  rootIds: string[];
  showInfoBanner: boolean;
  showValidationErrors: boolean;
  validationLookup: ValidationLookup;
};

export function DocumentTemplateCanvas({
  collapsedItems,
  contentBlocksById,
  dropIndicator,
  editingStaticTextId,
  editorLabels,
  items,
  onDismissInfoBanner,
  onRemove,
  onSectionTitleChange,
  onStartStaticTextEditing,
  onStaticTextChange,
  onToggleCollapsed,
  rootIds,
  showInfoBanner,
  showValidationErrors,
  validationLookup,
}: DocumentTemplateCanvasProps) {
  const { t } = useTranslation("admin");

  const renderListWithIndicator = <T,>(
    list: T[],
    containerId: DocumentTemplateContainerId,
    renderItem: (item: T) => ReactNode,
    accentIndicator = false
  ) => {
    const indicatorIndex =
      dropIndicator?.containerId === containerId ? dropIndicator.index : null;
    const nodes: ReactNode[] = [];

    for (let index = 0; index <= list.length; index += 1) {
      if (indicatorIndex === index) {
        nodes.push(
          <DropIndicator
            key={`drop-indicator-${containerId}-${index}`}
            accent={accentIndicator}
            variant={dropIndicator?.isValid === false ? "invalid" : "valid"}
          />
        );
      }

      if (index < list.length) {
        const item = list[index];
        if (item) {
          nodes.push(renderItem(item));
        }
      }
    }

    return nodes;
  };

  const renderSectionChild = (child: DocumentTemplateSectionChildItem) => {
    if (child.kind === "Content") {
      return (
        <SortableContentRow
          key={child.id}
          id={child.id}
          item={child}
          categoryLabel={
            child.source === "SUPPLIER"
              ? t("documentTemplates.categories.suppliers")
              : t("documentTemplates.categories.global")
          }
          contentBlocksById={contentBlocksById}
          collapsed={Boolean(collapsedItems[child.id])}
          onToggleCollapsed={() => onToggleCollapsed(child.id)}
          onRemove={() => onRemove(child.id)}
        />
      );
    }

    if (child.kind === "StaticText") {
      return (
        <SortableStaticTextRow
          key={child.id}
          item={child}
          collapsed={Boolean(collapsedItems[child.id])}
          hasError={
            showValidationErrors &&
            validationLookup.staticTextErrors.has(child.id)
          }
          isEditing={editingStaticTextId === child.id}
          editorLabels={editorLabels}
          onToggleCollapsed={() => onToggleCollapsed(child.id)}
          onRemove={() => onRemove(child.id)}
          onChange={(value) => onStaticTextChange(child.id, value)}
          onStartEditing={() => onStartStaticTextEditing(child.id)}
        />
      );
    }

    return (
      <SortablePageDividerRow
        key={child.id}
        item={child}
        title={t("documentTemplates.builder.pageDivider")}
        onRemove={() => onRemove(child.id)}
        accent={false}
      />
    );
  };

  const renderRootItem = (item: DocumentTemplateRootItem) => {
    if (item.kind === "Section") {
      const section = item as DocumentTemplateSectionItem;
      const sectionContainerId =
        `${SECTION_PREFIX}${section.id}` as DocumentTemplateContainerId;
      const childIds = section.items.map((child) => child.id);

      return (
        <SectionCard
          key={section.id}
          item={section}
          childIds={childIds}
          collapsed={Boolean(collapsedItems[section.id])}
          sectionTitleError={
            showValidationErrors &&
            validationLookup.sectionTitleErrors.has(section.id)
          }
          sectionItemsError={
            showValidationErrors &&
            validationLookup.sectionItemsErrors.has(section.id)
          }
          onToggleCollapsed={() => onToggleCollapsed(section.id)}
          onRemove={() => onRemove(section.id)}
          onSectionTitleChange={(value) =>
            onSectionTitleChange(section.id, value)
          }
          childrenContent={
            <SortableContext
              items={childIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {renderListWithIndicator(
                  section.items,
                  sectionContainerId,
                  renderSectionChild
                )}
              </div>
            </SortableContext>
          }
          isShowingDropIndicator={
            dropIndicator?.containerId === sectionContainerId
          }
        />
      );
    }

    if (item.kind === "Content") {
      return (
        <SortableContentRow
          key={item.id}
          id={item.id}
          item={item}
          categoryLabel={
            item.source === "SUPPLIER"
              ? t("documentTemplates.categories.suppliers")
              : t("documentTemplates.categories.global")
          }
          contentBlocksById={contentBlocksById}
          collapsed={Boolean(collapsedItems[item.id])}
          onToggleCollapsed={() => onToggleCollapsed(item.id)}
          onRemove={() => onRemove(item.id)}
          accent
        />
      );
    }

    if (item.kind === "StaticText") {
      return (
        <SortableStaticTextRow
          key={item.id}
          item={item}
          collapsed={Boolean(collapsedItems[item.id])}
          hasError={
            showValidationErrors &&
            validationLookup.staticTextErrors.has(item.id)
          }
          isEditing={editingStaticTextId === item.id}
          editorLabels={editorLabels}
          onToggleCollapsed={() => onToggleCollapsed(item.id)}
          onRemove={() => onRemove(item.id)}
          onChange={(value) => onStaticTextChange(item.id, value)}
          onStartEditing={() => onStartStaticTextEditing(item.id)}
          accent
        />
      );
    }

    return (
      <SortablePageDividerRow
        key={item.id}
        item={item}
        title={t("documentTemplates.builder.pageDivider")}
        onRemove={() => onRemove(item.id)}
      />
    );
  };

  return (
    <div className="min-h-0 overflow-y-auto rounded-md bg-gray-50 border border-gray-200 p-6">
      <div className="mx-auto flex min-h-full w-full max-w-[85%] flex-col bg-white px-10 py-6">
        {showInfoBanner ? (
          <DocumentTemplateInfoBanner onDismiss={onDismissInfoBanner} />
        ) : null}

        <BuilderDropZone
          id={DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID}
          className="flex flex-1 flex-col rounded-md"
          overClassName="rounded-md bg-blue-50 outline outline-1 outline-blue-300"
        >
          {items.length ? (
            <SortableContext
              items={rootIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {renderListWithIndicator(
                  items,
                  DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID,
                  renderRootItem,
                  true
                )}
              </div>
            </SortableContext>
          ) : dropIndicator?.containerId ===
            DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID ? (
            <DropIndicator
              accent
              variant={dropIndicator.isValid === false ? "invalid" : "valid"}
            />
          ) : (
            <RootEmptyState />
          )}
        </BuilderDropZone>
      </div>
    </div>
  );
}
