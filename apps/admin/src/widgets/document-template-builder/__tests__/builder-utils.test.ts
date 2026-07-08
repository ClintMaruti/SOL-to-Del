import { describe, expect, it } from "vitest";

import { DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID } from "@/entities/document-template";
import type { DocumentTemplateRootItem } from "@/entities/document-template";

import {
  buildValidationLookup,
  canDropDocumentTemplateKind,
  createInitialCollapsedState,
  prioritizeDocumentTemplateCollisions,
  resolveDropTarget,
} from "../model/utils";

describe("document-template-builder utils", () => {
  it("creates the initial collapsed state for nested content and supplier rows", () => {
    const items: DocumentTemplateRootItem[] = [
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
            id: "static-1",
            kind: "StaticText",
            sortOrder: 2,
            documentId: "tpl-1",
            version: 1,
            staticTextBody: "<p>Text</p>",
          },
        ],
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
        id: "global-2",
        kind: "Content",
        sortOrder: 3,
        documentId: "tpl-1",
        version: 1,
        source: "GLOBAL",
        contentBlockId: "cb-2",
      },
    ];

    expect(createInitialCollapsedState(items)).toEqual({
      "global-1": true,
      "supplier-1": true,
    });
  });

  it("builds validation lookup sets for the canvas", () => {
    const lookup = buildValidationLookup([
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

    expect([...lookup.sectionTitleErrors]).toEqual(["section-1"]);
    expect([...lookup.sectionItemsErrors]).toEqual(["section-1"]);
    expect([...lookup.staticTextErrors]).toEqual(["static-1"]);
  });

  it("resolves root drop targets to the container end index", () => {
    const items: DocumentTemplateRootItem[] = [
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
        id: "divider-1",
        kind: "PageDivider",
        sortOrder: 2,
        documentId: "tpl-1",
        version: 1,
      },
    ];

    expect(
      resolveDropTarget(items, DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID)
    ).toEqual({
      containerId: DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID,
      index: 2,
    });
  });

  it("blocks section drops into section containers while allowing content items", () => {
    expect(canDropDocumentTemplateKind("Section", "section:section-1")).toBe(
      false
    );
    expect(canDropDocumentTemplateKind("Section", "root")).toBe(true);
    expect(canDropDocumentTemplateKind("Content", "section:section-1")).toBe(
      true
    );
  });

  it("prefers nested drop targets over the root canvas container", () => {
    expect(
      prioritizeDocumentTemplateCollisions([
        { id: DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID },
        { id: "section:section-1" },
      ])
    ).toEqual([{ id: "section:section-1" }]);

    expect(
      prioritizeDocumentTemplateCollisions([
        { id: DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID },
      ])
    ).toEqual([{ id: DOCUMENT_TEMPLATE_ROOT_CONTAINER_ID }]);
  });
});
