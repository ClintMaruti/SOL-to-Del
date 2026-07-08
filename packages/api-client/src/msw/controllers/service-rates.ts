import { http, HttpResponse } from "msw";

interface MoneyAmountDto {
  currency: string;
  value: number;
}

interface ContractedRateDateDto {
  id: string;
  travelDateFrom: string;
  travelDateTo: string;
  bookingWindowFrom?: string | null;
  bookingWindowTo?: string | null;
  weekdays: string[];
}

interface ServiceRateDto {
  id: string;
  serviceId: string;
  rateName: string;
  chargeType: string;
  timeUnit: string;
  currency: string;
  version: number;
}

interface ContractedRateDto {
  id: string;
  contractId: string;
  rateId: string;
  serviceOptionId: string;
  seasonName: string;
  priority: number;
  net: MoneyAmountDto | null;
  rack: MoneyAmountDto | null;
  sell: MoneyAmountDto | null;
  version: number;
  dates: ContractedRateDateDto[];
}

export let mockServiceRates: ServiceRateDto[] = [
  {
    id: "rate-1",
    serviceId: "service-1",
    rateName: "Single: PPPN",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    version: 1,
  },
  {
    id: "rate-2",
    serviceId: "service-1",
    rateName: "Triple: PPPN",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    version: 1,
  },
  {
    id: "rate-3",
    serviceId: "service-1",
    rateName: "Sharing: PPPN",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    version: 1,
  },
];

export let mockContractedRates: ContractedRateDto[] = [
  {
    id: "cr-1",
    contractId: "contract-1",
    rateId: "rate-1",
    serviceOptionId: "option-1",
    seasonName: "High Season",
    priority: 1,
    net: { currency: "USD", value: 200 },
    rack: { currency: "USD", value: 250 },
    sell: { currency: "USD", value: 280 },
    version: 1,
    dates: [
      {
        id: "crd-1",
        travelDateFrom: "2025-06-01",
        travelDateTo: "2025-10-31",
        bookingWindowFrom: "2025-01-01",
        bookingWindowTo: "2025-05-31",
        weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
      },
    ],
  },
  {
    id: "cr-2",
    contractId: "contract-1",
    rateId: "rate-2",
    serviceOptionId: "option-1",
    seasonName: "High Season",
    priority: 1,
    net: { currency: "USD", value: 150 },
    rack: { currency: "USD", value: 180 },
    sell: { currency: "USD", value: 200 },
    version: 1,
    dates: [
      {
        id: "crd-2",
        travelDateFrom: "2025-06-01",
        travelDateTo: "2025-10-31",
        bookingWindowFrom: "2025-01-01",
        bookingWindowTo: "2025-05-31",
        weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
      },
    ],
  },
  {
    id: "cr-3",
    contractId: "contract-1",
    rateId: "rate-1",
    serviceOptionId: "option-2",
    seasonName: "High Season",
    priority: 1,
    net: { currency: "USD", value: 180 },
    rack: { currency: "USD", value: 220 },
    sell: null,
    version: 1,
    dates: [
      {
        id: "crd-3",
        travelDateFrom: "2025-06-01",
        travelDateTo: "2025-10-31",
        bookingWindowFrom: null,
        bookingWindowTo: null,
        weekdays: [],
      },
    ],
  },
];

let rateIdCounter = 100;
let contractedRateIdCounter = 100;
let dateIdCounter = 200;

function cloneDates(dates: ContractedRateDateDto[]): ContractedRateDateDto[] {
  return dates.map((d) => ({
    ...d,
    id: d.id || `crd-${++dateIdCounter}`,
    weekdays: [...(d.weekdays ?? [])],
  }));
}

export const serviceRatesRoutes = (API_BASE_URL: string) => [
  http.get(
    `${API_BASE_URL}/catalog/services/:serviceId/rates`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      const rates = mockServiceRates.filter((r) => r.serviceId === serviceId);
      return HttpResponse.json(
        { success: true, data: rates, error: null },
        { status: 200 }
      );
    }
  ),

  http.post(
    `${API_BASE_URL}/catalog/services/:serviceId/rates`,
    async ({ params, request }) => {
      const serviceId = params.serviceId as string;
      const body = (await request.json()) as {
        name: string;
        chargeType: string;
        timeUnit: string;
      };
      const duplicate = mockServiceRates.some(
        (r) =>
          r.serviceId === serviceId &&
          r.rateName.toLowerCase() === body.name.trim().toLowerCase()
      );
      if (duplicate) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: { message: "Rate name already exists for this service." },
          },
          { status: 409 }
        );
      }
      const created: ServiceRateDto = {
        id: `rate-${++rateIdCounter}`,
        serviceId,
        rateName: body.name.trim(),
        chargeType: body.chargeType,
        timeUnit: body.timeUnit,
        currency: "USD",
        version: 1,
      };
      mockServiceRates.push(created);
      return HttpResponse.json(
        { success: true, data: created, error: null },
        { status: 200 }
      );
    }
  ),

  http.delete(
    `${API_BASE_URL}/catalog/services/rates/:rateId`,
    ({ params }) => {
      const rateId = params.rateId as string;
      const index = mockServiceRates.findIndex((r) => r.id === rateId);
      if (index === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: { message: "Not found" } },
          { status: 404 }
        );
      }
      mockServiceRates.splice(index, 1);
      mockContractedRates = mockContractedRates.filter(
        (r) => r.rateId !== rateId
      );
      return new HttpResponse(null, { status: 204 });
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/services/rates/:rateId`,
    async ({ params, request }) => {
      const rateId = params.rateId as string;
      const body = (await request.json()) as {
        name: string;
        chargeType: string;
        timeUnit: string;
        version: number;
      };
      const index = mockServiceRates.findIndex((r) => r.id === rateId);
      if (index === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: { message: "Not found" } },
          { status: 404 }
        );
      }
      const existing = mockServiceRates[index]!;
      if (existing.version !== body.version) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: { message: "Concurrency conflict" },
          },
          { status: 409 }
        );
      }
      const updated: ServiceRateDto = {
        ...existing,
        rateName: body.name.trim(),
        chargeType: body.chargeType,
        timeUnit: body.timeUnit,
        version: existing.version + 1,
      };
      mockServiceRates[index] = updated;
      return HttpResponse.json(
        { success: true, data: updated, error: null },
        { status: 200 }
      );
    }
  ),

  http.get(
    `${API_BASE_URL}/catalog/services/:serviceId/contracted-rates`,
    ({ params, request }) => {
      const serviceId = params.serviceId as string;
      const url = new URL(request.url);
      const contractId = url.searchParams.get("contractId");
      if (!contractId) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: { message: "contractId is required" },
          },
          { status: 422 }
        );
      }
      const serviceRateIds = new Set(
        mockServiceRates
          .filter((r) => r.serviceId === serviceId)
          .map((r) => r.id)
      );
      let rows = mockContractedRates.filter(
        (cr) => cr.contractId === contractId && serviceRateIds.has(cr.rateId)
      );
      const serviceOptionId = url.searchParams.get("serviceOptionId");
      if (serviceOptionId) {
        rows = rows.filter((r) => r.serviceOptionId === serviceOptionId);
      }
      const rateId = url.searchParams.get("rateId");
      if (rateId) {
        rows = rows.filter((r) => r.rateId === rateId);
      }
      const travelDateFrom = url.searchParams.get("travelDateFrom");
      const travelDateTo = url.searchParams.get("travelDateTo");
      if (travelDateFrom) {
        rows = rows.filter((r) =>
          r.dates.some((d) => d.travelDateTo >= travelDateFrom)
        );
      }
      if (travelDateTo) {
        rows = rows.filter((r) =>
          r.dates.some((d) => d.travelDateFrom <= travelDateTo)
        );
      }
      rows.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.seasonName.localeCompare(b.seasonName);
      });
      return HttpResponse.json(
        { success: true, data: rows, error: null },
        { status: 200 }
      );
    }
  ),

  http.post(
    `${API_BASE_URL}/catalog/services/:serviceId/contracted-rates`,
    async ({ params, request }) => {
      const serviceId = params.serviceId as string;
      const body = (await request.json()) as {
        contractId: string;
        seasonName: string;
        priority: number;
        dates: ContractedRateDateDto[];
        priceRows: Array<{
          serviceOptionId: string;
          rateId: string;
          net: number | null;
          rack: number | null;
          sell: number | null;
        }>;
      };
      if (!body.priceRows?.length) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: { message: "At least one price row is required" },
          },
          { status: 422 }
        );
      }
      const seen = new Set<string>();
      for (const row of body.priceRows) {
        const key = `${row.serviceOptionId}:${row.rateId}`;
        if (seen.has(key)) {
          return HttpResponse.json(
            {
              success: false,
              data: null,
              error: { message: "Duplicate price row in request" },
            },
            { status: 422 }
          );
        }
        seen.add(key);
      }
      const serviceRateIds = new Set(
        mockServiceRates
          .filter((r) => r.serviceId === serviceId)
          .map((r) => r.id)
      );
      const created: ContractedRateDto[] = body.priceRows.map((row) => {
        const currency = "USD";
        return {
          id: `cr-${++contractedRateIdCounter}`,
          contractId: body.contractId,
          rateId: row.rateId,
          serviceOptionId: row.serviceOptionId,
          seasonName: body.seasonName.trim(),
          priority: body.priority,
          net: row.net != null ? { currency, value: row.net } : null,
          rack: row.rack != null ? { currency, value: row.rack } : null,
          sell: row.sell != null ? { currency, value: row.sell } : null,
          version: 1,
          dates: cloneDates(
            body.dates.map((d) => ({
              id: d.id ?? `crd-${++dateIdCounter}`,
              travelDateFrom: d.travelDateFrom,
              travelDateTo: d.travelDateTo,
              bookingWindowFrom: d.bookingWindowFrom ?? null,
              bookingWindowTo: d.bookingWindowTo ?? null,
              weekdays: d.weekdays ?? [],
            }))
          ),
        };
      });
      for (const row of created) {
        if (!serviceRateIds.has(row.rateId)) {
          return HttpResponse.json(
            {
              success: false,
              data: null,
              error: { message: "Rate does not belong to service" },
            },
            { status: 422 }
          );
        }
      }
      mockContractedRates.push(...created);
      return HttpResponse.json(
        { success: true, data: created, error: null },
        { status: 200 }
      );
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/services/:serviceId/contracted-rates/:id`,
    async ({ params, request }) => {
      const serviceId = params.serviceId as string;
      const id = params.id as string;
      const body = (await request.json()) as {
        seasonName: string;
        priority: number;
        net: number | null;
        rack: number | null;
        sell: number | null;
        dates: ContractedRateDateDto[];
        version: number;
      };
      const index = mockContractedRates.findIndex((r) => r.id === id);
      if (index === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: { message: "Not found" } },
          { status: 404 }
        );
      }
      const existing = mockContractedRates[index]!;
      const serviceRateIds = new Set(
        mockServiceRates
          .filter((r) => r.serviceId === serviceId)
          .map((r) => r.id)
      );
      if (!serviceRateIds.has(existing.rateId)) {
        return HttpResponse.json(
          { success: false, data: null, error: { message: "Not found" } },
          { status: 404 }
        );
      }
      if (existing.version !== body.version) {
        return HttpResponse.json(
          {
            success: false,
            data: null,
            error: { message: "Concurrency conflict" },
          },
          { status: 409 }
        );
      }
      const currency = "USD";
      const updated: ContractedRateDto = {
        ...existing,
        seasonName: body.seasonName.trim(),
        priority: body.priority,
        net: body.net != null ? { currency, value: body.net } : null,
        rack: body.rack != null ? { currency, value: body.rack } : null,
        sell: body.sell != null ? { currency, value: body.sell } : null,
        version: existing.version + 1,
        dates: body.dates.map((d) => ({
          id: d.id ?? `crd-${++dateIdCounter}`,
          travelDateFrom: d.travelDateFrom,
          travelDateTo: d.travelDateTo,
          bookingWindowFrom: d.bookingWindowFrom ?? null,
          bookingWindowTo: d.bookingWindowTo ?? null,
          weekdays: d.weekdays ?? [],
        })),
      };
      mockContractedRates[index] = updated;
      return HttpResponse.json(
        { success: true, data: updated, error: null },
        { status: 200 }
      );
    }
  ),

  http.delete(
    `${API_BASE_URL}/catalog/services/:serviceId/contracted-rates/:id`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      const id = params.id as string;
      const serviceRateIds = new Set(
        mockServiceRates
          .filter((r) => r.serviceId === serviceId)
          .map((r) => r.id)
      );
      const index = mockContractedRates.findIndex(
        (r) => r.id === id && serviceRateIds.has(r.rateId)
      );
      if (index === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: { message: "Not found" } },
          { status: 404 }
        );
      }
      mockContractedRates.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
  ),
];
