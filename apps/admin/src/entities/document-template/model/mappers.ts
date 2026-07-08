import type {
  DocumentTemplateContentItem,
  DocumentTemplateContentItemApi,
  DocumentTemplateDetail,
  DocumentTemplateDetailApi,
  DocumentTemplateListItem,
  DocumentTemplateListItemApi,
  DocumentTemplateRootItem,
  DocumentTemplateRootItemApi,
  DocumentTemplateSectionChildItem,
  DocumentTemplateSectionChildItemApi,
  DocumentTemplateSectionItemApi,
  DocumentTemplateStaticTextItemApi,
  SupplierContentType,
} from "./types";

import {
  normalizeSupplierContentTypeFromApi,
  SUPPLIER_CONTENT_TYPES,
} from "./types";

export function isSupplierContentType(
  value: string | undefined
): value is SupplierContentType {
  return Boolean(value && SUPPLIER_CONTENT_TYPES.includes(value as never));
}

export function mapDocumentTemplateListItemFromApi(
  item: DocumentTemplateListItemApi
): DocumentTemplateListItem {
  return {
    id: item.id,
    title: item.title,
    blocks: Array.isArray(item.blocks) ? item.blocks : [],
  };
}

function sortItems<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => left.sortOrder - right.sortOrder);
}

function mapContentItemFromApi(
  item: DocumentTemplateContentItemApi
): DocumentTemplateContentItem | null {
  if (typeof item.contentBlockId === "string" && item.contentBlockId.trim()) {
    return {
      id: item.id,
      kind: "Content",
      sortOrder: item.sortOrder,
      documentId: item.documentId,
      version: item.version ?? 0,
      source: "GLOBAL",
      contentBlockId: item.contentBlockId,
    };
  }

  if (
    typeof item.supplierContentType === "string" &&
    item.supplierContentType.trim()
  ) {
    return {
      id: item.id,
      kind: "Content",
      sortOrder: item.sortOrder,
      documentId: item.documentId,
      version: item.version ?? 0,
      source: "SUPPLIER",
      supplierContentType: normalizeSupplierContentTypeFromApi(
        item.supplierContentType
      ),
    };
  }

  return null;
}

function mapSectionChildItemFromApi(
  item: DocumentTemplateSectionChildItemApi
): DocumentTemplateSectionChildItem | null {
  if (item.kind === "Content") {
    return mapContentItemFromApi(item);
  }

  if (item.kind === "StaticText") {
    const staticTextItem = item as DocumentTemplateStaticTextItemApi;

    return {
      id: item.id,
      kind: "StaticText",
      sortOrder: item.sortOrder,
      documentId: item.documentId,
      version: item.version ?? 0,
      staticTextBody: staticTextItem.staticTextBody ?? "",
    };
  }

  if (item.kind !== "PageDivider") {
    return null;
  }

  return {
    id: item.id,
    kind: "PageDivider",
    sortOrder: item.sortOrder,
    documentId: item.documentId,
    version: item.version ?? 0,
  };
}

function mapRootItemFromApi(
  item: DocumentTemplateRootItemApi
): DocumentTemplateRootItem | null {
  if (item.kind === "Section") {
    const sectionItem = item as DocumentTemplateSectionItemApi;

    return {
      id: item.id,
      kind: "Section",
      sortOrder: item.sortOrder,
      documentId: item.documentId,
      version: item.version ?? 0,
      sectionTitle: sectionItem.sectionTitle ?? "",
      items: sortItems(sectionItem.items ?? [])
        .map(mapSectionChildItemFromApi)
        .filter((child): child is DocumentTemplateSectionChildItem =>
          Boolean(child)
        ),
    };
  }

  return mapSectionChildItemFromApi(item);
}

export function mapDocumentTemplateDetailFromApi(
  item: DocumentTemplateDetailApi
): DocumentTemplateDetail {
  return {
    id: item.id,
    title: item.title,
    version: item.version,
    items: sortItems(item.items ?? [])
      .map(mapRootItemFromApi)
      .filter((child): child is DocumentTemplateRootItem => Boolean(child)),
  };
}
