import {
  closestCorners,
  pointerWithin,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";

import {
  DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID,
  findDocumentTemplateItemLocation,
  validateDocumentTemplateItems,
  type DocumentTemplateItemKind,
  type DocumentTemplateContainerId,
  type DocumentTemplateRootItem,
  type DocumentTemplateSectionItem,
} from "@/entities/document-template";

import type { DropIndicatorState, ValidationLookup } from "./types";

export const SECTION_PREFIX = "section:";

type ResolvedDropTarget = Omit<DropIndicatorState, "isValid">;

export function prioritizeDocumentTemplateCollisions<
  T extends { id: UniqueIdentifier },
>(collisions: T[]) {
  const moreSpecificCollisions = collisions.filter(
    (collision) => String(collision.id) !== DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID
  );

  return moreSpecificCollisions.length > 0
    ? moreSpecificCollisions
    : collisions;
}

export function documentTemplateCollisionDetection(
  args: Parameters<typeof pointerWithin>[0]
) {
  const pointerCollisions = prioritizeDocumentTemplateCollisions(
    pointerWithin(args)
  );

  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  return prioritizeDocumentTemplateCollisions(closestCorners(args));
}

export function getActiveRect(
  event: Pick<DragStartEvent | DragOverEvent | DragEndEvent, "active">
) {
  return (
    event.active.rect.current.translated ?? event.active.rect.current.initial
  );
}

export function buildValidationLookup(template: DocumentTemplateRootItem[]) {
  const issues = validateDocumentTemplateItems(template);
  const lookup: ValidationLookup = {
    sectionTitleErrors: new Set<string>(),
    sectionItemsErrors: new Set<string>(),
    staticTextErrors: new Set<string>(),
  };

  issues.forEach((issue) => {
    if (issue.field === "sectionTitle") {
      lookup.sectionTitleErrors.add(issue.itemId);
    }
    if (issue.field === "sectionItems") {
      lookup.sectionItemsErrors.add(issue.itemId);
    }
    if (issue.field === "staticTextBody") {
      lookup.staticTextErrors.add(issue.itemId);
    }
  });

  return lookup;
}

export function createInitialCollapsedState(items: DocumentTemplateRootItem[]) {
  const collapsedState: Record<string, boolean> = {};

  items.forEach((item) => {
    if (item.kind === "Section") {
      item.items.forEach((child) => {
        if (child.kind === "Content") {
          collapsedState[child.id] = true;
        }
      });
      return;
    }

    if (item.kind === "Content" && item.source === "SUPPLIER") {
      collapsedState[item.id] = true;
    }
  });

  return collapsedState;
}

function getContainerLength(
  items: DocumentTemplateRootItem[],
  containerId: DocumentTemplateContainerId
) {
  if (containerId === DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID) {
    return items.length;
  }

  const sectionId = containerId.replace(SECTION_PREFIX, "");
  const section = items.find(
    (item): item is DocumentTemplateSectionItem =>
      item.kind === "Section" && item.id === sectionId
  );

  return section?.items.length;
}

export function resolveDropTarget(
  items: DocumentTemplateRootItem[],
  overId: UniqueIdentifier | null | undefined,
  activeRect?: {
    top: number;
    height: number;
  } | null,
  overRect?: {
    top: number;
    height: number;
  } | null
): ResolvedDropTarget | null {
  if (!overId) {
    return null;
  }

  const id = String(overId);

  if (
    id === DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID ||
    id.startsWith(SECTION_PREFIX)
  ) {
    const containerId = id as DocumentTemplateContainerId;
    return {
      containerId,
      index: getContainerLength(items, containerId) ?? 0,
    };
  }

  const location = findDocumentTemplateItemLocation(items, id);

  if (!location) {
    return null;
  }

  return {
    containerId: location.containerId,
    index:
      activeRect &&
      overRect &&
      activeRect.top + activeRect.height / 2 >
        overRect.top + overRect.height / 2
        ? location.index + 1
        : location.index,
  };
}

export function canDropDocumentTemplateKind(
  itemKind: DocumentTemplateItemKind,
  targetContainerId: DocumentTemplateContainerId
) {
  if (itemKind === "Section") {
    return targetContainerId === DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID;
  }

  return true;
}
