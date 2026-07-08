import type { useDraggable } from "@dnd-kit/core";

import type {
  DocumentTemplateContainerId,
  DocumentTemplateContentItem,
  DocumentTemplatePaletteDefinition,
  DocumentTemplateRootItem,
} from "@/entities/document-template";

export type BuilderPaletteItem = {
  id: string;
  label: string;
  category: "general" | "global" | "suppliers";
  definition: DocumentTemplatePaletteDefinition;
};

export type PaletteGroupKey = BuilderPaletteItem["category"];

export type PaletteDragData = {
  type: "palette";
  label: string;
  definition: DocumentTemplatePaletteDefinition;
};

export type SortableItemData = {
  type: "item";
  itemId: string;
};

export type ActiveDragState =
  | PaletteDragData
  | {
      type: "item";
      label: string;
      itemId: string;
    };

export type DropIndicatorState = {
  containerId: DocumentTemplateContainerId;
  index: number;
  isValid: boolean;
};

export type ValidationLookup = {
  sectionTitleErrors: Set<string>;
  sectionItemsErrors: Set<string>;
  staticTextErrors: Set<string>;
};

export type SortableHandleProps = {
  attributes: ReturnType<typeof useDraggable>["attributes"];
  listeners: ReturnType<typeof useDraggable>["listeners"];
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
};

export type ContentBlocksById = Record<string, { title: string; body: string }>;

export type PaletteGroups = Record<PaletteGroupKey, BuilderPaletteItem[]>;

export type ContentCategoryLabelResolver = (
  item: DocumentTemplateContentItem
) => string;

export type DocumentTemplateItemsState = DocumentTemplateRootItem[];
