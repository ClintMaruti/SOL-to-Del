import { setupServer } from "msw/node";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://localhost";

describe("documentTemplatesRoutes", () => {
  let server: ReturnType<typeof setupServer>;

  beforeEach(async () => {
    vi.resetModules();

    const {
      documentTemplatesRoutes,
      resetDocumentTemplatesMockState,
      setDocumentTemplatesMockData,
    } = await import("./document-templates");
    const { resetContentBlocksMockState, setContentBlocksMockData } =
      await import("./content-blocks");

    resetContentBlocksMockState();
    setContentBlocksMockData([
      {
        id: "cb-1",
        title: "Global",
        body: "<p>Global body</p>",
        templates: ["Quote"],
        version: 1,
      },
      {
        id: "cb-2",
        title: "Contacts",
        body: "<p>Contacts body</p>",
        templates: ["Quote"],
        version: 1,
      },
    ]);

    resetDocumentTemplatesMockState();
    setDocumentTemplatesMockData([
      {
        id: "tpl-1",
        title: "Quote",
        version: 1,
        items: [
          {
            id: "tpl-section-1",
            kind: "Section",
            sortOrder: 1,
            documentId: "tpl-1",
            sectionTitle: "General",
            version: 1,
            items: [
              {
                id: "tpl-content-1",
                kind: "Content",
                sortOrder: 1,
                documentId: "tpl-1",
                contentBlockId: "cb-1",
                version: 1,
              },
            ],
          },
        ],
      },
    ]);

    server = setupServer(...documentTemplatesRoutes(`${ORIGIN}/api`));
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.close();
  });

  it("returns list rows derived from stored templates", async () => {
    const response = await fetch(`${ORIGIN}/api/catalog/document-templates`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      success: boolean;
      data: Array<{ title: string; blocks: string[] }>;
    };

    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      { id: "tpl-1", title: "Quote", blocks: ["Global"] },
    ]);
  });

  it("persists PUT updates across detail and list responses", async () => {
    const updateResponse = await fetch(
      `${ORIGIN}/api/catalog/document-templates/tpl-1`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Quote",
          version: 1,
          items: [
            {
              id: "tpl-static-1",
              kind: "StaticText",
              sortOrder: 1,
              documentId: "tpl-1",
              staticTextBody: "<p>Extra text</p>",
              version: 1,
            },
            {
              id: "tpl-content-2",
              kind: "Content",
              sortOrder: 2,
              documentId: "tpl-1",
              supplierContentType: "About",
              version: 1,
            },
          ],
        }),
      }
    );

    expect(updateResponse.status).toBe(200);

    const detailResponse = await fetch(
      `${ORIGIN}/api/catalog/document-templates/tpl-1`
    );
    const detailBody = (await detailResponse.json()) as {
      data: {
        version: number;
        items: Array<{ kind: string; sortOrder: number }>;
      };
    };

    expect(detailBody.data.version).toBe(2);
    expect(detailBody.data.items).toEqual([
      expect.objectContaining({ kind: "StaticText", sortOrder: 1 }),
      expect.objectContaining({ kind: "Content", sortOrder: 2 }),
    ]);

    const listResponse = await fetch(
      `${ORIGIN}/api/catalog/document-templates`
    );
    const listBody = (await listResponse.json()) as {
      data: Array<{ blocks: string[] }>;
    };

    expect(listBody.data[0]?.blocks).toEqual(["Static text", "About"]);
  });
});
