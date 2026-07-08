import { describe, expect, it } from "vitest";

import type { ContentBlockListItem } from "@/entities/content-block";

import {
  deriveDocumentTemplateBlockLabels,
  moveDocumentTemplateItem,
  validateDocumentTemplateItems,
} from "../index";
import { serializeDocumentTemplateItems } from "../model/builder";
import {
  mapDocumentTemplateDetailFromApi,
  mapDocumentTemplateListItemFromApi,
} from "../model/mappers";
import type {
  DocumentTemplateDetailApi,
  DocumentTemplateRootItem,
} from "../model/types";

function createContentBlockMap(
  blocks: Array<Pick<ContentBlockListItem, "id" | "title" | "body">>
) {
  return Object.fromEntries(
    blocks.map((block) => [block.id, { title: block.title, body: block.body }])
  );
}

describe("document-template model", () => {
  it("maps list rows and guards invalid blocks arrays", () => {
    expect(
      mapDocumentTemplateListItemFromApi({
        id: "tpl-1",
        title: "Quote",
        blocks: ["Global"],
      })
    ).toEqual({
      id: "tpl-1",
      title: "Quote",
      blocks: ["Global"],
    });

    expect(
      mapDocumentTemplateListItemFromApi({
        id: "tpl-2",
        title: "Voucher",
        blocks: undefined as unknown as string[],
      })
    ).toEqual({
      id: "tpl-2",
      title: "Voucher",
      blocks: [],
    });
  });

  it("sorts detail items and preserves supplier placeholder content", () => {
    const apiTemplate: DocumentTemplateDetailApi = {
      id: "tpl-1",
      title: "Quote",
      version: 4,
      items: [
        {
          id: "child-2",
          kind: "StaticText",
          sortOrder: 2,
          documentId: "tpl-1",
          staticTextBody: "<p>Extra</p>",
          version: 4,
        },
        {
          id: "section-1",
          kind: "Section",
          sortOrder: 1,
          documentId: "tpl-1",
          sectionTitle: "General",
          version: 4,
          items: [
            {
              id: "supplier-1",
              kind: "Content",
              sortOrder: 2,
              documentId: "tpl-1",
              supplierContentType: "About",
              version: 4,
            },
            {
              id: "global-1",
              kind: "Content",
              sortOrder: 1,
              documentId: "tpl-1",
              contentBlockId: "cb-1",
              version: 4,
            },
          ],
        },
      ],
    };

    expect(mapDocumentTemplateDetailFromApi(apiTemplate)).toEqual({
      id: "tpl-1",
      title: "Quote",
      version: 4,
      items: [
        {
          id: "section-1",
          kind: "Section",
          sortOrder: 1,
          documentId: "tpl-1",
          sectionTitle: "General",
          version: 4,
          items: [
            {
              id: "global-1",
              kind: "Content",
              sortOrder: 1,
              documentId: "tpl-1",
              version: 4,
              source: "GLOBAL",
              contentBlockId: "cb-1",
            },
            {
              id: "supplier-1",
              kind: "Content",
              sortOrder: 2,
              documentId: "tpl-1",
              version: 4,
              source: "SUPPLIER",
              supplierContentType: "About",
            },
          ],
        },
        {
          id: "child-2",
          kind: "StaticText",
          sortOrder: 2,
          documentId: "tpl-1",
          version: 4,
          staticTextBody: "<p>Extra</p>",
        },
      ],
    });
  });

  it("preserves unknown supplier placeholder values from the api", () => {
    const apiTemplate: DocumentTemplateDetailApi = {
      id: "tpl-1",
      title: "Quote",
      version: 4,
      items: [
        {
          id: "supplier-1",
          kind: "Content",
          sortOrder: 1,
          documentId: "tpl-1",
          supplierContentType: "Contacts",
          version: 4,
        },
      ],
    };

    expect(mapDocumentTemplateDetailFromApi(apiTemplate)).toEqual({
      id: "tpl-1",
      title: "Quote",
      version: 4,
      items: [
        {
          id: "supplier-1",
          kind: "Content",
          sortOrder: 1,
          documentId: "tpl-1",
          version: 4,
          source: "SUPPLIER",
          supplierContentType: "Contacts",
        },
      ],
    });
  });

  it("maps normalized backend supplier content values to readable labels", () => {
    const apiTemplate: DocumentTemplateDetailApi = {
      id: "tpl-1",
      title: "Quote",
      version: 4,
      items: [
        {
          id: "supplier-1",
          kind: "Content",
          sortOrder: 1,
          documentId: "tpl-1",
          supplierContentType: "TermsAndConditions",
          version: 4,
        },
        {
          id: "supplier-2",
          kind: "Content",
          sortOrder: 2,
          documentId: "tpl-1",
          supplierContentType: "ServiceNotes",
          version: 4,
        },
      ],
    };

    expect(mapDocumentTemplateDetailFromApi(apiTemplate)).toEqual({
      id: "tpl-1",
      title: "Quote",
      version: 4,
      items: [
        {
          id: "supplier-1",
          kind: "Content",
          sortOrder: 1,
          documentId: "tpl-1",
          version: 4,
          source: "SUPPLIER",
          supplierContentType: "Terms & Conditions",
        },
        {
          id: "supplier-2",
          kind: "Content",
          sortOrder: 2,
          documentId: "tpl-1",
          version: 4,
          source: "SUPPLIER",
          supplierContentType: "Service Notes",
        },
      ],
    });
  });

  it("maps pascal-case api item kinds directly", () => {
    const apiTemplate: DocumentTemplateDetailApi = {
      id: "a3f8c2e1-4b9d-4e7a-b6f1-8c2d5e9a1f3b",
      title: "Quote",
      version: 1501,
      items: [
        {
          id: "section-1",
          documentId: "a3f8c2e1-4b9d-4e7a-b6f1-8c2d5e9a1f3b",
          contentBlockId: null,
          kind: "Section",
          sortOrder: 1,
          sectionTitle: "General Section",
          staticTextBody: null,
          supplierContentType: null,
          items: [
            {
              id: "content-1",
              documentId: "a3f8c2e1-4b9d-4e7a-b6f1-8c2d5e9a1f3b",
              contentBlockId: "019dd480-cc0d-7fa8-b48a-35691d2e9333",
              kind: "Content",
              sortOrder: 1,
              sectionTitle: null,
              staticTextBody: null,
              supplierContentType: null,
              items: [],
            },
          ],
        },
      ],
    } as unknown as DocumentTemplateDetailApi;

    expect(mapDocumentTemplateDetailFromApi(apiTemplate)).toEqual({
      id: "a3f8c2e1-4b9d-4e7a-b6f1-8c2d5e9a1f3b",
      title: "Quote",
      version: 1501,
      items: [
        {
          id: "section-1",
          kind: "Section",
          sortOrder: 1,
          documentId: "a3f8c2e1-4b9d-4e7a-b6f1-8c2d5e9a1f3b",
          version: 0,
          sectionTitle: "General Section",
          items: [
            {
              id: "content-1",
              kind: "Content",
              sortOrder: 1,
              documentId: "a3f8c2e1-4b9d-4e7a-b6f1-8c2d5e9a1f3b",
              version: 0,
              source: "GLOBAL",
              contentBlockId: "019dd480-cc0d-7fa8-b48a-35691d2e9333",
            },
          ],
        },
      ],
    });
  });

  it("serializes nested items with recomputed sort orders", () => {
    const items: DocumentTemplateRootItem[] = [
      {
        id: "section-1",
        kind: "Section",
        sortOrder: 99,
        documentId: "tpl-1",
        version: 2,
        sectionTitle: "General",
        items: [
          {
            id: "static-1",
            kind: "StaticText",
            sortOrder: 7,
            documentId: "tpl-1",
            version: 2,
            staticTextBody: "<p>Hello</p>",
          },
        ],
      },
      {
        id: "divider-1",
        kind: "PageDivider",
        sortOrder: 42,
        documentId: "tpl-1",
        version: 2,
      },
    ];

    expect(serializeDocumentTemplateItems(items, "tpl-1", 2)).toEqual([
      {
        id: "section-1",
        kind: "Section",
        sortOrder: 1,
        documentId: "tpl-1",
        version: 2,
        sectionTitle: "General",
        items: [
          {
            id: "static-1",
            kind: "StaticText",
            sortOrder: 1,
            documentId: "tpl-1",
            version: 2,
            staticTextBody: "<p>Hello</p>",
          },
        ],
      },
      {
        id: "divider-1",
        kind: "PageDivider",
        sortOrder: 2,
        documentId: "tpl-1",
        version: 2,
      },
    ]);
  });

  it("normalizes supplier placeholder labels before sending them to the api", () => {
    const items: DocumentTemplateRootItem[] = [
      {
        id: "supplier-terms",
        kind: "Content",
        sortOrder: 1,
        documentId: "tpl-1",
        version: 2,
        source: "SUPPLIER",
        supplierContentType: "Terms & Conditions",
      },
      {
        id: "supplier-notes",
        kind: "Content",
        sortOrder: 2,
        documentId: "tpl-1",
        version: 2,
        source: "SUPPLIER",
        supplierContentType: "Service Notes",
      },
      {
        id: "supplier-overview",
        kind: "Content",
        sortOrder: 3,
        documentId: "tpl-1",
        version: 2,
        source: "SUPPLIER",
        supplierContentType: "Overview",
      },
    ];

    expect(serializeDocumentTemplateItems(items, "tpl-1", 2)).toEqual([
      {
        id: "supplier-terms",
        kind: "Content",
        sortOrder: 1,
        documentId: "tpl-1",
        version: 2,
        supplierContentType: "TermsAndConditions",
      },
      {
        id: "supplier-notes",
        kind: "Content",
        sortOrder: 2,
        documentId: "tpl-1",
        version: 2,
        supplierContentType: "ServiceNotes",
      },
      {
        id: "supplier-overview",
        kind: "Content",
        sortOrder: 3,
        documentId: "tpl-1",
        version: 2,
        supplierContentType: "Overview",
      },
    ]);
  });

  it("validates empty section titles, empty sections, and empty static text", () => {
    const issues = validateDocumentTemplateItems([
      {
        id: "section-1",
        kind: "Section",
        sortOrder: 1,
        documentId: "tpl-1",
        version: 1,
        sectionTitle: "",
        items: [],
      },
      {
        id: "static-1",
        kind: "StaticText",
        sortOrder: 2,
        documentId: "tpl-1",
        version: 1,
        staticTextBody: "<p></p>",
      },
    ]);

    expect(issues).toEqual([
      { itemId: "section-1", field: "sectionTitle" },
      { itemId: "section-1", field: "sectionItems" },
      { itemId: "static-1", field: "staticTextBody" },
    ]);
  });

  it("derives visible block labels without structural items and deduplicates them", () => {
    const labels = deriveDocumentTemplateBlockLabels(
      [
        {
          id: "section-1",
          kind: "Section",
          sortOrder: 1,
          documentId: "tpl-1",
          version: 1,
          sectionTitle: "General",
          items: [
            {
              id: "global-1",
              kind: "Content",
              sortOrder: 1,
              documentId: "tpl-1",
              version: 1,
              source: "GLOBAL",
              contentBlockId: "cb-1",
            },
            {
              id: "supplier-1",
              kind: "Content",
              sortOrder: 2,
              documentId: "tpl-1",
              version: 1,
              source: "SUPPLIER",
              supplierContentType: "About",
            },
            {
              id: "static-1",
              kind: "StaticText",
              sortOrder: 3,
              documentId: "tpl-1",
              version: 1,
              staticTextBody: "<p>Hello</p>",
            },
          ],
        },
        {
          id: "global-2",
          kind: "Content",
          sortOrder: 2,
          documentId: "tpl-1",
          version: 1,
          source: "GLOBAL",
          contentBlockId: "cb-1",
        },
      ],
      createContentBlockMap([
        { id: "cb-1", title: "Global", body: "<p>Global body</p>" },
      ])
    );

    expect(labels).toEqual(["Global", "About", "Static text"]);
  });

  it("moves root items into a section and preserves root sections at the top level", () => {
    const movedToSection = moveDocumentTemplateItem(
      [
        {
          id: "section-1",
          kind: "Section",
          sortOrder: 1,
          documentId: "tpl-1",
          version: 1,
          sectionTitle: "General",
          items: [],
        },
        {
          id: "static-1",
          kind: "StaticText",
          sortOrder: 2,
          documentId: "tpl-1",
          version: 1,
          staticTextBody: "<p>Hello</p>",
        },
      ],
      "static-1",
      "section:section-1",
      0
    );

    expect(movedToSection).toEqual([
      {
        id: "section-1",
        kind: "Section",
        sortOrder: 1,
        documentId: "tpl-1",
        version: 1,
        sectionTitle: "General",
        items: [
          {
            id: "static-1",
            kind: "StaticText",
            sortOrder: 1,
            documentId: "tpl-1",
            version: 1,
            staticTextBody: "<p>Hello</p>",
          },
        ],
      },
    ]);

    const blockedNestedSection = moveDocumentTemplateItem(
      [
        {
          id: "section-1",
          kind: "Section",
          sortOrder: 1,
          documentId: "tpl-1",
          version: 1,
          sectionTitle: "General",
          items: [],
        },
        {
          id: "section-2",
          kind: "Section",
          sortOrder: 2,
          documentId: "tpl-1",
          version: 1,
          sectionTitle: "Other",
          items: [],
        },
      ],
      "section-2",
      "section:section-1",
      0
    );

    expect(blockedNestedSection).toEqual([
      expect.objectContaining({ id: "section-1", sortOrder: 1 }),
      expect.objectContaining({ id: "section-2", sortOrder: 2 }),
    ]);
  });

  it("returns the same tree reference for same-slot moves", () => {
    const items: DocumentTemplateRootItem[] = [
      {
        id: "global-1",
        kind: "Content",
        sortOrder: 1,
        documentId: "tpl-1",
        version: 1,
        source: "GLOBAL",
        contentBlockId: "cb-1",
      },
      {
        id: "global-2",
        kind: "Content",
        sortOrder: 2,
        documentId: "tpl-1",
        version: 1,
        source: "GLOBAL",
        contentBlockId: "cb-2",
      },
      {
        id: "global-3",
        kind: "Content",
        sortOrder: 3,
        documentId: "tpl-1",
        version: 1,
        source: "GLOBAL",
        contentBlockId: "cb-3",
      },
    ];

    expect(moveDocumentTemplateItem(items, "global-2", "root", 2)).toBe(items);

    expect(
      moveDocumentTemplateItem(items, "global-3", "root", items.length)
    ).toBe(items);
  });
});
