import { http, HttpResponse } from "msw";

interface MockEligibilityValidityDate {
  id: string;
  from: string;
  to: string;
  version: number;
}

interface MockAgeRestriction {
  id?: string;
  ageMin: number | null;
  ageMax: number | null;
  ruleMode: string;
  version: number;
}

interface MockPaxTypeConstraint {
  id: string;
  paxType: string;
  paxCode: string;
  minCount: number;
  maxCount: number;
  ageRestriction?: MockAgeRestriction;
  version: number;
}

interface MockPaxCompositionGroup {
  id: string;
  paxTypeConstraints: MockPaxTypeConstraint[];
  version: number;
}

interface MockServiceEligibility {
  id: string;
  sequence: number;
  name: string;
  serviceId: string;
  serviceName: string;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  minAge: number | null;
  totalPaxMin: number | null;
  totalPaxMax: number | null;
  unitsMin: number | null;
  unitsMax: number | null;
  nightsMin: number | null;
  nightsMax: number | null;
  validityDates: MockEligibilityValidityDate[];
  paxCompositionGroups: MockPaxCompositionGroup[];
  version: number;
  referenced?: boolean;
}

const mockServiceEligibilities: MockServiceEligibility[] = [
  {
    id: "service-elig-1",
    sequence: 1,
    name: "Eligibility 1",
    serviceId: "service-1",
    serviceName: "Camp",
    isActive: false,
    validFrom: "",
    validTo: "",
    minAge: 6,
    totalPaxMin: 1,
    totalPaxMax: 4,
    unitsMin: null,
    unitsMax: null,
    nightsMin: 2,
    nightsMax: 14,
    validityDates: [
      { id: "service-vd-1", from: "2026-10-01", to: "2026-10-31", version: 1 },
      { id: "service-vd-2", from: "2026-12-01", to: "2026-12-20", version: 1 },
    ],
    paxCompositionGroups: [
      {
        id: "service-pcg-1",
        paxTypeConstraints: [
          {
            id: "service-ptc-1",
            paxType: "ADT",
            paxCode: "ADT",
            minCount: 1,
            maxCount: 2,
            version: 1,
          },
          {
            id: "service-ptc-2",
            paxType: "CHD",
            paxCode: "CHD",
            minCount: 1,
            maxCount: 2,
            ageRestriction: {
              id: "service-age-1",
              ageMin: 6,
              ageMax: 11,
              ruleMode: "any",
              version: 1,
            },
            version: 1,
          },
        ],
        version: 1,
      },
    ],
    version: 1,
  },
  {
    id: "service-elig-2",
    sequence: 2,
    name: "Eligibility 2",
    serviceId: "service-1",
    serviceName: "Camp",
    isActive: true,
    validFrom: "",
    validTo: "",
    minAge: null,
    totalPaxMin: 2,
    totalPaxMax: 6,
    unitsMin: 1,
    unitsMax: 2,
    nightsMin: null,
    nightsMax: null,
    validityDates: [],
    paxCompositionGroups: [],
    version: 1,
    referenced: true,
  },
];

let eligibilityIdCounter = 100;
let validityDateIdCounter = 100;
let groupIdCounter = 100;
let constraintIdCounter = 100;
let ageRestrictionIdCounter = 100;

function validationError(errorMessage: string) {
  return HttpResponse.json([{ propertyName: "eligibility", errorMessage }], {
    status: 400,
  });
}

function normalizeEligibility(
  body: Partial<MockServiceEligibility>,
  fallback: MockServiceEligibility
): MockServiceEligibility {
  return {
    ...fallback,
    ...body,
    id: body.id || fallback.id,
    version: fallback.version,
    validityDates: (body.validityDates ?? fallback.validityDates).map(
      (date) => ({
        ...date,
        id: date.id || `service-vd-${++validityDateIdCounter}`,
        version: date.version ?? 0,
      })
    ),
    paxCompositionGroups: (
      body.paxCompositionGroups ?? fallback.paxCompositionGroups
    ).map((group) => ({
      ...group,
      id: group.id || `service-pcg-${++groupIdCounter}`,
      version: group.version ?? 0,
      paxTypeConstraints: group.paxTypeConstraints.map((constraint) => ({
        ...constraint,
        id: constraint.id || `service-ptc-${++constraintIdCounter}`,
        version: constraint.version ?? 0,
        ageRestriction: constraint.ageRestriction
          ? {
              ...constraint.ageRestriction,
              id:
                constraint.ageRestriction.id ||
                `service-age-${++ageRestrictionIdCounter}`,
              version: constraint.ageRestriction.version ?? 0,
            }
          : undefined,
      })),
    })),
  };
}

function hasMinMaxError(eligibility: Partial<MockServiceEligibility>) {
  const pairs = [
    [eligibility.totalPaxMin, eligibility.totalPaxMax],
    [eligibility.unitsMin, eligibility.unitsMax],
    [eligibility.nightsMin, eligibility.nightsMax],
  ];
  return pairs.some(
    ([min, max]) =>
      min !== null &&
      max !== null &&
      min !== undefined &&
      max !== undefined &&
      min > max
  );
}

function hasValidityDateError(eligibility: Partial<MockServiceEligibility>) {
  return (eligibility.validityDates ?? []).some(
    (date) => !date.from || !date.to || date.from > date.to
  );
}

function hasPaxCompositionError(eligibility: Partial<MockServiceEligibility>) {
  const totalPaxMax = eligibility.totalPaxMax;
  return (eligibility.paxCompositionGroups ?? []).some((group) =>
    group.paxTypeConstraints.some((constraint) => {
      if (constraint.minCount > constraint.maxCount) return true;
      if (
        totalPaxMax !== null &&
        totalPaxMax !== undefined &&
        constraint.maxCount > totalPaxMax
      ) {
        return true;
      }
      const age = constraint.ageRestriction;
      if (!age) return false;
      const hasAge = age.ageMin !== null || age.ageMax !== null;
      if (hasAge && !age.ruleMode) return true;
      return (
        age.ageMin !== null &&
        age.ageMax !== null &&
        age.ageMin !== undefined &&
        age.ageMax !== undefined &&
        age.ageMin > age.ageMax
      );
    })
  );
}

function validateEligibility(eligibility: Partial<MockServiceEligibility>) {
  if (hasMinMaxError(eligibility)) {
    return validationError("Minimum value cannot exceed maximum value.");
  }

  if (hasValidityDateError(eligibility)) {
    return validationError("Valid From must be on or before Valid To.");
  }

  if (eligibility.minAge !== null && eligibility.minAge !== undefined) {
    if (eligibility.minAge < 0) {
      return validationError("Minimum age must be zero or greater.");
    }
  }

  if (hasPaxCompositionError(eligibility)) {
    return validationError(
      "Pax maximum cannot exceed the block's total maximum passengers."
    );
  }

  return null;
}

export const serviceEligibilityRoutes = (API_BASE_URL: string) => [
  http.get(
    `${API_BASE_URL}/catalog/services/:serviceId/eligibilities`,
    ({ params }) => {
      const serviceId = params.serviceId as string;
      return HttpResponse.json(
        mockServiceEligibilities.filter(
          (eligibility) => eligibility.serviceId === serviceId
        ),
        { status: 200 }
      );
    }
  ),

  http.post(
    `${API_BASE_URL}/catalog/services/:serviceId/eligibilities`,
    async ({ request, params }) => {
      const serviceId = params.serviceId as string;
      const body = (await request.json()) as Partial<MockServiceEligibility>;
      const validation = validateEligibility(body);
      if (validation) return validation;

      const sequence =
        mockServiceEligibilities.filter(
          (eligibility) => eligibility.serviceId === serviceId
        ).length + 1;
      const fallback: MockServiceEligibility = {
        id: `service-elig-${++eligibilityIdCounter}`,
        sequence,
        name: `Eligibility ${sequence}`,
        serviceId,
        serviceName: body.serviceName ?? "Service",
        isActive: body.isActive ?? false,
        validFrom: body.validFrom ?? "",
        validTo: body.validTo ?? "",
        minAge: body.minAge ?? null,
        totalPaxMin: body.totalPaxMin ?? null,
        totalPaxMax: body.totalPaxMax ?? null,
        unitsMin: body.unitsMin ?? null,
        unitsMax: body.unitsMax ?? null,
        nightsMin: body.nightsMin ?? null,
        nightsMax: body.nightsMax ?? null,
        validityDates: [],
        paxCompositionGroups: [],
        version: 1,
      };

      const created = normalizeEligibility(body, fallback);
      mockServiceEligibilities.push(created);
      return HttpResponse.json(created, { status: 201 });
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/eligibilities/:eligibilityId`,
    async ({ request, params }) => {
      const eligibilityId = params.eligibilityId as string;
      const body = (await request.json()) as Partial<MockServiceEligibility>;
      const index = mockServiceEligibilities.findIndex(
        (eligibility) => eligibility.id === eligibilityId
      );

      if (index === -1) {
        return HttpResponse.json(
          { error: "Eligibility not found" },
          { status: 404 }
        );
      }

      if (
        body.version !== undefined &&
        body.version !== mockServiceEligibilities[index].version
      ) {
        return HttpResponse.json(
          { error: "Eligibility was updated by another user." },
          { status: 409 }
        );
      }

      const validation = validateEligibility(body);
      if (validation) return validation;

      const updated = normalizeEligibility(body, {
        ...mockServiceEligibilities[index],
        version: mockServiceEligibilities[index].version + 1,
      });
      mockServiceEligibilities[index] = updated;
      return HttpResponse.json(updated, { status: 200 });
    }
  ),

  http.delete(
    `${API_BASE_URL}/catalog/eligibilities/:eligibilityId`,
    ({ params }) => {
      const eligibilityId = params.eligibilityId as string;
      const index = mockServiceEligibilities.findIndex(
        (eligibility) => eligibility.id === eligibilityId
      );

      if (index === -1) {
        return HttpResponse.json(
          { error: "Eligibility not found" },
          { status: 404 }
        );
      }

      const eligibility = mockServiceEligibilities[index];
      if (eligibility.isActive || eligibility.referenced) {
        return HttpResponse.json(
          { error: "Active or referenced Eligibility cannot be deleted." },
          { status: 409 }
        );
      }

      mockServiceEligibilities.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    }
  ),
];
