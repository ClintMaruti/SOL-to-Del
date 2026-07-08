import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DropAnimation,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";

import {
  createDocumentTemplateItemFromPalette,
  findDocumentTemplateItemLocation,
  getDocumentTemplateItemLabel,
  insertDocumentTemplateItem,
  moveDocumentTemplateItem,
  type DocumentTemplateDetail,
  type DocumentTemplateRootItem,
} from "@/entities/document-template";

import type {
  ActiveDragState,
  ContentBlocksById,
  DropIndicatorState,
  SortableItemData,
} from "./types";
import {
  documentTemplateCollisionDetection,
  canDropDocumentTemplateKind,
  getActiveRect,
  resolveDropTarget,
} from "./utils";

type UseDocumentTemplateBuilderDndParams = {
  contentBlocksById: ContentBlocksById;
  items: DocumentTemplateRootItem[];
  onStartItemDrag: () => void;
  setItems: Dispatch<SetStateAction<DocumentTemplateRootItem[]>>;
  template: Pick<DocumentTemplateDetail, "id" | "version">;
};

export function useDocumentTemplateBuilderDnd({
  contentBlocksById,
  items,
  onStartItemDrag,
  setItems,
  template,
}: UseDocumentTemplateBuilderDndParams) {
  const { t } = useTranslation(["admin"]);
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState | null>(
    null
  );
  const [animatePaletteDropBack, setAnimatePaletteDropBack] = useState(true);
  const itemDragSnapshotRef = useRef<DocumentTemplateRootItem[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateDropIndicator = (nextIndicator: DropIndicatorState | null) => {
    setDropIndicator((current) => {
      if (
        current?.containerId === nextIndicator?.containerId &&
        current?.index === nextIndicator?.index
      ) {
        return current;
      }

      return nextIndicator;
    });
  };

  const resolveDropPreview = (
    activeData: ActiveDragState | SortableItemData,
    event: Pick<DragOverEvent | DragEndEvent, "over" | "active">
  ): DropIndicatorState | null => {
    const activeRect = getActiveRect(event);
    const dropTarget = resolveDropTarget(
      items,
      event.over?.id,
      activeRect,
      event.over?.rect
    );

    if (!dropTarget) {
      return null;
    }

    if (activeData.type === "palette") {
      return {
        ...dropTarget,
        isValid: canDropDocumentTemplateKind(
          activeData.definition.kind,
          dropTarget.containerId
        ),
      };
    }

    const location = findDocumentTemplateItemLocation(items, activeData.itemId);

    if (!location) {
      return null;
    }

    return {
      ...dropTarget,
      isValid: canDropDocumentTemplateKind(
        location.item.kind,
        dropTarget.containerId
      ),
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | ActiveDragState
      | SortableItemData
      | undefined;

    if (!data) {
      setActiveDrag(null);
      updateDropIndicator(null);
      return;
    }

    if (data.type === "palette") {
      setAnimatePaletteDropBack(true);
      setActiveDrag(data);
      updateDropIndicator(null);
      return;
    }

    itemDragSnapshotRef.current = items;
    setAnimatePaletteDropBack(true);
    onStartItemDrag();
    updateDropIndicator(null);

    const location = findDocumentTemplateItemLocation(items, data.itemId);
    if (!location) {
      setActiveDrag(null);
      updateDropIndicator(null);
      return;
    }

    const item = location.item;
    const label =
      item.kind === "Section"
        ? t("documentTemplates.builder.section")
        : item.kind === "PageDivider"
          ? t("documentTemplates.builder.pageDivider")
          : getDocumentTemplateItemLabel(item, contentBlocksById, {
              staticTextLabel: t("documentTemplates.builder.staticText"),
            });

    setActiveDrag({
      type: "item",
      itemId: data.itemId,
      label,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeData = event.active.data.current as
      | ActiveDragState
      | SortableItemData
      | undefined;

    if (!activeData) {
      updateDropIndicator(null);
      return;
    }

    const dropTarget = resolveDropPreview(activeData, event);

    updateDropIndicator(dropTarget);

    if (activeData.type === "palette") {
      return;
    }

    setItems((current) => {
      const activeRect = getActiveRect(event);
      const currentDropTarget = resolveDropTarget(
        current,
        event.over?.id,
        activeRect,
        event.over?.rect
      );

      if (!currentDropTarget) {
        return current;
      }

      const currentLocation = findDocumentTemplateItemLocation(
        current,
        activeData.itemId
      );

      if (
        !currentLocation ||
        !canDropDocumentTemplateKind(
          currentLocation.item.kind,
          currentDropTarget.containerId
        )
      ) {
        return current;
      }

      if (
        currentLocation &&
        currentLocation.containerId === currentDropTarget.containerId
      ) {
        return current;
      }

      return moveDocumentTemplateItem(
        current,
        activeData.itemId,
        currentDropTarget.containerId,
        currentDropTarget.index
      );
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeData = event.active.data.current as
      | ActiveDragState
      | SortableItemData
      | undefined;

    if (!activeData) {
      setActiveDrag(null);
      updateDropIndicator(null);
      return;
    }

    const dropTarget = resolveDropPreview(activeData, event);

    if (!dropTarget || !dropTarget.isValid) {
      if (activeData.type === "item" && itemDragSnapshotRef.current) {
        setItems(itemDragSnapshotRef.current);
      }
      setAnimatePaletteDropBack(true);
      itemDragSnapshotRef.current = null;
      setActiveDrag(null);
      updateDropIndicator(null);
      return;
    }

    if (activeData.type === "palette") {
      setAnimatePaletteDropBack(false);
      const nextItem = createDocumentTemplateItemFromPalette(
        activeData.definition,
        template.id,
        template.version
      );

      setItems((current) =>
        insertDocumentTemplateItem(
          current,
          nextItem,
          dropTarget.containerId,
          dropTarget.index
        )
      );
      itemDragSnapshotRef.current = null;
      setActiveDrag(null);
      updateDropIndicator(null);
      return;
    }

    setAnimatePaletteDropBack(true);
    setItems((current) =>
      moveDocumentTemplateItem(
        current,
        activeData.itemId,
        dropTarget.containerId,
        dropTarget.index
      )
    );
    itemDragSnapshotRef.current = null;
    setActiveDrag(null);
    updateDropIndicator(null);
  };

  const handleDragCancel = () => {
    if (itemDragSnapshotRef.current) {
      setItems(itemDragSnapshotRef.current);
    }
    setAnimatePaletteDropBack(true);
    itemDragSnapshotRef.current = null;
    setActiveDrag(null);
    updateDropIndicator(null);
  };

  const dropAnimation: DropAnimation | null | undefined =
    activeDrag?.type === "palette" && !animatePaletteDropBack
      ? null
      : undefined;

  return {
    activeDrag,
    collisionDetection: documentTemplateCollisionDetection,
    dropAnimation,
    dropIndicator,
    handleDragCancel,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    sensors,
  };
}
