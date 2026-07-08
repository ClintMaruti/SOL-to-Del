import { http, HttpResponse } from "msw";

export interface MockContentBlock {
  id: string;
  title: string;
  body: string;
  templates: string[];
  version: number;
}

function truncateBody(html: string, maxLen = 80): string {
  const plain = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) {
    return plain || html.slice(0, maxLen);
  }
  return `${plain.slice(0, maxLen)}…`;
}

function toListDto(b: MockContentBlock): MockContentBlock {
  return {
    ...b,
    body: truncateBody(b.body),
  };
}

let mockContentBlocks: MockContentBlock[] = [
  {
    id: "cb-1",
    title: "FCA Final Confirmation",
    body: "<p>Unless otherwise specified quotations include:</p>",
    templates: ["Quote", "Confirmation"],
    version: 1,
  },
  {
    id: "cb-2",
    title: "Global",
    body: "<p><strong>Summary</strong></p><p>Pricing text…</p>",
    templates: ["Quote", "Voucher", "B2B Itemised Invoice"],
    version: 2,
  },
  {
    id: "cb-3",
    title: "Contacts",
    body: "<p>Kenya Office …</p>",
    templates: [
      "Quote",
      "Confirmation",
      "B2B Itemised Invoice",
      "B2B Package Invoice",
      "Voucher",
      "ShortQuote",
      "B2C Itemised Invoice",
    ],
    version: 3,
  },
];

/** When true, GET /catalog/content-blocks returns 500 (for tests). */
let forceList500 = false;

export function setContentBlocksListForce500(value: boolean): void {
  forceList500 = value;
}

/** Replace mock list (for tests). */
export function setContentBlocksMockData(blocks: MockContentBlock[]): void {
  mockContentBlocks = [...blocks];
}

export function getContentBlocksMockData(): MockContentBlock[] {
  return [...mockContentBlocks];
}

export function resetContentBlocksMockState(): void {
  forceList500 = false;
  mockContentBlocks = [
    {
      id: "cb-1",
      title: "FCA Final Confirmation",
      body: "<p>Unless otherwise specified quotations include:</p>",
      templates: ["Quote", "Confirmation"],
      version: 1,
    },
    {
      id: "cb-2",
      title: "Global",
      body: "<p><strong>Summary</strong></p><p>Pricing text…</p>",
      templates: ["Quote", "Voucher", "B2B Itemised Invoice"],
      version: 2,
    },
    {
      id: "cb-3",
      title: "Contacts",
      body: "<p>Kenya Office …</p>",
      templates: [
        "Quote",
        "Confirmation",
        "B2B Itemised Invoice",
        "B2B Package Invoice",
        "Voucher",
        "ShortQuote",
        "B2C Itemised Invoice",
      ],
      version: 3,
    },
  ];
}

export function contentBlocksRoutes(baseUrl: string) {
  const listPattern = `${baseUrl}/catalog/content-blocks`;
  const itemPattern = `${baseUrl}/catalog/content-blocks/:id`;

  return [
    http.get(listPattern, () => {
      if (forceList500) {
        return HttpResponse.json(
          { success: false, data: null, error: "Internal Server Error" },
          { status: 500 }
        );
      }
      const data = mockContentBlocks.map(toListDto);
      return HttpResponse.json(
        { success: true, data, error: null },
        { status: 200 }
      );
    }),

    http.get(itemPattern, ({ params }) => {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      const found = mockContentBlocks.find((b) => b.id === id);
      if (!found) {
        return HttpResponse.json(
          { success: false, data: null, error: "Not found" },
          { status: 404 }
        );
      }
      return HttpResponse.json(
        { success: true, data: { ...found }, error: null },
        { status: 200 }
      );
    }),

    http.post(listPattern, async ({ request }) => {
      const body = (await request.json()) as { title?: string; body?: string };
      const newBlock: MockContentBlock = {
        id: `cb-${mockContentBlocks.length + 1}-${Date.now()}`,
        title: body.title ?? "Untitled",
        body: body.body ?? "<p></p>",
        templates: [],
        version: 1,
      };
      mockContentBlocks = [newBlock, ...mockContentBlocks];
      return HttpResponse.json(
        {
          success: true,
          data: {
            id: newBlock.id,
            title: newBlock.title,
            body: newBlock.body,
            version: newBlock.version,
          },
          error: null,
        },
        { status: 201 }
      );
    }),

    http.put(itemPattern, async ({ params, request }) => {
      const id = typeof params.id === "string" ? params.id : params.id?.[0];
      const body = (await request.json()) as {
        title?: string;
        body?: string;
        version?: number;
      };
      const index = mockContentBlocks.findIndex((b) => b.id === id);
      if (index === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: "Not found" },
          { status: 404 }
        );
      }
      const existing = mockContentBlocks[index];
      if (!existing) {
        return HttpResponse.json(
          { success: false, data: null, error: "Not found" },
          { status: 404 }
        );
      }
      const updated: MockContentBlock = {
        ...existing,
        title: body.title ?? existing.title,
        body: body.body ?? existing.body,
        version: (body.version ?? existing.version) + 1,
      };
      mockContentBlocks = [
        ...mockContentBlocks.slice(0, index),
        updated,
        ...mockContentBlocks.slice(index + 1),
      ];
      return HttpResponse.json(
        {
          success: true,
          data: {
            id: updated.id,
            title: updated.title,
            body: updated.body,
            version: updated.version,
          },
          error: null,
        },
        { status: 200 }
      );
    }),
  ];
}
