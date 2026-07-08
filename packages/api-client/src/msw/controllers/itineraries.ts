import { http, HttpResponse } from "msw";

import type {
  ItineraryListItem,
  ItineraryStatus,
  PaymentStatus,
} from "./itineraries.types";

type ItineraryMockRow = ItineraryListItem & {
  agencyId: string;
  agentId: string | null;
  bookedById: string;
  leadTravelerFirstName: string | null;
  leadTravelerLastName: string | null;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  childrenAges: number[];
};

interface CreateItineraryRequest {
  mode?: unknown;
  inquiryId?: unknown;
  title?: unknown;
  travelDateFrom?: unknown;
  travelDateTo?: unknown;
  agencyId?: unknown;
  agentId?: unknown;
  leadTravelerFirstName?: unknown;
  leadTravelerLastName?: unknown;
  adultsCount?: unknown;
  childrenCount?: unknown;
  infantsCount?: unknown;
  childrenAges?: unknown;
}

interface ValidatedCreateItineraryValue {
  agencyId: string;
  agentId: string | null;
  title: string | null;
  travelDateFrom: string;
  travelDateTo: string | null;
  leadTravelerFirstName?: string;
  leadTravelerLastName?: string;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  childrenAges: number[];
}

const AGENCY_A = "agency-1";
const AGENCY_B = "agency-2";
const AGENCY_C = "agency-3";
const AGENT_JAMES = "agent-2";
const AGENT_MARY = "agent-3";

const ACTIVE_AGENCIES = new Map([
  [AGENCY_A, "Kilimanjaro Experts"],
  [AGENCY_B, "Serengeti Adventures"],
  [AGENCY_C, "Africa Tours"],
]);

const ACTIVE_AGENTS = new Map([
  [
    AGENT_JAMES,
    {
      agencyId: AGENCY_B,
      name: "Jomo Kenyatta",
      agency: "Serengeti Adventures",
    },
  ],
  [
    AGENT_MARY,
    { agencyId: AGENCY_C, name: "Jonathan Annan", agency: "Africa Tours" },
  ],
]);

const STATUSES: ItineraryStatus[] = [
  "DRAFT",
  "PREPARED",
  "QUOTED",
  "APPROVED",
  "INVOICED",
  "VOUCHERED",
  "CONFIRMED",
  "TRAVEL_IN_PROGRESS",
  "COMPLETED",
  "LOST",
  "CANCELLED",
  "SUPERSEDED",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "UNPAID",
  "DEPOSIT_PAID",
  "PARTIALLY_PAID",
  "FULLY_PAID",
  "OVERPAID",
  "REFUND_PENDING",
];

const TITLES = [
  "Kenya & Tanzania Highlights",
  "Masai Mara Migration Safari",
  "Serengeti Explorer",
  "Okavango Delta Fly-In",
  "Victoria Falls & Chobe",
  "Cape Town & Garden Route",
  null,
  "Kruger Classic",
  "Rwanda Gorilla Trek",
  "Namibia Desert & Dunes",
];

const PLANNERS = [
  "Amelia Thornton",
  "James Okonkwo",
  "Sarah van der Berg",
  "Michael Nkosi",
];

const AGENCIES_LIST = [
  { id: AGENCY_A, name: "Kilimanjaro Experts" },
  { id: AGENCY_B, name: "Serengeti Adventures" },
  { id: AGENCY_C, name: "Africa Tours" },
];

const AGENTS_LIST = [
  { id: AGENT_JAMES, agencyId: AGENCY_B, name: "Jomo Kenyatta" },
  { id: AGENT_MARY, agencyId: AGENCY_C, name: "Jonathan Annan" },
  { id: "agent-4", agencyId: AGENCY_A, name: "Bartholomew Fairweather" },
  { id: "agent-5", agencyId: AGENCY_A, name: "Jane Richardson" },
];

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

let inquirySeq = 100;
function nextInquiryRef(): string {
  inquirySeq += 1;
  return `CPS26${String(inquirySeq).padStart(6, "0")}`;
}

function seedRows(): ItineraryMockRow[] {
  const rows: ItineraryMockRow[] = [];

  const bases = [
    {
      agencyId: AGENCY_A,
      agentId: "agent-4",
      agentName: "Bartholomew Fairweather",
    },
    { agencyId: AGENCY_A, agentId: "agent-5", agentName: "Jane Richardson" },
    { agencyId: AGENCY_B, agentId: AGENT_JAMES, agentName: "Jomo Kenyatta" },
    { agencyId: AGENCY_C, agentId: AGENT_MARY, agentName: "Jonathan Annan" },
    { agencyId: AGENCY_C, agentId: null, agentName: null },
  ];

  const inquiryRefs = Array.from({ length: 20 }, () => nextInquiryRef());

  for (let i = 0; i < 35; i++) {
    const base = bases[i % bases.length]!;
    const agencyName = ACTIVE_AGENCIES.get(base.agencyId)!;
    const inquiryRef = inquiryRefs[i % inquiryRefs.length]!;
    const optionNum = i < 20 ? "001" : i < 28 ? "002" : "003";
    const reference = `${inquiryRef}-${optionNum}`;

    const dateFromBase = `2026-${String((i % 11) + 1).padStart(2, "0")}-${String((i % 20) + 5).padStart(2, "0")}`;
    const dateFrom = dateFromBase;
    const dateTo = i % 8 === 0 ? null : addDays(dateFrom, 7 + (i % 14));
    const createdAt = addDays(dateFrom, -(10 + (i % 30)));
    const updatedAt = addDays(createdAt, 1 + (i % 8));

    const total = 4000 + ((i * 1337) % 18000);
    const paid =
      i % 4 === 0
        ? 0
        : i % 4 === 1
          ? total * 0.3
          : i % 4 === 2
            ? total * 0.8
            : total;
    const balance = total - paid;

    rows.push({
      id: `c3000000-0000-4000-8000-${String(100000 + i).padStart(12, "0")}`,
      reference,
      title: TITLES[i % TITLES.length] ?? null,
      agency: agencyName,
      agent: base.agentName,
      safariPlanner: PLANNERS[i % PLANNERS.length]!,
      travelDateFrom: dateFrom,
      travelDateTo: dateTo,
      status: STATUSES[i % STATUSES.length]!,
      paymentStatus: PAYMENT_STATUSES[i % PAYMENT_STATUSES.length]!,
      totalUsd: total,
      balanceUsd: Math.round(balance),
      updatedAt: updatedAt + "T10:30:00Z",
      createdAt: createdAt + "T09:00:00Z",
      version: 1,
      agencyId: base.agencyId,
      agentId: base.agentId,
      bookedById: base.agentId ?? base.agencyId,
      leadTravelerFirstName: null,
      leadTravelerLastName: null,
      adultsCount: 2,
      childrenCount: 0,
      infantsCount: 0,
      childrenAges: [],
    });
  }

  return rows;
}

let mockItineraries: ItineraryMockRow[] = seedRows();

export function resetItinerariesMockState(): void {
  mockItineraries = seedRows();
}

function toPublicItem(row: ItineraryMockRow): ItineraryListItem {
  const {
    agencyId: _a,
    agentId: _i,
    bookedById: _b,
    leadTravelerFirstName: _lf,
    leadTravelerLastName: _ll,
    adultsCount: _ac,
    childrenCount: _cc,
    infantsCount: _ic,
    childrenAges: _ca,
    ...rest
  } = row;
  return rest;
}

function toDetailItem(row: ItineraryMockRow) {
  const agentRecord = row.agentId
    ? AGENTS_LIST.find((a) => a.id === row.agentId)
    : null;
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    status: row.status,
    travelDateFrom: row.travelDateFrom,
    travelDateTo: row.travelDateTo,
    adultsCount: row.adultsCount,
    childrenCount: row.childrenCount,
    infantsCount: row.infantsCount,
    childrenAges: row.childrenAges,
    agencyId: row.agencyId,
    agencyName: row.agency,
    agentId: row.agentId,
    agentName: agentRecord?.name ?? row.agent,
    leadTravelerFirstName: row.leadTravelerFirstName,
    leadTravelerLastName: row.leadTravelerLastName,
    safariPlannerName: row.safariPlanner,
    salesSupportName: null,
    opsName: null,
  };
}

type SearchBody = {
  search?: string;
  agencyIds?: string[];
  locationIds?: string[];
  statuses?: string[];
  paymentStatuses?: string[];
  travelDateFrom?: string;
  travelDateTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  sortBy?: string;
  sortDirection?: string;
  pageSize?: number;
  cursor?: string;
};

function matchesSearch(row: ItineraryMockRow, q: string): boolean {
  const s = q.toLowerCase().trim();
  if (!s) return true;
  const hay = [
    row.reference,
    row.title ?? "",
    row.agency,
    row.agent ?? "",
    row.safariPlanner,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function addError(
  errors: Record<string, string[]>,
  field: string,
  message: string
) {
  if (!errors[field]) errors[field] = [];
  errors[field]!.push(message);
}

function validateCreateRequest(body: CreateItineraryRequest): {
  errors: Record<string, string[]>;
  value: ValidatedCreateItineraryValue;
} {
  const errors: Record<string, string[]> = {};

  const agencyId = typeof body.agencyId === "string" ? body.agencyId : "";
  const agentId =
    typeof body.agentId === "string" && body.agentId.trim()
      ? body.agentId
      : null;
  const title = typeof body.title === "string" ? body.title.trim() : null;
  const travelDateFrom = body.travelDateFrom;
  const travelDateTo = body.travelDateTo ?? null;

  if (!agencyId) {
    addError(errors, "AgencyId", "Agency is required.");
  } else if (!ACTIVE_AGENCIES.has(agencyId)) {
    addError(errors, "AgencyId", "Agency must reference an active Agency.");
  }

  if (agentId) {
    const agent = ACTIVE_AGENTS.get(agentId);
    if (!agent) {
      addError(errors, "AgentId", "Agent must reference an active Agent.");
    } else if (agent.agencyId !== agencyId) {
      addError(errors, "AgentId", "Agent must belong to the selected Agency.");
    }
  }

  if (!isIsoDate(travelDateFrom)) {
    addError(errors, "TravelDateFrom", "Date From must be a valid date.");
  }

  if (
    travelDateTo !== null &&
    travelDateTo !== "" &&
    !isIsoDate(travelDateTo)
  ) {
    addError(errors, "TravelDateTo", "Date To must be a valid date.");
  }

  if (
    isIsoDate(travelDateFrom) &&
    isIsoDate(travelDateTo) &&
    travelDateTo < travelDateFrom
  ) {
    addError(errors, "TravelDateTo", "Date To must be on or after Date From.");
  }

  if (!Number.isInteger(body.adultsCount) || Number(body.adultsCount) < 1) {
    addError(errors, "AdultsCount", "Adults must be at least 1.");
  }

  if (!isNonNegativeInteger(body.childrenCount)) {
    addError(errors, "ChildrenCount", "Children must be zero or greater.");
  }

  if (!isNonNegativeInteger(body.infantsCount)) {
    addError(errors, "InfantsCount", "Infants must be zero or greater.");
  }

  const childrenCount =
    typeof body.childrenCount === "number" ? body.childrenCount : 0;
  const childrenAges = Array.isArray(body.childrenAges)
    ? body.childrenAges.filter(
        (age): age is number => typeof age === "number"
      )
    : [];
  for (let c = 0; c < childrenCount; c++) {
    const age = childrenAges[c];
    if (typeof age !== "number" || age < 2 || age > 17) {
      addError(
        errors,
        `ChildrenAges[${c}]`,
        `Please enter a valid age (2–17) for Child ${c + 1}.`
      );
    }
  }

  return {
    errors,
    value: {
      agencyId,
      agentId,
      title,
      travelDateFrom: isIsoDate(travelDateFrom) ? travelDateFrom : "",
      travelDateTo:
        travelDateTo !== null &&
        travelDateTo !== "" &&
        isIsoDate(travelDateTo)
          ? travelDateTo
          : null,
      leadTravelerFirstName:
        typeof body.leadTravelerFirstName === "string"
          ? body.leadTravelerFirstName
          : undefined,
      leadTravelerLastName:
        typeof body.leadTravelerLastName === "string"
          ? body.leadTravelerLastName
          : undefined,
      adultsCount: Number(body.adultsCount) || 0,
      childrenCount,
      infantsCount: Number(body.infantsCount) || 0,
      childrenAges,
    },
  };
}

function createMockId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `c3000000-0000-4000-8000-${Math.floor(Math.random() * 1_000_000_000_000)
      .toString()
      .padStart(12, "0")}`
  );
}

function sortFieldValue(row: ItineraryMockRow, sort: string): string | number {
  switch (sort) {
    case "reference":
      return row.reference.toLowerCase();
    case "title":
      return (row.title ?? "").toLowerCase();
    case "travelDateFrom":
      return row.travelDateFrom;
    case "total":
      return row.totalUsd;
    case "balance":
      return row.balanceUsd;
    case "updatedAt":
      return row.updatedAt;
    default:
      return row.updatedAt;
  }
}

function apiSortToInternalKey(sortBy: string | undefined): string {
  if (!sortBy || sortBy === "None") return "updatedAt";
  switch (sortBy) {
    case "Reference":
      return "reference";
    case "Title":
      return "title";
    case "TravelDateFrom":
      return "travelDateFrom";
    case "Total":
      return "total";
    case "Balance":
      return "balance";
    case "UpdatedAt":
      return "updatedAt";
    default:
      return "updatedAt";
  }
}

// Mock existing inquiries for Flow 2
const MOCK_INQUIRIES = Array.from({ length: 15 }, (_, i) => ({
  id: `inquiry-${i + 1}`,
  reference: `CPS26${String(200 + i).padStart(6, "0")}`,
  agencyId: [AGENCY_A, AGENCY_B, AGENCY_C][i % 3]!,
  agentId: [AGENT_JAMES, AGENT_MARY, null][i % 3],
}));

export function itinerariesRoutes(apiBase: string) {
  return [
    // GET /agencies — for create modal dropdown
    http.get(`${apiBase}/agencies`, () => {
      return HttpResponse.json(
        AGENCIES_LIST.map((a) => ({ id: a.id, name: a.name, isActive: true })),
        { status: 200 }
      );
    }),

    // GET /agents — for create modal dropdown
    http.get(`${apiBase}/agents`, () => {
      return HttpResponse.json(
        AGENTS_LIST.map((a) => ({
          id: a.id,
          agencyId: a.agencyId,
          firstName: a.name.split(" ")[0],
          lastName: a.name.split(" ").slice(1).join(" "),
          isActive: true,
          status: "Active",
        })),
        { status: 200 }
      );
    }),

    // GET /itinerary/inquiries — for existing inquiry search
    http.get(`${apiBase}/itinerary/inquiries`, ({ request }) => {
      const url = new URL(request.url);
      const q = (url.searchParams.get("search") ?? "").toLowerCase();
      const results = MOCK_INQUIRIES.filter(
        (inq) => !q || inq.reference.toLowerCase().includes(q)
      );
      return HttpResponse.json({ items: results }, { status: 200 });
    }),

    // POST search
    http.post(
      `${apiBase}/itinerary/itineraries/search`,
      async ({ request }) => {
        let bodyJson: Partial<SearchBody> = {};
        try {
          bodyJson = ((await request.json()) as Partial<SearchBody>) ?? {};
        } catch {
          bodyJson = {};
        }

        const search =
          typeof bodyJson.search === "string" ? bodyJson.search : "";
        const agencyIds = Array.isArray(bodyJson.agencyIds)
          ? bodyJson.agencyIds.filter(
              (id): id is string => typeof id === "string"
            )
          : [];
        const statuses = Array.isArray(bodyJson.statuses)
          ? bodyJson.statuses.filter((s): s is string => typeof s === "string")
          : [];
        const paymentStatuses = Array.isArray(bodyJson.paymentStatuses)
          ? bodyJson.paymentStatuses.filter(
              (s): s is string => typeof s === "string"
            )
          : [];
        const travelDateFrom =
          typeof bodyJson.travelDateFrom === "string"
            ? bodyJson.travelDateFrom
            : null;
        const travelDateTo =
          typeof bodyJson.travelDateTo === "string"
            ? bodyJson.travelDateTo
            : null;
        const createdAtFrom =
          typeof bodyJson.createdAtFrom === "string"
            ? bodyJson.createdAtFrom
            : null;
        const createdAtTo =
          typeof bodyJson.createdAtTo === "string"
            ? bodyJson.createdAtTo
            : null;

        let filtered = mockItineraries.filter((row) => {
          if (!matchesSearch(row, search)) return false;
          if (agencyIds.length > 0 && !agencyIds.includes(row.agencyId))
            return false;
          if (statuses.length > 0 && !statuses.includes(row.status))
            return false;
          if (
            paymentStatuses.length > 0 &&
            !paymentStatuses.includes(row.paymentStatus)
          )
            return false;
          if (travelDateFrom && row.travelDateFrom < travelDateFrom)
            return false;
          if (travelDateTo && row.travelDateFrom > travelDateTo) return false;
          if (createdAtFrom && row.createdAt.slice(0, 10) < createdAtFrom)
            return false;
          if (createdAtTo && row.createdAt.slice(0, 10) > createdAtTo)
            return false;
          return true;
        });

        const sortKey = apiSortToInternalKey(bodyJson.sortBy);
        const order = bodyJson.sortDirection === "Desc" ? "desc" : "asc";

        filtered = [...filtered].sort((a, b) => {
          const va = sortFieldValue(a, sortKey);
          const vb = sortFieldValue(b, sortKey);
          const cmp =
            typeof va === "number" && typeof vb === "number"
              ? va - vb
              : String(va).localeCompare(String(vb));
          return order === "desc" ? -cmp : cmp;
        });

        const items = filtered.map(toPublicItem);
        return HttpResponse.json(
          { items, total: filtered.length, cursor: null },
          { status: 200 }
        );
      }
    ),

    // POST create
    http.post(`${apiBase}/itinerary/itineraries`, async ({ request }) => {
      const body = (await request
        .json()
        .catch(() => ({}))) as CreateItineraryRequest;
      const { errors, value } = validateCreateRequest(body);

      if (Object.keys(errors).length > 0) {
        return HttpResponse.json(
          { title: "One or more validation errors occurred.", errors },
          { status: 422 }
        );
      }

      const agent = value.agentId
        ? ACTIVE_AGENTS.get(value.agentId)
        : undefined;
      const agencyName =
        agent?.agency ?? ACTIVE_AGENCIES.get(value.agencyId) ?? "Agency";
      const now = new Date().toISOString();
      const createdAt = now.slice(0, 10);
      const inquiryRef = nextInquiryRef();

      const row: ItineraryMockRow = {
        id: createMockId(),
        reference: `${inquiryRef}-001`,
        title: value.title ?? null,
        agency: agencyName,
        agent: agent?.name ?? null,
        safariPlanner: "Amelia Thornton",
        travelDateFrom: String(value.travelDateFrom),
        travelDateTo: value.travelDateTo ? String(value.travelDateTo) : null,
        status: "DRAFT",
        paymentStatus: "UNPAID",
        totalUsd: 0,
        balanceUsd: 0,
        updatedAt: now,
        createdAt: createdAt + "T09:00:00Z",
        version: 1,
        agencyId: value.agencyId,
        agentId: value.agentId ?? null,
        bookedById: value.agentId ?? value.agencyId,
        leadTravelerFirstName: value.leadTravelerFirstName
          ? String(value.leadTravelerFirstName)
          : null,
        leadTravelerLastName: value.leadTravelerLastName
          ? String(value.leadTravelerLastName)
          : null,
        adultsCount: Number(value.adultsCount) || 0,
        childrenCount: Number(value.childrenCount) || 0,
        infantsCount: Number(value.infantsCount) || 0,
        childrenAges: Array.isArray(value.childrenAges)
          ? value.childrenAges.map(Number)
          : [],
      };

      mockItineraries = [row, ...mockItineraries];
      return HttpResponse.json(toPublicItem(row), { status: 201 });
    }),

    http.get(`${apiBase}/itinerary/itineraries/:id`, ({ params }) => {
      const row = mockItineraries.find((r) => r.id === params.id);
      if (!row)
        return HttpResponse.json({ title: "Not found." }, { status: 404 });
      return HttpResponse.json(toDetailItem(row), { status: 200 });
    }),

    http.post(
      `${apiBase}/itinerary/itineraries/:id/services`,
      async ({ params, request }) => {
        const row = mockItineraries.find((r) => r.id === params.id);
        if (!row)
          return HttpResponse.json({ title: "Not found." }, { status: 404 });
        const body = (await request.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const item = {
          id: createMockId(),
          itineraryId: String(params.id),
          type: String(body.type ?? "ACCOMMODATION"),
          supplierId: String(body.supplierId ?? ""),
          supplierName: String(body.supplierName ?? ""),
          name: String(body.name ?? ""),
          startDate: String(body.startDate ?? ""),
          endDate: String(body.endDate ?? ""),
          qty: Number(body.qty) || 1,
          status: "NEW",
        };
        return HttpResponse.json(item, { status: 201 });
      }
    ),
  ];
}
