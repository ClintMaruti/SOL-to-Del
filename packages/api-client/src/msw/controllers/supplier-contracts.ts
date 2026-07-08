import { http, HttpResponse } from "msw";

import { getMockAgencyGroupById } from "./agency-groups";
import { mockServiceOptions } from "./service-options";
import { mockSupplierServices } from "./supplier-services";
interface MockSupplierCloseout {
  id: string;
  supplierId: string;
  serviceId?: string | null;
  serviceName?: string | null;
  serviceOptionId?: string | null;
  serviceOptionName?: string | null;
  travelDateFrom: string;
  travelDateTo: string;
  reason: string | null;
  status: "Active" | "Inactive";
  version: number;
}

interface MockCondition {
  id: string;
  starts: string;
  referenceEvent: string;
  startDay: number;
  startTime: string;
  endDay: number;
  endTime: string;
  penaltyValue: number;
  penaltyType: string;
}

interface MockPolicyTravelDate {
  id: string;
  version: number;
  from: string;
  to: string | null;
}

interface MockPolicy {
  id: string;
  name: string;
  description: string;
  isRefundable: boolean;
  isActive: boolean;
  travelDates: MockPolicyTravelDate[];
  conditions: MockCondition[];
}

interface MockSupplierContract {
  id: string;
  supplierId: string;
  /** Catalog service this contract belongs to (GET/POST .../services/{serviceId}/contracts). */
  serviceId: string;
  name: string;
  link: string | null;
  agencyGroupId: string | null;
  agencyGroupName: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** True when no dependent entities exist. */
  canDelete: boolean;
  policies: MockPolicy[];
}

type ContractRequestBody = {
  name?: string;
  link?: string | null;
  agencyGroupId?: string | null;
  validFrom?: string;
  validTo?: string;
};

type PolicyTravelDateRequestBody = {
  id?: string;
  version?: number;
  dateFrom?: string | null;
  dateTo?: string | null;
};

const normalizeAgencyGroupId = (agencyGroupId: unknown): string | null => {
  if (typeof agencyGroupId !== "string") return null;
  const trimmed = agencyGroupId.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getAgencyGroupName = (agencyGroupId: string | null): string | null => {
  if (!agencyGroupId) return null;
  return getMockAgencyGroupById(agencyGroupId)?.name ?? null;
};

const getContractConflictMessage = (contract: MockSupplierContract): string =>
  `Contract overlaps with ${contract.name} (${contract.validFrom} - ${contract.validTo})`;

const dateRangesOverlap = (
  fromA: string,
  toA: string,
  fromB: string,
  toB: string
) => fromA <= toB && toA >= fromB;

const findDuplicateContractName = ({
  supplierId,
  name,
  excludeContractId,
}: {
  supplierId: string;
  name: string;
  excludeContractId?: string;
}) =>
  mockSupplierContracts.find(
    (contract) =>
      contract.supplierId === supplierId &&
      contract.id !== excludeContractId &&
      contract.name.trim().toLowerCase() === name.trim().toLowerCase()
  );

const findOverlappingContract = ({
  supplierId,
  agencyGroupId,
  validFrom,
  validTo,
  excludeContractId,
}: {
  supplierId: string;
  agencyGroupId: string | null;
  validFrom: string;
  validTo: string;
  excludeContractId?: string;
}) =>
  mockSupplierContracts.find(
    (contract) =>
      contract.supplierId === supplierId &&
      contract.id !== excludeContractId &&
      (contract.agencyGroupId ?? null) === (agencyGroupId ?? null) &&
      dateRangesOverlap(
        contract.validFrom,
        contract.validTo,
        validFrom,
        validTo
      )
  );

const validateContractRequest = ({
  supplierId,
  body,
  currentContract,
}: {
  supplierId: string;
  body: ContractRequestBody;
  currentContract?: MockSupplierContract;
}) => {
  const nextName =
    body.name !== undefined
      ? body.name.trim()
      : (currentContract?.name.trim() ?? "");
  const nextValidFrom = body.validFrom ?? currentContract?.validFrom;
  const nextValidTo = body.validTo ?? currentContract?.validTo;
  const nextAgencyGroupId =
    body.agencyGroupId !== undefined
      ? normalizeAgencyGroupId(body.agencyGroupId)
      : (currentContract?.agencyGroupId ?? null);

  if (!nextName) {
    return HttpResponse.json({ message: "Name is required" }, { status: 400 });
  }
  if (!nextValidFrom || !nextValidTo) {
    return HttpResponse.json(
      { message: "Valid From and Valid To are required" },
      { status: 400 }
    );
  }
  if (nextValidTo < nextValidFrom) {
    return HttpResponse.json(
      { message: "Valid To must be on or after Valid From" },
      { status: 400 }
    );
  }

  const duplicate = findDuplicateContractName({
    supplierId,
    name: nextName,
    excludeContractId: currentContract?.id,
  });
  if (duplicate) {
    return HttpResponse.json(
      {
        message: `Contract name must be unique per supplier. "${duplicate.name}" already exists.`,
      },
      { status: 409 }
    );
  }

  const overlappingContract = findOverlappingContract({
    supplierId,
    agencyGroupId: nextAgencyGroupId,
    validFrom: nextValidFrom,
    validTo: nextValidTo,
    excludeContractId: currentContract?.id,
  });
  if (overlappingContract) {
    return HttpResponse.json(
      { message: getContractConflictMessage(overlappingContract) },
      { status: 409 }
    );
  }

  return null;
};

const normalizeTravelDates = (
  ranges: PolicyTravelDateRequestBody[] | undefined,
  fallbackFrom?: string
): MockPolicyTravelDate[] => {
  const source =
    ranges && ranges.length > 0
      ? ranges
      : [{ dateFrom: fallbackFrom ?? "", dateTo: null }];

  return source.map((range, index) => ({
    id:
      range.id ??
      `policy-range-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
    version: range.version ?? 1,
    from: range.dateFrom ?? "",
    to: range.dateTo ?? null,
  }));
};

const validateTravelDates = (
  ranges: MockPolicyTravelDate[],
  contract: Pick<MockSupplierContract, "validFrom" | "validTo">
) => {
  const invalidMissingFrom = ranges.some((range) => !range.from);
  if (invalidMissingFrom) {
    return HttpResponse.json(
      { message: "Travel Date From is required" },
      { status: 400 }
    );
  }

  const invalidOrder = ranges.some(
    (range) => range.to != null && range.to !== "" && range.from > range.to
  );
  if (invalidOrder) {
    return HttpResponse.json(
      { message: "Travel Date From must be on or before Travel Date To" },
      { status: 400 }
    );
  }

  const outsideContract = ranges.some((range) => {
    const resolvedTo = range.to || contract.validTo;
    return range.from < contract.validFrom || resolvedTo > contract.validTo;
  });
  if (outsideContract) {
    return HttpResponse.json(
      { message: "Travel dates must be within contract validity period" },
      { status: 400 }
    );
  }

  const hasOverlap = ranges.some((range, index) => {
    const rangeTo = range.to || contract.validTo;
    return ranges.some((otherRange, otherIndex) => {
      if (otherIndex <= index) return false;
      const otherRangeTo = otherRange.to || contract.validTo;
      return dateRangesOverlap(
        range.from,
        rangeTo,
        otherRange.from,
        otherRangeTo
      );
    });
  });
  if (hasOverlap) {
    return HttpResponse.json(
      { message: "Travel date ranges must not overlap" },
      { status: 400 }
    );
  }

  return null;
};

let mockSupplierContracts: MockSupplierContract[] = [
  {
    id: "contract-1",
    supplierId: "sup-1",
    serviceId: "service-1",
    name: "Elewana Contract 2025",
    link: "https://drive.google.com/file/d/abc123/view",
    agencyGroupId: null,
    agencyGroupName: null,
    validFrom: "2025-01-01",
    validTo: "2025-12-31",
    isActive: true,
    createdAt: "2024-11-15T10:00:00Z",
    updatedAt: "2024-12-01T14:30:00Z",
    canDelete: false,
    policies: [
      {
        id: "policy-1",
        name: "Standard Cancellation",
        description: "Standard cancellation policy for all bookings",
        isRefundable: true,
        isActive: true,
        travelDates: [
          {
            id: "policy-1-range-1",
            version: 1,
            from: "2025-01-01",
            to: null,
          },
        ],
        conditions: [
          {
            id: "rule-1",
            starts: "Before",
            referenceEvent: "TravelDate",
            startDay: 30,
            startTime: "00:00",
            endDay: 15,
            endTime: "23:59",
            penaltyValue: 25,
            penaltyType: "Percent",
          },
          {
            id: "rule-2",
            starts: "Before",
            referenceEvent: "TravelDate",
            startDay: 14,
            startTime: "00:00",
            endDay: 0,
            endTime: "23:59",
            penaltyValue: 100,
            penaltyType: "Percent",
          },
        ],
      },
    ],
  },
  {
    id: "contract-2",
    supplierId: "sup-1",
    serviceId: "service-1",
    name: "Elewana Contract 2024",
    link: "https://drive.google.com/file/d/def456/view",
    agencyGroupId: "ag-1",
    agencyGroupName: "AAConsultants",
    validFrom: "2024-01-01",
    validTo: "2024-12-31",
    isActive: true,
    createdAt: "2023-11-20T09:00:00Z",
    updatedAt: "2023-12-05T11:00:00Z",
    canDelete: true,
    policies: [],
  },
  {
    id: "contract-3",
    supplierId: "sup-1",
    serviceId: "service-2",
    name: "Contract 2026",
    link: null,
    agencyGroupId: "ag-1",
    agencyGroupName: "AAConsultants",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    isActive: true,
    createdAt: "2025-10-01T08:00:00Z",
    updatedAt: "2025-10-01T08:00:00Z",
    canDelete: true,
    policies: [
      {
        id: "policy-2026-1",
        name: "Standard Cancellation",
        description: "Standard cancellation policy for all bookings",
        isRefundable: true,
        isActive: true,
        travelDates: [
          {
            id: "policy-2026-1-range-1",
            version: 1,
            from: "2026-01-01",
            to: "2026-06-30",
          },
          {
            id: "policy-2026-1-range-2",
            version: 1,
            from: "2026-07-01",
            to: null,
          },
        ],
        conditions: [
          {
            id: "rule-2026-1",
            starts: "Before",
            referenceEvent: "TravelDate",
            startDay: 30,
            startTime: "00:00",
            endDay: 15,
            endTime: "23:59",
            penaltyValue: 25,
            penaltyType: "Percent",
          },
          {
            id: "rule-2026-2",
            starts: "Before",
            referenceEvent: "TravelDate",
            startDay: 14,
            startTime: "00:00",
            endDay: 0,
            endTime: "23:59",
            penaltyValue: 100,
            penaltyType: "Percent",
          },
        ],
      },
    ],
  },
  {
    id: "contract-4",
    supplierId: "sup-1",
    serviceId: "service-1",
    name: "Elewana Legacy Contract",
    link: null,
    agencyGroupId: null,
    agencyGroupName: null,
    validFrom: "2023-01-01",
    validTo: "2023-12-31",
    isActive: false,
    createdAt: "2022-11-01T07:00:00Z",
    updatedAt: "2022-11-01T07:00:00Z",
    canDelete: true,
    policies: [],
  },
  {
    id: "contract-5",
    supplierId: "sup-2",
    serviceId: "service-6",
    name: "Serengeti Safari Contract 2025",
    link: "https://drive.google.com/file/d/ghi789/view",
    agencyGroupId: "ag-3",
    agencyGroupName: "RAgent",
    validFrom: "2026-03-01",
    validTo: "2027-02-28",
    isActive: true,
    createdAt: "2025-02-01T12:00:00Z",
    updatedAt: "2025-02-15T09:00:00Z",
    canDelete: true,
    policies: [],
  },
];

let mockSupplierCloseouts: MockSupplierCloseout[] = [
  {
    id: "supplier-closeout-1",
    supplierId: "sup-1",
    serviceId: null,
    serviceName: null,
    serviceOptionId: null,
    serviceOptionName: null,
    travelDateFrom: "2025-10-01",
    travelDateTo: "2025-10-31",
    reason: "Rain Season",
    status: "Active",
    version: 1,
  },
  {
    id: "supplier-closeout-2",
    supplierId: "sup-1",
    serviceId: "service-1",
    serviceName: "Camp",
    serviceOptionId: "option-1",
    serviceOptionName: "Game Package",
    travelDateFrom: "2025-08-10",
    travelDateTo: "2025-08-16",
    reason: "No such option for these dates",
    status: "Active",
    version: 1,
  },
  {
    id: "supplier-closeout-3",
    supplierId: "sup-1",
    serviceId: "service-2",
    serviceName: "Family Camp",
    serviceOptionId: null,
    serviceOptionName: "ALL",
    travelDateFrom: "2025-12-10",
    travelDateTo: "2026-01-07",
    reason: "Renovation of the Family Camp and even more long description",
    status: "Active",
    version: 1,
  },
];

const getContractsForService = ({
  params,
}: {
  params: { serviceId: string };
}) => {
  const { serviceId } = params;
  const service = mockSupplierServices.find((s) => s.id === serviceId);
  if (!service) {
    return HttpResponse.json({ message: "Service not found" }, { status: 404 });
  }
  const contracts = mockSupplierContracts.filter(
    (c) => c.serviceId === serviceId
  );
  return HttpResponse.json(contracts.map(toApiContract), { status: 200 });
};

const createServiceContract = async ({
  params,
  request,
}: {
  params: { serviceId?: string };
  request: Request;
}) => {
  const serviceId = params.serviceId as string;
  const service = mockSupplierServices.find((s) => s.id === serviceId);
  if (!service) {
    return HttpResponse.json({ message: "Service not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    link?: string | null;
    agencyGroupId?: string | null;
    validFrom?: string;
    validTo?: string;
  };
  const agencyGroupId = normalizeAgencyGroupId(body.agencyGroupId);
  const agencyGroup = agencyGroupId
    ? getMockAgencyGroupById(agencyGroupId)
    : null;
  if (agencyGroupId && (!agencyGroup || !agencyGroup.isActive)) {
    return HttpResponse.json(
      { message: "Agency Group must be active" },
      { status: 400 }
    );
  }

  const validationError = validateContractRequest({
    supplierId: service.supplierId,
    body,
  });
  if (validationError) return validationError;

  const now = new Date().toISOString();
  const newContract: MockSupplierContract = {
    id: `contract-${Date.now()}`,
    supplierId: service.supplierId,
    serviceId,
    name: body.name!.trim(),
    link: body.link?.trim() || null,
    agencyGroupId,
    agencyGroupName: getAgencyGroupName(agencyGroupId),
    validFrom: body.validFrom!,
    validTo: body.validTo!,
    isActive: false,
    createdAt: now,
    updatedAt: now,
    canDelete: true,
    policies: [],
  };

  mockSupplierContracts = [...mockSupplierContracts, newContract];

  return HttpResponse.json(toApiContract(newContract), { status: 201 });
};

const createSupplierContract = async ({
  params,
  request,
}: {
  params: { supplierId: string };
  request: Request;
}) => {
  const supplierId = params.supplierId;
  const body = (await request.json()) as ContractRequestBody;
  const agencyGroupId = normalizeAgencyGroupId(body.agencyGroupId);
  const agencyGroup = agencyGroupId
    ? getMockAgencyGroupById(agencyGroupId)
    : null;

  if (agencyGroupId && (!agencyGroup || !agencyGroup.isActive)) {
    return HttpResponse.json(
      { message: "Agency Group must be active" },
      { status: 400 }
    );
  }

  const validationError = validateContractRequest({ supplierId, body });
  if (validationError) return validationError;

  const now = new Date().toISOString();
  const serviceId =
    mockSupplierServices.find((service) => service.supplierId === supplierId)
      ?.id ?? `service-${supplierId}`;
  const newContract: MockSupplierContract = {
    id: `contract-${Date.now()}`,
    supplierId,
    serviceId,
    name: body.name!.trim(),
    link: body.link?.trim() || null,
    agencyGroupId,
    agencyGroupName: getAgencyGroupName(agencyGroupId),
    validFrom: body.validFrom!,
    validTo: body.validTo!,
    isActive: false,
    createdAt: now,
    updatedAt: now,
    canDelete: true,
    policies: [],
  };

  mockSupplierContracts = [...mockSupplierContracts, newContract];

  return HttpResponse.json(toApiContract(newContract), { status: 201 });
};

const activateSupplierContract = ({
  params,
}: {
  params: { contractId: string };
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  if (contract.isActive) {
    return HttpResponse.json(
      { message: "Contract is already active" },
      { status: 400 }
    );
  }
  contract.isActive = true;
  contract.updatedAt = new Date().toISOString();
  return HttpResponse.json(toApiContract(contract), { status: 200 });
};

const deactivateSupplierContract = ({
  params,
}: {
  params: { contractId: string };
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  if (!contract.isActive) {
    return HttpResponse.json(
      { message: "Contract is already inactive" },
      { status: 400 }
    );
  }
  contract.isActive = false;
  contract.updatedAt = new Date().toISOString();
  return HttpResponse.json(toApiContract(contract), { status: 200 });
};

/** GET /catalog/contracts/:contractId - Fetch a single contract by id. */
const getSupplierContractByContractId = ({
  params,
}: {
  params: { contractId: string };
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  return HttpResponse.json(toApiContract(contract), { status: 200 });
};

const updateSupplierContract = async ({
  params,
  request,
}: {
  params: { contractId: string };
  request: Request;
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }

  const body = (await request.json()) as ContractRequestBody;
  if (
    body.agencyGroupId !== undefined &&
    normalizeAgencyGroupId(body.agencyGroupId) !==
      (contract.agencyGroupId ?? null)
  ) {
    return HttpResponse.json(
      { message: "Agency Group cannot be changed after contract is saved" },
      { status: 409 }
    );
  }

  const validationError = validateContractRequest({
    supplierId: contract.supplierId,
    body,
    currentContract: contract,
  });
  if (validationError) return validationError;

  if (body.name !== undefined) {
    contract.name = body.name.trim();
  }
  if (body.link !== undefined) {
    contract.link = body.link?.trim() || null;
  }
  if (body.validFrom !== undefined) {
    contract.validFrom = body.validFrom;
  }
  if (body.validTo !== undefined) {
    contract.validTo = body.validTo;
  }
  contract.updatedAt = new Date().toISOString();
  return HttpResponse.json(toApiContract(contract), { status: 200 });
};

const deleteSupplierContract = ({
  params,
}: {
  params: { supplierId: string; contractId: string };
}) => {
  const index = mockSupplierContracts.findIndex(
    (c) => c.id === params.contractId && c.supplierId === params.supplierId
  );
  if (index === -1) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  mockSupplierContracts = mockSupplierContracts.filter((_, i) => i !== index);
  return HttpResponse.json({ success: true }, { status: 200 });
};

function normalizeCloseoutScopeValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : null;
}

function toApiSupplierCloseout(closeout: MockSupplierCloseout) {
  return {
    id: closeout.id,
    supplierId: closeout.supplierId,
    serviceId: closeout.serviceId ?? null,
    serviceName: closeout.serviceName ?? null,
    serviceOptionId: closeout.serviceOptionId ?? null,
    serviceOptionName:
      closeout.serviceId && !closeout.serviceOptionId
        ? "ALL"
        : (closeout.serviceOptionName ?? null),
    travelDateFrom: closeout.travelDateFrom,
    travelDateTo: closeout.travelDateTo,
    reason: closeout.reason,
    status: closeout.status,
    version: closeout.version,
  };
}

function isSameSupplierCloseoutScope(
  closeout: MockSupplierCloseout,
  scope: {
    supplierId: string;
    serviceId?: string | null;
    serviceOptionId?: string | null;
  }
) {
  return (
    closeout.supplierId === scope.supplierId &&
    normalizeCloseoutScopeValue(closeout.serviceId) ===
      normalizeCloseoutScopeValue(scope.serviceId) &&
    normalizeCloseoutScopeValue(closeout.serviceOptionId) ===
      normalizeCloseoutScopeValue(scope.serviceOptionId)
  );
}

function rangesOverlap(
  first: Pick<MockSupplierCloseout, "travelDateFrom" | "travelDateTo">,
  second: Pick<MockSupplierCloseout, "travelDateFrom" | "travelDateTo">
) {
  return (
    first.travelDateFrom <= second.travelDateTo &&
    second.travelDateFrom <= first.travelDateTo
  );
}

const listSupplierCloseouts = ({
  params,
  request,
}: {
  params: { supplierId: string };
  request: Request;
}) => {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const rows = mockSupplierCloseouts.filter((closeout) => {
    if (closeout.supplierId !== params.supplierId) return false;
    if (serviceId && closeout.serviceId !== serviceId) return false;
    return true;
  });

  return HttpResponse.json(rows.map(toApiSupplierCloseout), { status: 200 });
};

const createSupplierCloseout = async ({
  params,
  request,
}: {
  params: { supplierId: string };
  request: Request;
}) => {
  const body = (await request.json()) as {
    supplierId?: string;
    travelDateFrom?: string;
    travelDateTo?: string;
    serviceId?: string | null;
    serviceOptionId?: string | null;
    reason?: string | null;
  };

  const supplierId = params.supplierId || body.supplierId;
  const serviceId = normalizeCloseoutScopeValue(body.serviceId);
  const serviceOptionId = normalizeCloseoutScopeValue(body.serviceOptionId);

  if (!supplierId) {
    return HttpResponse.json(
      { message: "Supplier ID is required" },
      { status: 400 }
    );
  }

  if (!body.travelDateFrom || !body.travelDateTo) {
    return HttpResponse.json(
      { message: "Travel date from and to are required" },
      { status: 400 }
    );
  }

  if (body.travelDateFrom > body.travelDateTo) {
    return HttpResponse.json(
      { message: "Travel Date From must be on or before Travel Date To." },
      { status: 400 }
    );
  }

  if (serviceOptionId && !serviceId) {
    return HttpResponse.json(
      { message: "Service Option cannot be set without a Service." },
      { status: 400 }
    );
  }

  const service = serviceId
    ? mockSupplierServices.find((s) => s.id === serviceId)
    : null;
  if (serviceId && (!service || service.supplierId !== supplierId)) {
    return HttpResponse.json(
      { message: "Selected Service does not belong to this Supplier." },
      { status: 400 }
    );
  }

  const serviceOption = serviceOptionId
    ? mockServiceOptions.find((o) => o.id === serviceOptionId)
    : null;
  if (
    serviceOptionId &&
    (!serviceOption || serviceOption.serviceId !== serviceId)
  ) {
    return HttpResponse.json(
      { message: "Selected Option does not belong to the selected Service." },
      { status: 400 }
    );
  }

  const scope = { supplierId, serviceId, serviceOptionId };
  const sameScopeRows = mockSupplierCloseouts.filter((closeout) =>
    isSameSupplierCloseoutScope(closeout, scope)
  );
  const duplicate = sameScopeRows.some(
    (closeout) =>
      closeout.travelDateFrom === body.travelDateFrom &&
      closeout.travelDateTo === body.travelDateTo
  );
  if (duplicate) {
    return HttpResponse.json(
      {
        message:
          "A Closeout with the same date range already exists for this scope.",
      },
      { status: 409 }
    );
  }

  const overlaps = sameScopeRows.some((closeout) =>
    rangesOverlap(closeout, {
      travelDateFrom: body.travelDateFrom!,
      travelDateTo: body.travelDateTo!,
    })
  );
  if (overlaps) {
    return HttpResponse.json(
      {
        message:
          "Date range overlaps with an existing Closeout for this scope.",
      },
      { status: 409 }
    );
  }

  const newCloseout: MockSupplierCloseout = {
    id: `supplier-closeout-${Date.now()}`,
    supplierId,
    serviceId,
    serviceName: service?.name ?? null,
    serviceOptionId,
    serviceOptionName: serviceOption?.title ?? (serviceId ? "ALL" : null),
    travelDateFrom: body.travelDateFrom,
    travelDateTo: body.travelDateTo,
    reason: body.reason?.trim() || null,
    status: "Inactive",
    version: 1,
  };

  mockSupplierCloseouts.push(newCloseout);
  return HttpResponse.json(toApiSupplierCloseout(newCloseout), { status: 201 });
};

function findSupplierCloseout(closeoutId: string) {
  return mockSupplierCloseouts.find((closeout) => closeout.id === closeoutId);
}

const getSupplierCloseoutById = ({
  params,
}: {
  params: { closeoutId: string };
}) => {
  const closeout = findSupplierCloseout(params.closeoutId);
  if (!closeout) {
    return HttpResponse.json(
      { message: "Closeout not found" },
      { status: 404 }
    );
  }
  return HttpResponse.json(toApiSupplierCloseout(closeout), { status: 200 });
};

const deleteSupplierCloseout = ({
  params,
}: {
  params: { closeoutId: string };
}) => {
  const index = mockSupplierCloseouts.findIndex(
    (closeout) => closeout.id === params.closeoutId
  );
  if (index === -1) {
    return HttpResponse.json(
      { message: "Closeout not found" },
      { status: 404 }
    );
  }
  mockSupplierCloseouts.splice(index, 1);
  return HttpResponse.json({ success: true }, { status: 200 });
};

const activateSupplierCloseout = ({
  params,
}: {
  params: { closeoutId: string };
}) => {
  const closeout = findSupplierCloseout(params.closeoutId);
  if (!closeout) {
    return HttpResponse.json(
      { message: "Closeout not found" },
      { status: 404 }
    );
  }
  closeout.status = "Active";
  closeout.version += 1;
  return HttpResponse.json(toApiSupplierCloseout(closeout), { status: 200 });
};

const deactivateSupplierCloseout = ({
  params,
}: {
  params: { closeoutId: string };
}) => {
  const closeout = findSupplierCloseout(params.closeoutId);
  if (!closeout) {
    return HttpResponse.json(
      { message: "Closeout not found" },
      { status: 404 }
    );
  }
  closeout.status = "Inactive";
  closeout.version += 1;
  return HttpResponse.json(toApiSupplierCloseout(closeout), { status: 200 });
};

function toApiPolicy({
  name,
  isRefundable,
  conditions,
  travelDates,
  ...rest
}: MockPolicy) {
  return {
    ...rest,
    policyName: name,
    refundable: isRefundable,
    travelDates: travelDates.map(({ from, to, ...range }) => ({
      ...range,
      dateFrom: from,
      dateTo: to,
    })),
    conditions,
  };
}

function toApiContract(contract: MockSupplierContract) {
  return {
    ...contract,
    policies: contract.policies.map(toApiPolicy),
  };
}

/** GET /catalog/suppliers/contracts/:contractId/cancellation-policies */
const getContractCancellationPolicies = ({
  params,
}: {
  params: { contractId: string };
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  return HttpResponse.json(contract.policies.map(toApiPolicy), { status: 200 });
};

/** POST /catalog/suppliers/contracts/:contractId/cancellation-policies (API contract) */
const createCancellationPolicy = async ({
  params,
  request,
}: {
  params: { contractId: string };
  request: Request;
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }

  const body = (await request.json()) as {
    policyName?: string;
    description?: string;
    refundable?: boolean;
    isActive?: boolean;
    travelDates?: PolicyTravelDateRequestBody[];
    conditions?: Array<{
      starts: string;
      referenceEvent: string;
      startDay: number;
      startTime: string;
      endDay: number;
      endTime: string;
      penaltyType: string;
      penaltyValue: number;
    }>;
  };

  if (!body.policyName?.trim()) {
    return HttpResponse.json(
      { message: "Policy name is required" },
      { status: 400 }
    );
  }
  const description =
    body.description != null ? String(body.description).trim() : "";
  const travelDates = normalizeTravelDates(
    body.travelDates,
    contract.validFrom
  );
  const rangeValidationError = validateTravelDates(travelDates, contract);
  if (rangeValidationError) return rangeValidationError;

  const newPolicy: MockPolicy = {
    id: `policy-${Date.now()}`,
    name: body.policyName.trim(),
    description,
    isRefundable: body.refundable ?? false,
    isActive: body.isActive ?? false,
    travelDates,
    conditions: (body.conditions ?? []).map((r) => ({
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      starts: r.starts,
      referenceEvent: r.referenceEvent,
      startDay: r.startDay,
      startTime: r.startTime,
      endDay: r.endDay,
      endTime: r.endTime,
      penaltyValue: r.penaltyValue,
      penaltyType: r.penaltyType,
    })),
  };

  contract.policies.push(newPolicy);
  contract.canDelete = false;

  return HttpResponse.json(contract.policies.map(toApiPolicy), { status: 201 });
};

/** @deprecated Use createCancellationPolicy; legacy path with supplierId and old body shape. */
const createContractPolicy = async ({
  params,
  request,
}: {
  params: { supplierId: string; contractId: string };
  request: Request;
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId && c.supplierId === params.supplierId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    isRefundable?: boolean;
    travelDates?: PolicyTravelDateRequestBody[];
    conditions?: Omit<MockCondition, "id">[];
  };

  if (!body.name?.trim()) {
    return HttpResponse.json(
      { message: "Policy name is required" },
      { status: 400 }
    );
  }
  if (!body.description?.trim()) {
    return HttpResponse.json(
      { message: "Description is required" },
      { status: 400 }
    );
  }
  const travelDates = normalizeTravelDates(
    body.travelDates,
    contract.validFrom
  );
  const rangeValidationError = validateTravelDates(travelDates, contract);
  if (rangeValidationError) return rangeValidationError;

  const newPolicy: MockPolicy = {
    id: `policy-${Date.now()}`,
    name: body.name.trim(),
    description: body.description.trim(),
    isRefundable: body.isRefundable ?? false,
    isActive: true,
    travelDates,
    conditions: (body.conditions ?? []).map((r) => ({
      ...r,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    })),
  };

  contract.policies.push(newPolicy);
  contract.canDelete = false;

  return HttpResponse.json(toApiPolicy(newPolicy), { status: 201 });
};

/** PUT /catalog/suppliers/contracts/cancellation-policies/:id (API contract) */
const updateCancellationPolicy = async ({
  params,
  request,
}: {
  params: { id: string };
  request: Request;
}) => {
  const policyId = params.id;
  const contract = mockSupplierContracts.find((c) =>
    c.policies.some((p) => p.id === policyId)
  );
  if (!contract) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  const policy = contract.policies.find((p) => p.id === policyId);
  if (!policy) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    id?: string;
    contractId?: string;
    policyName?: string;
    description?: string;
    refundable?: boolean;
    isActive?: boolean;
    travelDates?: PolicyTravelDateRequestBody[];
    conditions?: Array<{
      id?: string;
      starts: string;
      referenceEvent: string;
      startDay: number;
      startTime: string;
      endDay: number;
      endTime: string;
      penaltyType: string;
      penaltyValue: number;
    }>;
  };

  if (body.policyName !== undefined) policy.name = body.policyName.trim();
  if (body.description !== undefined)
    policy.description = String(body.description).trim();
  if (body.refundable !== undefined) policy.isRefundable = body.refundable;
  if (body.isActive !== undefined) policy.isActive = body.isActive;
  if (body.travelDates !== undefined) {
    const travelDates = normalizeTravelDates(
      body.travelDates,
      contract.validFrom
    );
    const rangeValidationError = validateTravelDates(travelDates, contract);
    if (rangeValidationError) return rangeValidationError;
    policy.travelDates = travelDates;
  }
  if (body.conditions !== undefined) {
    policy.conditions = body.conditions.map((r) => ({
      id:
        r.id ?? `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      starts: r.starts,
      referenceEvent: r.referenceEvent,
      startDay: r.startDay,
      startTime: r.startTime,
      endDay: r.endDay,
      endTime: r.endTime,
      penaltyValue: r.penaltyValue,
      penaltyType: r.penaltyType,
    }));
  }

  return HttpResponse.json(toApiPolicy(policy), { status: 200 });
};

/** @deprecated Use updateCancellationPolicy; legacy PATCH path and body shape. */
const updateContractPolicy = async ({
  params,
  request,
}: {
  params: { supplierId: string; contractId: string; policyId: string };
  request: Request;
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId && c.supplierId === params.supplierId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  const policy = contract.policies.find((p) => p.id === params.policyId);
  if (!policy) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    isRefundable?: boolean;
    travelDates?: PolicyTravelDateRequestBody[];
    conditions?: MockCondition[];
  };

  if (body.name !== undefined) policy.name = body.name.trim();
  if (body.description !== undefined)
    policy.description = body.description.trim();
  if (body.isRefundable !== undefined) policy.isRefundable = body.isRefundable;
  if (body.travelDates !== undefined) {
    const travelDates = normalizeTravelDates(
      body.travelDates,
      contract.validFrom
    );
    const rangeValidationError = validateTravelDates(travelDates, contract);
    if (rangeValidationError) return rangeValidationError;
    policy.travelDates = travelDates;
  }
  if (body.conditions !== undefined) {
    policy.conditions = body.conditions.map((r) => ({
      ...r,
      id:
        r.id || `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));
  }

  return HttpResponse.json(toApiPolicy(policy), { status: 200 });
};

/** DELETE /catalog/suppliers/contracts/cancellation-policies/:id */
const deleteCancellationPolicy = ({ params }: { params: { id: string } }) => {
  const policyId = params.id;
  const contract = mockSupplierContracts.find((c) =>
    c.policies.some((p) => p.id === policyId)
  );
  if (!contract) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  const index = contract.policies.findIndex((p) => p.id === policyId);
  if (index === -1) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  contract.policies.splice(index, 1);
  return HttpResponse.json({ success: true }, { status: 200 });
};

/** @deprecated Use deleteCancellationPolicy; legacy path with supplierId. */
const deleteContractPolicy = ({
  params,
}: {
  params: { supplierId: string; contractId: string; policyId: string };
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId && c.supplierId === params.supplierId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  const index = contract.policies.findIndex((p) => p.id === params.policyId);
  if (index === -1) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  contract.policies.splice(index, 1);
  return HttpResponse.json({ success: true }, { status: 200 });
};

/** PATCH /catalog/suppliers/contracts/cancellation-policies/:id/activate */
const activateCancellationPolicy = ({ params }: { params: { id: string } }) => {
  const policyId = params.id;
  const contract = mockSupplierContracts.find((c) =>
    c.policies.some((p) => p.id === policyId)
  );
  if (!contract) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  const policy = contract.policies.find((p) => p.id === policyId);
  if (!policy) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  policy.isActive = true;
  return HttpResponse.json(toApiPolicy(policy), { status: 200 });
};

/** PATCH /catalog/suppliers/contracts/cancellation-policies/:id/deactivate */
const deactivateCancellationPolicy = ({
  params,
}: {
  params: { id: string };
}) => {
  const policyId = params.id;
  const contract = mockSupplierContracts.find((c) =>
    c.policies.some((p) => p.id === policyId)
  );
  if (!contract) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  const policy = contract.policies.find((p) => p.id === policyId);
  if (!policy) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  policy.isActive = false;
  return HttpResponse.json(toApiPolicy(policy), { status: 200 });
};

/** @deprecated Use activateCancellationPolicy. */
const activateContractPolicy = ({
  params,
}: {
  params: { supplierId: string; contractId: string; policyId: string };
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId && c.supplierId === params.supplierId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  const policy = contract.policies.find((p) => p.id === params.policyId);
  if (!policy) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  policy.isActive = true;
  return HttpResponse.json(toApiPolicy(policy), { status: 200 });
};

/** @deprecated Use deactivateCancellationPolicy. */
const deactivateContractPolicy = ({
  params,
}: {
  params: { supplierId: string; contractId: string; policyId: string };
}) => {
  const contract = mockSupplierContracts.find(
    (c) => c.id === params.contractId && c.supplierId === params.supplierId
  );
  if (!contract) {
    return HttpResponse.json(
      { message: "Contract not found" },
      { status: 404 }
    );
  }
  const policy = contract.policies.find((p) => p.id === params.policyId);
  if (!policy) {
    return HttpResponse.json({ message: "Policy not found" }, { status: 404 });
  }
  policy.isActive = false;
  return HttpResponse.json(toApiPolicy(policy), { status: 200 });
};

function toPolicyParams(
  p: Record<string, string | readonly string[] | undefined> | undefined
): { supplierId: string; contractId: string; policyId: string } {
  const params = p ?? {};
  const v = (k: string) => {
    const val = params[k];
    return Array.isArray(val) ? val[0] : val;
  };
  return {
    supplierId: String(v("supplierId") ?? ""),
    contractId: String(v("contractId") ?? ""),
    policyId: String(v("policyId") ?? ""),
  };
}

function toCloseoutParams(
  p: Record<string, string | readonly string[] | undefined> | undefined
): { closeoutId: string } {
  const params = p ?? {};
  const v = (k: string) => {
    const val = params[k];
    return Array.isArray(val) ? val[0] : val;
  };
  return {
    closeoutId: String(v("closeoutId") ?? ""),
  };
}

function toParams(
  p: Record<string, string | readonly string[] | undefined> | undefined
): { supplierId: string; contractId: string } {
  const params = p ?? {};
  const v = (k: string) => {
    const val = params[k];
    return Array.isArray(val) ? val[0] : val;
  };
  return {
    supplierId: String(v("supplierId") ?? ""),
    contractId: String(v("contractId") ?? ""),
  };
}

export const supplierContractRoutes = (API_BASE_URL: string) => [
  /** Mirrors GET /api/catalog/suppliers/{supplierId}/contracts (catalog list DTO shape for admin extras, etc.). */
  http.get(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/contracts`,
    (info) => {
      const supplierId = String(
        (info.params as { supplierId?: string }).supplierId ?? ""
      );
      const rows = mockSupplierContracts.filter(
        (c) => c.supplierId === supplierId
      );
      const list = rows
        .slice()
        .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
        .map((c) => ({
          id: c.id,
          supplierId: c.supplierId,
          serviceId: c.serviceId,
          name: c.name,
          link: c.link,
          agencyGroupId: c.agencyGroupId,
          agencyGroupName: c.agencyGroupName,
          validFrom: c.validFrom,
          validTo: c.validTo,
          isActive: c.isActive,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          canDelete: c.canDelete,
        }));
      return HttpResponse.json({
        success: true,
        data: list,
        error: null,
      });
    }
  ),
  http.post(`${API_BASE_URL}/catalog/suppliers/:supplierId/contracts`, (info) =>
    createSupplierContract({
      params: {
        supplierId: String(
          (info.params as { supplierId?: string }).supplierId ?? ""
        ),
      },
      request: info.request,
    })
  ),
  http.get(`${API_BASE_URL}/catalog/services/:serviceId/contracts`, (info) =>
    getContractsForService({
      params: {
        serviceId: String(
          (info.params as { serviceId?: string }).serviceId ?? ""
        ),
      },
    })
  ),
  http.post(`${API_BASE_URL}/catalog/services/:serviceId/contracts`, (info) =>
    createServiceContract({
      params: {
        serviceId: String(
          (info.params as { serviceId?: string }).serviceId ?? ""
        ),
      },
      request: info.request,
    })
  ),
  http.get(`${API_BASE_URL}/catalog/contracts/:contractId`, (info) => {
    const params = info.params as Record<
      string,
      string | readonly string[] | undefined
    >;
    const contractId = Array.isArray(params.contractId)
      ? params.contractId[0]
      : params.contractId;
    return getSupplierContractByContractId({
      params: { contractId: String(contractId ?? "") },
    });
  }),
  http.put(`${API_BASE_URL}/catalog/contracts/:contractId`, (info) =>
    updateSupplierContract({
      params: {
        contractId: String(
          (info.params as { contractId?: string }).contractId ?? ""
        ),
      },
      request: info.request,
    })
  ),
  http.patch(`${API_BASE_URL}/catalog/contracts/:contractId/activate`, (info) =>
    activateSupplierContract({
      params: {
        contractId: String(
          (info.params as { contractId?: string }).contractId ?? ""
        ),
      },
    })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/contracts/:contractId/deactivate`,
    (info) =>
      deactivateSupplierContract({
        params: {
          contractId: String(
            (info.params as { contractId?: string }).contractId ?? ""
          ),
        },
      })
  ),
  http.delete(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/contracts/:contractId`,
    (info) =>
      deleteSupplierContract({
        params: toParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
      })
  ),
  http.get(`${API_BASE_URL}/catalog/suppliers/:supplierId/closeouts`, (info) =>
    listSupplierCloseouts({
      params: {
        supplierId: String(
          (info.params as { supplierId?: string }).supplierId ?? ""
        ),
      },
      request: info.request,
    })
  ),
  http.post(`${API_BASE_URL}/catalog/suppliers/:supplierId/closeouts`, (info) =>
    createSupplierCloseout({
      params: {
        supplierId: String(
          (info.params as { supplierId?: string }).supplierId ?? ""
        ),
      },
      request: info.request,
    })
  ),
  http.patch(`${API_BASE_URL}/catalog/closeouts/:closeoutId/activate`, (info) =>
    activateSupplierCloseout({
      params: toCloseoutParams(
        info.params as Record<string, string | readonly string[] | undefined>
      ),
    })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/closeouts/:closeoutId/deactivate`,
    (info) =>
      deactivateSupplierCloseout({
        params: toCloseoutParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
      })
  ),
  http.delete(`${API_BASE_URL}/catalog/closeouts/:closeoutId`, (info) =>
    deleteSupplierCloseout({
      params: toCloseoutParams(
        info.params as Record<string, string | readonly string[] | undefined>
      ),
    })
  ),
  http.get(`${API_BASE_URL}/catalog/closeouts/:closeoutId`, (info) =>
    getSupplierCloseoutById({
      params: toCloseoutParams(
        info.params as Record<string, string | readonly string[] | undefined>
      ),
    })
  ),
  http.get(
    `${API_BASE_URL}/catalog/suppliers/contracts/:contractId/cancellation-policies`,
    (info) =>
      getContractCancellationPolicies({
        params: {
          contractId: String(
            (info.params as { contractId?: string }).contractId ?? ""
          ),
        },
      })
  ),
  http.post(
    `${API_BASE_URL}/catalog/suppliers/contracts/:contractId/cancellation-policies`,
    (info) =>
      createCancellationPolicy({
        params: {
          contractId: String(
            (info.params as { contractId?: string }).contractId ?? ""
          ),
        },
        request: info.request,
      })
  ),
  http.put(
    `${API_BASE_URL}/catalog/suppliers/contracts/cancellation-policies/:id`,
    (info) =>
      updateCancellationPolicy({
        params: {
          id: String((info.params as { id?: string }).id ?? ""),
        },
        request: info.request,
      })
  ),
  http.post(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/contracts/:contractId/policies`,
    (info) =>
      createContractPolicy({
        params: toParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
        request: info.request,
      })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/contracts/:contractId/policies/:policyId`,
    (info) =>
      updateContractPolicy({
        params: toPolicyParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
        request: info.request,
      })
  ),
  http.delete(
    `${API_BASE_URL}/catalog/suppliers/contracts/cancellation-policies/:id`,
    (info) =>
      deleteCancellationPolicy({
        params: {
          id: String((info.params as { id?: string }).id ?? ""),
        },
      })
  ),
  http.delete(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/contracts/:contractId/policies/:policyId`,
    (info) =>
      deleteContractPolicy({
        params: toPolicyParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
      })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/suppliers/contracts/cancellation-policies/:id/activate`,
    (info) =>
      activateCancellationPolicy({
        params: {
          id: String((info.params as { id?: string }).id ?? ""),
        },
      })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/suppliers/contracts/cancellation-policies/:id/deactivate`,
    (info) =>
      deactivateCancellationPolicy({
        params: {
          id: String((info.params as { id?: string }).id ?? ""),
        },
      })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/contracts/:contractId/policies/:policyId/activate`,
    (info) =>
      activateContractPolicy({
        params: toPolicyParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
      })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/suppliers/:supplierId/contracts/:contractId/policies/:policyId/deactivate`,
    (info) =>
      deactivateContractPolicy({
        params: toPolicyParams(
          info.params as Record<string, string | readonly string[] | undefined>
        ),
      })
  ),
];
