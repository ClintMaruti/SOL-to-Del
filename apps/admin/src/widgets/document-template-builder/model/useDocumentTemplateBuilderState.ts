import { toast } from "@sol/ui";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  getDocumentTemplateComparisonSnapshot,
  removeDocumentTemplateItem,
  toDocumentTemplateUpdatePayload,
  updateDocumentTemplateSectionTitle,
  updateDocumentTemplateStaticTextBody,
  useUpdateDocumentTemplate,
  validateDocumentTemplateItems,
  type DocumentTemplateDetail,
} from "@/entities/document-template";
import { useUnsavedChangesBlocker } from "@/shared/hooks";

import type { PaletteGroupKey } from "./types";
import { buildValidationLookup, createInitialCollapsedState } from "./utils";

type PaletteOpenState = Record<PaletteGroupKey, boolean>;

const INITIAL_PALETTE_OPEN: PaletteOpenState = {
  general: true,
  global: true,
  suppliers: true,
};

const TEMPLATE_EXIT_PATH =
  "/database/destinations/content?tab=document-templates";

export function useDocumentTemplateBuilderState(
  template: DocumentTemplateDetail
) {
  const { t } = useTranslation(["admin"]);
  const [items, setItems] = useState(template.items);
  const [savedItems, setSavedItems] = useState(template.items);
  const [comparisonVersion, setComparisonVersion] = useState(template.version);
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>(
    () => createInitialCollapsedState(template.items)
  );
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [editingStaticTextId, setEditingStaticTextId] = useState<string | null>(
    null
  );
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [paletteOpen, setPaletteOpen] =
    useState<PaletteOpenState>(INITIAL_PALETTE_OPEN);

  const { mutate: updateDocumentTemplate, isPending: isSaving } =
    useUpdateDocumentTemplate();

  const initialSnapshot = useMemo(
    () =>
      getDocumentTemplateComparisonSnapshot({
        id: template.id,
        title: template.title,
        version: comparisonVersion,
        items: savedItems,
      }),
    [comparisonVersion, savedItems, template.id, template.title]
  );
  const currentSnapshot = useMemo(
    () =>
      getDocumentTemplateComparisonSnapshot({
        id: template.id,
        title: template.title,
        version: comparisonVersion,
        items,
      }),
    [comparisonVersion, items, template.id, template.title]
  );
  const isDirty = initialSnapshot !== currentSnapshot;

  const validationLookup = useMemo(() => buildValidationLookup(items), [items]);

  const {
    showUnsavedDialog,
    handleCancel,
    handleUnsavedDiscard,
    handleUnsavedStay,
  } = useUnsavedChangesBlocker({
    isDirty,
    exitPath: TEMPLATE_EXIT_PATH,
    onPrepareDiscard: () => {
      setItems(savedItems);
      setShowValidationErrors(false);
      setCollapsedItems(createInitialCollapsedState(savedItems));
      setEditingStaticTextId(null);
      setShowInfoBanner(true);
      setPaletteOpen(INITIAL_PALETTE_OPEN);
    },
  });

  const toggleCollapsed = (itemId: string) => {
    setEditingStaticTextId((current) => (current === itemId ? null : current));
    setCollapsedItems((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
  };

  const togglePaletteGroup = (group: PaletteGroupKey) => {
    setPaletteOpen((current) => ({
      ...current,
      [group]: !current[group],
    }));
  };

  const clearEditingStaticText = () => {
    setEditingStaticTextId(null);
  };

  const handleRemove = (itemId: string) => {
    setEditingStaticTextId((current) => (current === itemId ? null : current));
    setItems((current) => removeDocumentTemplateItem(current, itemId));
    setCollapsedItems((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  };

  const handleSectionTitleChange = (itemId: string, value: string) => {
    setItems((current) =>
      updateDocumentTemplateSectionTitle(current, itemId, value)
    );
  };

  const handleStaticTextChange = (itemId: string, value: string) => {
    setItems((current) =>
      updateDocumentTemplateStaticTextBody(current, itemId, value)
    );
  };

  const handleStartStaticTextEditing = (itemId: string) => {
    setEditingStaticTextId(itemId);
  };

  const handleDismissInfoBanner = () => {
    setShowInfoBanner(false);
  };

  const handleSave = () => {
    if (validateDocumentTemplateItems(items).length > 0) {
      setShowValidationErrors(true);
      toast.error(t("admin:documentTemplates.validation.fixErrors"));
      return;
    }

    updateDocumentTemplate(
      toDocumentTemplateUpdatePayload({
        id: template.id,
        title: template.title,
        version: comparisonVersion,
        items,
      }),
      {
        onSuccess: (data) => {
          setItems(data.items);
          setSavedItems(data.items);
          setComparisonVersion(data.version);
          setShowValidationErrors(false);
        },
      }
    );
  };

  return {
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
  };
}
