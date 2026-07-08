import type {
  ItinerariesListQueryInput,
  ItinerariesListResponse,
  ItinerariesSearchSortByApi,
  ItinerariesSearchSortDirectionApi,
  ItinerarySortField,
} from "../model/types";

export const ITINERARIES_SEARCH_PATH = "/itinerary/itineraries/search";

/** Default matches typical first-page listing; aligns with backend max page hints. */
export const ITINERARIES_DEFAULT_PAGE_SIZE = 50;

const SORT_FIELD_TO_API: Record<
  ItinerarySortField,
  Exclude<ItinerariesSearchSortByApi, "None">
> = {
  reference: "Reference",
  title: "Title",
  travelDateFrom: "TravelDateFrom",
  status: "Status",
  paymentStatus: "PaymentStatus",
  total: "Total",
  balance: "Balance",
  updatedAt: "UpdatedAt",
};

export function sortFieldToApiSortBy(
  sort: ItinerarySortField | null | undefined
): ItinerariesSearchSortByApi {
  if (!sort) {
    return "None";
  }
  return SORT_FIELD_TO_API[sort];
}

export function listOrderToApiSortDirection(
  order: "asc" | "desc" | undefined
): ItinerariesSearchSortDirectionApi {
  return order === "desc" ? "Desc" : "Asc";
}

export type ItinerariesSearchRequestBody = {
  pageSize: number;
  sortBy: ItinerariesSearchSortByApi;
  sortDirection: ItinerariesSearchSortDirectionApi;
  hideCompleted?: boolean;
  search?: string;
  cursor?: string;
  agencyIds?: string[];
  locationIds?: string[];
  statuses?: string[];
  paymentStatuses?: string[];
  travelDateFrom?: string;
  travelDateTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export function buildItinerariesSearchRequestBody(
  params: ItinerariesListQueryInput
): ItinerariesSearchRequestBody {
  const search = params.search?.trim();
  const body: ItinerariesSearchRequestBody = {
    pageSize: ITINERARIES_DEFAULT_PAGE_SIZE,
    sortBy: sortFieldToApiSortBy(params.sort ?? null),
    sortDirection: listOrderToApiSortDirection(params.order),
  };

  if (search && search.length > 0) {
    body.search = search;
  }

  if (params.agencyId && params.agencyId.length > 0) {
    body.agencyIds = [params.agencyId];
  }

  if (params.destinationId && params.destinationId.length > 0) {
    body.locationIds = [params.destinationId];
  }

  if (params.dateFrom && params.dateFrom.length > 0) {
    body.travelDateFrom = params.dateFrom;
  }

  if (params.dateTo && params.dateTo.length > 0) {
    body.travelDateTo = params.dateTo;
  }

  if (params.createdOnFrom && params.createdOnFrom.length > 0) {
    body.createdAtFrom = params.createdOnFrom;
  }

  if (params.createdOnTo && params.createdOnTo.length > 0) {
    body.createdAtTo = params.createdOnTo;
  }

  if (params.statuses && params.statuses.length > 0) {
    body.statuses = params.statuses;
  }

  if (params.paymentStatus && params.paymentStatus.length > 0) {
    body.paymentStatuses = [params.paymentStatus];
  }

  if (params.hideCompleted === true) {
    body.hideCompleted = true;
  }

  return body;
}

export function normalizeItinerariesListResponse(
  data: unknown
): ItinerariesListResponse {
  if (data && typeof data === "object" && "items" in data) {
    const raw = data as Record<string, unknown>;
    const rawItems = raw.items;
    if (Array.isArray(rawItems)) {
      const items = rawItems as ItinerariesListResponse["items"];
      const totalFromApi = raw.total;
      const total =
        typeof totalFromApi === "number" ? totalFromApi : items.length;

      return {
        items,
        total,
      };
    }
  }

  if (Array.isArray(data)) {
    return {
      items: data as ItinerariesListResponse["items"],
      total: data.length,
    };
  }

  return { items: [], total: 0 };
}
