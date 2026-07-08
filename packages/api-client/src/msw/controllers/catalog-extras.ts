import { http, HttpResponse } from "msw";

import { mockSupplierServices } from "./supplier-services";

interface MockNote {
  id: string;
  text: string;
  version: number;
}

interface MockMoney {
  amount: number;
  currency: string;
}

interface MockContractedExtraDetail {
  id: string;
  contractId: string;
  extraType: "Mandatory" | "Optional";
  chargeType: "Person" | "Unit";
  timeUnit: "None" | "Night" | "Day" | "Stay";
  travelFrom: string | null;
  travelTo: string | null;
  paxType: "Any" | "Adult" | "Child" | "Infant" | null;
  net: MockMoney | null;
  rack: MockMoney | null;
  sell: MockMoney | null;
  version: number;
}

export interface MockCatalogExtra {
  id: string;
  supplierId: string;
  title: string;
  serviceIds?: string[];
  description: string | null;
  isActive: boolean;
  version: number;
  notes: MockNote | null;
  serviceExtras?: Array<{
    id: string;
    serviceId: string | null;
    serviceName: string | null;
    serviceOptionId: string | null;
    serviceOptionName: string | null;
    validFrom: string;
    validTo: string | null;
    version: number;
  }>;
  contractedExtra: MockContractedExtraDetail | null;
}

function moneyFromDecimal(v: number | null | undefined): MockMoney | null {
  if (v == null || Number.isNaN(v)) return null;
  return { amount: v, currency: "USD" };
}

function defaultContractedExtra(
  idSuffix: string,
  extraType: "Mandatory" | "Optional" = "Optional",
  chargeType: "Person" | "Unit" = "Person"
): MockContractedExtraDetail {
  return {
    id: `contracted-${idSuffix}`,
    contractId: "contract-1",
    extraType,
    chargeType,
    timeUnit: "Night",
    travelFrom: "2025-06-01",
    travelTo: "2025-10-31",
    paxType: null,
    net: { amount: 30, currency: "USD" },
    rack: { amount: 60, currency: "USD" },
    sell: { amount: 50, currency: "USD" },
    version: 1,
  };
}

function simpleExtra(
  idSuffix: string,
  supplierId: string,
  title: string,
  description: string,
  extraType: "Mandatory" | "Optional" = "Optional",
  chargeType: "Person" | "Unit" = "Person"
): MockCatalogExtra {
  return {
    id: `extra-${idSuffix}`,
    supplierId,
    title,
    description,
    isActive: true,
    version: 1,
    notes: null,
    contractedExtra: defaultContractedExtra(idSuffix, extraType, chargeType),
  };
}

/** Mutable fixture store for catalog extras (MSW). */
export let mockCatalogExtras: MockCatalogExtra[] = [
  {
    id: "extra-1",
    supplierId: "sup-1",
    title: "Lunch",
    serviceIds: ["service-1"],
    description: "Bush lunch",
    isActive: true,
    version: 1,
    notes: null,
    serviceExtras: [
      {
        id: "se-1",
        serviceId: "service-1",
        serviceName: "Camp",
        serviceOptionId: null,
        serviceOptionName: null,
        validFrom: "2026-05-28",
        validTo: null,
        version: 1,
      },
    ],
    contractedExtra: defaultContractedExtra("e1", "Mandatory"),
  },
  {
    id: "extra-2",
    supplierId: "sup-1",
    title: "Walking Safaris",
    serviceIds: ["service-1"],
    description: null,
    isActive: true,
    version: 1,
    notes: null,
    serviceExtras: [
      {
        id: "se-2",
        serviceId: "service-1",
        serviceName: "Camp",
        serviceOptionId: null,
        serviceOptionName: null,
        validFrom: "2026-05-28",
        validTo: null,
        version: 1,
      },
    ],
    contractedExtra: defaultContractedExtra("e2"),
  },
  {
    id: "extra-3",
    supplierId: "sup-1",
    title: "Yoga mats available",
    serviceIds: ["service-2"],
    description: "Yoga mats for guest use",
    isActive: false,
    version: 1,
    notes: null,
    serviceExtras: [
      {
        id: "se-3",
        serviceId: "service-2",
        serviceName: "Game Drive",
        serviceOptionId: null,
        serviceOptionName: null,
        validFrom: "2026-05-28",
        validTo: null,
        version: 1,
      },
    ],
    contractedExtra: defaultContractedExtra("e3"),
  },
  {
    id: "extra-4",
    supplierId: "sup-2",
    title: "Picnic lunch box",
    serviceIds: ["service-6"],
    description: "Packed picnic lunch for day trips",
    isActive: true,
    version: 1,
    notes: null,
    serviceExtras: [
      {
        id: "se-4",
        serviceId: "service-6",
        serviceName: "Lodge",
        serviceOptionId: null,
        serviceOptionName: null,
        validFrom: "2026-05-28",
        validTo: null,
        version: 1,
      },
    ],
    contractedExtra: defaultContractedExtra("e4"),
  },
  simpleExtra(
    "5",
    "sup-3",
    "Fuel Supplement",
    "Fuel surcharge for long transfers",
    "Mandatory",
    "Unit"
  ),
  simpleExtra(
    "6",
    "sup-3",
    "Extra Luggage",
    "Additional luggage allowance",
    "Optional",
    "Unit"
  ),
  simpleExtra(
    "7",
    "sup-4",
    "Sundowner Setup",
    "Private sundowner drinks setup"
  ),
  simpleExtra(
    "8",
    "sup-4",
    "Seasonal Supplement",
    "Peak season surcharge",
    "Mandatory",
    "Unit"
  ),
  simpleExtra(
    "9",
    "sup-5",
    "Additional Meals",
    "Extra meal service outside the plan"
  ),
  simpleExtra("10", "sup-5", "Laundry Service", "Same-day laundry service"),
  simpleExtra("11", "sup-6", "Guided Nature Walk", "Ranger-led nature walk"),
  simpleExtra(
    "12",
    "sup-6",
    "Boat Excursion",
    "Lake Manyara boat trip",
    "Optional",
    "Unit"
  ),
  simpleExtra(
    "13",
    "sup-7",
    "Cultural Village Visit",
    "Visit to a nearby local village"
  ),
  simpleExtra(
    "14",
    "sup-7",
    "Exclusive Use of Vehicle",
    "Private-use safari vehicle",
    "Optional",
    "Unit"
  ),
  simpleExtra("15", "sup-8", "Bush Breakfast", "Breakfast set up in the bush"),
  simpleExtra("16", "sup-8", "Fly Camping", "Overnight fly camping add-on"),
  simpleExtra(
    "17",
    "sup-9",
    "Seasonal Supplement",
    "Peak season surcharge",
    "Mandatory",
    "Unit"
  ),
  simpleExtra(
    "18",
    "sup-9",
    "Fuel Supplement",
    "Fuel surcharge for game drives",
    "Mandatory",
    "Unit"
  ),
  simpleExtra(
    "19",
    "sup-10",
    "Hot Air Balloon Safari",
    "Sunrise balloon safari"
  ),
  simpleExtra(
    "20",
    "sup-10",
    "Massage Treatment",
    "In-camp spa massage",
    "Optional",
    "Unit"
  ),
  simpleExtra(
    "21",
    "sup-11",
    "Private Dining",
    "Private candlelit dinner setup"
  ),
  simpleExtra(
    "22",
    "sup-11",
    "Photographic Guide",
    "Dedicated photography guide"
  ),
  simpleExtra("23", "sup-12", "Night Game Drive", "Spotlit night game drive"),
  simpleExtra(
    "24",
    "sup-12",
    "Conservancy Fee",
    "Mandatory conservancy contribution",
    "Mandatory"
  ),
  simpleExtra("25", "sup-13", "Bush Dinner", "Private bush dinner experience"),
  simpleExtra(
    "26",
    "sup-13",
    "Airstrip Transfer",
    "Transfer to/from the nearest airstrip"
  ),
];

function toListItem(row: MockCatalogExtra) {
  const linkedServices = (row.serviceExtras ?? [])
    .filter((se) => se.serviceId)
    .map((se) => ({
      id: se.serviceId as string,
      name: se.serviceName ?? "",
      isActive: true,
    }));
  return {
    id: row.id,
    supplierId: row.supplierId,
    title: row.title,
    linkedServices,
    description: row.description,
    isActive: row.isActive,
    extraType: row.contractedExtra?.extraType ?? "Optional",
    chargeType: row.contractedExtra?.chargeType ?? "Person",
    pricing: {
      net: row.contractedExtra?.net?.amount ?? 0,
      sell: row.contractedExtra?.sell?.amount ?? 0,
      rack: row.contractedExtra?.rack?.amount ?? 0,
    },
  };
}

/** Mirrors BE `ExtraDetailDto` — contracted extra is loaded separately. */
function toDetail(row: MockCatalogExtra) {
  return {
    id: row.id,
    supplierId: row.supplierId,
    supplierName: "Mock Supplier",
    title: row.title,
    description: row.description,
    isActive: row.isActive,
    version: row.version,
    notes: row.notes,
    serviceExtras: (row.serviceExtras ?? []).map((se) => ({
      ...se,
      serviceOptionTitle: se.serviceOptionName,
    })),
  };
}

/** Mirrors BE `UpdateExtraDto` returned from PUT. */
function toUpdateResponse(row: MockCatalogExtra) {
  return {
    id: row.id,
    supplierId: row.supplierId,
    title: row.title,
    serviceIds: row.serviceIds ?? [],
    description: row.description,
    isActive: row.isActive,
    version: row.version,
    notes: row.notes,
    contractedExtra: row.contractedExtra,
  };
}

function applyContractedPut(
  prev: MockContractedExtraDetail | null,
  body: {
    id?: string | null;
    contractId: string;
    extraType: "Mandatory" | "Optional";
    chargeType: "Person" | "Unit";
    timeUnit: "Night" | "Day" | "Stay";
    travelFrom?: string | null;
    travelTo?: string | null;
    paxType?: "Any" | "Adult" | "Child" | "Infant" | null;
    net?: number | null;
    rack?: number | null;
    sell?: number | null;
    version?: number | null;
  }
): MockContractedExtraDetail {
  const id =
    (typeof body.id === "string" && body.id.trim()) ||
    prev?.id ||
    `contracted-${Date.now()}`;

  const pickMoney = (
    incoming: number | null | undefined,
    previous: MockMoney | null | undefined
  ): MockMoney | null => {
    if (incoming === null) return null;
    if (incoming !== undefined) return moneyFromDecimal(incoming);
    return previous ?? null;
  };

  return {
    id,
    contractId: body.contractId,
    extraType: body.extraType,
    chargeType: body.chargeType,
    timeUnit: body.timeUnit,
    travelFrom: body.travelFrom ?? prev?.travelFrom ?? null,
    travelTo: body.travelTo ?? prev?.travelTo ?? null,
    paxType: body.paxType ?? prev?.paxType ?? null,
    net: pickMoney(body.net, prev?.net),
    rack: pickMoney(body.rack, prev?.rack),
    sell: pickMoney(body.sell, prev?.sell),
    version: (prev?.version ?? 0) + 1,
  };
}

export const catalogExtrasRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/extras/:extraId`, ({ params }) => {
    const extraId = params.extraId as string;
    const row = mockCatalogExtras.find((e) => e.id === extraId);
    if (!row) {
      return HttpResponse.json(
        { success: false, data: null, error: "Extra not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      success: true,
      data: toDetail(row),
      error: null,
    });
  }),

  http.get(
    `${API_BASE_URL}/catalog/extras/:extraId/contracted-extras`,
    ({ params, request }) => {
      const extraId = params.extraId as string;
      const contractId = new URL(request.url).searchParams.get("contractId");
      if (!contractId?.trim()) {
        return HttpResponse.json(
          {
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            title: "Bad Request",
            status: 400,
          },
          { status: 400 }
        );
      }
      const row = mockCatalogExtras.find((e) => e.id === extraId);
      const ce = row?.contractedExtra;
      if (!ce || ce.contractId !== contractId) {
        return HttpResponse.json(
          { success: false, data: null, error: "Contracted extra not found" },
          { status: 404 }
        );
      }
      return HttpResponse.json({
        success: true,
        data: ce,
        error: null,
      });
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/extras/:extraId`,
    async ({ params, request }) => {
      const extraId = params.extraId as string;
      const idx = mockCatalogExtras.findIndex((e) => e.id === extraId);
      if (idx === -1) {
        return HttpResponse.json(
          { success: false, data: null, error: "Extra not found" },
          { status: 404 }
        );
      }

      const body = (await request.json()) as Partial<{
        title: string;
        description: string | null;
        isActive: boolean;
        version: number;
        notes: MockNote | null;
        serviceIds?: string[];
        contractedExtra: {
          id?: string | null;
          contractId: string;
          extraType: "Mandatory" | "Optional";
          chargeType: "Person" | "Unit";
          timeUnit: "Night" | "Day" | "Stay";
          travelFrom?: string | null;
          travelTo?: string | null;
          paxType?: "Any" | "Adult" | "Child" | "Infant" | null;
          net?: number | null;
          rack?: number | null;
          sell?: number | null;
          version?: number | null;
        } | null;
      }>;

      const prev = mockCatalogExtras[idx];
      if (body.version !== undefined && body.version !== prev.version) {
        return HttpResponse.json(
          { detail: "Concurrency conflict." },
          { status: 409 }
        );
      }

      let nextNotes = prev.notes;
      if (Object.prototype.hasOwnProperty.call(body, "notes")) {
        if (body.notes === null) {
          nextNotes = null;
        } else if (body.notes) {
          nextNotes = {
            id: body.notes.id,
            text: body.notes.text,
            version: body.notes.version + 1,
          };
        }
      }

      let nextContracted = prev.contractedExtra;
      if (body.contractedExtra !== undefined && body.contractedExtra !== null) {
        nextContracted = applyContractedPut(
          prev.contractedExtra,
          body.contractedExtra
        );
      }

      const nextServiceIds = body.serviceIds ?? prev.serviceIds ?? [];
      const nextServiceExtras =
        nextServiceIds.length > 0
          ? nextServiceIds.map((sid, i) => {
              const existing = (prev.serviceExtras ?? []).find(
                (se) => se.serviceId === sid
              );
              return (
                existing ?? {
                  id: `se-${Date.now()}-${i}`,
                  serviceId: sid,
                  serviceName:
                    mockSupplierServices.find((s) => s.id === sid)?.name ??
                    null,
                  serviceOptionId: null,
                  serviceOptionName: null,
                  validFrom: "2026-05-28",
                  validTo: null,
                  version: 1,
                }
              );
            })
          : (prev.serviceExtras ?? []);

      mockCatalogExtras[idx] = {
        ...prev,
        title: body.title ?? prev.title,
        serviceIds: nextServiceIds,
        description:
          body.description !== undefined ? body.description : prev.description,
        isActive: body.isActive !== undefined ? body.isActive : prev.isActive,
        serviceExtras: nextServiceExtras,
        version: prev.version + 1,
        notes: nextNotes,
        contractedExtra: nextContracted,
      };

      return HttpResponse.json({
        success: true,
        data: toUpdateResponse(mockCatalogExtras[idx]),
        error: null,
      });
    }
  ),

  http.post(`${API_BASE_URL}/catalog/extras`, async ({ request }) => {
    const body = (await request.json()) as {
      supplierId: string;
      title: string;
      serviceIds?: string[];
      description: string | null;
    };
    const titleNorm = body.title.trim();

    const duplicate = mockCatalogExtras.some(
      (e) =>
        e.supplierId === body.supplierId &&
        e.title.trim().toLowerCase() === titleNorm.toLowerCase()
    );

    if (duplicate) {
      return HttpResponse.json(
        {
          type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
          title: "One or more validation errors occurred.",
          status: 400,
          errors: {
            Title: ["Extra must be unique. Change the title to proceed."],
          },
        },
        { status: 400 }
      );
    }

    const id = `extra-${Date.now()}`;
    const serviceIds = Array.isArray(body.serviceIds)
      ? body.serviceIds.filter((x) => typeof x === "string" && x.trim())
      : [];
    const row: MockCatalogExtra = {
      id,
      supplierId: body.supplierId,
      title: titleNorm,
      serviceIds,
      description: body.description,
      isActive: false,
      version: 1,
      notes: null,
      serviceExtras: serviceIds.map((sid, i) => ({
        id: `se-${Date.now()}-${i}`,
        serviceId: sid,
        serviceName:
          mockSupplierServices.find((s) => s.id === sid)?.name ?? null,
        serviceOptionId: null,
        serviceOptionName: null,
        validFrom: "2026-05-28",
        validTo: null,
        version: 1,
      })),
      contractedExtra: defaultContractedExtra(id),
    };
    mockCatalogExtras.push(row);

    return HttpResponse.json(
      {
        success: true,
        data: toListItem(row),
        error: null,
      },
      { status: 201 }
    );
  }),

  http.get(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/extras`,
    ({ params }) => {
      const supplierId = params.supplierId as string;
      const rows = mockCatalogExtras.filter((e) => e.supplierId === supplierId);
      return HttpResponse.json({
        success: true,
        data: rows.map(toListItem),
        error: null,
      });
    }
  ),

  http.get(
    `${API_BASE_URL}/catalog/services/:serviceId/extras`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      const rows = mockCatalogExtras.filter((e) =>
        (e.serviceExtras ?? []).some(
          (se) => se.serviceId === null || se.serviceId === serviceId
        )
      );
      return HttpResponse.json({
        success: true,
        data: rows.map(toListItem),
        error: null,
      });
    }
  ),
];
