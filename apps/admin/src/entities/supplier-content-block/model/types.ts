/** List row from GET /catalog/suppliers/:supplierId/content-blocks */
export interface SupplierContentBlockListItemApi {
  id: string;
  /** Display title (preferred). */
  title?: string;
  /** Backend may expose section label as contentType (e.g. About). */
  contentType?: string;
  /** Preview HTML or plain text snippet. */
  bodyPreview?: string;
  /** Some APIs return truncated `body` for list. */
  body?: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SupplierContentBlockListItem {
  id: string;
  title: string;
  bodyPreview: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
}

/** Detail from GET /catalog/suppliers/:supplierId/content-blocks/:id */
export interface SupplierContentBlockDetailApi {
  id?: string;
  title?: string;
  contentType?: string;
  /** Primary rich-text payload (HTML). */
  body?: string;
  /** Some backends expose HTML under a different key. */
  html?: string;
  /** Alternate keys seen from APIs / serializers. */
  content?: string;
  contentHtml?: string;
  bodyHtml?: string;
  description?: string;
  text?: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SupplierContentBlockDetail {
  id: string;
  title: string;
  body: string;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UpdateSupplierContentBlockPayload {
  /** Target id in PUT /catalog/supplier-content-blocks/:id */
  contentBlockId: string;
  body: string;
  version: number;
}

export function mapListItemFromApi(
  row: SupplierContentBlockListItemApi
): SupplierContentBlockListItem {
  const title = (row.title ?? row.contentType ?? "").trim();
  const previewSource = row.bodyPreview ?? row.body ?? "";
  return {
    id: row.id,
    title,
    bodyPreview: previewSource,
    version: row.version,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}

/** Prefer first non-empty string from known payload keys (camelCase + PascalCase). */
export function extractDetailBody(row: SupplierContentBlockDetailApi): string {
  const r = row as SupplierContentBlockDetailApi & Record<string, unknown>;
  const candidates: unknown[] = [
    row.body,
    row.html,
    row.content,
    row.contentHtml,
    row.bodyHtml,
    row.description,
    row.text,
    r.Body,
    r.Html,
    r.Content,
    r.ContentHtml,
    r.BodyHtml,
    r.Description,
    r.Text,
  ];

  for (const c of candidates) {
    if (typeof c !== "string") {
      continue;
    }
    if (c.trim() !== "") {
      return c;
    }
  }

  return "";
}

export function mapDetailFromApi(
  row: SupplierContentBlockDetailApi
): SupplierContentBlockDetail {
  const title = (row.title ?? row.contentType ?? "").trim();
  const id = typeof row.id === "string" && row.id.trim() !== "" ? row.id : "";

  return {
    id,
    title,
    body: extractDetailBody(row),
    version: row.version,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}
