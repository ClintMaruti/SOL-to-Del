import { http, HttpResponse } from "msw";

interface MockContract {
  id: string;
  name: string;
  validFrom: string;
  validTo: string;
}

interface MockFlightOption {
  operatingDays: string[];
  timeFrom: string;
  timeTo: string;
  flightNumber: string;
}

interface MockScheduleOption {
  operatingDays: string[];
  timeFrom: string;
  timeTo: string;
}

interface MockLinkedOptionRef {
  serviceOptionId: string;
}

interface MockServiceOption {
  id: string;
  serviceId: string;
  title: string;
  includes: string;
  excludes: string;
  contractId: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  flightOption?: MockFlightOption;
  activityOption?: MockScheduleOption;
  transportOption?: MockScheduleOption;
  accommodationOption?: MockLinkedOptionRef;
  otherOption?: MockLinkedOptionRef;
  feeOption?: MockLinkedOptionRef;
}

const mockContracts: MockContract[] = [
  {
    id: "contract-1",
    name: "Contract 2025",
    validFrom: "2025-06-01",
    validTo: "2026-05-31",
  },
  {
    id: "contract-2",
    name: "Contract 2024",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
  },
  {
    id: "contract-3",
    name: "Contract 2026",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
  },
];

export const mockServiceOptions: MockServiceOption[] = [
  {
    id: "option-1",
    serviceId: "service-1",
    title: "Full Board",
    includes:
      "Soft drinks, beer, house wines, and selected spirits; Limited laundry; and TDL and all statutory taxes.",
    excludes:
      "Champagne, luxury spirits, and private cellar wines; Activities; Park fees, camping fees, and conservancy fees; Exclusive use of safari vehicle; Staff gratuities and any other extras.",
    contractId: null,
    isActive: true,
    version: 1,
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-03-01T14:30:00Z",
  },
  {
    id: "option-2",
    serviceId: "service-1",
    title: "Half Board",
    includes: "Breakfast and dinner; All statutory taxes.",
    excludes:
      "Lunch; Alcoholic beverages; Laundry; Activities; Park fees and conservancy fees.",
    contractId: null,
    isActive: true,
    version: 1,
    createdAt: "2025-02-10T08:00:00Z",
    updatedAt: "2025-02-10T08:00:00Z",
  },
];

let optionIdCounter = 100;

export const serviceOptionsRoutes = (API_BASE_URL: string) => [
  // --- Service Options CRUD ---

  http.get(
    `${API_BASE_URL}/catalog/services/:serviceId/options`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      const options = mockServiceOptions.filter(
        (o) => o.serviceId === serviceId
      );
      return HttpResponse.json(options, { status: 200 });
    }
  ),

  http.post(
    `${API_BASE_URL}/catalog/services/:serviceId/options`,
    async ({ request, params }) => {
      const serviceId = params.serviceId as string;
      const body = (await request.json()) as {
        title: string;
        includes?: string;
        excludes?: string;
        contractId?: string | null;
        isActive?: boolean;
        flightOption?: MockFlightOption;
        activityOption?: MockScheduleOption;
        transportOption?: MockScheduleOption;
        accommodationOption?: MockLinkedOptionRef;
        otherOption?: MockLinkedOptionRef;
        feeOption?: MockLinkedOptionRef;
      };
      const now = new Date().toISOString();
      const id = `option-${++optionIdCounter}`;
      const newOption: MockServiceOption = {
        id,
        serviceId,
        title: body.title,
        includes: body.includes ?? "",
        excludes: body.excludes ?? "",
        contractId: body.contractId ?? null,
        isActive: body.isActive ?? false,
        version: 1,
        createdAt: now,
        updatedAt: now,
        ...(body.flightOption ? { flightOption: body.flightOption } : {}),
        ...(body.activityOption ? { activityOption: body.activityOption } : {}),
        ...(body.transportOption
          ? { transportOption: body.transportOption }
          : {}),
        ...(body.accommodationOption
          ? { accommodationOption: body.accommodationOption }
          : {}),
        ...(body.otherOption ? { otherOption: body.otherOption } : {}),
        ...(body.feeOption ? { feeOption: body.feeOption } : {}),
      };
      mockServiceOptions.push(newOption);
      return HttpResponse.json(newOption, { status: 201 });
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/services/options/:optionId`,
    async ({ request, params }) => {
      const optionId = params.optionId as string;
      const body = (await request.json()) as Partial<MockServiceOption>;
      const index = mockServiceOptions.findIndex((o) => o.id === optionId);
      if (index === -1) {
        return HttpResponse.json(
          { error: "Option not found" },
          { status: 404 }
        );
      }
      mockServiceOptions[index] = {
        ...mockServiceOptions[index],
        ...body,
        version: mockServiceOptions[index].version + 1,
        updatedAt: new Date().toISOString(),
      };
      return HttpResponse.json(mockServiceOptions[index], { status: 200 });
    }
  ),

  http.delete(
    `${API_BASE_URL}/catalog/services/options/:optionId`,
    ({ params }) => {
      const optionId = params.optionId as string;
      const index = mockServiceOptions.findIndex((o) => o.id === optionId);
      if (index === -1) {
        return HttpResponse.json(
          { error: "Option not found" },
          { status: 404 }
        );
      }
      mockServiceOptions.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
  ),

  http.get(
    `${API_BASE_URL}/catalog/service-options/:serviceId/contracts`,
    () => {
      return HttpResponse.json(mockContracts, { status: 200 });
    }
  ),
];
