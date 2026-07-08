import { http, HttpResponse } from "msw";

type MockSupplier = {
  id: string;
  name: string;
  headOfficeId: string;
  code: string;
  email: string;
  phone: string;
  isActive: boolean;
  paymentTermId: string;
  isDeleted: boolean;
  deletedAt: string | null;
  deletedBy?: string;
  serviceTypeId?: string;
  type?: string;
  xeroId?: string;
  locationId?: string | null;
  /** Catalog Country location id (matches MSW `/catalog/locations` root ids, e.g. `kenya`). */
  countryId: string;
  /** Resolved human-readable location name for list display. */
  locationName?: string | null;
  /** Whether this is a preferred/starred supplier. */
  preferredSupplier?: boolean;
  /** Seasonal closure start date (ISO). */
  closedFrom?: string | null;
  /** Seasonal closure end date (ISO). */
  closedTo?: string | null;
};

/** Map mock supplier `countryId` to catalog Country `name` for eligible-locations filtering. */
const MSW_SUPPLIER_COUNTRY_ID_TO_NAME: Record<string, string> = {
  kenya: "Kenya",
  "south-africa": "South Africa",
  egypt: "Egypt",
  morocco: "Morocco",
};

type StoredSupplierNote = { id: string; text: string; version: number };

const supplierNotesBySupplierId: Record<string, StoredSupplierNote> = {};

function nextSupplierNoteId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const mockSuppliers: MockSupplier[] = [
  {
    id: "sup-1",
    name: "Elewana Lodges & Camps",
    headOfficeId: "sho-1",
    code: "ELW-001",
    email: "bookings@elewanalodges.com",
    phone: "+255 123 456 789",
    isActive: true,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Nairobi, Kenya",
    preferredSupplier: true,
  },
  {
    id: "sup-2",
    name: "Serengeti Safari Co.",
    headOfficeId: "sho-2",
    code: "SSC-002",
    email: "inquiries@serengetisafarico.com",
    phone: "+255 234 567 890",
    isActive: true,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Serengeti, Tanzania",
    preferredSupplier: true,
  },
  {
    id: "sup-3",
    name: "Kilimanjaro Trekking Ltd",
    headOfficeId: "sho-3",
    code: "KTL-003",
    email: "treks@kilimanjaroltd.com",
    phone: "+255 345 678 901",
    isActive: true,
    paymentTermId: "pt-2",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Moshi, Tanzania",
  },
  {
    id: "sup-4",
    name: "Ngorongoro Crater Lodge",
    headOfficeId: "sho-4",
    code: "NCL-004",
    email: "reservations@ngorongorolodge.com",
    phone: "+255 456 789 012",
    isActive: true,
    paymentTermId: "pt-2",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Ngorongoro, Tanzania",
    closedFrom: "2026-06-12",
    closedTo: "2026-07-12",
  },
  {
    id: "sup-5",
    name: "Tarangire Safari Camp",
    headOfficeId: "sho-5",
    code: "TSC-005",
    email: "info@tarangiresafaricamp.com",
    phone: "+255 567 890 123",
    isActive: true,
    paymentTermId: "pt-3",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Tarangire, Tanzania",
  },
  {
    id: "sup-9",
    name: "Asilia Dunia Camp",
    headOfficeId: "sho-9",
    code: "ADC-009",
    email: "reservations@asiliadunia.com",
    phone: "+255 911 222 333",
    isActive: true,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Arusha, Tanzania",
    preferredSupplier: true,
  },
  {
    id: "sup-10",
    name: "Lamai Serengeti",
    headOfficeId: "sho-10",
    code: "LMS-010",
    email: "info@lamaiSerengeti.com",
    phone: "+255 922 333 444",
    isActive: true,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Northern Serengeti, Tanzania",
    preferredSupplier: true,
  },
  {
    id: "sup-11",
    name: "Singita Tented Camp",
    headOfficeId: "sho-11",
    code: "STC-011",
    email: "reservations@singita.com",
    phone: "+255 933 444 555",
    isActive: true,
    paymentTermId: "pt-2",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Serengeti, Tanzania",
  },
  {
    id: "sup-12",
    name: "Singita Serengeti House",
    headOfficeId: "sho-11",
    code: "SSH-012",
    email: "reservations@singita.com",
    phone: "+255 933 444 566",
    isActive: true,
    paymentTermId: "pt-2",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Serengeti, Tanzania",
  },
  {
    id: "sup-13",
    name: "Singita Grumeti",
    headOfficeId: "sho-11",
    code: "SGR-013",
    email: "grumeti@singita.com",
    phone: "+255 933 444 577",
    isActive: true,
    paymentTermId: "pt-2",
    isDeleted: false,
    deletedAt: null,
    countryId: "kenya",
    locationName: "Grumeti Reserve, Tanzania",
    closedFrom: "2026-06-12",
    closedTo: "2026-07-12",
  },
  {
    id: "sup-6",
    name: "Lake Manyara Tours",
    headOfficeId: "sho-6",
    code: "LMT-006",
    email: "tours@lakemanyara.com",
    phone: "+255 678 901 234",
    isActive: false,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
    countryId: "south-africa",
  },
  {
    id: "sup-7",
    name: "Ruaha Wilderness Camp",
    headOfficeId: "sho-7",
    code: "RWC-007",
    email: "wilderness@ruahacamp.com",
    phone: "+255 789 012 345",
    isActive: false,
    paymentTermId: "pt-2",
    isDeleted: false,
    deletedAt: null,
    countryId: "egypt",
  },
  {
    id: "sup-8",
    name: "Katavi Bush Camp",
    headOfficeId: "sho-8",
    code: "KBC-008",
    email: "bush@katavicamp.com",
    phone: "+255 890 123 456",
    isActive: false,
    paymentTermId: "pt-3",
    isDeleted: false,
    deletedAt: null,
    countryId: "morocco",
  },
];

/** Active suppliers' country names (lowercase) for MSW eligible-locations filtering. */
export function getActiveMockSupplierCountryNamesLowercase(): Set<string> {
  const out = new Set<string>();
  for (const s of mockSuppliers) {
    if (!s.isDeleted && s.isActive && s.countryId?.trim()) {
      const label = MSW_SUPPLIER_COUNTRY_ID_TO_NAME[s.countryId] ?? s.countryId;
      if (label.trim()) {
        out.add(label.trim().toLowerCase());
      }
    }
  }
  return out;
}

/** List API shape: GET /catalog/suppliers */
const headOfficeIdToName: Record<string, string> = {
  "sho-1": "Elewana Collection",
  "sho-2": "Serengeti Safari",
  "sho-3": "Kilimanjaro Treks",
  "sho-4": "Ngorongoro Adventures",
  "sho-5": "Tarangire Escapes",
  "sho-6": "Lake Manyara Co",
  "sho-7": "Ruaha Wilderness",
  "sho-8": "Katavi Bush",
  "sho-9": "Asilia Dunia",
  "sho-10": "Lamai Serengeti",
  "sho-11": "Singita Serengeti",
};

function toListShape(s: MockSupplier) {
  return {
    id: s.id,
    name: s.name,
    headOfficeName: headOfficeIdToName[s.headOfficeId] ?? s.headOfficeId,
    code: s.code,
    locationName: s.locationName ?? null,
    email: s.email,
    phone: s.phone,
    isActive: s.isActive,
    xeroId: s.xeroId ?? "",
    preferredSupplier: s.preferredSupplier ?? false,
    closedFrom: s.closedFrom ?? null,
    closedTo: s.closedTo ?? null,
  };
}

/** GET /catalog/suppliers - Fetch all suppliers (excludes soft-deleted by default). Optional ?headOfficeId= filter. */
export const getSuppliers = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const headOfficeId = url.searchParams.get("headOfficeId");
  let activeSuppliers = mockSuppliers.filter((s) => !s.deletedAt);
  if (headOfficeId) {
    activeSuppliers = activeSuppliers.filter(
      (s) => s.headOfficeId === headOfficeId
    );
  }
  return HttpResponse.json(activeSuppliers.map(toListShape), { status: 200 });
};

/** Expand list shape to detail shape for GET /catalog/suppliers/:id */
function toSupplierDetail(s: MockSupplier) {
  return {
    ...s,
    additionalName: "",
    starRating: 0,
    serviceTypeId: s.serviceTypeId ?? "",
    type: s.type ?? "",
    preferredSupplier: false,
    additionalEmail: "",
    secondAdditionalEmail: "",
    website: "",
    liveAvailabilityCheck: "",
    otherCommunicationChannels: "",
    countryId: s.countryId ?? "",
    countryIsPreferred: false,
    city: "",
    postalCode: "",
    streetAddress: "",
    poBox: "",
    locationId: s.locationId ?? null,
    latitude: null as number | null,
    longitude: null as number | null,
    closestAirstrip: "",
    airstripLatitude: 0,
    airstripLongitude: 0,
    checkIn: "",
    checkOut: "",
    pickUp: "",
    dropOff: "",
    xeroId: s.xeroId ?? "",
    paymentTerms: [] as {
      name: string;
      travelDatesFrom: string;
      travelDatesTo: string;
      depositPercent: number;
      balanceDueDays: number;
    }[],
    taxCode: "Standard",
    visibilityForAgentZone: false,
    agentZoneId: "",
    updatedAt: undefined,
    updatedBy: undefined,
  };
}

/** GET /catalog/suppliers/:id - Fetch a single supplier by id. Returns 404 if not found. */
const getSupplierById = (id: string) => {
  const supplier = mockSuppliers.find((s) => s.id === id);
  if (!supplier) {
    return HttpResponse.json(
      { message: "Supplier not found" },
      { status: 404 }
    );
  }
  return HttpResponse.json(toSupplierDetail(supplier), { status: 200 });
};

/** POST /catalog/suppliers - Create a new supplier. */
const createSupplier = async (info: { request: Request }) => {
  const body = (await info.request.json()) as Record<string, unknown>;
  const wantsActive = body.isActive === true;
  const nameTrim = String(body.name ?? "").trim();
  const hoTrim = String(body.headOfficeId ?? "").trim();
  const codeTrim = String(body.code ?? "").trim();
  const serviceTypeTrim = String(body.serviceTypeId ?? "").trim();
  const typeTrim = String(body.type ?? "").trim();
  const countryIdTrim = String(body.countryId ?? "").trim();
  const locationIdTrim =
    body.locationId == null ? "" : String(body.locationId).trim();
  const emailTrim = String(body.email ?? "").trim();
  const xeroTrim = body.xeroId == null ? "" : String(body.xeroId).trim();
  const locationGuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const errors: Record<string, string[]> = {};
  if (nameTrim.length < 3) {
    errors.Name = ["Name must be at least 3 characters."];
  }

  if (!hoTrim) {
    errors.HeadOfficeId = ["Head office is required."];
  }

  if (!serviceTypeTrim) {
    errors.ServiceTypeId = ["Primary service type is required."];
  }

  if (wantsActive) {
    if (!typeTrim) {
      errors.Type = ["Type is required."];
    }

    if (!countryIdTrim) {
      errors.CountryId = ["Country is required."];
    }

    if (!locationIdTrim || !locationGuid.test(locationIdTrim)) {
      errors.LocationId = ["Location is required."];
    }

    if (!emailTrim) {
      errors.Email = ["Email is required."];
    }

    if (!xeroTrim) {
      errors.XeroId = ["Xero ID is required."];
    }
  }

  if (Object.keys(errors).length > 0) {
    return HttpResponse.json(
      { message: "Validation failed", errors },
      { status: 400 }
    );
  }

  const name = nameTrim || "Draft supplier";
  const headOfficeId = hoTrim || "sho-1";
  const code = codeTrim || `TEMP-${Date.now().toString(36)}`;
  const newSupplier: MockSupplier = {
    id: `sup-${Date.now()}`,
    name,
    headOfficeId,
    code,
    email: String(body.email ?? ""),
    phone: String(body.phone ?? body.phoneNumber ?? ""),
    isActive: wantsActive,
    paymentTermId: "pt-1",
    isDeleted: false,
    deletedAt: null,
    serviceTypeId: String(body.serviceTypeId ?? ""),
    type: String(body.type ?? ""),
    countryId: String(body.countryId ?? ""),
    locationId: body.locationId == null ? null : String(body.locationId),
    xeroId: body.xeroId == null ? "" : String(body.xeroId),
  };
  mockSuppliers.push(newSupplier);
  const detail = toSupplierDetail(newSupplier);
  return HttpResponse.json(
    {
      ...detail,
      name: String(body.name ?? name),
      headOfficeId: String(body.headOfficeId ?? headOfficeId),
      code: String(body.code ?? code),
      additionalName: String(body.additionalName ?? ""),
      starRating: Number(body.starRating ?? 0),
      serviceTypeId: String(body.serviceTypeId ?? ""),
      type: String(body.type ?? ""),
      preferredSupplier: Boolean(body.preferredSupplier ?? false),
      phone: String(body.phone ?? ""),
      additionalEmail: String(body.additionalEmail ?? ""),
      secondAdditionalEmail: String(body.secondAdditionalEmail ?? ""),
      website: String(body.website ?? ""),
      liveAvailabilityCheck: String(body.liveAvailabilityCheck ?? ""),
      otherCommunicationChannels: String(body.otherCommunicationChannels ?? ""),
      countryId: String(body.countryId ?? ""),
      city: String(body.city ?? ""),
      postalCode: String(body.postalCode ?? ""),
      streetAddress: String(body.streetAddress ?? ""),
      poBox: String(body.poBox ?? ""),
      locationId: body.locationId ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      closestAirstrip: String(body.closestAirstrip ?? ""),
      closestAirstripLatitude: String(body.closestAirstripLatitude ?? ""),
      closestAirstripLongitude: String(body.closestAirstripLongitude ?? ""),
      checkIn: String(body.checkIn ?? ""),
      checkOut: String(body.checkOut ?? ""),
      pickUp: String(body.pickUp ?? ""),
      dropOff: String(body.dropOff ?? ""),
      xeroId: body.xeroId == null ? "" : String(body.xeroId),
      paymentTerms: (body.paymentTerms as typeof detail.paymentTerms) ?? [],
      visibilityForAgentZone: Boolean(body.visibilityForAgentZone ?? false),
      agentZoneId: String(body.agentZoneId ?? ""),
      isActive: wantsActive,
    },
    { status: 201 }
  );
};

/** PATCH /catalog/suppliers/:id - Update a supplier. Persists to mock so list refetch shows updated data. */
const updateSupplier = async (info: {
  params: { id?: string };
  request: Request;
}) => {
  const id = String(info.params.id ?? info.params["id"] ?? "");
  const index = mockSuppliers.findIndex((s) => s.id === id);
  if (index === -1) {
    return HttpResponse.json(
      { message: "Supplier not found" },
      { status: 404 }
    );
  }
  const rawBody = (await info.request.json()) as Record<string, unknown>;
  const { country: _legacyCountry, ...restBody } = rawBody;
  void _legacyCountry;
  const body = restBody as Partial<
    MockSupplier & { phone?: string; poBox?: string }
  >;
  const updated: MockSupplier = {
    ...mockSuppliers[index],
    ...body,
    id: mockSuppliers[index].id,
    name: body.name ?? mockSuppliers[index].name,
    headOfficeId: body.headOfficeId ?? mockSuppliers[index].headOfficeId,
    code: body.code ?? mockSuppliers[index].code,
    email: body.email ?? mockSuppliers[index].email,
    phone: body.phone ?? mockSuppliers[index].phone,
    isActive: body.isActive ?? mockSuppliers[index].isActive,
    paymentTermId: body.paymentTermId ?? mockSuppliers[index].paymentTermId,
    isDeleted: body.isDeleted ?? mockSuppliers[index].isDeleted,
    deletedAt: body.deletedAt ?? mockSuppliers[index].deletedAt,
    serviceTypeId:
      (body as { serviceTypeId?: string }).serviceTypeId ??
      mockSuppliers[index].serviceTypeId,
    type: (body as { type?: string }).type ?? mockSuppliers[index].type,
    countryId: body.countryId ?? mockSuppliers[index].countryId,
    locationId:
      (body as { locationId?: string | null }).locationId ??
      mockSuppliers[index].locationId,
    xeroId:
      (body as { xeroId?: string | null }).xeroId ??
      mockSuppliers[index].xeroId,
  };
  mockSuppliers[index] = updated;
  const detail = toSupplierDetail(updated);
  return HttpResponse.json(
    {
      ...detail,
      ...(typeof body.poBox === "string" ? { poBox: body.poBox } : {}),
    },
    { status: 200 }
  );
};

/** PATCH /catalog/suppliers/:supplierId/activate - Set supplier to Active. */
const activateSupplier = ({ params }: { params: { supplierId?: string } }) => {
  const supplierId = String(params.supplierId ?? "");
  const index = mockSuppliers.findIndex((s) => s.id === supplierId);
  if (index === -1) {
    return HttpResponse.json(
      { message: "Supplier not found" },
      { status: 404 }
    );
  }
  const row = mockSuppliers[index];
  const detail = toSupplierDetail(row);
  const typeOk = Boolean(detail.type?.trim());
  const countryOk = Boolean(detail.countryId?.trim());
  const locationOk = Boolean(
    detail.locationId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(detail.locationId)
    )
  );
  const emailOk = Boolean(detail.email?.trim());
  const xeroOk = Boolean(String(detail.xeroId ?? "").trim());

  if (!typeOk || !countryOk || !locationOk || !emailOk || !xeroOk) {
    const errors: Record<string, string[]> = {};
    if (!typeOk) {
      errors.Type = ["Type is required."];
    }

    if (!countryOk) {
      errors.CountryId = ["Country is required."];
    }

    if (!locationOk) {
      errors.LocationId = ["Location is required."];
    }

    if (!emailOk) {
      errors.Email = ["Email is required."];
    }

    if (!xeroOk) {
      errors.XeroId = ["Xero ID is required."];
    }

    return HttpResponse.json(
      {
        message:
          "Supplier cannot be activated until required fields are complete.",
        errors,
      },
      { status: 400 }
    );
  }

  mockSuppliers[index].isActive = true;
  return HttpResponse.json(toSupplierDetail(mockSuppliers[index]), {
    status: 200,
  });
};

/** PATCH /catalog/suppliers/:supplierId/deactivate - Set supplier to Inactive. */
const deactivateSupplier = ({
  params,
}: {
  params: { supplierId?: string };
}) => {
  const supplierId = String(params.supplierId ?? "");
  const index = mockSuppliers.findIndex((s) => s.id === supplierId);
  if (index === -1) {
    return HttpResponse.json(
      { message: "Supplier not found" },
      { status: 404 }
    );
  }
  mockSuppliers[index].isActive = false;
  return HttpResponse.json(toSupplierDetail(mockSuppliers[index]), {
    status: 200,
  });
};

/** GET /catalog/suppliers/:supplierId/notes */
const getSupplierNotes = ({ params }: { params: { supplierId?: string } }) => {
  const supplierId = String(params.supplierId ?? "");
  const supplier = mockSuppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return HttpResponse.json(
      { message: "Supplier not found" },
      { status: 404 }
    );
  }
  const note = supplierNotesBySupplierId[supplierId];
  if (!note) {
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }
  return HttpResponse.json(note, { status: 200 });
};

/** PUT /catalog/suppliers/:supplierId/note */
const putSupplierNote = async (info: {
  params: { supplierId?: string };
  request: Request;
}) => {
  const supplierId = String(info.params.supplierId ?? "");
  const index = mockSuppliers.findIndex((s) => s.id === supplierId);
  if (index === -1) {
    return HttpResponse.json(
      { message: "Supplier not found" },
      { status: 404 }
    );
  }
  const body = (await info.request.json()) as {
    text?: string | null;
    version?: number | null;
  };
  const prev = supplierNotesBySupplierId[supplierId];
  const version = Number(body.version ?? 0);
  if (prev && prev.version !== version) {
    return HttpResponse.json({ message: "Conflict" }, { status: 409 });
  }
  const text = body.text ?? "";
  const next: StoredSupplierNote = {
    id: prev?.id ?? nextSupplierNoteId(),
    text,
    version: prev ? prev.version + 1 : 1,
  };
  supplierNotesBySupplierId[supplierId] = next;
  return HttpResponse.json(next, { status: 200 });
};

type MockSupplierContentBlock = {
  id: string;
  title: string;
  body: string;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

const supplierContentBlocksBySupplierId: Record<
  string,
  MockSupplierContentBlock[]
> = {};

function truncateSupplierContentPreview(html: string, maxLen = 80): string {
  const plain = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) {
    return plain;
  }
  return `${plain.slice(0, maxLen)}…`;
}

function seedSupplierContentBlocks(
  supplierId: string
): MockSupplierContentBlock[] {
  if (supplierContentBlocksBySupplierId[supplierId]) {
    return supplierContentBlocksBySupplierId[supplierId];
  }
  const now = new Date().toISOString();
  const by = "James Donnovan";
  const p = `${supplierId}`;
  const rows: MockSupplierContentBlock[] = [
    {
      id: `${p}-about`,
      title: "About",
      body: "<p>Unless otherwise specified, quotations include all standard inclusions for this property and region. Contact us for a full breakdown of what is included in your stay.</p>",
      version: 1,
      updatedAt: now,
      updatedBy: by,
    },
    {
      id: `${p}-terms`,
      title: "Terms & Conditions",
      body: '<p><a href="#">Click here for the properties Terms &amp; Conditions</a></p>',
      version: 1,
      updatedAt: now,
      updatedBy: by,
    },
    {
      id: `${p}-overview`,
      title: "Overview",
      body: "<p></p>",
      version: 1,
      updatedAt: now,
      updatedBy: by,
    },
    {
      id: `${p}-service-notes`,
      title: "Service Notes",
      body: "<p></p>",
      version: 1,
      updatedAt: now,
      updatedBy: by,
    },
    {
      id: `${p}-activities`,
      title: "Activities",
      body: "<p>Day game drives, walking safaris, and cultural visits can be arranged subject to availability.</p>",
      version: 1,
      updatedAt: now,
      updatedBy: by,
    },
  ];
  supplierContentBlocksBySupplierId[supplierId] = rows;
  return rows;
}

export function resetSupplierContentBlocksMockState(): void {
  for (const key of Object.keys(supplierContentBlocksBySupplierId)) {
    delete supplierContentBlocksBySupplierId[key];
  }
}

const getSupplierContentBlocks = ({
  params,
}: {
  params: { supplierId?: string };
}) => {
  const supplierId = String(params.supplierId ?? "");
  const supplier = mockSuppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return HttpResponse.json(
      { success: false, data: null, error: "Supplier not found" },
      { status: 404 }
    );
  }
  const rows = seedSupplierContentBlocks(supplierId);
  const data = rows.map((r) => ({
    id: r.id,
    title: r.title,
    bodyPreview: truncateSupplierContentPreview(r.body),
    version: r.version,
    updatedAt: r.updatedAt,
    updatedBy: r.updatedBy,
  }));
  return HttpResponse.json(
    { success: true, data, error: null },
    { status: 200 }
  );
};

const getSupplierContentBlock = ({
  params,
}: {
  params: { supplierId?: string; contentBlockId?: string };
}) => {
  const supplierId = String(params.supplierId ?? "");
  const contentBlockId = String(params.contentBlockId ?? "");
  const supplier = mockSuppliers.find((s) => s.id === supplierId);
  if (!supplier) {
    return HttpResponse.json(
      { success: false, data: null, error: "Supplier not found" },
      { status: 404 }
    );
  }
  const rows = seedSupplierContentBlocks(supplierId);
  const row = rows.find((r) => r.id === contentBlockId);
  if (!row) {
    return HttpResponse.json(
      { success: false, data: null, error: "Content block not found" },
      { status: 404 }
    );
  }
  const data = {
    id: row.id,
    title: row.title,
    body: row.body,
    version: row.version,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
  return HttpResponse.json(
    { success: true, data, error: null },
    { status: 200 }
  );
};

function findSupplierContentBlockById(contentBlockId: string): {
  supplierId: string;
  rowIndex: number;
} | null {
  for (const supplier of mockSuppliers) {
    const rows = seedSupplierContentBlocks(supplier.id);
    const rowIndex = rows.findIndex((r) => r.id === contentBlockId);
    if (rowIndex !== -1) {
      return { supplierId: supplier.id, rowIndex };
    }
  }
  return null;
}

const putSupplierContentBlock = async (info: {
  params: { id?: string };
  request: Request;
}) => {
  const contentBlockId = String(info.params.id ?? "");
  const located = findSupplierContentBlockById(contentBlockId);
  if (!located) {
    return HttpResponse.json(
      { success: false, data: null, error: "Content block not found" },
      { status: 404 }
    );
  }
  const { supplierId, rowIndex } = located;
  const body = (await info.request.json()) as {
    body?: string;
    version?: number;
  };
  const rows = supplierContentBlocksBySupplierId[supplierId]!;
  const index = rowIndex;
  const expectedVersion = Number(body.version ?? 0);
  if (rows[index].version !== expectedVersion) {
    return HttpResponse.json(
      { success: false, data: null, error: "Version conflict" },
      { status: 409 }
    );
  }
  const nextBody = typeof body.body === "string" ? body.body : "";
  const updated: MockSupplierContentBlock = {
    ...rows[index],
    body: nextBody,
    version: rows[index].version + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "You (local mock)",
  };
  rows[index] = updated;
  const data = {
    id: updated.id,
    title: updated.title,
    body: updated.body,
    version: updated.version,
    updatedAt: updated.updatedAt,
    updatedBy: updated.updatedBy,
  };
  return HttpResponse.json(
    { success: true, data, error: null },
    { status: 200 }
  );
};

/** DELETE /catalog/suppliers/:supplierId - Soft delete a supplier. */
const deleteSupplier = ({ params }: { params: { supplierId?: string } }) => {
  const supplierId = String(params.supplierId ?? "");
  const index = mockSuppliers.findIndex((s) => s.id === supplierId);
  if (index === -1) {
    return HttpResponse.json(
      { message: "Supplier not found" },
      { status: 404 }
    );
  }
  if (mockSuppliers[index].isDeleted) {
    return HttpResponse.json(
      { message: "Supplier is already deleted" },
      { status: 404 }
    );
  }
  mockSuppliers[index].isDeleted = true;
  mockSuppliers[index].deletedAt = new Date().toISOString();
  return new HttpResponse(null, { status: 204 });
};

/** All supplier MSW route handlers. Use in handlers.ts: ...supplierRoutes(API_BASE_URL) */
export const supplierRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/suppliers`, getSuppliers),
  http.post(`${API_BASE_URL}/catalog/suppliers`, createSupplier),
  http.get(`${API_BASE_URL}/catalog/suppliers/:id`, ({ params }) => {
    const id = params.id as string;
    return getSupplierById(id);
  }),
  http.patch(`${API_BASE_URL}/catalog/suppliers/:id`, updateSupplier),
  http.get(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/notes`,
    ({ params }) =>
      getSupplierNotes({ params: { supplierId: params.supplierId as string } })
  ),
  http.put(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/note`,
    putSupplierNote
  ),
  http.patch(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/activate`,
    activateSupplier
  ),
  http.patch(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/deactivate`,
    deactivateSupplier
  ),
  http.delete(`${API_BASE_URL}/catalog/suppliers/:supplierId`, ({ params }) =>
    deleteSupplier({ params: { supplierId: params.supplierId as string } })
  ),
  http.get(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/content-blocks`,
    ({ params }) => getSupplierContentBlocks({ params })
  ),
  http.get(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/content-blocks/:contentBlockId`,
    ({ params }) => getSupplierContentBlock({ params })
  ),
  http.put(`${API_BASE_URL}/catalog/supplier-content-blocks/:id`, (info) =>
    putSupplierContentBlock(info)
  ),
];
