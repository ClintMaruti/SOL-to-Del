import { http, HttpResponse } from "msw";

interface MockRatePlan {
  id: string;
  contractId: string;
  name: string;
  validityDateFrom: string;
  validityDateTo: string;
  payAtProperty: boolean;
  isActive: boolean;
}

let mockRatePlans: MockRatePlan[] = [
  {
    id: "rp-1",
    contractId: "contract-1",
    name: "STD",
    validityDateFrom: "2025-10-01",
    validityDateTo: "2025-10-31",
    payAtProperty: true,
    isActive: false,
  },
  {
    id: "rp-2",
    contractId: "contract-1",
    name: "RACK",
    validityDateFrom: "2025-11-01",
    validityDateTo: "2025-12-31",
    payAtProperty: false,
    isActive: true,
  },
  {
    id: "rp-3",
    contractId: "contract-2",
    name: "NET",
    validityDateFrom: "2026-01-01",
    validityDateTo: "2026-03-31",
    payAtProperty: false,
    isActive: true,
  },
];

const getRatePlans = ({ params }: { params: { contractId: string } }) => {
  const { contractId } = params;
  const ratePlans = mockRatePlans.filter((rp) => rp.contractId === contractId);
  return HttpResponse.json(ratePlans, { status: 200 });
};

export const ratePlansRoutes = (API_BASE_URL: string) => [
  http.get(
    `${API_BASE_URL}/catalog/contracts/:contractId/rate-plans`,
    ({ params }) =>
      getRatePlans({
        params: { contractId: String(params.contractId ?? "") },
      })
  ),
];

export { mockRatePlans };
