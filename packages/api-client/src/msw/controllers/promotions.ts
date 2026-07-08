import { http, HttpResponse } from "msw";

type MockPromotionPaxCode = "ANY" | "ADT" | "CHD" | "INF" | "YTH";
type MockPromotionConditionType =
  | "SupplierNights"
  | "SuppliersTotal"
  | "NightsTotal"
  | "PaxNumber"
  | "PaxAge";
type MockPromotionTargetNightsType =
  | "ANY"
  | "Cheapest"
  | "Average"
  | "AnyFromFirst"
  | "AnyFromLast"
  | "ByIndex";

type MockPromotionDetailPaxType =
  | "Any"
  | "Adult"
  | "Child"
  | "Infant"
  | "Youth";

type MockPromotionTravelDateRange = {
  id: string;
  from: string;
  to: string;
  version: number;
};

type MockPromotionBookingWindow = {
  from: string;
  to: string;
};

type MockPromotionBookingWindowRelative = {
  fromDays: number | null;
  toDays: number | null;
};

type MockPromotionCondition =
  | {
      id: string;
      type: "SupplierNights";
      supplierId: string | null;
      serviceId: string | null;
      optionText: string | null;
      minNights: number | null;
      maxNights: number | null;
      version: number;
    }
  | {
      id: string;
      type: "SuppliersTotal";
      minSuppliers: number | null;
      maxSuppliers: number | null;
      version: number;
    }
  | {
      id: string;
      type: "NightsTotal";
      minNights: number | null;
      maxNights: number | null;
      version: number;
    }
  | {
      id: string;
      type: "PaxNumber";
      paxCode: MockPromotionPaxCode;
      minPax: number | null;
      maxPax: number | null;
      version: number;
    }
  | {
      id: string;
      type: "PaxAge";
      paxCode: MockPromotionPaxCode;
      minAge: number | null;
      maxAge: number | null;
      version: number;
    };

type MockPromotionDiscountRow = {
  id: string;
  discountPercent: number | null;
  paxCode: MockPromotionPaxCode;
  paxIndexFrom: number | null;
  paxIndexTo: number | null;
  targetNightsType: MockPromotionTargetNightsType;
  nightIndexFrom: number | null;
  nightIndexTo: number | null;
};

type MockPromotionAction =
  | {
      id: string;
      type: "DiscountPercentage";
      rows: MockPromotionDiscountRow[];
      version: number;
    }
  | {
      id: string;
      type: "AddOn";
      items: Array<{
        id: string;
        value: string;
      }>;
      version: number;
    };

type MockPromotionDetailNote = {
  id: string;
  text: string;
  version: number;
};

type MockPromotionDetailRangeValue = {
  min: number;
  max: number;
};

type MockPromotionDetailConditionResponse = {
  id: string;
  type: MockPromotionConditionType;
  supplierId: string | null;
  serviceId: string | null;
  optionText: string | null;
  paxType: MockPromotionDetailPaxType;
  nights: MockPromotionDetailRangeValue;
  suppliers: MockPromotionDetailRangeValue;
  nightsTotal: MockPromotionDetailRangeValue;
  paxCount: MockPromotionDetailRangeValue;
  age: MockPromotionDetailRangeValue;
  version: number;
};

type MockPromotionDetailAddOnResponse = {
  id: string;
  serviceTypeId: string | null;
  name: string;
  version: number;
};

type MockPromotionDiscountTargetType = "Pax" | "Nights";

type MockPromotionDetailDiscountResponse = {
  id: string;
  discountPercent: number;
  targetType: MockPromotionDiscountTargetType;
  paxType: MockPromotionDetailPaxType;
  paxIndexFrom: number;
  paxIndexTo: number;
  targetNightsType: MockPromotionTargetNightsType;
  nightsIndexFrom: number;
  nightsIndexTo: number;
  version: number;
};

type MockPromotionDetailActionResponse = {
  id: string;
  type: "DiscountPercentage" | "AddOn";
  addOn: MockPromotionDetailAddOnResponse | null;
  discount: MockPromotionDetailDiscountResponse | null;
  version: number;
};

type MockPromotionDetailResponse = {
  id: string;
  headOfficeId: string;
  name: string;
  isActive: boolean;
  isPartiallySupported: boolean;
  note: MockPromotionDetailNote | null;
  travelDates: MockPromotionTravelDateRange[];
  bookingWindow: MockPromotionBookingWindow;
  bookingWindowRelative: {
    fromDays: number;
    toDays: number;
  };
  conditions: MockPromotionDetailConditionResponse[];
  actions: MockPromotionDetailActionResponse[];
  version: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

type MockPromotionDetail = {
  id: string;
  name: string;
  headOfficeId: string;
  isPartiallySupported: boolean;
  note: string | null;
  travelDates: MockPromotionTravelDateRange[];
  bookingWindow: MockPromotionBookingWindow;
  bookingWindowRelative: MockPromotionBookingWindowRelative | null;
  conditions: MockPromotionCondition[];
  actions: MockPromotionAction[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

type MockPromotionSummary = {
  id: string;
  name: string;
  headOfficeId: string;
  bookingWindowFrom: string;
  bookingWindowTo: string;
  isActive: boolean;
};

const NOW = "2026-04-06T09:30:00.000Z";
const DEFAULT_USER = "Amelia Earhart";
const FORBIDDEN_HEAD_OFFICE_ID = "sho-forbidden";

const initialMockPromotionDetails: MockPromotionDetail[] = [
  {
    id: "promo-1",
    name: "Long Stay Discount",
    headOfficeId: "sho-1",
    isPartiallySupported: false,
    note: null,
    travelDates: [
      {
        id: "travel-1",
        from: "2027-01-01",
        to: "2027-12-31",
        version: 1,
      },
    ],
    bookingWindow: {
      from: "2027-01-01",
      to: "2027-12-31",
    },
    bookingWindowRelative: null,
    conditions: [
      {
        id: "condition-1",
        type: "SupplierNights",
        supplierId: "sup-1",
        serviceId: null,
        optionText: null,
        minNights: 5,
        maxNights: null,
        version: 1,
      },
    ],
    actions: [
      {
        id: "action-1",
        type: "DiscountPercentage",
        version: 1,
        rows: [
          {
            id: "discount-row-1",
            discountPercent: 15,
            paxCode: "ANY",
            paxIndexFrom: null,
            paxIndexTo: null,
            targetNightsType: "Cheapest",
            nightIndexFrom: null,
            nightIndexTo: null,
          },
        ],
      },
    ],
    isActive: true,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: DEFAULT_USER,
    updatedBy: DEFAULT_USER,
  },
  {
    id: "promo-2",
    name: "Honeymoon Package",
    headOfficeId: "sho-1",
    isPartiallySupported: false,
    note: null,
    travelDates: [
      {
        id: "travel-2",
        from: "2027-02-01",
        to: "2027-12-31",
        version: 1,
      },
    ],
    bookingWindow: {
      from: "2027-01-01",
      to: "2027-12-31",
    },
    bookingWindowRelative: null,
    conditions: [
      {
        id: "condition-2",
        type: "SupplierNights",
        supplierId: "sup-1",
        serviceId: "service-1",
        optionText: "Full Board",
        minNights: 4,
        maxNights: null,
        version: 1,
      },
    ],
    actions: [
      {
        id: "action-2",
        type: "AddOn",
        version: 1,
        items: [{ id: "addon-1", value: "Sparkling wine" }],
      },
    ],
    isActive: true,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: DEFAULT_USER,
    updatedBy: DEFAULT_USER,
  },
  {
    id: "promo-3",
    name: "5% Circuit Discount on Accommodation",
    headOfficeId: "sho-1",
    isPartiallySupported: false,
    note: null,
    travelDates: [
      {
        id: "travel-3",
        from: "2027-01-01",
        to: "2027-12-31",
        version: 1,
      },
    ],
    bookingWindow: {
      from: "2027-01-01",
      to: "2027-12-31",
    },
    bookingWindowRelative: {
      fromDays: 30,
      toDays: 90,
    },
    conditions: [
      {
        id: "condition-3",
        type: "SuppliersTotal",
        minSuppliers: 2,
        maxSuppliers: null,
        version: 1,
      },
      {
        id: "condition-4",
        type: "NightsTotal",
        minNights: 6,
        maxNights: null,
        version: 1,
      },
    ],
    actions: [
      {
        id: "action-3",
        type: "DiscountPercentage",
        version: 1,
        rows: [
          {
            id: "discount-row-2",
            discountPercent: 5,
            paxCode: "ANY",
            paxIndexFrom: null,
            paxIndexTo: null,
            targetNightsType: "Cheapest",
            nightIndexFrom: null,
            nightIndexTo: null,
          },
        ],
      },
    ],
    isActive: false,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: DEFAULT_USER,
    updatedBy: DEFAULT_USER,
  },
  {
    id: "promo-4",
    name: "Stay 4 Pay 3",
    headOfficeId: "sho-1",
    isPartiallySupported: true,
    note: "Requires planner review",
    travelDates: [
      {
        id: "travel-4",
        from: "2027-01-01",
        to: "2027-12-31",
        version: 1,
      },
    ],
    bookingWindow: {
      from: "2027-01-01",
      to: "2027-12-31",
    },
    bookingWindowRelative: null,
    conditions: [
      {
        id: "condition-5",
        type: "SupplierNights",
        supplierId: "sup-1",
        serviceId: "service-1",
        optionText: null,
        minNights: 4,
        maxNights: null,
        version: 1,
      },
    ],
    actions: [
      {
        id: "action-4",
        type: "DiscountPercentage",
        version: 1,
        rows: [
          {
            id: "discount-row-3",
            discountPercent: 25,
            paxCode: "ANY",
            paxIndexFrom: null,
            paxIndexTo: null,
            targetNightsType: "ByIndex",
            nightIndexFrom: 4,
            nightIndexTo: 4,
          },
        ],
      },
    ],
    isActive: true,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: DEFAULT_USER,
    updatedBy: DEFAULT_USER,
  },
  {
    id: "promo-5",
    name: "Shoulder Season Special",
    headOfficeId: "sho-2",
    isPartiallySupported: false,
    note: null,
    travelDates: [
      {
        id: "travel-5",
        from: "2026-10-01",
        to: "2026-12-20",
        version: 1,
      },
    ],
    bookingWindow: {
      from: "2026-10-01",
      to: "2026-12-20",
    },
    bookingWindowRelative: null,
    conditions: [
      {
        id: "condition-6",
        type: "PaxNumber",
        paxCode: "ADT",
        minPax: 2,
        maxPax: null,
        version: 1,
      },
    ],
    actions: [
      {
        id: "action-5",
        type: "DiscountPercentage",
        version: 1,
        rows: [
          {
            id: "discount-row-4",
            discountPercent: 10,
            paxCode: "ADT",
            paxIndexFrom: null,
            paxIndexTo: null,
            targetNightsType: "AnyFromFirst",
            nightIndexFrom: 1,
            nightIndexTo: 2,
          },
        ],
      },
    ],
    isActive: false,
    version: 1,
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: DEFAULT_USER,
    updatedBy: DEFAULT_USER,
  },
];

let mockPromotionDetails = structuredClone(initialMockPromotionDetails);
let idSequence = 100;

function nextId(prefix: string) {
  idSequence += 1;
  return `${prefix}-${idSequence}`;
}

function getParam(
  params: Record<string, string | readonly string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function isForbiddenHeadOffice(headOfficeId: string | undefined) {
  return headOfficeId === FORBIDDEN_HEAD_OFFICE_ID;
}

function toResponseNumber(value: number | null | undefined) {
  return value ?? 0;
}

function toDetailPaxType(
  paxCode: MockPromotionPaxCode
): MockPromotionDetailPaxType {
  switch (paxCode) {
    case "ADT":
      return "Adult";
    case "CHD":
      return "Child";
    case "INF":
      return "Infant";
    case "YTH":
      return "Youth";
    case "ANY":
    default:
      return "Any";
  }
}

function toRangeValue(
  min: number | null | undefined,
  max: number | null | undefined
): MockPromotionDetailRangeValue {
  return {
    min: toResponseNumber(min),
    max: toResponseNumber(max),
  };
}

function toNoteResponse(
  promotion: MockPromotionDetail
): MockPromotionDetailNote | null {
  if (!promotion.note) {
    return null;
  }

  return {
    id: `note-${promotion.id}`,
    text: promotion.note,
    version: promotion.version,
  };
}

function toConditionResponse(
  condition: MockPromotionCondition
): MockPromotionDetailConditionResponse {
  const base = {
    id: condition.id,
    type: condition.type,
    supplierId: null,
    serviceId: null,
    optionText: null,
    paxType: "Any" as MockPromotionDetailPaxType,
    nights: toRangeValue(null, null),
    suppliers: toRangeValue(null, null),
    nightsTotal: toRangeValue(null, null),
    paxCount: toRangeValue(null, null),
    age: toRangeValue(null, null),
    version: condition.version,
  };

  switch (condition.type) {
    case "SupplierNights":
      return {
        ...base,
        supplierId: condition.supplierId,
        serviceId: condition.serviceId,
        optionText: condition.optionText,
        nights: toRangeValue(condition.minNights, condition.maxNights),
      };
    case "SuppliersTotal":
      return {
        ...base,
        suppliers: toRangeValue(condition.minSuppliers, condition.maxSuppliers),
      };
    case "NightsTotal":
      return {
        ...base,
        nightsTotal: toRangeValue(condition.minNights, condition.maxNights),
      };
    case "PaxNumber":
      return {
        ...base,
        paxType: toDetailPaxType(condition.paxCode),
        paxCount: toRangeValue(condition.minPax, condition.maxPax),
      };
    case "PaxAge":
      return {
        ...base,
        paxType: toDetailPaxType(condition.paxCode),
        age: toRangeValue(condition.minAge, condition.maxAge),
      };
  }
}

function getDiscountTargetType(
  row: MockPromotionDiscountRow
): MockPromotionDiscountTargetType {
  if (
    row.paxCode !== "ANY" ||
    row.paxIndexFrom != null ||
    row.paxIndexTo != null
  ) {
    return "Pax";
  }

  return "Nights";
}

function toActionResponses(
  action: MockPromotionAction
): MockPromotionDetailActionResponse[] {
  if (action.type === "DiscountPercentage") {
    return action.rows.map((row, index) => ({
      id: action.rows.length > 1 ? `${action.id}-${index + 1}` : action.id,
      type: "DiscountPercentage",
      addOn: null,
      discount: {
        id: row.id,
        discountPercent: toResponseNumber(row.discountPercent),
        targetType: getDiscountTargetType(row),
        paxType: toDetailPaxType(row.paxCode),
        paxIndexFrom: toResponseNumber(row.paxIndexFrom),
        paxIndexTo: toResponseNumber(row.paxIndexTo),
        targetNightsType: row.targetNightsType,
        nightsIndexFrom: toResponseNumber(row.nightIndexFrom),
        nightsIndexTo: toResponseNumber(row.nightIndexTo),
        version: action.version,
      },
      version: action.version,
    }));
  }

  return action.items.map((item, index) => ({
    id: action.items.length > 1 ? `${action.id}-${index + 1}` : action.id,
    type: "AddOn",
    addOn: {
      id: item.id,
      serviceTypeId: null,
      name: item.value,
      version: action.version,
    },
    discount: null,
    version: action.version,
  }));
}

function toPromotionDetailResponse(
  promotion: MockPromotionDetail
): MockPromotionDetailResponse {
  return {
    id: promotion.id,
    headOfficeId: promotion.headOfficeId,
    name: promotion.name,
    isActive: promotion.isActive,
    isPartiallySupported: promotion.isPartiallySupported,
    note: toNoteResponse(promotion),
    travelDates: promotion.travelDates,
    bookingWindow: promotion.bookingWindow,
    bookingWindowRelative: promotion.bookingWindowRelative
      ? {
          fromDays: toResponseNumber(promotion.bookingWindowRelative.fromDays),
          toDays: toResponseNumber(promotion.bookingWindowRelative.toDays),
        }
      : {
          fromDays: 0,
          toDays: 0,
        },
    conditions: promotion.conditions.map(toConditionResponse),
    actions: promotion.actions.flatMap(toActionResponses),
    version: promotion.version,
    createdAt: promotion.createdAt,
    updatedAt: promotion.updatedAt,
    createdBy: promotion.createdBy,
    updatedBy: promotion.updatedBy,
  };
}

function toPromotionSummary(
  promotion: MockPromotionDetail
): MockPromotionSummary {
  return {
    id: promotion.id,
    name: promotion.name,
    headOfficeId: promotion.headOfficeId,
    bookingWindowFrom: promotion.bookingWindow.from,
    bookingWindowTo: promotion.bookingWindow.to,
    isActive: promotion.isActive,
  };
}

function getHeadOfficePromotions({
  params,
}: {
  params: Record<string, string | readonly string[] | undefined>;
}) {
  const headOfficeId = getParam(params, "headOfficeId");

  if (isForbiddenHeadOffice(headOfficeId)) {
    return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return HttpResponse.json(
    mockPromotionDetails
      .filter((promotion) => promotion.headOfficeId === headOfficeId)
      .map(toPromotionSummary),
    { status: 200 }
  );
}

function getPromotionDetail({
  params,
}: {
  params: Record<string, string | readonly string[] | undefined>;
}) {
  const promotionId = getParam(params, "promotionId");
  const promotion = mockPromotionDetails.find(
    (item) => item.id === promotionId
  );

  if (!promotion) {
    return HttpResponse.json(
      { message: "Promotion not found" },
      { status: 404 }
    );
  }

  if (isForbiddenHeadOffice(promotion.headOfficeId)) {
    return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return HttpResponse.json(toPromotionDetailResponse(promotion), {
    status: 200,
  });
}

function togglePromotionStatus({
  params,
  activate,
}: {
  params: Record<string, string | readonly string[] | undefined>;
  activate: boolean;
}) {
  const promotionId = getParam(params, "promotionId");
  const promotionIndex = mockPromotionDetails.findIndex(
    (promotion) => promotion.id === promotionId
  );

  if (promotionIndex === -1) {
    return HttpResponse.json(
      { message: "Promotion not found" },
      { status: 404 }
    );
  }

  if (
    isForbiddenHeadOffice(mockPromotionDetails[promotionIndex]?.headOfficeId)
  ) {
    return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  mockPromotionDetails[promotionIndex] = {
    ...mockPromotionDetails[promotionIndex],
    isActive: activate,
    updatedAt: new Date().toISOString(),
    version: mockPromotionDetails[promotionIndex].version + 1,
  };

  return HttpResponse.json(
    toPromotionSummary(mockPromotionDetails[promotionIndex]),
    {
      status: 200,
    }
  );
}

type PromotionUpsertRequestBody = {
  version?: number;
  name?: string;
  isPartiallySupported?: boolean;
  note?:
    | string
    | {
        id?: string;
        text?: string;
        version?: number;
      }
    | null;
  travelDates?: Array<{
    id?: string;
    version?: number;
    from?: string;
    to?: string;
  }>;
  bookingWindow?: {
    from?: string;
    to?: string;
  } | null;
  bookingWindowRelative?: {
    fromDays?: number | null;
    toDays?: number | null;
  } | null;
  conditions?: Array<Record<string, unknown>>;
  actions?: Array<Record<string, unknown>>;
  isActive?: boolean;
};

function fromDetailPaxType(
  paxType: string | null | undefined
): MockPromotionPaxCode {
  switch (paxType) {
    case "Adult":
      return "ADT";
    case "Child":
      return "CHD";
    case "Infant":
      return "INF";
    case "Youth":
    case "Teen":
      return "YTH";
    case "Any":
    default:
      return "ANY";
  }
}

function getRangeMin(
  value: Record<string, unknown> | null | undefined,
  fallbackKey: string
) {
  const nested = (value?.min as number | null | undefined) ?? null;
  const fallback = (value?.[fallbackKey] as number | null | undefined) ?? null;

  return nested ?? fallback;
}

function getRangeMax(
  value: Record<string, unknown> | null | undefined,
  fallbackKey: string
) {
  const nested = (value?.max as number | null | undefined) ?? null;
  const fallback = (value?.[fallbackKey] as number | null | undefined) ?? null;

  return nested ?? fallback;
}

function getNoteText(note: PromotionUpsertRequestBody["note"]) {
  if (typeof note === "string") {
    return note;
  }

  if (note && typeof note === "object") {
    return note.text ?? "";
  }

  return "";
}

function createPromotionValidationErrors(body: PromotionUpsertRequestBody) {
  const errors: Record<string, string[]> = {};
  const push = (field: string, message: string) => {
    errors[field] = [...(errors[field] ?? []), message];
  };

  const name = body.name?.trim() ?? "";
  if (!name) {
    push("Name", "Promotion name is required.");
  } else {
    if (name.length < 3) {
      push("Name", "Promotion name must be at least 3 characters.");
    }
    if (name.length > 64) {
      push("Name", "Promotion name must be at most 64 characters.");
    }
  }

  if (body.isPartiallySupported && !getNoteText(body.note).trim()) {
    push("Note", "Note is required when partially supported is enabled.");
  }

  if (!Array.isArray(body.travelDates) || body.travelDates.length === 0) {
    push("TravelDates", "At least one travel date range is required.");
  }

  if (!body.bookingWindow?.from || !body.bookingWindow?.to) {
    push("BookingWindow", "Booking window from and to are required.");
  }

  if (!Array.isArray(body.conditions) || body.conditions.length === 0) {
    push("Conditions", "At least one condition is required.");
  }

  if (!Array.isArray(body.actions) || body.actions.length === 0) {
    push("Actions", "At least one action is required.");
  }

  return errors;
}

function buildPromotionDetail({
  existingPromotion,
  headOfficeId,
  body,
  now,
}: {
  existingPromotion?: MockPromotionDetail;
  headOfficeId: string;
  body: PromotionUpsertRequestBody;
  now: string;
}): MockPromotionDetail {
  return {
    id: existingPromotion?.id ?? nextId("promo"),
    name: body.name!.trim(),
    headOfficeId,
    isPartiallySupported: Boolean(body.isPartiallySupported),
    note: getNoteText(body.note).trim() || null,
    travelDates: (body.travelDates ?? []).map((range) => ({
      id: (range.id as string | undefined) ?? nextId("travel"),
      from: String(range.from ?? ""),
      to: String(range.to ?? ""),
      version: (range.version as number | undefined) ?? 1,
    })),
    bookingWindow: {
      from: String(body.bookingWindow?.from ?? ""),
      to: String(body.bookingWindow?.to ?? ""),
    },
    bookingWindowRelative: body.bookingWindowRelative
      ? {
          fromDays: body.bookingWindowRelative.fromDays ?? null,
          toDays: body.bookingWindowRelative.toDays ?? null,
        }
      : null,
    conditions: (body.conditions ?? [])
      .map((condition) => normalizeCondition(condition))
      .filter((condition): condition is MockPromotionCondition =>
        Boolean(condition)
      ),
    actions: (body.actions ?? [])
      .map((action) => normalizeAction(action))
      .filter((action): action is MockPromotionAction => Boolean(action)),
    isActive: Boolean(body.isActive),
    version: existingPromotion ? existingPromotion.version + 1 : 1,
    createdAt: existingPromotion?.createdAt ?? now,
    updatedAt: now,
    createdBy: existingPromotion?.createdBy ?? DEFAULT_USER,
    updatedBy: DEFAULT_USER,
  };
}

function normalizeCondition(
  condition: Record<string, unknown>
): MockPromotionCondition | null {
  const type = condition.type as MockPromotionConditionType | undefined;

  switch (type) {
    case "SupplierNights":
      return {
        id: (condition.id as string | undefined) ?? nextId("condition"),
        type,
        supplierId: (condition.supplierId as string | null | undefined) ?? null,
        serviceId: (condition.serviceId as string | null | undefined) ?? null,
        optionText:
          (condition.optionText as string | null | undefined)?.trim() || null,
        minNights:
          getRangeMin(
            (condition.nights as Record<string, unknown> | null | undefined) ??
              condition,
            "minNights"
          ) ?? null,
        maxNights:
          getRangeMax(
            (condition.nights as Record<string, unknown> | null | undefined) ??
              condition,
            "maxNights"
          ) ?? null,
        version: (condition.version as number | undefined) ?? 1,
      };
    case "SuppliersTotal":
      return {
        id: (condition.id as string | undefined) ?? nextId("condition"),
        type,
        minSuppliers:
          getRangeMin(
            (condition.suppliers as
              | Record<string, unknown>
              | null
              | undefined) ?? condition,
            "minSuppliers"
          ) ?? null,
        maxSuppliers:
          getRangeMax(
            (condition.suppliers as
              | Record<string, unknown>
              | null
              | undefined) ?? condition,
            "maxSuppliers"
          ) ?? null,
        version: (condition.version as number | undefined) ?? 1,
      };
    case "NightsTotal":
      return {
        id: (condition.id as string | undefined) ?? nextId("condition"),
        type,
        minNights:
          getRangeMin(
            (condition.nightsTotal as
              | Record<string, unknown>
              | null
              | undefined) ?? condition,
            "minNights"
          ) ?? null,
        maxNights:
          getRangeMax(
            (condition.nightsTotal as
              | Record<string, unknown>
              | null
              | undefined) ?? condition,
            "maxNights"
          ) ?? null,
        version: (condition.version as number | undefined) ?? 1,
      };
    case "PaxNumber":
      return {
        id: (condition.id as string | undefined) ?? nextId("condition"),
        type,
        paxCode:
          (condition.paxCode as MockPromotionPaxCode | undefined) ??
          fromDetailPaxType(
            (condition.paxType as string | null | undefined) ?? null
          ),
        minPax:
          getRangeMin(
            (condition.paxCount as
              | Record<string, unknown>
              | null
              | undefined) ?? condition,
            "minPax"
          ) ?? null,
        maxPax:
          getRangeMax(
            (condition.paxCount as
              | Record<string, unknown>
              | null
              | undefined) ?? condition,
            "maxPax"
          ) ?? null,
        version: (condition.version as number | undefined) ?? 1,
      };
    case "PaxAge":
      return {
        id: (condition.id as string | undefined) ?? nextId("condition"),
        type,
        paxCode:
          (condition.paxCode as MockPromotionPaxCode | undefined) ??
          fromDetailPaxType(
            (condition.paxType as string | null | undefined) ?? null
          ),
        minAge:
          getRangeMin(
            (condition.age as Record<string, unknown> | null | undefined) ??
              condition,
            "minAge"
          ) ?? null,
        maxAge:
          getRangeMax(
            (condition.age as Record<string, unknown> | null | undefined) ??
              condition,
            "maxAge"
          ) ?? null,
        version: (condition.version as number | undefined) ?? 1,
      };
    default:
      return null;
  }
}

function normalizeDiscountRow(
  row: Record<string, unknown>
): MockPromotionDiscountRow {
  return {
    id: (row.id as string | undefined) ?? nextId("discount-row"),
    discountPercent: (row.discountPercent as number | null | undefined) ?? null,
    paxCode:
      (row.paxCode as MockPromotionPaxCode | undefined) ??
      fromDetailPaxType((row.paxType as string | null | undefined) ?? null),
    paxIndexFrom: (row.paxIndexFrom as number | null | undefined) ?? null,
    paxIndexTo: (row.paxIndexTo as number | null | undefined) ?? null,
    targetNightsType:
      (row.targetNightsType as MockPromotionTargetNightsType | undefined) ??
      "Cheapest",
    nightIndexFrom:
      (row.nightIndexFrom as number | null | undefined) ??
      (row.nightsIndexFrom as number | null | undefined) ??
      null,
    nightIndexTo:
      (row.nightIndexTo as number | null | undefined) ??
      (row.nightsIndexTo as number | null | undefined) ??
      null,
  };
}

function normalizeAction(
  action: Record<string, unknown>
): MockPromotionAction | null {
  const type = action.type as "DiscountPercentage" | "AddOn" | undefined;

  if (type === "DiscountPercentage") {
    const rawDiscount = action.discount as
      | Record<string, unknown>
      | null
      | undefined;
    if (rawDiscount) {
      return {
        id: (action.id as string | undefined) ?? nextId("action"),
        type,
        version: (action.version as number | undefined) ?? 1,
        rows: [normalizeDiscountRow(rawDiscount)],
      };
    }

    const rawRows = Array.isArray(action.rows) ? action.rows : [];
    return {
      id: (action.id as string | undefined) ?? nextId("action"),
      type,
      version: (action.version as number | undefined) ?? 1,
      rows: rawRows.map((row) =>
        normalizeDiscountRow(row as Record<string, unknown>)
      ),
    };
  }

  if (type === "AddOn") {
    const rawAddOn = action.addOn as Record<string, unknown> | null | undefined;
    if (rawAddOn) {
      return {
        id: (action.id as string | undefined) ?? nextId("action"),
        type,
        version: (action.version as number | undefined) ?? 1,
        items: [
          {
            id: (rawAddOn.id as string | undefined) ?? nextId("addon"),
            value: String(rawAddOn.name ?? ""),
          },
        ],
      };
    }

    const rawItems = Array.isArray(action.items) ? action.items : [];
    return {
      id: (action.id as string | undefined) ?? nextId("action"),
      type,
      version: (action.version as number | undefined) ?? 1,
      items: rawItems.map((item) => ({
        id:
          ((item as Record<string, unknown>).id as string | undefined) ??
          nextId("addon"),
        value: String(
          (item as Record<string, unknown>).value ??
            (item as Record<string, unknown>).name ??
            ""
        ),
      })),
    };
  }

  return null;
}

const createPromotion = async ({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string | readonly string[] | undefined>;
}) => {
  const headOfficeId = getParam(params, "headOfficeId");

  if (!headOfficeId) {
    return HttpResponse.json(
      { message: "Head office not found" },
      { status: 404 }
    );
  }

  if (isForbiddenHeadOffice(headOfficeId)) {
    return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as PromotionUpsertRequestBody;
  const errors = createPromotionValidationErrors(body);

  if (Object.keys(errors).length > 0) {
    return HttpResponse.json(
      { message: "Validation failed", errors },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const promotion = buildPromotionDetail({
    headOfficeId,
    body,
    now,
  });

  mockPromotionDetails.push(promotion);

  return HttpResponse.json(toPromotionDetailResponse(promotion), {
    status: 201,
  });
};

const updatePromotion = async ({
  request,
  params,
}: {
  request: Request;
  params: Record<string, string | readonly string[] | undefined>;
}) => {
  const promotionId = getParam(params, "promotionId");

  if (!promotionId) {
    return HttpResponse.json(
      { message: "Promotion not found" },
      { status: 404 }
    );
  }
  const promotionIndex = mockPromotionDetails.findIndex(
    (promotion) => promotion.id === promotionId
  );

  if (promotionIndex === -1) {
    return HttpResponse.json(
      { message: "Promotion not found" },
      { status: 404 }
    );
  }

  const existingPromotion = mockPromotionDetails[promotionIndex];

  if (isForbiddenHeadOffice(existingPromotion?.headOfficeId)) {
    return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as PromotionUpsertRequestBody;
  const errors = createPromotionValidationErrors(body);

  if (body.version == null) {
    errors.Version = ["Version is required."];
  }

  if (Object.keys(errors).length > 0) {
    return HttpResponse.json(
      { message: "Validation failed", errors },
      { status: 422 }
    );
  }

  const now = new Date().toISOString();
  const updatedPromotion = buildPromotionDetail({
    existingPromotion,
    headOfficeId: existingPromotion.headOfficeId,
    body,
    now,
  });

  mockPromotionDetails[promotionIndex] = updatedPromotion;

  return HttpResponse.json(toPromotionDetailResponse(updatedPromotion), {
    status: 200,
  });
};

export const promotionRoutes = (API_BASE_URL: string) => [
  http.get(
    `${API_BASE_URL}/catalog/head-offices/:headOfficeId/promotions`,
    getHeadOfficePromotions
  ),
  http.get(
    `${API_BASE_URL}/catalog/promotions/:promotionId`,
    getPromotionDetail
  ),
  http.post(
    `${API_BASE_URL}/catalog/head-offices/:headOfficeId/promotions`,
    createPromotion
  ),
  http.put(`${API_BASE_URL}/catalog/promotions/:promotionId`, updatePromotion),
  http.patch(
    `${API_BASE_URL}/catalog/promotions/:promotionId/activate`,
    ({ params }) => togglePromotionStatus({ params, activate: true })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/promotions/:promotionId/deactivate`,
    ({ params }) => togglePromotionStatus({ params, activate: false })
  ),
];
