/** Raw list row from GET /catalog/content-blocks */
export type ContentBlockListItemApi = {
  id: string;
  title: string;
  body: string;
  templates: string[];
  version: number;
};

/** Normalized list row for UI */
export type ContentBlockListItem = {
  id: string;
  title: string;
  body: string;
  applicableDocumentTypes: string[];
  version: number;
};

export type ContentBlockDetail = {
  id: string;
  title: string;
  body: string;
  version: number;
};

export type CreateContentBlockPayload = {
  title: string;
  body: string;
};

export type UpdateContentBlockPayload = {
  id: string;
  title: string;
  body: string;
  version: number;
};

export function mapListItemFromApi(
  item: ContentBlockListItemApi
): ContentBlockListItem {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    version: item.version,
    applicableDocumentTypes: Array.isArray(item.templates)
      ? item.templates
      : [],
  };
}
