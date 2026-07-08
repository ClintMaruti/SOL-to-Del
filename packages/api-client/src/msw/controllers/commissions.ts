import { http, HttpResponse } from "msw";

type MockCommission = {
  id: string;
  agencyId: string;
  effectiveFrom: string;
  commissionPercent: number;
  version: number;
};

type CommissionPayload = {
  effectiveFrom?: unknown;
  commissionPercent?: unknown;
  version?: unknown;
};

function sortMockCommissionsByEffectiveFromDesc(
  commissions: MockCommission[]
): MockCommission[] {
  return [...commissions].sort((left, right) =>
    right.effectiveFrom.localeCompare(left.effectiveFrom)
  );
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function offsetDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function buildInitialMockCommissions(): MockCommission[] {
  return [
    {
      id: "commission-future-1",
      agencyId: "agency-1",
      effectiveFrom: offsetDays(45),
      commissionPercent: 7,
      version: 3,
    },
    {
      id: "commission-past-1",
      agencyId: "agency-1",
      effectiveFrom: offsetDays(-180),
      commissionPercent: 6,
      version: 2,
    },
    {
      id: "commission-past-2",
      agencyId: "agency-1",
      effectiveFrom: offsetDays(-365),
      commissionPercent: 4,
      version: 1,
    },
  ];
}

let mockCommissions = buildInitialMockCommissions();
let nextCommissionNumber = 1;

function createValidationError(propertyName: string, errorMessage: string) {
  return {
    propertyName,
    errorMessage,
  };
}

function getTodayIsoDateString(): string {
  return toIsoDate(new Date());
}

function validateCommissionPayload(
  body: CommissionPayload,
  options?: {
    requireVersion?: boolean;
    agencyId?: string;
    excludedCommissionId?: string;
  }
) {
  const validationErrors: Array<{
    propertyName: string;
    errorMessage: string;
  }> = [];

  const effectiveFrom =
    typeof body.effectiveFrom === "string" ? body.effectiveFrom.trim() : "";

  if (!effectiveFrom) {
    validationErrors.push(
      createValidationError("effectiveFrom", "Effective from is required")
    );
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) {
    validationErrors.push(
      createValidationError("effectiveFrom", "Enter a valid date")
    );
  } else if (effectiveFrom <= getTodayIsoDateString()) {
    validationErrors.push(
      createValidationError(
        "effectiveFrom",
        "Effective date can not be set as today or a past date"
      )
    );
  } else if (
    options?.agencyId &&
    mockCommissions.some(
      (commission) =>
        commission.agencyId === options.agencyId &&
        commission.id !== options.excludedCommissionId &&
        commission.effectiveFrom === effectiveFrom
    )
  ) {
    validationErrors.push(
      createValidationError(
        "effectiveFrom",
        "A commission with this effective date already exists for this agency."
      )
    );
  }

  const commissionPercent =
    typeof body.commissionPercent === "number"
      ? body.commissionPercent
      : typeof body.commissionPercent === "string" &&
          body.commissionPercent.trim() !== ""
        ? Number(body.commissionPercent)
        : Number.NaN;

  if (!Number.isFinite(commissionPercent)) {
    validationErrors.push(
      createValidationError("commissionPercent", "Commission, % is required")
    );
  } else if (commissionPercent < 0) {
    validationErrors.push(
      createValidationError(
        "commissionPercent",
        "Commission, % must be 0 or greater"
      )
    );
  }

  if (options?.requireVersion && typeof body.version !== "number") {
    validationErrors.push(
      createValidationError("version", "Version is required")
    );
  }

  return validationErrors;
}

export const commissionRoutes = (API_BASE_URL: string) => [
  http.get(`${API_BASE_URL}/catalog/agencies/:id/commissions`, ({ params }) => {
    const agencyId =
      typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

    return HttpResponse.json(
      sortMockCommissionsByEffectiveFromDesc(
        mockCommissions.filter((commission) => commission.agencyId === agencyId)
      ),
      { status: 200 }
    );
  }),

  http.post(
    `${API_BASE_URL}/catalog/agencies/:id/commissions`,
    async ({ params, request }) => {
      const agencyId =
        typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
      const body = (await request.json()) as CommissionPayload;
      const validationErrors = validateCommissionPayload(body, {
        agencyId,
      });

      if (validationErrors.length > 0) {
        return HttpResponse.json(validationErrors, { status: 422 });
      }

      const newCommission: MockCommission = {
        id: `commission-created-${nextCommissionNumber++}`,
        agencyId,
        effectiveFrom: body.effectiveFrom as string,
        commissionPercent: Number(body.commissionPercent),
        version: 1,
      };

      mockCommissions = [...mockCommissions, newCommission];

      return HttpResponse.json(newCommission, { status: 200 });
    }
  ),

  http.put(
    `${API_BASE_URL}/catalog/commissions/:commissionId`,
    async ({ params, request }) => {
      const commissionId =
        typeof params.commissionId === "string"
          ? params.commissionId
          : (params.commissionId?.[0] ?? "");
      const body = (await request.json()) as CommissionPayload;
      const existingCommission = mockCommissions.find(
        (commission) => commission.id === commissionId
      );
      const validationErrors = validateCommissionPayload(body, {
        requireVersion: true,
        agencyId: existingCommission?.agencyId,
        excludedCommissionId: commissionId,
      });

      if (validationErrors.length > 0) {
        return HttpResponse.json(validationErrors, { status: 422 });
      }

      const commissionIndex = mockCommissions.findIndex(
        (commission) => commission.id === commissionId
      );

      if (commissionIndex === -1) {
        return HttpResponse.json(
          { message: "Commission not found" },
          { status: 404 }
        );
      }

      const existingCommissionByIndex = mockCommissions[commissionIndex];
      const updatedCommission: MockCommission = {
        ...existingCommissionByIndex,
        effectiveFrom: body.effectiveFrom as string,
        commissionPercent: Number(body.commissionPercent),
        version: Number(body.version) + 1,
      };

      mockCommissions = mockCommissions.map((commission) =>
        commission.id === commissionId ? updatedCommission : commission
      );

      return HttpResponse.json(updatedCommission, { status: 200 });
    }
  ),

  http.delete(
    `${API_BASE_URL}/catalog/commissions/:commissionId`,
    ({ params }) => {
      const commissionId =
        typeof params.commissionId === "string"
          ? params.commissionId
          : (params.commissionId?.[0] ?? "");

      const commissionExists = mockCommissions.some(
        (commission) => commission.id === commissionId
      );

      if (!commissionExists) {
        return HttpResponse.json(
          { message: "Commission not found" },
          { status: 404 }
        );
      }

      mockCommissions = mockCommissions.filter(
        (commission) => commission.id !== commissionId
      );

      return HttpResponse.json(null, { status: 200 });
    }
  ),
];
