import { http, HttpResponse } from "msw";

import { getContentBlocksMockData } from "./content-blocks";

type MockTemplateBaseItem = {
  id: string;
  kind: "Section" | "Content" | "StaticText" | "PageDivider";
  sortOrder: number;
  documentId: string;
  version: number;
};

type MockTemplateContentItem = MockTemplateBaseItem & {
  kind: "Content";
  contentBlockId?: string;
  supplierContentType?: string;
};

type MockTemplateStaticTextItem = MockTemplateBaseItem & {
  kind: "StaticText";
  staticTextBody: string;
};

type MockTemplatePageDividerItem = MockTemplateBaseItem & {
  kind: "PageDivider";
};

type MockTemplateSectionItem = MockTemplateBaseItem & {
  kind: "Section";
  sectionTitle: string;
  items: MockTemplateSectionChildItem[];
};

type MockTemplateSectionChildItem =
  | MockTemplateContentItem
  | MockTemplateStaticTextItem
  | MockTemplatePageDividerItem;

type MockTemplateRootItem =
  | MockTemplateSectionItem
  | MockTemplateSectionChildItem;

export type MockDocumentTemplate = {
  id: string;
  title: string;
  version: number;
  items: MockTemplateRootItem[];
};

function createDefaultDocumentTemplates(): MockDocumentTemplate[] {
  return [
    {
      id: "template-quote",
      title: "Quote",
      version: 7,
      items: [
        {
          id: "template-quote-section-1",
          kind: "Section",
          sortOrder: 1,
          documentId: "template-quote",
          sectionTitle: "General information",
          version: 7,
          items: [
            {
              id: "template-quote-content-global",
              kind: "Content",
              sortOrder: 1,
              documentId: "template-quote",
              contentBlockId: "cb-2",
              version: 7,
            },
            {
              id: "template-quote-content-supplier",
              kind: "Content",
              sortOrder: 2,
              documentId: "template-quote",
              supplierContentType: "About",
              version: 7,
            },
          ],
        },
        {
          id: "template-quote-divider-1",
          kind: "PageDivider",
          sortOrder: 2,
          documentId: "template-quote",
          version: 7,
        },
        {
          id: "template-quote-static-text",
          kind: "StaticText",
          sortOrder: 3,
          documentId: "template-quote",
          staticTextBody:
            "<p>Please note that all pricing is subject to final confirmation.</p>",
          version: 7,
        },
      ],
    },
    {
      id: "template-voucher",
      title: "Voucher",
      version: 3,
      items: [],
    },
  ];
}

let mockDocumentTemplates: MockDocumentTemplate[] =
  createDefaultDocumentTemplates();

export function setDocumentTemplatesMockData(
  templates: MockDocumentTemplate[]
): void {
  mockDocumentTemplates = [...templates];
}

export function resetDocumentTemplatesMockState(): void {
  mockDocumentTemplates = createDefaultDocumentTemplates();
}

function cloneItems(items: MockTemplateRootItem[]): MockTemplateRootItem[] {
  return items.map((item) => {
    if (item.kind === "Section") {
      return {
        ...item,
        items: item.items.map((child) => ({ ...child })),
      };
    }

    return { ...item };
  });
}

function resequenceItems(
  items: MockTemplateRootItem[],
  documentId: string,
  version: number
): MockTemplateRootItem[] {
  return items.map((item, index) => {
    if (item.kind === "Section") {
      return {
        ...item,
        sortOrder: index + 1,
        documentId,
        version,
        items: item.items.map((child, childIndex) => ({
          ...child,
          sortOrder: childIndex + 1,
          documentId,
          version,
        })),
      };
    }

    return {
      ...item,
      sortOrder: index + 1,
      documentId,
      version,
    };
  });
}

function deriveTemplateBlockLabels(items: MockTemplateRootItem[]): string[] {
  const contentBlocksById = Object.fromEntries(
    getContentBlocksMockData().map((block) => [block.id, block.title])
  ) as Record<string, string>;
  const labels: string[] = [];

  const addLabel = (label: string | undefined) => {
    if (label && !labels.includes(label)) {
      labels.push(label);
    }
  };

  items.forEach((item) => {
    if (item.kind === "Section") {
      item.items.forEach((child) => {
        if (child.kind === "Content") {
          addLabel(
            child.contentBlockId
              ? contentBlocksById[child.contentBlockId]
              : child.supplierContentType
          );
        }
        if (child.kind === "StaticText") {
          addLabel("Static text");
        }
      });
      return;
    }

    if (item.kind === "Content") {
      addLabel(
        item.contentBlockId
          ? contentBlocksById[item.contentBlockId]
          : item.supplierContentType
      );
    }

    if (item.kind === "StaticText") {
      addLabel("Static text");
    }
  });

  return labels;
}

function toListDto(template: MockDocumentTemplate) {
  return {
    id: template.id,
    title: template.title,
    blocks: deriveTemplateBlockLabels(template.items),
  };
}

export function documentTemplatesRoutes(baseUrl: string) {
  const listPattern = `${baseUrl}/catalog/document-templates`;
  const itemPattern = `${baseUrl}/catalog/document-templates/:id`;

  return [
    http.get(listPattern, () => {
      return HttpResponse.json(
        {
          success: true,
          data: mockDocumentTemplates.map(toListDto),
          error: null,
        },
        { status: 200 }
      );
    }),
    http.get(itemPattern, ({ params }) => {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      const template = mockDocumentTemplates.find((item) => item.id === id);

      if (!template) {
        return HttpResponse.json(
          { success: false, data: null, error: "Not found" },
          { status: 404 }
        );
      }

      return HttpResponse.json(
        {
          success: true,
          data: {
            ...template,
            items: cloneItems(template.items),
          },
          error: null,
        },
        { status: 200 }
      );
    }),
    http.put(itemPattern, async ({ params, request }) => {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      const payload = (await request.json()) as {
        title?: string;
        version?: number;
        items?: MockTemplateRootItem[];
      };
      const index = mockDocumentTemplates.findIndex((item) => item.id === id);

      if (index === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: "Not found" },
          { status: 404 }
        );
      }

      const existing = mockDocumentTemplates[index];
      if (!existing) {
        return HttpResponse.json(
          { success: false, data: null, error: "Not found" },
          { status: 404 }
        );
      }

      const nextVersion = Math.max(existing.version, payload.version ?? 0) + 1;
      const updated: MockDocumentTemplate = {
        ...existing,
        title: payload.title ?? existing.title,
        version: nextVersion,
        items: resequenceItems(payload.items ?? [], existing.id, nextVersion),
      };

      mockDocumentTemplates = [
        ...mockDocumentTemplates.slice(0, index),
        updated,
        ...mockDocumentTemplates.slice(index + 1),
      ];

      return HttpResponse.json(
        {
          success: true,
          data: {
            ...updated,
            items: cloneItems(updated.items),
          },
          error: null,
        },
        { status: 200 }
      );
    }),
  ];
}
