import { DndContext } from "@dnd-kit/core";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@sol/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { DocumentTemplateDetail } from "@/entities/document-template";
import { ROUTES } from "@/shared/lib/paths";
import { UnsavedChangesDialog } from "@/shared/ui";

import {
  useDocumentTemplateBuilderDnd,
  useDocumentTemplateBuilderResources,
  useDocumentTemplateBuilderState,
} from "../model";

import { DocumentTemplateCanvas } from "./DocumentTemplateCanvas";
import { DocumentTemplateDragOverlay } from "./DocumentTemplateDragOverlay";
import { DocumentTemplateSidebar } from "./DocumentTemplateSidebar";

const TEMPLATE_EXIT_PATH = `${ROUTES.DATABASE_CONTENT}?tab=document-templates`;

type DocumentTemplateBuilderProps = {
  template: DocumentTemplateDetail;
};

export function DocumentTemplateBuilder({
  template,
}: DocumentTemplateBuilderProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    contentBlocksById,
    contentBlocksError,
    editorLabels,
    groupedPaletteItems,
    isLoadingContentBlocks,
  } = useDocumentTemplateBuilderResources();
  const {
    clearEditingStaticText,
    collapsedItems,
    editingStaticTextId,
    handleCancel,
    handleDismissInfoBanner,
    handleRemove,
    handleSave,
    handleSectionTitleChange,
    handleStartStaticTextEditing,
    handleStaticTextChange,
    handleUnsavedDiscard,
    handleUnsavedStay,
    isDirty,
    isSaving,
    items,
    paletteOpen,
    setItems,
    showInfoBanner,
    showUnsavedDialog,
    showValidationErrors,
    toggleCollapsed,
    togglePaletteGroup,
    validationLookup,
  } = useDocumentTemplateBuilderState(template);
  const {
    activeDrag,
    collisionDetection,
    dropAnimation,
    dropIndicator,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    sensors,
  } = useDocumentTemplateBuilderDnd({
    contentBlocksById,
    items,
    onStartItemDrag: clearEditingStaticText,
    setItems,
    template,
  });

  const rootIds = useMemo(() => items.map((item) => item.id), [items]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-100 p-4">
      <Breadcrumb className="pb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link className="text-blue-500" to={ROUTES.DATABASE_CONTENT}>
                {t("admin:sidebar.content")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link className="text-blue-500" to={TEMPLATE_EXIT_PATH}>
                {t("admin:contentBlocks.tabDocumentTemplates")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium text-neutral-900">
              {template.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold leading-10 text-text-primary">
          {template.title}
        </h1>

        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            {t("common:buttons.cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!isDirty || isSaving}
          >
            {t("common:buttons.save")}
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <DocumentTemplateCanvas
            collapsedItems={collapsedItems}
            contentBlocksById={contentBlocksById}
            dropIndicator={dropIndicator}
            editingStaticTextId={editingStaticTextId}
            editorLabels={editorLabels}
            items={items}
            onDismissInfoBanner={handleDismissInfoBanner}
            onRemove={handleRemove}
            onSectionTitleChange={handleSectionTitleChange}
            onStartStaticTextEditing={handleStartStaticTextEditing}
            onStaticTextChange={handleStaticTextChange}
            onToggleCollapsed={toggleCollapsed}
            rootIds={rootIds}
            showInfoBanner={showInfoBanner}
            showValidationErrors={showValidationErrors}
            validationLookup={validationLookup}
          />
          <DocumentTemplateSidebar
            contentBlocksError={contentBlocksError}
            groupedPaletteItems={groupedPaletteItems}
            isLoadingContentBlocks={isLoadingContentBlocks}
            onTogglePaletteGroup={togglePaletteGroup}
            paletteOpen={paletteOpen}
          />
        </div>

        <DocumentTemplateDragOverlay
          activeDrag={activeDrag}
          dropAnimation={dropAnimation}
          isDropInvalid={dropIndicator?.isValid === false}
        />
      </DndContext>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={(open) => !open && handleUnsavedStay()}
        onStay={handleUnsavedStay}
        onDiscard={handleUnsavedDiscard}
      />
    </div>
  );
}
