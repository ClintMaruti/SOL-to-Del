import { http, HttpResponse } from "msw";

import { mockServiceRates } from "./service-rates";

interface MockServiceOptionSummary {
  id: string;
  title: string;
}

interface MockServiceRateSummary {
  id: string;
  rateName: string;
}

interface MockSupplierService {
  id: string;
  supplierId: string;
  name: string;
  alternativeName?: string;
  serviceTypeId: string;
  type: string;
  locationId?: string;
  fromLocationId?: string;
  toLocationId?: string;
  description?: string;
  isActive: boolean;
  tags: string;
  options: MockServiceOptionSummary[];
  rates?: MockServiceRateSummary[];
  nominalSaleCode: string | null;
  purchaseNominalCode: string | null;
  createdAt: string;
  updatedAt: string;
}

const MOCK_SERVICE_TYPE_IDS = {
  ACCOMMODATION: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
  ACTIVITY: "047a5ae2-c3ed-4d6e-9f93-d42e1ff57f7a",
  FLIGHT: "a5d4151d-d125-4fca-af9d-3e05f5699d5c",
  FEE: "c7b8a9d0-e1f2-3456-7890-abcdef123456",
  OTHER: "ad54d130-a599-4cef-8602-2f6ab1cb6322",
  TRANSPORTATION: "aff9c2d3-cdf2-4100-b9d2-dcf238265c96",
} as const;

const MOCK_TIMESTAMP = "2024-01-01T00:00:00Z";

/** In-memory service notes for MSW (GET …/notes, PUT …/note). */
export const mockSupplierServiceNotes: Record<
  string,
  { id: string; text: string; version: number }
> = {
  "service-1": {
    id: "11111111-1111-1111-1111-111111111111",
    text: "Example note for Camp service.",
    version: 1,
  },
};

export const mockSupplierServices: MockSupplierService[] = [
  {
    id: "service-1",
    supplierId: "sup-1",
    name: "Camp",
    alternativeName: "Dunia Camp",
    serviceTypeId: MOCK_SERVICE_TYPE_IDS.ACCOMMODATION,
    type: "accommodation",
    locationId: "1",
    description: "A luxury tented camp in the Serengeti",
    isActive: true,
    tags: "Families, Romance",
    options: [
      { id: "option-1", title: "Full Board" },
      { id: "option-2", title: "Half Board" },
    ],
    nominalSaleCode: "T200-1",
    purchaseNominalCode: "T300-1",
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
  },
  {
    id: "service-2",
    supplierId: "sup-1",
    name: "Game Drive",
    alternativeName: "Serengeti Game Drive",
    serviceTypeId: MOCK_SERVICE_TYPE_IDS.ACTIVITY,
    type: "activity",
    locationId: "2",
    description: "Full-day game drive through the Serengeti",
    isActive: true,
    tags: "Adventure",
    options: [{ id: "option-3", title: "Game Package" }],
    nominalSaleCode: "T200-2",
    purchaseNominalCode: "T300-2",
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
  },
  {
    id: "service-3",
    supplierId: "sup-1",
    name: "Airport Transfer",
    alternativeName: "JRO Airport to Arusha",
    serviceTypeId: MOCK_SERVICE_TYPE_IDS.TRANSPORTATION,
    type: "transportation",
    description: "Private transfer from Kilimanjaro Airport to Arusha",
    isActive: true,
    tags: "Transfer",
    options: [],
    nominalSaleCode: "T200-3",
    purchaseNominalCode: "T300-3",
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
  },
  {
    id: "service-4",
    supplierId: "sup-1",
    name: "Domestic Flight",
    alternativeName: "JRO to ZNZ",
    serviceTypeId: MOCK_SERVICE_TYPE_IDS.FLIGHT,
    type: "flight",
    fromLocationId: "1",
    toLocationId: "2",
    description: "Scheduled flight Kilimanjaro to Zanzibar",
    isActive: true,
    tags: "",
    options: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
  },
  {
    id: "service-5",
    supplierId: "sup-1",
    name: "Transfer Package",
    serviceTypeId: MOCK_SERVICE_TYPE_IDS.OTHER,
    type: "other",
    description: "Airport transfers and ground transport",
    isActive: false,
    tags: "Transport",
    options: [],
    nominalSaleCode: "T200-5",
    purchaseNominalCode: "T300-5",
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
  },
  {
    id: "service-6",
    supplierId: "sup-2",
    name: "Lodge",
    serviceTypeId: MOCK_SERVICE_TYPE_IDS.ACCOMMODATION,
    type: "accommodation",
    locationId: "1",
    isActive: true,
    tags: "",
    options: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
  },
];

const createSupplierService = async ({ request }: { request: Request }) => {
  const body = (await request.json()) as Partial<MockSupplierService>;
  const now = new Date().toISOString();
  const data: MockSupplierService = {
    ...body,
    id: new Date().getTime().toString(),
    isActive: true,
    type: body.type ?? "other",
    tags: body.tags ?? "",
    options: [],
    nominalSaleCode: null,
    purchaseNominalCode: null,
    createdAt: now,
    updatedAt: now,
  } as MockSupplierService;
  mockSupplierServices.push(data);
  return HttpResponse.json(
    { success: true, data, error: null },
    { status: 201 }
  );
};

export const supplierServicesRoutes = (API_BASE_URL: string) => [
  http.post(`${API_BASE_URL}/catalog/services`, createSupplierService),

  http.get(
    `${API_BASE_URL}/catalog/services/:serviceId/notes`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      const note = mockSupplierServiceNotes[serviceId];
      if (!note) {
        return HttpResponse.json(
          { success: false, data: null, error: "Resource not found" },
          { status: 404 }
        );
      }
      return HttpResponse.json(
        { success: true, data: note, error: null },
        { status: 200 }
      );
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/services/:serviceId/note`,
    async ({ request, params }) => {
      const serviceId = params.serviceId as string;
      const body = (await request.json()) as {
        text?: string | null;
        version?: number | null;
      };
      const existing = mockSupplierServiceNotes[serviceId];
      if (
        existing &&
        body.version != null &&
        body.version !== existing.version
      ) {
        return HttpResponse.json(
          { success: false, data: null, error: "Conflict" },
          { status: 409 }
        );
      }
      const nextVersion = existing ? existing.version + 1 : 1;
      const id =
        existing?.id ??
        `00000000-0000-4000-8000-0000000${serviceId.slice(-5).padStart(5, "0")}`;
      const text = body.text ?? "";
      mockSupplierServiceNotes[serviceId] = {
        id,
        text,
        version: nextVersion,
      };
      return HttpResponse.json(
        {
          success: true,
          data: mockSupplierServiceNotes[serviceId],
          error: null,
        },
        { status: 200 }
      );
    }
  ),

  http.get(`${API_BASE_URL}/catalog/services/search`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();

    const INCL_FULL_BOARD =
      "Soft drinks, beer, house wines, and selected spirits; Limited laundry; and TDL and all statutory taxes.";
    const EXCL_FULL_BOARD =
      "Champagne, luxury spirits, and private cellar wines;  Activities;  Park fees, camping fees, and conservancy fees;  Exclusive use of safari vehicle;  Staff gratuities and any other extras.";

    const mockSearchResults = [
      // Accommodation
      {
        id: "sr-1",
        type: "accommodation",
        name: "Twin Tent",
        supplierName: "Asilia Dunia Camp",
        supplierId: "sup-9",
        priceFrom: 450,
        chargeType: "PPPN",
        paxMin: 1,
        paxMax: 1,
        unitsMin: 1,
        minNights: 1,
        minAge: 8,
        specialAllocationRules: true,
        options: [
          {
            id: "opt-1-fb",
            title: "Full Board (FB)",
            includes: INCL_FULL_BOARD,
            excludes: EXCL_FULL_BOARD,
          },
          {
            id: "opt-1-hb",
            title: "Half Board (HB)",
            includes:
              "Breakfast and dinner; Soft drinks and house wines at dinner.",
            excludes:
              "Lunch, activities, park fees, staff gratuities and any other extras.",
          },
          {
            id: "opt-1-bb",
            title: "Bed & Breakfast (BB)",
            includes: "Breakfast only.",
            excludes: "All meals except breakfast, activities, park fees.",
          },
        ],
      },
      {
        id: "sr-2",
        type: "accommodation",
        name: "Double Tent",
        supplierName: "Asilia Dunia Camp",
        supplierId: "sup-9",
        priceFrom: 2500,
        chargeType: "PUPN",
        paxMin: 1,
        paxMax: 3,
        unitsMin: 2,
        unitsMax: 3,
        minAge: 8,
        minNights: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-2-fb",
            title: "Full Board (FB)",
            includes: INCL_FULL_BOARD,
            excludes: EXCL_FULL_BOARD,
          },
          {
            id: "opt-2-hb",
            title: "Half Board (HB)",
            includes: "Breakfast and dinner.",
            excludes: "Lunch and activities.",
          },
        ],
      },
      {
        id: "sr-3",
        type: "accommodation",
        name: "Family Tent",
        supplierName: "Asilia Dunia Camp",
        supplierId: "sup-9",
        priceFrom: 950,
        chargeType: "PPPN",
        paxMin: 1,
        paxMax: 4,
        unitsMin: 1,
        minNights: 2,
        specialAllocationRules: true,
        options: [
          {
            id: "opt-3-fb",
            title: "Full Board (FB)",
            includes: INCL_FULL_BOARD,
            excludes: EXCL_FULL_BOARD,
          },
        ],
      },
      // Transport
      {
        id: "sr-5",
        type: "transport",
        name: "Kilimanjaro International Airport to Arusha City",
        supplierName: "Cheli & Peacock Safaris",
        supplierId: "sup-3",
        priceFrom: 85,
        chargeType: "PVT",
        unitsMin: 1,
        paxMin: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-5-lc",
            title: "4×4 Toyota Land Cruiser",
            includes: "Bottled water, Soft drinks per day, WiFi Available",
            excludes: "--",
          },
          {
            id: "opt-5-mb",
            title: "Minibus (8-seater)",
            includes: "Bottled water",
            excludes: "WiFi, meals",
          },
        ],
      },
      {
        id: "sr-5b",
        type: "transport",
        name: "Airport Transfer",
        supplierName: "Kilimanjaro Transfers",
        supplierId: "sup-3",
        priceFrom: 75,
        chargeType: "PVT",
        unitsMin: 1,
        paxMin: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-5b-sd",
            title: "Sedan",
            includes: "Bottled water",
            excludes: "--",
          },
          {
            id: "opt-5b-suv",
            title: "SUV",
            includes: "Bottled water, WiFi",
            excludes: "--",
          },
        ],
      },
      // Flight
      {
        id: "sr-8",
        type: "flight",
        name: "Serengeti North to Arusha AUA/SENARU/O",
        supplierName: "CPS Costal Aviation",
        supplierId: "sup-5",
        priceFrom: 320,
        chargeType: "PVT",
        unitsMin: 1,
        paxMin: 2,
        specialAllocationRules: true,
        options: [
          {
            id: "opt-8-mf",
            title: "Morning Flight",
            includes: INCL_FULL_BOARD,
            excludes: EXCL_FULL_BOARD,
          },
          {
            id: "opt-8-af",
            title: "Afternoon Flight",
            includes: "Soft drinks and water",
            excludes: "Meals, checked luggage over 15kg",
          },
        ],
      },
      {
        id: "sr-8b",
        type: "flight",
        name: "Domestic Flight JRO to ZNZ",
        supplierName: "Coastal Aviation",
        supplierId: "sup-5",
        priceFrom: 280,
        chargeType: "PVT",
        unitsMin: 1,
        paxMin: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-8b-std",
            title: "Standard",
            includes: "Carry-on luggage",
            excludes: "Checked luggage, meals",
          },
        ],
      },
      // Activity
      {
        id: "sr-wv",
        type: "activity",
        name: "Wildlife viewing",
        supplierName: "Hot Air Safaries",
        supplierId: "sup-2",
        priceFrom: 120,
        chargeType: "PPPD",
        paxMin: 1,
        paxMax: 5,
        unitsMin: 1,
        minAge: 8,
        specialAllocationRules: true,
        options: [
          {
            id: "opt-wv-mb",
            title: "Morning Baloon",
            includes: "Bottled water",
            excludes: "--",
          },
          {
            id: "opt-wv-gd",
            title: "Full Day Game Drive",
            includes: "Packed lunch, bottled water",
            excludes: "Park fees, staff gratuities",
          },
        ],
      },
      {
        id: "sr-6",
        type: "activity",
        name: "Bush Walk",
        supplierName: "Serengeti Safari Co.",
        supplierId: "sup-2",
        priceFrom: 65,
        chargeType: "PPPD",
        paxMin: 2,
        paxMax: 8,
        unitsMin: 1,
        minAge: 16,
        specialAllocationRules: true,
        options: [
          {
            id: "opt-6-hw",
            title: "Half Day Walk",
            includes: "Water and snacks",
            excludes: "Park fees, gratuities",
          },
          {
            id: "opt-6-fw",
            title: "Full Day Walk",
            includes: "Packed lunch, water and snacks",
            excludes: "Park fees, gratuities",
          },
        ],
      },
      {
        id: "sr-4",
        type: "activity",
        name: "Game Drive",
        supplierName: "Serengeti Safari Co.",
        supplierId: "sup-2",
        priceFrom: 120,
        chargeType: "PPPD",
        paxMin: 1,
        paxMax: 6,
        unitsMin: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-4-am",
            title: "Morning Game Drive",
            includes: "Tea/coffee and light snacks",
            excludes: "Park fees",
          },
          {
            id: "opt-4-pm",
            title: "Afternoon Game Drive",
            includes: "Sundowner drinks",
            excludes: "Park fees",
          },
        ],
      },
      // Fee
      {
        id: "sr-fee1",
        type: "fee",
        name: "Amboseli and Lake Nakuru National Parks",
        supplierName: "CPS Kenya Wildlife Services",
        supplierId: "sup-5",
        priceFrom: 150,
        chargeType: "PPP",
        paxMin: 1,
        unitsMin: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-fee1-std",
            title: "Standard",
            includes: "--",
            excludes: "--",
          },
          {
            id: "opt-fee1-grp",
            title: "Group Rate (6+)",
            includes: "--",
            excludes: "--",
          },
        ],
      },
      {
        id: "sr-fee2",
        type: "fee",
        name: "Serengeti Conservation Levy",
        supplierName: "Tanzania National Parks",
        supplierId: "sup-5",
        priceFrom: 60,
        chargeType: "PPP",
        paxMin: 1,
        unitsMin: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-fee2-std",
            title: "Standard",
            includes: "--",
            excludes: "--",
          },
        ],
      },
      // Other
      {
        id: "sr-7",
        type: "other",
        name: "Sunset Sundowner",
        supplierName: "Ngorongoro Lodge",
        supplierId: "sup-4",
        priceFrom: 45,
        chargeType: "PPPD",
        paxMin: 2,
        paxMax: 20,
        unitsMin: 1,
        specialAllocationRules: false,
        options: [
          {
            id: "opt-7-std",
            title: "Standard Package",
            includes: "Drinks and canapes",
            excludes: "Transport to location",
          },
        ],
      },
    ];

    let results = mockSearchResults;
    if (q)
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.supplierName.toLowerCase().includes(q)
      );

    return HttpResponse.json(
      { success: true, data: results, error: null },
      { status: 200 }
    );
  }),

  http.get(`${API_BASE_URL}/catalog/services/:serviceId`, ({ params }) => {
    const serviceId = params.serviceId as string;
    const service = mockSupplierServices.find((s) => s.id === serviceId);
    if (!service) {
      return HttpResponse.json(
        { success: false, data: null, error: "Service not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json(
      { success: true, data: service, error: null },
      { status: 200 }
    );
  }),

  http.get(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/services`,
    ({ params }) => {
      const supplierId = params.supplierId as string;
      const services = mockSupplierServices
        .filter((s) => s.supplierId === supplierId)
        .map((s) => ({
          ...s,
          rates: mockServiceRates
            .filter((r) => r.serviceId === s.id)
            .map((r) => ({ id: r.id, rateName: r.rateName })),
        }));
      return HttpResponse.json(
        { success: true, data: services, error: null },
        { status: 200 }
      );
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/services/:serviceId`,
    async ({ request, params }) => {
      const body = (await request.json()) as Partial<MockSupplierService>;
      const serviceId = params.serviceId as string;
      const index = mockSupplierServices.findIndex((s) => s.id === serviceId);
      if (index === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: "Service not found" },
          { status: 404 }
        );
      }
      mockSupplierServices[index] = {
        ...mockSupplierServices[index],
        ...body,
      };
      return HttpResponse.json(
        { success: true, data: mockSupplierServices[index], error: null },
        { status: 200 }
      );
    }
  ),

  http.patch(
    `${API_BASE_URL}/catalog/services/:serviceId/activate`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      const serviceindex = mockSupplierServices.findIndex(
        (s) => s.id === serviceId
      );
      if (serviceindex === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: "Service not found" },
          { status: 404 }
        );
      }
      mockSupplierServices[serviceindex].isActive = true;
      return HttpResponse.json(
        {
          success: true,
          data: mockSupplierServices[serviceindex],
          error: null,
        },
        { status: 200 }
      );
    }
  ),

  http.patch(
    `${API_BASE_URL}/catalog/services/:serviceId/deactivate`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      const serviceindex = mockSupplierServices.findIndex(
        (s) => s.id === serviceId
      );
      if (serviceindex === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: "Service not found" },
          { status: 404 }
        );
      }
      mockSupplierServices[serviceindex].isActive = false;
      return HttpResponse.json(
        {
          success: true,
          data: mockSupplierServices[serviceindex],
          error: null,
        },
        { status: 200 }
      );
    }
  ),

  http.delete(`${API_BASE_URL}/catalog/services/:serviceId`, ({ params }) => {
    const serviceId = params.serviceId as string;
    const index = mockSupplierServices.findIndex((s) => s.id === serviceId);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, data: null, error: "Service not found" },
        { status: 404 }
      );
    }
    mockSupplierServices.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
