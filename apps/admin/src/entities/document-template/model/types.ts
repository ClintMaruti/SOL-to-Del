export const DOCUMENT_TEMPLATE_ITEM_KINDS = [
  "Section",
  "Content",
  "StaticText",
  "PageDivider",
] as const;

export const SUPPLIER_CONTENT_TYPES = [
  "About",
  "Terms & Conditions",
  "Overview",
  "Service Notes",
  "Activities",
] as const;

export const SUPPLIER_CONTENT_TYPE_API_VALUES = [
  "About",
  "TermsAndConditions",
  "Overview",
  "ServiceNotes",
  "Activities",
] as const;

export type DocumentTemplateItemKind =
  (typeof DOCUMENT_TEMPLATE_ITEM_KINDS)[number];

export type SupplierContentType = (typeof SUPPLIER_CONTENT_TYPES)[number];
export type SupplierContentTypeApi =
  (typeof SUPPLIER_CONTENT_TYPE_API_VALUES)[number];

const SUPPLIER_CONTENT_TYPE_LABEL_TO_API: Record<
  SupplierContentType,
  SupplierContentTypeApi
> = {
  About: "About",
  "Terms & Conditions": "TermsAndConditions",
  Overview: "Overview",
  "Service Notes": "ServiceNotes",
  Activities: "Activities",
};

const SUPPLIER_CONTENT_TYPE_API_TO_LABEL: Record<
  SupplierContentTypeApi,
  SupplierContentType
> = {
  About: "About",
  TermsAndConditions: "Terms & Conditions",
  Overview: "Overview",
  ServiceNotes: "Service Notes",
  Activities: "Activities",
};

export function normalizeSupplierContentTypeForApi(value: string): string {
  if (value in SUPPLIER_CONTENT_TYPE_LABEL_TO_API) {
    return SUPPLIER_CONTENT_TYPE_LABEL_TO_API[value as SupplierContentType];
  }

  return value;
}

export function normalizeSupplierContentTypeFromApi(value: string): string {
  if (value in SUPPLIER_CONTENT_TYPE_API_TO_LABEL) {
    return SUPPLIER_CONTENT_TYPE_API_TO_LABEL[value as SupplierContentTypeApi];
  }

  return value;
}

export type DocumentTemplateListItemApi = {
  id: string;
  title: string;
  blocks: string[];
};

export type DocumentTemplateListItem = {
  id: string;
  title: string;
  blocks: string[];
};

export type DocumentTemplateBaseItemApi = {
  id: string;
  kind: DocumentTemplateItemKind;
  sortOrder: number;
  documentId: string;
  version?: number;
};

export type DocumentTemplateContentItemApi = DocumentTemplateBaseItemApi & {
  kind: "Content";
  contentBlockId?: string | null;
  supplierContentType?: string | null;
};

export type DocumentTemplateStaticTextItemApi = DocumentTemplateBaseItemApi & {
  kind: "StaticText";
  staticTextBody?: string | null;
};

export type DocumentTemplatePageDividerItemApi = DocumentTemplateBaseItemApi & {
  kind: "PageDivider";
};

export type DocumentTemplateSectionItemApi = DocumentTemplateBaseItemApi & {
  kind: "Section";
  sectionTitle?: string | null;
  items?: DocumentTemplateSectionChildItemApi[];
};

export type DocumentTemplateSectionChildItemApi =
  | DocumentTemplateContentItemApi
  | DocumentTemplateStaticTextItemApi
  | DocumentTemplatePageDividerItemApi;

export type DocumentTemplateRootItemApi =
  | DocumentTemplateSectionItemApi
  | DocumentTemplateSectionChildItemApi;

export type DocumentTemplateDetailApi = {
  id: string;
  title: string;
  version: number;
  items?: DocumentTemplateRootItemApi[];
};

export type DocumentTemplateBaseItem = {
  id: string;
  kind: DocumentTemplateItemKind;
  sortOrder: number;
  documentId: string;
  version: number;
};

export type DocumentTemplateGlobalContentItem = DocumentTemplateBaseItem & {
  kind: "Content";
  source: "GLOBAL";
  contentBlockId: string;
};

export type DocumentTemplateSupplierContentItem = DocumentTemplateBaseItem & {
  kind: "Content";
  source: "SUPPLIER";
  supplierContentType: string;
};

export type DocumentTemplateContentItem =
  | DocumentTemplateGlobalContentItem
  | DocumentTemplateSupplierContentItem;

export type DocumentTemplateStaticTextItem = DocumentTemplateBaseItem & {
  kind: "StaticText";
  staticTextBody: string;
};

export type DocumentTemplatePageDividerItem = DocumentTemplateBaseItem & {
  kind: "PageDivider";
};

export type DocumentTemplateSectionChildItem =
  | DocumentTemplateContentItem
  | DocumentTemplateStaticTextItem
  | DocumentTemplatePageDividerItem;

export type DocumentTemplateSectionItem = DocumentTemplateBaseItem & {
  kind: "Section";
  sectionTitle: string;
  items: DocumentTemplateSectionChildItem[];
};

export type DocumentTemplateRootItem =
  | DocumentTemplateSectionItem
  | DocumentTemplateSectionChildItem;

export type DocumentTemplateDetail = {
  id: string;
  title: string;
  version: number;
  items: DocumentTemplateRootItem[];
};

export type UpdateDocumentTemplatePayload = {
  id: string;
  title: string;
  version: number;
  items: DocumentTemplateRootItem[];
};
