import { http, HttpResponse } from "msw";

import { mockServiceOptions } from "./service-options";
import { mockSupplierServices } from "./supplier-services";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const TODAY_ISO = "2026-04-16";

const AGENCY_GROUPS = [
  { agencyGroupId: "ag-1", agencyGroupName: "AAConsultants" },
  { agencyGroupId: "ag-3", agencyGroupName: "RAgent" },
  { agencyGroupId: "ag-4", agencyGroupName: "WHAgent" },
] as const;

const SERVICE_TYPES = [
  {
    id: "14eeea9e-603e-41da-b77d-3c745e1e5da9",
    name: "Accommodation",
  },
  {
    id: "047a5ae2-c3ed-4d6e-9f93-d42e1ff57f7a",
    name: "Activity",
  },
  {
    id: "a5d4151d-d125-4fca-af9d-3e05f5699d5c",
    name: "Flight",
  },
  {
    id: "aff9c2d3-cdf2-4100-b9d2-dcf238265c96",
    name: "Transportation",
  },
  {
    id: "ad54d130-a599-4cef-8602-2f6ab1cb6322",
    name: "Other",
  },
  {
    id: "c7b8a9d0-e1f2-3456-7890-abcdef123456",
    name: "Fee",
  },
] as const;

const SUPPLIERS = [
  { id: "sup-1", name: "Elewana Lodges & Camps" },
  { id: "sup-2", name: "Serengeti Safari Co." },
  { id: "sup-3", name: "Kilimanjaro Trekking Ltd" },
  { id: "sup-4", name: "Ngorongoro Crater Lodge" },
  { id: "sup-5", name: "Tarangire Safari Camp" },
] as const;

const ACTIVE_SEASONS = [
  { validFrom: "2026-01-01", validTo: "2026-12-31" },
  { validFrom: "2027-01-01", validTo: "2027-12-31" },
] as const;

const EXPIRED_SEASON = { validFrom: "2025-01-01", validTo: "2025-12-31" };
const SERVICE_RULE_IDS = [
  "service-1",
  "service-2",
  "service-3",
  "service-4",
  "service-6",
] as const;
const OPTION_RULE_IDS = ["option-1", "option-2"] as const;

const SORT_FIELDS = [
  "agencyGroupName",
  "serviceType",
  "supplierName",
  "serviceName",
  "optionName",
  "validFrom",
  "validTo",
  "marginPercent",
] as const;

type SortField = (typeof SORT_FIELDS)[number];
type SortDirection = "asc" | "desc";

interface MarginRuleRecord {
  id: string;
  agencyGroupId: string;
  agencyGroupName: string;
  serviceTypeNameId: string | null;
  serviceTypeName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  optionId: string | null;
  optionName: string | null;
  validFrom: string;
  validTo: string;
  marginPercent: number;
  version: number;
}

interface MarginRuleSeed {
  agencyGroupId: string;
  agencyGroupName: string;
  serviceTypeNameId?: string | null;
  serviceTypeName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  serviceId?: string | null;
  serviceName?: string | null;
  optionId?: string | null;
  optionName?: string | null;
  validFrom: string;
  validTo: string;
  marginPercent: number;
  version: number;
}

const serviceTypeNameById = new Map<string, string>(
  SERVICE_TYPES.map((serviceType) => [serviceType.id, serviceType.name])
);
const serviceById = new Map(
  mockSupplierServices.map((service) => [service.id, service])
);
const optionById = new Map(
  mockServiceOptions.map((option) => [option.id, option])
);

function encodeCursor(offset: number) {
  try {
    return btoa(String(offset));
  } catch {
    return String(offset);
  }
}

function decodeCursor(cursor: string | null) {
  if (!cursor) return 0;

  try {
    const parsed = Number(atob(cursor));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    const parsed = Number(cursor);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
}

function clampPageSize(rawValue: string | null) {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(MAX_PAGE_SIZE, Math.trunc(parsed));
}

function parseMarginPercent(rawValue: string | null) {
  if (!rawValue?.trim()) return null;

  const parsed = Number(rawValue);

  return Number.isFinite(parsed) ? parsed : null;
}

function createMarginRule(
  index: number,
  seed: MarginRuleSeed
): MarginRuleRecord {
  return {
    id: `margin-rule-${String(index).padStart(4, "0")}`,
    agencyGroupId: seed.agencyGroupId,
    agencyGroupName: seed.agencyGroupName,
    serviceTypeNameId: seed.serviceTypeNameId ?? null,
    serviceTypeName: seed.serviceTypeName ?? null,
    supplierId: seed.supplierId ?? null,
    supplierName: seed.supplierName ?? null,
    serviceId: seed.serviceId ?? null,
    serviceName: seed.serviceName ?? null,
    optionId: seed.optionId ?? null,
    optionName: seed.optionName ?? null,
    validFrom: seed.validFrom,
    validTo: seed.validTo,
    marginPercent: seed.marginPercent,
    version: seed.version,
  };
}

function createMockMarginRules() {
  const rules: MarginRuleRecord[] = [];
  let index = 1;

  for (const [agencyIndex, agencyGroup] of AGENCY_GROUPS.entries()) {
    for (const [seasonIndex, season] of ACTIVE_SEASONS.entries()) {
      rules.push(
        createMarginRule(index++, {
          ...agencyGroup,
          validFrom: season.validFrom,
          validTo: season.validTo,
          marginPercent: Number(
            (7.5 + agencyIndex + seasonIndex * 0.5).toFixed(2)
          ),
          version: seasonIndex + 1,
        })
      );
    }

    for (const [supplierIndex, supplier] of SUPPLIERS.entries()) {
      for (const [seasonIndex, season] of ACTIVE_SEASONS.entries()) {
        rules.push(
          createMarginRule(index++, {
            ...agencyGroup,
            supplierId: supplier.id,
            supplierName: supplier.name,
            validFrom: season.validFrom,
            validTo: season.validTo,
            marginPercent: Number(
              (
                9.25 +
                agencyIndex +
                supplierIndex * 0.35 +
                seasonIndex * 0.5
              ).toFixed(2)
            ),
            version: seasonIndex + 1,
          })
        );
      }

      rules.push(
        createMarginRule(index++, {
          ...agencyGroup,
          supplierId: supplier.id,
          supplierName: supplier.name,
          validFrom: EXPIRED_SEASON.validFrom,
          validTo: EXPIRED_SEASON.validTo,
          marginPercent: Number(
            (6 + agencyIndex + supplierIndex * 0.25).toFixed(2)
          ),
          version: 1,
        })
      );

      for (const [serviceTypeIndex, serviceType] of SERVICE_TYPES.entries()) {
        rules.push(
          createMarginRule(index++, {
            ...agencyGroup,
            serviceTypeNameId: serviceType.id,
            serviceTypeName: serviceType.name,
            supplierId: supplier.id,
            supplierName: supplier.name,
            validFrom: ACTIVE_SEASONS[0].validFrom,
            validTo: ACTIVE_SEASONS[0].validTo,
            marginPercent: Number(
              (
                10.5 +
                agencyIndex +
                supplierIndex * 0.2 +
                serviceTypeIndex * 0.15
              ).toFixed(2)
            ),
            version: 2,
          })
        );
      }
    }

    for (const [serviceIndex, serviceId] of SERVICE_RULE_IDS.entries()) {
      const service = serviceById.get(serviceId);

      if (!service) continue;

      rules.push(
        createMarginRule(index++, {
          ...agencyGroup,
          serviceTypeNameId: service.serviceTypeId,
          serviceTypeName:
            serviceTypeNameById.get(service.serviceTypeId) ?? null,
          supplierId: service.supplierId,
          supplierName:
            SUPPLIERS.find((supplier) => supplier.id === service.supplierId)
              ?.name ?? null,
          serviceId: service.id,
          serviceName: service.name,
          validFrom: ACTIVE_SEASONS[0].validFrom,
          validTo: ACTIVE_SEASONS[0].validTo,
          marginPercent: Number(
            (12.5 + agencyIndex + serviceIndex * 0.4).toFixed(2)
          ),
          version: 3,
        })
      );
    }

    for (const [optionIndex, optionId] of OPTION_RULE_IDS.entries()) {
      const option = optionById.get(optionId);
      const service = option ? serviceById.get(option.serviceId) : null;

      if (!option || !service) continue;

      rules.push(
        createMarginRule(index++, {
          ...agencyGroup,
          serviceTypeNameId: service.serviceTypeId,
          serviceTypeName:
            serviceTypeNameById.get(service.serviceTypeId) ?? null,
          supplierId: service.supplierId,
          supplierName:
            SUPPLIERS.find((supplier) => supplier.id === service.supplierId)
              ?.name ?? null,
          serviceId: service.id,
          serviceName: service.name,
          optionId: option.id,
          optionName: option.title,
          validFrom: ACTIVE_SEASONS[0].validFrom,
          validTo: ACTIVE_SEASONS[0].validTo,
          marginPercent: Number(
            (14 + agencyIndex + optionIndex * 0.5).toFixed(2)
          ),
          version: 3,
        })
      );
    }
  }

  return rules;
}

function getSortField(rawValue: string | null): SortField {
  return SORT_FIELDS.includes(rawValue as SortField)
    ? (rawValue as SortField)
    : "agencyGroupName";
}

function getSortDirection(rawValue: string | null): SortDirection {
  return rawValue === "desc" ? "desc" : "asc";
}

function matchesDateRange(
  rule: MarginRuleRecord,
  validFrom: string | null,
  validTo: string | null
) {
  if (validFrom && validTo) {
    return rule.validFrom <= validTo && rule.validTo >= validFrom;
  }

  if (validFrom) {
    return rule.validTo >= validFrom;
  }

  if (validTo) {
    return rule.validFrom <= validTo;
  }

  return true;
}

function compareValues(left: number | string, right: number | string) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    sensitivity: "base",
  });
}

function getSortValue(rule: MarginRuleRecord, sortBy: SortField) {
  switch (sortBy) {
    case "serviceType":
      return rule.serviceTypeName ?? "";
    case "supplierName":
      return rule.supplierName ?? "";
    case "serviceName":
      return rule.serviceName ?? "";
    case "optionName":
      return rule.optionName ?? "";
    case "validFrom":
      return rule.validFrom;
    case "validTo":
      return rule.validTo;
    case "marginPercent":
      return rule.marginPercent;
    case "agencyGroupName":
    default:
      return rule.agencyGroupName;
  }
}

function sortMarginRules(
  rules: MarginRuleRecord[],
  sortBy: SortField,
  sortDirection: SortDirection
) {
  const multiplier = sortDirection === "desc" ? -1 : 1;

  return [...rules].sort((left, right) => {
    const comparison = compareValues(
      getSortValue(left, sortBy),
      getSortValue(right, sortBy)
    );

    if (comparison !== 0) {
      return comparison * multiplier;
    }

    return compareValues(left.id, right.id);
  });
}

interface MarginRuleMutationPayload {
  agencyGroupId: string;
  serviceTypeId: string | null;
  supplierId: string | null;
  serviceId: string | null;
  optionId: string | null;
  validFrom: string;
  validTo: string;
  marginPercent: number;
  version?: number;
}

function getTomorrowIsoDate(fromIsoDate: string) {
  const nextDate = new Date(`${fromIsoDate}T00:00:00.000Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  return nextDate.toISOString().slice(0, 10);
}

function normalizeNullableId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validationErrorResponse(
  errors: Record<string, string[]>,
  message = "Validation failed"
) {
  return HttpResponse.json(
    {
      message,
      errors,
    },
    { status: 422 }
  );
}

function conflictResponse(message: string) {
  return HttpResponse.json(
    {
      message,
    },
    { status: 409 }
  );
}

function notFoundResponse() {
  return HttpResponse.json(
    {
      message: "Margin rule not found.",
    },
    { status: 404 }
  );
}

function validateMarginRulePayload(
  payload: MarginRuleMutationPayload,
  existingRule?: MarginRuleRecord
) {
  const errors: Record<string, string[]> = {};
  const agencyGroup = AGENCY_GROUPS.find(
    (item) => item.agencyGroupId === payload.agencyGroupId
  );
  const serviceType = payload.serviceTypeId
    ? SERVICE_TYPES.find((item) => item.id === payload.serviceTypeId)
    : null;
  const supplier = payload.supplierId
    ? SUPPLIERS.find((item) => item.id === payload.supplierId)
    : null;
  const service = payload.serviceId ? serviceById.get(payload.serviceId) : null;
  const option = payload.optionId ? optionById.get(payload.optionId) : null;

  if (!payload.agencyGroupId || !agencyGroup) {
    errors.agencyGroupId = ["Must select existing active Agency Group."];
  }

  if (payload.serviceTypeId && !serviceType) {
    errors.serviceTypeId = ["Must reference existing Service Type."];
  }

  if (!payload.validFrom) {
    errors.validFrom = ["Valid From is required."];
  } else if (!isIsoDate(payload.validFrom)) {
    errors.validFrom = ["Valid From must be a valid date."];
  }

  if (!payload.validTo) {
    errors.validTo = ["Valid To is required."];
  } else if (!isIsoDate(payload.validTo)) {
    errors.validTo = ["Valid To must be a valid date."];
  }

  if (
    payload.validFrom &&
    payload.validTo &&
    isIsoDate(payload.validFrom) &&
    isIsoDate(payload.validTo) &&
    payload.validFrom > payload.validTo
  ) {
    errors.validTo = ["Valid To must be on or after Valid From."];
  }

  if (!Number.isFinite(payload.marginPercent) || payload.marginPercent < 0) {
    errors.marginPercent = ["Margin Percent must be numeric and 0 or greater."];
  }

  if (payload.supplierId && !supplier) {
    errors.supplierId = ["Must reference existing Supplier if selected."];
  }

  if (payload.serviceId && !payload.supplierId) {
    errors.serviceId = ["Service requires a selected Supplier."];
  } else if (payload.serviceId && !service) {
    errors.serviceId = [
      "Must reference existing Service of selected Supplier.",
    ];
  } else if (
    payload.serviceId &&
    service &&
    payload.supplierId &&
    service.supplierId !== payload.supplierId
  ) {
    errors.serviceId = [
      "Must reference existing Service of selected Supplier.",
    ];
  }

  if (payload.optionId && !payload.serviceId) {
    errors.optionId = ["Option requires a selected Service."];
  } else if (payload.optionId && !option) {
    errors.optionId = ["Must reference existing Option of selected Service."];
  } else if (
    payload.optionId &&
    option &&
    payload.serviceId &&
    option.serviceId !== payload.serviceId
  ) {
    errors.optionId = ["Must reference existing Option of selected Service."];
  }

  if (existingRule) {
    const isFutureRule = existingRule.validFrom > TODAY_ISO;
    const isPastRule = existingRule.validTo < TODAY_ISO;

    if (isPastRule) {
      return {
        errors: {
          Request: ["Past margin rules cannot be edited."],
        },
        agencyGroup,
        serviceType,
        supplier,
        service,
        option,
      };
    }

    if (!isFutureRule) {
      const hasScopeChanges =
        existingRule.agencyGroupId !== payload.agencyGroupId ||
        existingRule.serviceTypeNameId !== payload.serviceTypeId ||
        existingRule.supplierId !== payload.supplierId ||
        existingRule.serviceId !== payload.serviceId ||
        existingRule.optionId !== payload.optionId ||
        existingRule.validFrom !== payload.validFrom ||
        existingRule.marginPercent !== payload.marginPercent;

      if (hasScopeChanges) {
        errors.validTo = ["Only Valid To can be updated for active rules."];
      }

      if (payload.validTo && payload.validTo < getTomorrowIsoDate(TODAY_ISO)) {
        errors.validTo = [
          "Valid To must be tomorrow or later for active rules.",
        ];
      }
    }
  }

  return {
    errors,
    agencyGroup,
    serviceType,
    supplier,
    service,
    option,
  };
}

function hasExactDuplicateRule(
  payload: MarginRuleMutationPayload,
  excludeId?: string
) {
  return mockMarginRules.some(
    (rule) =>
      rule.id !== excludeId &&
      rule.agencyGroupId === payload.agencyGroupId &&
      rule.serviceTypeNameId === payload.serviceTypeId &&
      rule.supplierId === payload.supplierId &&
      rule.serviceId === payload.serviceId &&
      rule.optionId === payload.optionId &&
      rule.validFrom === payload.validFrom &&
      rule.validTo === payload.validTo
  );
}

function buildMarginRuleRecord(
  payload: MarginRuleMutationPayload,
  options: {
    id: string;
    version: number;
    agencyGroupName: string;
    serviceTypeName: string | null;
    supplierName: string | null;
    serviceName: string | null;
    optionName: string | null;
  }
): MarginRuleRecord {
  return {
    id: options.id,
    agencyGroupId: payload.agencyGroupId,
    agencyGroupName: options.agencyGroupName,
    serviceTypeNameId: payload.serviceTypeId,
    serviceTypeName: options.serviceTypeName,
    supplierId: payload.supplierId,
    supplierName: options.supplierName,
    serviceId: payload.serviceId,
    serviceName: options.serviceName,
    optionId: payload.optionId,
    optionName: options.optionName,
    validFrom: payload.validFrom,
    validTo: payload.validTo,
    marginPercent: payload.marginPercent,
    version: options.version,
  };
}

async function parseMarginRulePayload(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;

  return {
    agencyGroupId:
      typeof body.agencyGroupId === "string" ? body.agencyGroupId : "",
    serviceTypeId: normalizeNullableId(body.serviceTypeId),
    supplierId: normalizeNullableId(body.supplierId),
    serviceId: normalizeNullableId(body.serviceId),
    optionId: normalizeNullableId(body.optionId),
    validFrom: typeof body.validFrom === "string" ? body.validFrom : "",
    validTo: typeof body.validTo === "string" ? body.validTo : "",
    marginPercent:
      typeof body.marginPercent === "number"
        ? body.marginPercent
        : Number(body.marginPercent),
    version:
      typeof body.version === "number" ? body.version : Number(body.version),
  } satisfies MarginRuleMutationPayload;
}

let mockMarginRules = createMockMarginRules();

export function resetMarginRulesMockState() {
  mockMarginRules = createMockMarginRules();
}

const getMarginRules = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
  const agencyGroupId = url.searchParams.get("agencyGroupId");
  const serviceTypeId = url.searchParams.get("serviceTypeId");
  const supplierId = url.searchParams.get("supplierId");
  const serviceId = url.searchParams.get("serviceId");
  const optionId = url.searchParams.get("optionId");
  const validFrom = url.searchParams.get("validFrom");
  const validTo = url.searchParams.get("validTo");
  const marginPercent = parseMarginPercent(
    url.searchParams.get("marginPercent")
  );
  const hideExpiredParam = url.searchParams.get("hideExpired");
  const hideExpired =
    hideExpiredParam == null ? false : hideExpiredParam !== "false";
  const pageSize = clampPageSize(url.searchParams.get("pageSize"));
  const cursor = decodeCursor(url.searchParams.get("cursor"));
  const sortBy = getSortField(url.searchParams.get("sortBy"));
  const sortDirection = getSortDirection(url.searchParams.get("sortDirection"));

  const filtered = mockMarginRules.filter((rule) => {
    if (
      search &&
      !rule.agencyGroupName.toLowerCase().includes(search) &&
      !(rule.supplierName ?? "").toLowerCase().includes(search)
    ) {
      return false;
    }

    if (agencyGroupId && rule.agencyGroupId !== agencyGroupId) {
      return false;
    }

    if (serviceTypeId && rule.serviceTypeNameId !== serviceTypeId) {
      return false;
    }

    if (supplierId && rule.supplierId !== supplierId) {
      return false;
    }

    if (serviceId && rule.serviceId !== serviceId) {
      return false;
    }

    if (optionId && rule.optionId !== optionId) {
      return false;
    }

    if (hideExpired && rule.validTo < TODAY_ISO) {
      return false;
    }

    if (!matchesDateRange(rule, validFrom, validTo)) {
      return false;
    }

    if (marginPercent != null && rule.marginPercent !== marginPercent) {
      return false;
    }

    return true;
  });

  const sorted = sortMarginRules(filtered, sortBy, sortDirection);
  const totalCount = sorted.length;
  const items = sorted.slice(cursor, cursor + pageSize);
  const nextCursor =
    cursor + pageSize < totalCount ? encodeCursor(cursor + pageSize) : null;

  return HttpResponse.json(
    {
      items,
      nextCursor,
      totalCount,
    },
    { status: 200 }
  );
};

const createMarginRuleHandler = async ({ request }: { request: Request }) => {
  const payload = await parseMarginRulePayload(request);
  const { errors, agencyGroup, serviceType, supplier, service, option } =
    validateMarginRulePayload(payload);

  if (Object.keys(errors).length > 0) {
    return validationErrorResponse(errors);
  }

  if (hasExactDuplicateRule(payload)) {
    return conflictResponse(
      "Rule already exists. Adjust the conditions to proceed."
    );
  }

  const nextRule = buildMarginRuleRecord(payload, {
    id: crypto.randomUUID(),
    version: 1,
    agencyGroupName: agencyGroup!.agencyGroupName,
    serviceTypeName: serviceType?.name ?? null,
    supplierName: supplier?.name ?? null,
    serviceName: service?.name ?? null,
    optionName: option?.title ?? null,
  });

  mockMarginRules = [...mockMarginRules, nextRule];

  return HttpResponse.json(nextRule, { status: 201 });
};

const updateMarginRuleHandler = async ({
  params,
  request,
}: {
  params: { marginRuleId?: string };
  request: Request;
}) => {
  const marginRuleId = params.marginRuleId;

  if (!marginRuleId) {
    return notFoundResponse();
  }

  const currentRule = mockMarginRules.find((rule) => rule.id === marginRuleId);

  if (!currentRule) {
    return notFoundResponse();
  }

  const payload = await parseMarginRulePayload(request);
  const { errors, agencyGroup, serviceType, supplier, service, option } =
    validateMarginRulePayload(payload, currentRule);

  if (
    currentRule.version !== payload.version ||
    !Number.isFinite(payload.version)
  ) {
    errors.version = ["Version does not match the latest record."];
  }

  if (Object.keys(errors).length > 0) {
    return validationErrorResponse(errors);
  }

  if (hasExactDuplicateRule(payload, currentRule.id)) {
    return conflictResponse(
      "Rule already exists. Adjust the conditions to proceed."
    );
  }

  const nextRule = buildMarginRuleRecord(payload, {
    id: currentRule.id,
    version: currentRule.version + 1,
    agencyGroupName: agencyGroup!.agencyGroupName,
    serviceTypeName: serviceType?.name ?? null,
    supplierName: supplier?.name ?? null,
    serviceName: service?.name ?? null,
    optionName: option?.title ?? null,
  });

  mockMarginRules = mockMarginRules.map((rule) =>
    rule.id === currentRule.id ? nextRule : rule
  );

  return HttpResponse.json(nextRule, { status: 200 });
};

const deleteMarginRuleHandler = ({
  params,
}: {
  params: { marginRuleId?: string };
}) => {
  const marginRuleId = params.marginRuleId;

  if (!marginRuleId) {
    return notFoundResponse();
  }

  const currentRule = mockMarginRules.find((rule) => rule.id === marginRuleId);

  if (!currentRule) {
    return notFoundResponse();
  }

  if (currentRule.validFrom <= TODAY_ISO) {
    return conflictResponse("Only future margin rules can be deleted.");
  }

  mockMarginRules = mockMarginRules.filter(
    (rule) => rule.id !== currentRule.id
  );

  return new HttpResponse(null, { status: 204 });
};

export const marginRulesRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/margin-rules`, getMarginRules),
  http.post(`${API_BASE_URL}/catalog/margin-rules`, createMarginRuleHandler),
  http.put(
    `${API_BASE_URL}/catalog/margin-rules/:marginRuleId`,
    updateMarginRuleHandler
  ),
  http.delete(
    `${API_BASE_URL}/catalog/margin-rules/:marginRuleId`,
    deleteMarginRuleHandler
  ),
];
