import type { ContentBlockListItem } from "@/entities/content-block";

import type {
  DocumentTemplateContentItem,
  DocumentTemplateDetail,
  DocumentTemplateRootItem,
  DocumentTemplateSectionChildItem,
  DocumentTemplateSectionItem,
  DocumentTemplateStaticTextItem,
  SupplierContentType,
  UpdateDocumentTemplatePayload,
} from "./types";
import { normalizeSupplierContentTypeForApi } from "./types";

export const DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID = "root";
export const EMPTY_RICH_TEXT = "<p></p>";

export type DocumentTemplateContainerId =
  | typeof DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID
  | `section:${string}`;

export type DocumentTemplatePaletteDefinition =
  | { kind: "Section" }
  | { kind: "PageDivider" }
  | { kind: "StaticText" }
  | { kind: "Content"; source: "GLOBAL"; contentBlockId: string }
  | {
      kind: "Content";
      source: "SUPPLIER";
      supplierContentType: SupplierContentType;
    };

export type DocumentTemplateValidationIssue = {
  itemId: string;
  field: "sectionTitle" | "sectionItems" | "staticTextBody";
};

export type DocumentTemplateItemLocation = {
  item: DocumentTemplateRootItem | DocumentTemplateSectionChildItem;
  containerId: DocumentTemplateContainerId;
  index: number;
};

type DocumentTemplateSerializableItem =
  | {
      id: string;
      kind: "Section";
      sortOrder: number;
      documentId: string;
      version: number;
      sectionTitle: string;
      items: DocumentTemplateSerializableItem[];
    }
  | {
      id: string;
      kind: "Content";
      sortOrder: number;
      documentId: string;
      version: number;
      contentBlockId?: string;
      supplierContentType?: string;
    }
  | {
      id: string;
      kind: "StaticText";
      sortOrder: number;
      documentId: string;
      version: number;
      staticTextBody: string;
    }
  | {
      id: string;
      kind: "PageDivider";
      sortOrder: number;
      documentId: string;
      version: number;
    };

export function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichTextHtmlEmpty(html: string): boolean {
  return stripHtmlToPlainText(html).length === 0;
}

export function isDocumentTemplateSectionItem(
  item: DocumentTemplateRootItem | DocumentTemplateSectionChildItem
): item is DocumentTemplateSectionItem {
  return item.kind === "Section";
}

export function isDocumentTemplateStaticTextItem(
  item: DocumentTemplateRootItem | DocumentTemplateSectionChildItem
): item is DocumentTemplateStaticTextItem {
  return item.kind === "StaticText";
}

function resequenceSectionChildren(
  items: DocumentTemplateSectionChildItem[]
): DocumentTemplateSectionChildItem[] {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
}

export function resequenceDocumentTemplateItems(
  items: DocumentTemplateRootItem[]
): DocumentTemplateRootItem[] {
  return items.map((item, index) => {
    if (item.kind === "Section") {
      return {
        ...item,
        sortOrder: index + 1,
        items: resequenceSectionChildren(item.items),
      };
    }

    return {
      ...item,
      sortOrder: index + 1,
    };
  });
}

function createBaseItem(documentId: string, version: number) {
  return {
    id: crypto.randomUUID(),
    documentId,
    version,
    sortOrder: 0,
  };
}

export function createDocumentTemplateItemFromPalette(
  palette: DocumentTemplatePaletteDefinition,
  documentId: string,
  version: number
): DocumentTemplateRootItem | DocumentTemplateSectionChildItem {
  const base = createBaseItem(documentId, version);

  if (palette.kind === "Section") {
    return {
      ...base,
      kind: "Section",
      sectionTitle: "",
      items: [],
    };
  }

  if (palette.kind === "PageDivider") {
    return {
      ...base,
      kind: "PageDivider",
    };
  }

  if (palette.kind === "StaticText") {
    return {
      ...base,
      kind: "StaticText",
      staticTextBody: EMPTY_RICH_TEXT,
    };
  }

  if (palette.source === "GLOBAL") {
    return {
      ...base,
      kind: "Content",
      source: "GLOBAL",
      contentBlockId: palette.contentBlockId,
    };
  }

  return {
    ...base,
    kind: "Content",
    source: "SUPPLIER",
    supplierContentType: palette.supplierContentType,
  };
}

export function findDocumentTemplateItemLocation(
  items: DocumentTemplateRootItem[],
  itemId: string
): DocumentTemplateItemLocation | null {
  const rootIndex = items.findIndex((item) => item.id === itemId);
  if (rootIndex >= 0) {
    const rootItem = items[rootIndex];
    if (!rootItem) {
      return null;
    }
    return {
      item: rootItem,
      containerId: DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID,
      index: rootIndex,
    };
  }

  for (const section of items) {
    if (section.kind !== "Section") {
      continue;
    }
    const childIndex = section.items.findIndex((item) => item.id === itemId);
    if (childIndex >= 0) {
      const childItem = section.items[childIndex];
      if (!childItem) {
        return null;
      }
      return {
        item: childItem,
        containerId: `section:${section.id}`,
        index: childIndex,
      };
    }
  }

  return null;
}

export function insertDocumentTemplateItem(
  items: DocumentTemplateRootItem[],
  item: DocumentTemplateRootItem | DocumentTemplateSectionChildItem,
  containerId: DocumentTemplateContainerId,
  targetIndex?: number
): DocumentTemplateRootItem[] {
  if (containerId === DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID) {
    const next = [...items];
    const safeIndex =
      typeof targetIndex === "number" ? Math.max(0, targetIndex) : next.length;
    next.splice(safeIndex, 0, item as DocumentTemplateRootItem);
    return resequenceDocumentTemplateItems(next);
  }

  if (item.kind === "Section") {
    return items;
  }

  const sectionId = containerId.replace(/^section:/, "");
  return resequenceDocumentTemplateItems(
    items.map((rootItem) => {
      if (rootItem.kind !== "Section" || rootItem.id !== sectionId) {
        return rootItem;
      }

      const nextChildren = [...rootItem.items];
      const safeIndex =
        typeof targetIndex === "number"
          ? Math.max(0, targetIndex)
          : nextChildren.length;
      nextChildren.splice(safeIndex, 0, item);

      return {
        ...rootItem,
        items: resequenceSectionChildren(nextChildren),
      };
    })
  );
}

export function removeDocumentTemplateItem(
  items: DocumentTemplateRootItem[],
  itemId: string
): DocumentTemplateRootItem[] {
  const rootItems = items.filter((item) => item.id !== itemId);
  if (rootItems.length !== items.length) {
    return resequenceDocumentTemplateItems(rootItems);
  }

  return resequenceDocumentTemplateItems(
    items.map((item) => {
      if (item.kind !== "Section") {
        return item;
      }

      return {
        ...item,
        items: resequenceSectionChildren(
          item.items.filter((child) => child.id !== itemId)
        ),
      };
    })
  );
}

export function moveDocumentTemplateItem(
  items: DocumentTemplateRootItem[],
  itemId: string,
  targetContainerId: DocumentTemplateContainerId,
  targetIndex?: number
): DocumentTemplateRootItem[] {
  const location = findDocumentTemplateItemLocation(items, itemId);

  if (!location) {
    return items;
  }

  if (
    location.item.kind === "Section" &&
    targetContainerId !== DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID
  ) {
    return items;
  }

  const withoutItem = removeDocumentTemplateItem(items, itemId);
  let nextIndex = targetIndex;

  if (
    location.containerId === targetContainerId &&
    typeof targetIndex === "number" &&
    targetIndex > location.index
  ) {
    nextIndex = targetIndex - 1;
  }

  if (
    location.containerId === targetContainerId &&
    (typeof nextIndex !== "number" || nextIndex === location.index)
  ) {
    return items;
  }

  return insertDocumentTemplateItem(
    withoutItem,
    location.item,
    targetContainerId,
    nextIndex
  );
}

export function updateDocumentTemplateSectionTitle(
  items: DocumentTemplateRootItem[],
  sectionId: string,
  sectionTitle: string
): DocumentTemplateRootItem[] {
  return items.map((item) =>
    item.kind === "Section" && item.id === sectionId
      ? { ...item, sectionTitle }
      : item
  );
}

export function updateDocumentTemplateStaticTextBody(
  items: DocumentTemplateRootItem[],
  itemId: string,
  staticTextBody: string
): DocumentTemplateRootItem[] {
  return items.map((item) => {
    if (item.kind === "StaticText" && item.id === itemId) {
      return { ...item, staticTextBody };
    }

    if (item.kind !== "Section") {
      return item;
    }

    return {
      ...item,
      items: item.items.map((child) =>
        child.kind === "StaticText" && child.id === itemId
          ? { ...child, staticTextBody }
          : child
      ),
    };
  });
}

export function validateDocumentTemplateItems(
  items: DocumentTemplateRootItem[]
): DocumentTemplateValidationIssue[] {
  const issues: DocumentTemplateValidationIssue[] = [];

  items.forEach((item) => {
    if (item.kind === "Section") {
      if (!item.sectionTitle.trim()) {
        issues.push({ itemId: item.id, field: "sectionTitle" });
      }

      if (!item.items.length) {
        issues.push({ itemId: item.id, field: "sectionItems" });
      }

      item.items.forEach((child) => {
        if (
          child.kind === "StaticText" &&
          isRichTextHtmlEmpty(child.staticTextBody)
        ) {
          issues.push({ itemId: child.id, field: "staticTextBody" });
        }
      });

      return;
    }

    if (
      item.kind === "StaticText" &&
      isRichTextHtmlEmpty(item.staticTextBody)
    ) {
      issues.push({ itemId: item.id, field: "staticTextBody" });
    }
  });

  return issues;
}

function serializeItem(
  item: DocumentTemplateRootItem | DocumentTemplateSectionChildItem,
  documentId: string,
  version: number,
  sortOrder: number
): DocumentTemplateSerializableItem {
  if (item.kind === "Section") {
    return {
      id: item.id,
      kind: "Section",
      sortOrder,
      documentId,
      version: item.version || version,
      sectionTitle: item.sectionTitle,
      items: item.items.map((child, index) =>
        serializeItem(child, documentId, version, index + 1)
      ),
    };
  }

  if (item.kind === "Content") {
    return {
      id: item.id,
      kind: "Content",
      sortOrder,
      documentId,
      version: item.version || version,
      ...(item.source === "GLOBAL"
        ? { contentBlockId: item.contentBlockId }
        : {
            supplierContentType: normalizeSupplierContentTypeForApi(
              item.supplierContentType
            ),
          }),
    };
  }

  if (item.kind === "StaticText") {
    return {
      id: item.id,
      kind: "StaticText",
      sortOrder,
      documentId,
      version: item.version || version,
      staticTextBody: item.staticTextBody,
    };
  }

  return {
    id: item.id,
    kind: "PageDivider",
    sortOrder,
    documentId,
    version: item.version || version,
  };
}

export function serializeDocumentTemplateItems(
  items: DocumentTemplateRootItem[],
  documentId: string,
  version: number
) {
  return items.map((item, index) =>
    serializeItem(item, documentId, version, index + 1)
  );
}

export function toDocumentTemplateUpdatePayload(
  template: Pick<DocumentTemplateDetail, "id" | "title" | "version" | "items">
): UpdateDocumentTemplatePayload {
  return {
    id: template.id,
    title: template.title,
    version: template.version,
    items: resequenceDocumentTemplateItems(template.items),
  };
}

export function getDocumentTemplateComparisonSnapshot(
  template: Pick<DocumentTemplateDetail, "id" | "title" | "version" | "items">
): string {
  return JSON.stringify({
    id: template.id,
    title: template.title,
    version: template.version,
    items: serializeDocumentTemplateItems(
      resequenceDocumentTemplateItems(template.items),
      template.id,
      template.version
    ),
  });
}

export function deriveDocumentTemplateBlockLabels(
  items: DocumentTemplateRootItem[],
  contentBlocksById: Record<string, Pick<ContentBlockListItem, "title">>,
  options?: {
    staticTextLabel?: string;
  }
): string[] {
  const labels: string[] = [];
  const staticTextLabel = options?.staticTextLabel ?? "Static text";

  const pushLabel = (label: string | undefined) => {
    const next = label?.trim();
    if (next && !labels.includes(next)) {
      labels.push(next);
    }
  };

  items.forEach((item) => {
    if (item.kind === "Section") {
      item.items.forEach((child) => {
        if (child.kind === "Content") {
          pushLabel(
            child.source === "GLOBAL"
              ? contentBlocksById[child.contentBlockId]?.title
              : child.supplierContentType
          );
        }
        if (child.kind === "StaticText") {
          pushLabel(staticTextLabel);
        }
      });
      return;
    }

    if (item.kind === "Content") {
      pushLabel(
        item.source === "GLOBAL"
          ? contentBlocksById[item.contentBlockId]?.title
          : item.supplierContentType
      );
    }

    if (item.kind === "StaticText") {
      pushLabel(staticTextLabel);
    }
  });

  return labels;
}

export function getDocumentTemplateItemLabel(
  item: DocumentTemplateContentItem | DocumentTemplateStaticTextItem,
  contentBlocksById: Record<string, Pick<ContentBlockListItem, "title">>,
  options?: {
    staticTextLabel?: string;
  }
): string {
  if (item.kind === "StaticText") {
    return options?.staticTextLabel ?? "Static text";
  }

  return item.source === "GLOBAL"
    ? (contentBlocksById[item.contentBlockId]?.title ?? item.contentBlockId)
    : item.supplierContentType;
}

export function getDocumentTemplateItemPreview(
  item: DocumentTemplateContentItem | DocumentTemplateStaticTextItem,
  contentBlocksById: Record<
    string,
    Pick<ContentBlockListItem, "body" | "title">
  >
): string {
  if (item.kind === "StaticText") {
    return stripHtmlToPlainText(item.staticTextBody);
  }

  if (item.source === "SUPPLIER") {
    return item.supplierContentType;
  }

  return stripHtmlToPlainText(
    contentBlocksById[item.contentBlockId]?.body ??
      contentBlocksById[item.contentBlockId]?.title ??
      ""
  );
}
