import { http, HttpResponse } from "msw";

type PaxType = "Adult" | "Child" | "Infant" | "Teen";

interface MockSupplierPaxType {
  id: string;
  name: PaxType;
  paxType: PaxType;
  ageFrom: number | null;
  ageTo: number | null;
  isActive: boolean;
  version: number;
  isAdult: boolean;
  isInfant: boolean;
  canDeactivate: boolean;
  hasActiveDownstreamReferences: boolean;
}

interface MockSupplierPaxTypeSchedule {
  id: string;
  supplierId: string;
  validFrom: string;
  validTo: string | null;
  paxTypes: MockSupplierPaxType[];
  version: number;
}

interface SupplierPaxTypeRequestBody {
  id?: string;
  name?: PaxType;
  paxType?: PaxType;
  ageFrom?: number | null;
  ageTo?: number | null;
  isActive?: boolean;
  version?: number;
}

interface SupplierPaxTypeScheduleRequestBody {
  supplierId?: string;
  validFrom?: string;
  validTo?: string | null;
  paxTypes?: SupplierPaxTypeRequestBody[];
  version?: number;
}

const PAX_TYPE_ORDER: PaxType[] = ["Adult", "Child", "Infant", "Teen"];

const validationMessages = {
  validFromRequired: "Valid From is required.",
  activeAgeRangeRequired: "Age range is required for active Pax Types.",
  ageFromLessThanAgeTo: "Age From must be less than Age To.",
  rangesMustNotOverlap: "Age ranges must not overlap across active Pax Types.",
  adultCannotBeDeactivated: "Adult cannot be deactivated.",
  adultMustCoverHighestAgeBoundary:
    "Adult must cover the highest age boundary.",
  endDateMustBeOnOrAfterStart: "End date must be on or after start date.",
  versionConflict:
    "This PAX Configuration was updated by another user. Refresh and try again.",
};

function makePaxType(
  id: string,
  paxType: PaxType,
  ageFrom: number | null,
  ageTo: number | null,
  isActive: boolean,
  version = 1
): MockSupplierPaxType {
  const isAdult = paxType === "Adult";
  const isInfant = paxType === "Infant";
  return {
    id,
    name: paxType,
    paxType,
    ageFrom,
    ageTo,
    isActive: isAdult ? true : isActive,
    version,
    isAdult,
    isInfant,
    canDeactivate: !isAdult,
    hasActiveDownstreamReferences: false,
  };
}

let mockSupplierPaxTypeSchedules: MockSupplierPaxTypeSchedule[] = [
  {
    id: "sup-1-pax-schedule-2026",
    supplierId: "sup-1",
    validFrom: "2026-01-01",
    validTo: null,
    version: 1,
    paxTypes: [
      makePaxType("sup-1-pax-2026-adt", "Adult", 18, 999, true),
      makePaxType("sup-1-pax-2026-chd", "Child", 2, 17, true),
      makePaxType("sup-1-pax-2026-inf", "Infant", 0, 1, true),
      makePaxType("sup-1-pax-2026-yth", "Teen", null, null, false),
    ],
  },
  {
    id: "sup-1-pax-schedule-2025",
    supplierId: "sup-1",
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    version: 3,
    paxTypes: [
      makePaxType("sup-1-pax-2025-adt", "Adult", 18, 99, true, 3),
      makePaxType("sup-1-pax-2025-chd", "Child", 3, 17, true, 3),
      makePaxType("sup-1-pax-2025-inf", "Infant", 0, 2, true, 3),
      makePaxType("sup-1-pax-2025-yth", "Teen", null, null, false, 3),
    ],
  },
  {
    id: "sup-1-pax-schedule-2024",
    supplierId: "sup-1",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    version: 2,
    paxTypes: [
      makePaxType("sup-1-pax-2024-adt", "Adult", 18, 99, true, 2),
      makePaxType("sup-1-pax-2024-chd", "Child", 5, 17, true, 2),
      makePaxType("sup-1-pax-2024-inf", "Infant", 0, 4, true, 2),
      makePaxType("sup-1-pax-2024-yth", "Teen", null, null, false, 2),
    ],
  },
];

function sortSchedules(schedules: MockSupplierPaxTypeSchedule[]) {
  return [...schedules].sort((a, b) => b.validFrom.localeCompare(a.validFrom));
}

function validationError(message: string) {
  return HttpResponse.json({ message }, { status: 422 });
}

function ageRangesOverlap(
  fromA: number,
  toA: number,
  fromB: number,
  toB: number
) {
  return fromA <= toB && toA >= fromB;
}

function validateSchedule(body: SupplierPaxTypeScheduleRequestBody) {
  if (!body.validFrom) {
    return validationMessages.validFromRequired;
  }

  if (body.validFrom && body.validTo && body.validTo < body.validFrom) {
    return validationMessages.endDateMustBeOnOrAfterStart;
  }

  const paxTypes = Array.isArray(body.paxTypes) ? body.paxTypes : [];
  const adult = paxTypes.find((row) => row.paxType === "Adult");
  if (adult && adult.isActive === false) {
    return validationMessages.adultCannotBeDeactivated;
  }

  const activeRows = paxTypes
    .filter((row) => row.paxType === "Adult" || row.isActive)
    .map((row) => ({
      ...row,
      ageFrom: row.ageFrom ?? null,
      ageTo: row.ageTo ?? null,
    }));

  for (const row of activeRows) {
    if (row.ageFrom === null || row.ageTo === null) {
      return validationMessages.activeAgeRangeRequired;
    }
    if (row.ageFrom >= row.ageTo) {
      return validationMessages.ageFromLessThanAgeTo;
    }
  }

  for (let i = 0; i < activeRows.length; i += 1) {
    for (let j = i + 1; j < activeRows.length; j += 1) {
      const current = activeRows[i];
      const candidate = activeRows[j];
      if (
        ageRangesOverlap(
          current.ageFrom!,
          current.ageTo!,
          candidate.ageFrom!,
          candidate.ageTo!
        )
      ) {
        return validationMessages.rangesMustNotOverlap;
      }
    }
  }

  const adultRow = activeRows.find((row) => row.paxType === "Adult");
  if (adultRow) {
    const highestOtherAgeTo = Math.max(
      ...activeRows
        .filter((row) => row.paxType !== "Adult")
        .map((row) => row.ageTo ?? Number.NEGATIVE_INFINITY),
      Number.NEGATIVE_INFINITY
    );
    if ((adultRow.ageTo ?? Number.NEGATIVE_INFINITY) < highestOtherAgeTo) {
      return validationMessages.adultMustCoverHighestAgeBoundary;
    }
  }

  return null;
}

function normalizePaxTypes(
  scheduleId: string,
  rows: SupplierPaxTypeRequestBody[] | undefined,
  version = 1
) {
  return PAX_TYPE_ORDER.map((paxType) => {
    const row = rows?.find((candidate) => candidate.paxType === paxType);
    return makePaxType(
      row?.id ?? `${scheduleId}-${paxType.toLowerCase()}`,
      paxType,
      row?.ageFrom ?? null,
      row?.ageTo ?? null,
      paxType === "Adult" ? true : Boolean(row?.isActive),
      row?.version ?? version
    );
  });
}

const listSupplierPaxTypeSchedules = ({
  params,
}: {
  params: { supplierId: string };
}) => {
  return HttpResponse.json(
    sortSchedules(
      mockSupplierPaxTypeSchedules.filter(
        (schedule) => schedule.supplierId === params.supplierId
      )
    ),
    { status: 200 }
  );
};

const createSupplierPaxTypeSchedule = async ({
  params,
  request,
}: {
  params: { supplierId: string };
  request: Request;
}) => {
  const body = (await request.json()) as SupplierPaxTypeScheduleRequestBody;
  const validationMessage = validateSchedule({
    ...body,
    supplierId: params.supplierId,
  });
  if (validationMessage) return validationError(validationMessage);

  const id = `supplier-pax-schedule-${Date.now()}`;
  const schedule: MockSupplierPaxTypeSchedule = {
    id,
    supplierId: params.supplierId,
    validFrom: body.validFrom!,
    validTo: body.validTo ?? null,
    paxTypes: normalizePaxTypes(id, body.paxTypes),
    version: 1,
  };

  mockSupplierPaxTypeSchedules = [...mockSupplierPaxTypeSchedules, schedule];

  return HttpResponse.json(schedule, { status: 201 });
};

const updateSupplierPaxTypeSchedule = async ({
  params,
  request,
}: {
  params: { scheduleId: string };
  request: Request;
}) => {
  const schedule = mockSupplierPaxTypeSchedules.find(
    (item) => item.id === params.scheduleId
  );
  if (!schedule) {
    return HttpResponse.json(
      { message: "PAX Configuration not found" },
      { status: 404 }
    );
  }

  const body = (await request.json()) as SupplierPaxTypeScheduleRequestBody;
  if (body.version !== undefined && body.version !== schedule.version) {
    return HttpResponse.json(
      { message: validationMessages.versionConflict },
      { status: 409 }
    );
  }

  const validationMessage = validateSchedule({
    supplierId: schedule.supplierId,
    validFrom: body.validFrom ?? schedule.validFrom,
    validTo: body.validTo ?? null,
    paxTypes: body.paxTypes ?? schedule.paxTypes,
  });
  if (validationMessage) return validationError(validationMessage);

  schedule.validFrom = body.validFrom ?? schedule.validFrom;
  schedule.validTo = body.validTo ?? null;
  schedule.paxTypes = normalizePaxTypes(
    schedule.id,
    body.paxTypes ?? schedule.paxTypes,
    schedule.version
  );
  schedule.version += 1;

  return HttpResponse.json(schedule, { status: 200 });
};

function toParams(
  params: Record<string, string | readonly string[] | undefined>
) {
  return {
    supplierId: String(params.supplierId ?? ""),
    scheduleId: String(params.scheduleId ?? ""),
  };
}

export const supplierPaxTypeScheduleRoutes = (API_BASE_URL: string) => [
  http.get(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/pax-type-schedules`,
    (info) =>
      listSupplierPaxTypeSchedules({
        params: toParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
      })
  ),
  http.post(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/pax-type-schedules`,
    (info) =>
      createSupplierPaxTypeSchedule({
        params: toParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
        request: info.request,
      })
  ),
  http.put(`${API_BASE_URL}/catalog/pax-type-schedules/:scheduleId`, (info) =>
    updateSupplierPaxTypeSchedule({
      params: toParams(
        info.params as Record<string, string | readonly string[] | undefined>
      ),
      request: info.request,
    })
  ),
];
