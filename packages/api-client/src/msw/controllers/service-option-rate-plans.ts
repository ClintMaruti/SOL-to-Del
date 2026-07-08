import { http, HttpResponse } from "msw";

interface MockRuleComponent {
  id: string;
  priority: number;
  paxType: string | null;
  rateId: string | null;
  modifier: number | null;
  type: string;
  componentConditions: {
    id: string;
    ageFrom: number | null;
    ageTo: number | null;
    paxFrom: number | null;
    paxTo: number | null;
    unitFrom: number | null;
    unitTo: number | null;
    nightFrom: number | null;
    nightTo: number | null;
  }[];
  bookingWindowId: string | null;
  bookingWindowFrom: string | null;
  bookingWindowTo: string | null;
  bookingWindowFromDays: number | null;
  bookingWindowToDays: number | null;
  componentDates: {
    id: string;
    travelDateFrom: string;
    travelDateTo: string;
  }[];
  residencies: string[];
}

interface MockRuleCondition {
  id: string;
  condition: string;
  option: string | null;
  min: number | null;
  max: number | null;
}

interface MockRateRule {
  id: string;
  ratePlanId: string;
  name: string;
  isActive?: boolean;
  version?: number;
  conditions: MockRuleCondition[];
  components: MockRuleComponent[];
}

interface MockRatePlan {
  id: string;
  serviceId: string;
  name: string;
  validityDateFrom: string;
  validityDateTo: string | null;
  payAtProperty: boolean;
  isActive: boolean;
  version?: number;
  rateRules: MockRateRule[];
}

export const mockRatePlans: MockRatePlan[] = [
  {
    id: "rp-1",
    serviceId: "service-1",
    name: "STD",
    validityDateFrom: "2025-10-01",
    validityDateTo: "2025-10-31",
    payAtProperty: true,
    isActive: false,
    version: 1,
    rateRules: [
      {
        id: "rr-1",
        ratePlanId: "rp-1",
        name: "Rate Rule",
        isActive: true,
        version: 1,
        conditions: [
          {
            id: "cond-1",
            condition: "Pax",
            option: "ADT",
            min: 0,
            max: 4,
          },
          {
            id: "cond-2",
            condition: "Pax",
            option: "CHD",
            min: 0,
            max: 4,
          },
          {
            id: "cond-3",
            condition: "Nights",
            option: "Number",
            min: 5,
            max: null,
          },
        ],
        components: [
          {
            id: "comp-1",
            priority: 100,
            paxType: "ADT",
            rateId: null,
            modifier: null,
            type: "%",
            componentConditions: [],
            bookingWindowId: null,
            bookingWindowFrom: null,
            bookingWindowTo: null,
            bookingWindowFromDays: null,
            bookingWindowToDays: null,
            componentDates: [],
            residencies: [],
          },
        ],
      },
    ],
  },
];

let ratePlanIdCounter = mockRatePlans.length;
let rateRuleIdCounter = 200;

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function toApiPaxOption(option: string | null): string {
  switch (option) {
    case "ADT":
      return "Adult";
    case "CHD":
      return "Child";
    case "INF":
      return "Infant";
    case "YTH":
      return "Teen";
    case "Number":
      return "Number";
    default:
      return "Adult";
  }
}

function fromApiPaxOption(option: string | null): string {
  switch (option) {
    case "Adult":
      return "ADT";
    case "Child":
      return "CHD";
    case "Infant":
      return "INF";
    case "Teen":
      return "YTH";
    case "Number":
      return "Number";
    default:
      return "ADT";
  }
}

function toApiModifierType(type: string): string {
  if (type === "%") return "Percent";
  if (type === "Fixed Amount") return "FixedAmount";
  return "Percent";
}

function fromApiModifierType(type: string): string {
  if (type === "Percent") return "%";
  if (type === "FixedAmount") return "Fixed Amount";
  return "%";
}

function findRateRuleById(rateRuleId: string): {
  planIndex: number;
  ruleIndex: number;
} | null {
  for (let pi = 0; pi < mockRatePlans.length; pi++) {
    const plan = mockRatePlans[pi];
    const ri = plan.rateRules.findIndex((r) => r.id === rateRuleId);
    if (ri !== -1) {
      return { planIndex: pi, ruleIndex: ri };
    }
  }
  return null;
}

function toApiRateRule(rule: MockRateRule) {
  return {
    id: rule.id,
    ratePlanId: rule.ratePlanId,
    name: rule.name,
    isActive: rule.isActive ?? true,
    version: rule.version ?? 1,
    conditions: rule.conditions.map((c, idx) => ({
      id: c.id || `${rule.id}-cond-${idx}`,
      rateRuleId: rule.id,
      conditionType: c.condition,
      option: toApiPaxOption(c.option),
      minValue: c.min ?? null,
      maxValue: c.max ?? null,
      version: 1,
    })),
    components: rule.components.map((c, idx) => {
      const firstCondition = c.componentConditions[0];
      const bwFrom = c.bookingWindowFrom?.trim() ?? "";
      const bwTo = c.bookingWindowTo?.trim() ?? "";
      return {
        id: c.id || `${rule.id}-comp-${idx}`,
        rateRuleId: rule.id,
        priority: c.priority,
        paxType: toApiPaxOption(c.paxType),
        rateId: c.rateId ?? null,
        modifierValue: c.modifier ?? 0,
        modifierType: toApiModifierType(c.type),
        isActive: true,
        version: 1,
        ageFrom: firstCondition?.ageFrom ?? null,
        ageTo: firstCondition?.ageTo ?? null,
        paxIndexFrom: firstCondition?.paxFrom ?? null,
        paxIndexTo: firstCondition?.paxTo ?? null,
        nightIndexFrom: firstCondition?.nightFrom ?? null,
        nightIndexTo: firstCondition?.nightTo ?? null,
        unitIndexFrom: firstCondition?.unitFrom ?? null,
        unitIndexTo: firstCondition?.unitTo ?? null,
        travelDates: c.componentDates.map((d, didx) => ({
          id: d.id || `${c.id}-td-${didx}`,
          rateComponentId: c.id,
          from: d.travelDateFrom,
          to: d.travelDateTo,
          version: 1,
        })),
        bookingWindow:
          bwFrom && bwTo
            ? {
                id: c.bookingWindowId || `${c.id}-bw`,
                rateComponentId: c.id,
                from: bwFrom,
                to: bwTo,
                version: 1,
              }
            : null,
        residencies: c.residencies.map((residencyId, ridx) => ({
          id: `${c.id}-res-${ridx}`,
          rateComponentId: c.id,
          residencyId,
          version: 1,
        })),
      };
    }),
  };
}

function fromApiRateRulePayload(
  payload: {
    id?: string;
    rateRuleId?: string;
    ratePlanId?: string;
    name?: string;
    isActive?: boolean;
    version?: number;
    conditions?: Array<{
      id?: string | null;
      type?: string;
      conditionType?: string;
      option?: string;
      min?: number | null;
      max?: number | null;
      minValue?: number | null;
      maxValue?: number | null;
    }>;
    components?: Array<{
      id?: string | null;
      priority?: number;
      paxType?: string;
      rateId?: string | null;
      modifierValue?: number;
      modifierType?: string;
      isActive?: boolean;
      ageFrom?: number | null;
      ageTo?: number | null;
      paxIndexFrom?: number | null;
      paxIndexTo?: number | null;
      nightIndexFrom?: number | null;
      nightIndexTo?: number | null;
      unitIndexFrom?: number | null;
      unitIndexTo?: number | null;
      travelDates?: Array<{ id?: string | null; from?: string; to?: string }>;
      bookingWindow?: { id?: string | null; from?: string; to?: string } | null;
      residencies?: Array<{ id?: string | null; residencyId?: string }>;
    }>;
  },
  fallbackId: string,
  ratePlanId: string
): MockRateRule {
  return {
    id: payload.rateRuleId ?? payload.id ?? fallbackId,
    ratePlanId,
    name: payload.name ?? "Rate Rule",
    isActive: payload.isActive ?? true,
    version: payload.version ?? 1,
    conditions: (payload.conditions ?? []).map((c, idx) => {
      const apiType = c.conditionType ?? c.type ?? "Pax";
      const minRaw = c.minValue ?? c.min;
      const maxRaw = c.maxValue ?? c.max;
      return {
        id: c.id ?? `${fallbackId}-cond-${idx}`,
        condition: apiType,
        option: fromApiPaxOption(c.option ?? "Adult"),
        min: minRaw ?? null,
        max: maxRaw ?? null,
      };
    }),
    components: (payload.components ?? []).map((c, idx) => ({
      id: c.id ?? `${fallbackId}-comp-${idx}`,
      priority: c.priority ?? 0,
      paxType: fromApiPaxOption(c.paxType ?? "Adult"),
      rateId: c.rateId ?? null,
      modifier: c.modifierValue ?? 0,
      type: fromApiModifierType(c.modifierType ?? "Percent"),
      componentConditions: [
        {
          id: `${c.id ?? `${fallbackId}-comp-${idx}`}-cc-0`,
          ageFrom: c.ageFrom ?? null,
          ageTo: c.ageTo ?? null,
          paxFrom: c.paxIndexFrom ?? null,
          paxTo: c.paxIndexTo ?? null,
          unitFrom: c.unitIndexFrom ?? null,
          unitTo: c.unitIndexTo ?? null,
          nightFrom: c.nightIndexFrom ?? null,
          nightTo: c.nightIndexTo ?? null,
        },
      ],
      bookingWindowId: c.bookingWindow?.id ?? null,
      bookingWindowFrom: c.bookingWindow?.from ?? null,
      bookingWindowTo: c.bookingWindow?.to ?? null,
      bookingWindowFromDays: null,
      bookingWindowToDays: null,
      componentDates: (c.travelDates ?? []).map((td, didx) => ({
        id: td.id ?? `${c.id ?? `${fallbackId}-comp-${idx}`}-td-${didx}`,
        travelDateFrom: td.from ?? "",
        travelDateTo: td.to ?? "",
      })),
      residencies: (c.residencies ?? [])
        .map((r) => r.residencyId)
        .filter((r): r is string => Boolean(r)),
    })),
  };
}

/** List/create/update summary shape (no nested rateRules). */
function toRatePlanSummary(rp: MockRatePlan) {
  return {
    id: rp.id,
    serviceId: rp.serviceId,
    name: rp.name,
    validityDateFrom: rp.validityDateFrom,
    validityDateTo: rp.validityDateTo ?? null,
    payAtProperty: rp.payAtProperty,
    isActive: rp.isActive,
    ...(rp.version !== undefined ? { version: rp.version } : {}),
  };
}

export const serviceOptionRatePlansRoutes = (API_BASE_URL: string) => [
  // GET /catalog/services/{serviceId}/rate-plans
  http.get(
    `${API_BASE_URL}/catalog/services/:serviceId/rate-plans`,
    ({ params }) => {
      const { serviceId } = params as { serviceId: string };
      const plans = mockRatePlans.filter((rp) => rp.serviceId === serviceId);
      return HttpResponse.json(plans.map(toRatePlanSummary), { status: 200 });
    }
  ),

  // POST /catalog/services/{serviceId}/rate-plans
  http.post(
    `${API_BASE_URL}/catalog/services/:serviceId/rate-plans`,
    async ({ request, params }) => {
      const { serviceId } = params as { serviceId: string };
      const body = (await request.json()) as {
        name?: string;
        validityDateFrom?: string;
        validityDateTo?: string | null;
        payAtProperty?: boolean;
        isActive?: boolean;
      };

      const id = `rp-${++ratePlanIdCounter}`;
      const newPlan: MockRatePlan = {
        id,
        serviceId,
        name: body.name ?? "",
        validityDateFrom: body.validityDateFrom ?? "",
        validityDateTo: body.validityDateTo ?? null,
        payAtProperty: body.payAtProperty ?? false,
        isActive: body.isActive ?? true,
        version: 1,
        rateRules: [],
      };

      mockRatePlans.push(newPlan);
      return HttpResponse.json(toRatePlanSummary(newPlan), { status: 201 });
    }
  ),

  // PUT /catalog/services/rate-plans/{ratePlanId}
  http.put(
    `${API_BASE_URL}/catalog/services/rate-plans/:ratePlanId`,
    async ({ request, params }) => {
      const { ratePlanId } = params as { ratePlanId: string };
      const idx = mockRatePlans.findIndex((rp) => rp.id === ratePlanId);
      if (idx === -1) {
        return HttpResponse.json(
          { error: "Rate plan not found" },
          { status: 404 }
        );
      }

      const body = (await request.json()) as Partial<MockRatePlan>;
      mockRatePlans[idx] = {
        ...mockRatePlans[idx],
        ...body,
        version: (mockRatePlans[idx].version ?? 1) + 1,
      };

      return HttpResponse.json(toRatePlanSummary(mockRatePlans[idx]), {
        status: 200,
      });
    }
  ),

  // PATCH /catalog/services/rate-plans/{ratePlanId}/activate
  http.patch(
    `${API_BASE_URL}/catalog/services/rate-plans/:ratePlanId/activate`,
    ({ params }) => {
      const { ratePlanId } = params as { ratePlanId: string };
      const idx = mockRatePlans.findIndex((rp) => rp.id === ratePlanId);
      if (idx === -1) {
        return HttpResponse.json(
          { error: "Rate plan not found" },
          { status: 404 }
        );
      }
      mockRatePlans[idx] = { ...mockRatePlans[idx], isActive: true };
      return HttpResponse.json(toRatePlanSummary(mockRatePlans[idx]), {
        status: 200,
      });
    }
  ),

  // PATCH /catalog/services/rate-plans/{ratePlanId}/deactivate
  http.patch(
    `${API_BASE_URL}/catalog/services/rate-plans/:ratePlanId/deactivate`,
    ({ params }) => {
      const { ratePlanId } = params as { ratePlanId: string };
      const idx = mockRatePlans.findIndex((rp) => rp.id === ratePlanId);
      if (idx === -1) {
        return HttpResponse.json(
          { error: "Rate plan not found" },
          { status: 404 }
        );
      }
      mockRatePlans[idx] = { ...mockRatePlans[idx], isActive: false };
      return HttpResponse.json(toRatePlanSummary(mockRatePlans[idx]), {
        status: 200,
      });
    }
  ),

  // GET /catalog/services/rate-plans/{ratePlanId}/rate-rules
  http.get(
    `${API_BASE_URL}/catalog/services/rate-plans/:ratePlanId/rate-rules`,
    ({ params }) => {
      const { ratePlanId } = params as { ratePlanId: string };
      const plan = mockRatePlans.find((rp) => rp.id === ratePlanId);
      if (!plan) {
        return HttpResponse.json([], { status: 200 });
      }
      return HttpResponse.json(plan.rateRules.map(toApiRateRule), {
        status: 200,
      });
    }
  ),

  // POST /catalog/services/rate-plans/{ratePlanId}/rate-rules
  http.post(
    `${API_BASE_URL}/catalog/services/rate-plans/:ratePlanId/rate-rules`,
    async ({ request, params }) => {
      const { ratePlanId } = params as { ratePlanId: string };
      const body = (await request.json()) as {
        name?: string;
        isActive?: boolean;
        conditions?: unknown[];
        components?: unknown[];
      };

      const plan = mockRatePlans.find((rp) => rp.id === ratePlanId);
      if (!plan) {
        return HttpResponse.json(
          { error: "Rate plan not found" },
          { status: 404 }
        );
      }

      const id = crypto.randomUUID?.() ?? `rr-${++rateRuleIdCounter}`;
      const rule = fromApiRateRulePayload(body as never, id, ratePlanId);
      plan.rateRules.push(rule);
      return HttpResponse.json(toApiRateRule(rule), { status: 201 });
    }
  ),

  // PUT /catalog/rate-rules/{rateRuleId}
  http.put(
    `${API_BASE_URL}/catalog/rate-rules/:rateRuleId`,
    async ({ params, request }) => {
      const { rateRuleId } = params as { rateRuleId: string };
      const body = (await request.json()) as {
        rateRuleId?: string;
        ratePlanId?: string;
        components?: unknown[];
      };

      if (!rateRuleId?.trim()) {
        return HttpResponse.json(
          { error: "Invalid rate rule id" },
          { status: 400 }
        );
      }
      if (body.rateRuleId && body.rateRuleId !== rateRuleId) {
        return HttpResponse.json(
          { error: "Route rateRuleId and body rateRuleId must match" },
          { status: 400 }
        );
      }
      if (!Array.isArray(body.components)) {
        return HttpResponse.json(
          { error: "components must be an array" },
          { status: 400 }
        );
      }

      const found = findRateRuleById(rateRuleId);
      if (!found) {
        return HttpResponse.json(
          { error: "Rate rule not found" },
          { status: 404 }
        );
      }

      const plan = mockRatePlans[found.planIndex];
      const existingRatePlanId =
        body.ratePlanId ?? plan.rateRules[found.ruleIndex].ratePlanId;
      const updated = fromApiRateRulePayload(
        body as never,
        rateRuleId,
        existingRatePlanId
      );
      updated.version = (plan.rateRules[found.ruleIndex].version ?? 1) + 1;
      plan.rateRules[found.ruleIndex] = updated;

      return HttpResponse.json(toApiRateRule(updated), { status: 200 });
    }
  ),

  // DELETE /catalog/rate-rules/{id}
  http.delete(`${API_BASE_URL}/catalog/rate-rules/:id`, ({ params }) => {
    const id = String(params.id ?? "");
    if (!id.trim()) {
      return HttpResponse.json({ error: "Invalid id format" }, { status: 400 });
    }

    const found = findRateRuleById(id);
    if (!found) {
      return HttpResponse.json(
        { error: "Rate rule not found" },
        { status: 404 }
      );
    }

    mockRatePlans[found.planIndex].rateRules.splice(found.ruleIndex, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

void deepClone;
