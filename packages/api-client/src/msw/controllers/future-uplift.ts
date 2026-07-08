import { http, HttpResponse } from "msw";

/** Mutable mock: mirrors CompanySettings row for future uplift + version. */
let mockFutureUpliftPercent: number | null = null;
let mockVersion = 1;

export function resetFutureUpliftMock(): void {
  mockFutureUpliftPercent = null;
  mockVersion = 1;
}

export function setFutureUpliftMockState(
  futureUpliftPercent: number | null,
  version: number
): void {
  mockFutureUpliftPercent = futureUpliftPercent;
  mockVersion = version;
}

export const futureUpliftRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/future-uplift`, () => {
    return HttpResponse.json(
      {
        futureUpliftPercent: mockFutureUpliftPercent,
        version: mockVersion,
      },
      { status: 200 }
    );
  }),

  http.patch(`${API_BASE_URL}/catalog/future-uplift`, async ({ request }) => {
    const body = (await request.json()) as {
      futureUpliftPercent?: unknown;
      version?: unknown;
    };

    if (body.version === undefined) {
      return HttpResponse.json(
        { title: "Bad Request", detail: "version is required" },
        { status: 400 }
      );
    }
    if (body.futureUpliftPercent === undefined) {
      return HttpResponse.json(
        { title: "Bad Request", detail: "futureUpliftPercent is required" },
        { status: 400 }
      );
    }

    const version = Number(body.version);
    if (!Number.isFinite(version)) {
      return HttpResponse.json(
        { title: "Bad Request", detail: "Invalid version" },
        { status: 400 }
      );
    }

    const n = body.futureUpliftPercent;
    if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
      return HttpResponse.json(
        { title: "Bad Request", detail: "Invalid futureUpliftPercent" },
        { status: 400 }
      );
    }

    if (version !== mockVersion) {
      return HttpResponse.json(
        {
          title: "Conflict",
          detail:
            "Company settings were modified by another user. Refresh and retry.",
          type: "https://tools.ietf.org/html/rfc7231#section-6.5.8",
        },
        { status: 409 }
      );
    }

    mockFutureUpliftPercent = n;
    mockVersion += 1;

    return HttpResponse.json(
      {
        futureUpliftPercent: mockFutureUpliftPercent,
        version: mockVersion,
      },
      { status: 200 }
    );
  }),
];
