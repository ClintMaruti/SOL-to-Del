import { http, HttpResponse } from "msw";
import { mockServiceOptions } from "./service-options";

/**
 * Mirrors catalog wire shape for GET/POST/PUT responses
 * (see admin `ServiceOptionRateApiItem` in apps/admin).
 */
interface MoneyAmountDto {
  currency: string;
  value: number;
}

interface ContractedRateDateWireDto {
  id?: string;
  travelDateFrom: string;
  travelDateTo: string;
  weekdays?: string[];
  version?: number;
}

interface ContractedRateDto {
  id: string;
  contractId: string;
  rack: MoneyAmountDto;
  net: MoneyAmountDto;
  sell: MoneyAmountDto;
  priority: number;
  bookingWindowFrom: string;
  bookingWindowTo: string;
  contractedRateDates: ContractedRateDateWireDto[];
  rateId?: string;
  residency?: string;
  isActive?: boolean;
  version?: number;
}

interface ServiceOptionRateDto {
  id: string;
  serviceOptionId: string;
  rateName: string;
  chargeType: string;
  timeUnit: string;
  currency: string;
  isActive?: boolean;
  version?: number;
  contractedRates: ContractedRateDto[];
}

export const mockServiceOptionRates: ServiceOptionRateDto[] = [
  {
    id: "rate-1",
    serviceOptionId: "option-1",
    rateName: "Standard Rate",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    isActive: true,
    version: 1,
    contractedRates: [
      {
        id: "cr-1",
        contractId: "contract-1",
        rateId: "rate-1",
        residency: "Resident",
        rack: { currency: "USD", value: 250 },
        net: { currency: "USD", value: 200 },
        sell: { currency: "USD", value: 280 },
        priority: 1,
        bookingWindowFrom: "2025-01-01",
        bookingWindowTo: "2025-05-31",
        isActive: true,
        version: 1,
        contractedRateDates: [
          {
            id: "crd-flat-1",
            travelDateFrom: "2025-06-01",
            travelDateTo: "2025-10-31",
            weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
            version: 1,
          },
        ],
      },
    ],
  },
  {
    id: "rate-2",
    serviceOptionId: "option-1",
    rateName: "Unit Rate",
    chargeType: "Unit",
    timeUnit: "Stay",
    currency: "USD",
    isActive: true,
    version: 1,
    contractedRates: [],
  },
  {
    id: "rate-3",
    serviceOptionId: "option-2",
    rateName: "Half Board Rate",
    chargeType: "Person",
    timeUnit: "Night",
    currency: "USD",
    isActive: true,
    version: 1,
    contractedRates: [],
  },
];

/** Catalog POST request body (admin `ServiceOptionRateMutationRequestBody`). */
interface CreateRateBody {
  name: string;
  chargeType: "Person" | "Unit";
  timeUnit: "Night" | "Day" | "Stay" | "None";
  contractedRates: {
    id: string;
    contractId: string;
    rack: number;
    net: number;
    sell: number;
    priority: number;
    bookingWindowFrom: string;
    bookingWindowTo: string;
    contractedRateDates: ContractedRateDateWireDto[];
  }[];
}

type UpdateRateBody = CreateRateBody & { version: number };

let rateIdCounter = mockServiceOptionRates.length;

export const serviceOptionRatesRoutes = (API_BASE_URL: string) => [
  http.get(
    `${API_BASE_URL}/catalog/services/options/:serviceOptionId/rates`,
    ({ params }) => {
      const serviceOptionId = params.serviceOptionId as string;

      const optionExists = mockServiceOptions.some(
        (o) => o.id === serviceOptionId
      );
      if (!optionExists) {
        return HttpResponse.json(
          { success: false, data: null, error: "Service option not found" },
          { status: 404 }
        );
      }

      const rates = mockServiceOptionRates.filter(
        (r) => r.serviceOptionId === serviceOptionId
      );
      return HttpResponse.json(
        { success: true, data: rates, error: null },
        { status: 200 }
      );
    }
  ),

  http.post(
    `${API_BASE_URL}/catalog/services/options/:serviceOptionId/rates`,
    async ({ request, params }) => {
      const serviceOptionId = params.serviceOptionId as string;

      const optionExists = mockServiceOptions.some(
        (o) => o.id === serviceOptionId
      );
      if (!optionExists) {
        return HttpResponse.json(
          { success: false, data: null, error: "Service option not found" },
          { status: 404 }
        );
      }

      const body = (await request.json()) as CreateRateBody;

      const newRate: ServiceOptionRateDto = {
        id: `rate-${++rateIdCounter}`,
        serviceOptionId,
        rateName: body.name,
        chargeType: body.chargeType,
        timeUnit: body.timeUnit,
        currency: "USD",
        isActive: true,
        version: 1,
        contractedRates: [],
      };

      mockServiceOptionRates.push(newRate);

      return HttpResponse.json(
        { success: true, data: newRate, error: null },
        { status: 201 }
      );
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/services/options/rates/:rateId`,
    async ({ request, params }) => {
      const rateId = params.rateId as string;

      const idx = mockServiceOptionRates.findIndex((r) => r.id === rateId);
      if (idx === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: "Rate not found" },
          { status: 404 }
        );
      }

      const body = (await request.json()) as UpdateRateBody;

      mockServiceOptionRates[idx] = {
        ...mockServiceOptionRates[idx],
        rateName: body.name,
        chargeType: body.chargeType,
        timeUnit: body.timeUnit,
        version: body.version,
      };

      return HttpResponse.json(
        { success: true, data: mockServiceOptionRates[idx], error: null },
        { status: 200 }
      );
    }
  ),
];
