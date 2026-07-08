import type { Destination } from "@/entities/destination";

export interface CountryDestinationFilterOption {
  id: string;
  name: string;
}

/**
 * Active Country destinations in tree preorder (same rules as create-itinerary
 * `DestinationMultiSelect`).
 */
export function flattenActiveCountryDestinationsForFilter(
  destinations: Destination[]
): CountryDestinationFilterOption[] {
  const options: CountryDestinationFilterOption[] = [];

  for (const destination of destinations) {
    if (destination.status !== "Inactive" && destination.type === "Country") {
      options.push({
        id: destination.id,
        name: destination.name,
      });
    }

    if (destination.children?.length) {
      options.push(
        ...flattenActiveCountryDestinationsForFilter(destination.children)
      );
    }
  }

  return options;
}

function findDestinationById(
  destinations: Destination[],
  id: string
): Destination | null {
  for (const node of destinations) {
    if (node.id === id) {
      return node;
    }

    if (node.children?.length) {
      const found = findDestinationById(node.children, id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/** Legacy URL filters may reference a non-country location; surface it once in the dropdown. */
export function getDestinationFilterLegacyOption(
  tree: Destination[],
  destinationId: string | null,
  countryIds: Set<string>
): CountryDestinationFilterOption | null {
  if (!destinationId || countryIds.has(destinationId)) {
    return null;
  }

  const node = findDestinationById(tree, destinationId);
  if (!node || node.status === "Inactive") {
    return null;
  }

  return { id: node.id, name: node.name };
}
