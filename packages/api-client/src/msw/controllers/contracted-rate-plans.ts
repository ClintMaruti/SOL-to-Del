import { http, HttpResponse } from "msw";

interface MockContractedRatePlan {
  id: string;
  ratePlanId: string;
  name: string;
  validityDateFrom: string;
  validityDateTo: string;
  payAtProperty: boolean;
  isActive: boolean;
}

let mockContractedRatePlans: MockContractedRatePlan[] = [
  {
    id: "crp-1",
    ratePlanId: "rp-1",
    name: "Standard Plan",
    validityDateFrom: "2025-10-01",
    validityDateTo: "2025-12-31",
    payAtProperty: true,
    isActive: true,
  },
  {
    id: "crp-2",
    ratePlanId: "rp-1",
    name: "Rack Plan",
    validityDateFrom: "2026-01-01",
    validityDateTo: "2026-03-31",
    payAtProperty: false,
    isActive: false,
  },
  {
    id: "crp-3",
    ratePlanId: "rp-2",
    name: "Net Plan",
    validityDateFrom: "2025-11-01",
    validityDateTo: "2026-02-28",
    payAtProperty: false,
    isActive: true,
  },
];

function toId(
  p: Record<string, string | readonly string[] | undefined>,
  key: string
): string {
  const val = p[key];
  return String(Array.isArray(val) ? val[0] : (val ?? ""));
}

const getContractedRatePlans = ({
  params,
}: {
  params: Record<string, string | readonly string[] | undefined>;
}) => {
  const ratePlanId = toId(params, "ratePlanId");
  const plans = mockContractedRatePlans.filter(
    (p) => p.ratePlanId === ratePlanId
  );
  return HttpResponse.json(plans, { status: 200 });
};

const getContractedRatePlan = ({
  params,
}: {
  params: Record<string, string | readonly string[] | undefined>;
}) => {
  const id = toId(params, "id");
  const plan = mockContractedRatePlans.find((p) => p.id === id);
  if (!plan) {
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }
  return HttpResponse.json(plan, { status: 200 });
};

const patchContractedRatePlan = async ({
  params,
  request,
}: {
  params: Record<string, string | readonly string[] | undefined>;
  request: Request;
}) => {
  const id = toId(params, "id");
  const index = mockContractedRatePlans.findIndex((p) => p.id === id);

  if (index === -1) {
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<MockContractedRatePlan>;

  if (body.name !== undefined && !body.name.trim()) {
    return HttpResponse.json({ message: "Name is required" }, { status: 400 });
  }

  const existing = mockContractedRatePlans[index];
  const updated: MockContractedRatePlan = {
    ...existing,
    ...(body.name !== undefined && { name: body.name.trim() }),
    ...(body.validityDateFrom !== undefined && {
      validityDateFrom: body.validityDateFrom,
    }),
    ...(body.validityDateTo !== undefined && {
      validityDateTo: body.validityDateTo,
    }),
    ...(body.payAtProperty !== undefined && {
      payAtProperty: body.payAtProperty,
    }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  };

  mockContractedRatePlans[index] = updated;
  return HttpResponse.json(updated, { status: 200 });
};

export const contractedRatePlansRoutes = (API_BASE_URL: string) => [
  http.get(
    `${API_BASE_URL}/catalog/rate-plans/:ratePlanId/contracted-rate-plans`,
    ({ params }) =>
      getContractedRatePlans({
        params: params as Record<
          string,
          string | readonly string[] | undefined
        >,
      })
  ),
  http.get(`${API_BASE_URL}/catalog/contracted-rate-plans/:id`, ({ params }) =>
    getContractedRatePlan({
      params: params as Record<string, string | readonly string[] | undefined>,
    })
  ),
  http.patch(
    `${API_BASE_URL}/catalog/contracted-rate-plans/:id`,
    ({ params, request }) =>
      patchContractedRatePlan({
        params: params as Record<
          string,
          string | readonly string[] | undefined
        >,
        request,
      })
  ),
];

export { mockContractedRatePlans };
