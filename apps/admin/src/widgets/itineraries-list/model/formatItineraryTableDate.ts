/**
 * Itinerary search rows may use calendar dates (YYYY-MM-DD) or full ISO datetimes.
 * Keeps itinerary table display correct without widening the shared `formatDate` contract.
 */
export function formatItineraryTableDate(value: string): string {
  const trimmed = value.trim();
  const parsed = trimmed.includes("T")
    ? new Date(trimmed)
    : new Date(`${trimmed}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
