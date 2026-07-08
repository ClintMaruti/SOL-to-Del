import type { ItinerariesListQueryInput } from "./types";

export function getItinerariesQueryKey(params: ItinerariesListQueryInput) {
  return [
    "itineraries",
    "list",
    params.search ?? "",
    params.hideCompleted === true ? "1" : "0",
    params.sort ?? "",
    params.order ?? "",
    params.agencyId ?? "",
    params.bookedById ?? "",
    params.dateFrom ?? "",
    params.dateTo ?? "",
    params.destinationId ?? "",
    params.createdOnFrom ?? "",
    params.createdOnTo ?? "",
    (params.statuses ?? []).join(","),
    params.paymentStatus ?? "",
  ] as const;
}
