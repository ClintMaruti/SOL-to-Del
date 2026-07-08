import type { Destination } from "../model/types";

/** One selectable country row for itinerary create (AC-7 / BR-6). */
export interface ItineraryDestinationCountryOption {
  id: string;
  label: string;
  isPreferred: boolean;
}

function collectActiveCountryRows(
  destinations: Destination[]
): ItineraryDestinationCountryOption[] {
  const rows: ItineraryDestinationCountryOption[] = [];

  for (const destination of destinations) {
    if (destination.type === "Country" && destination.status !== "Inactive") {
      rows.push({
        id: destination.id,
        label: destination.name,
        isPreferred: !!destination.isPreferred,
      });
    }
    if (destination.children?.length) {
      rows.push(...collectActiveCountryRows(destination.children));
    }
  }

  return rows;
}

/**
 * Preferred (A→Z) then other (A→Z) for eligible itinerary country pickers.
 * Omits an empty preferred bucket (AC-8) — caller should not render a header for length 0.
 */
export function buildItineraryEligibleCountryOptionBuckets(
  destinations: Destination[]
): {
  preferred: ItineraryDestinationCountryOption[];
  other: ItineraryDestinationCountryOption[];
} {
  const flat = collectActiveCountryRows(destinations);
  const preferred = flat
    .filter((r) => r.isPreferred)
    .sort((a, b) => a.label.localeCompare(b.label));
  const other = flat
    .filter((r) => !r.isPreferred)
    .sort((a, b) => a.label.localeCompare(b.label));
  return { preferred, other };
}
