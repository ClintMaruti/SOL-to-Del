import type { LucideIcon } from "lucide-react";
import { Globe, Layers, Map as MapIcon, MapPin, Plane } from "lucide-react";

import type {
  Destination,
  DestinationType,
  ParentDestinationOption,
} from "../model/types";

/**
 * Intermediate type for tree building - transformed destination with parentId
 */
type DestinationWithParentId = Omit<Destination, "children"> & {
  parentId: string | null;
};

/** Row produced by {@link flattenDestinations} for tree UIs. */
export type FlattenedDestinationNode = Destination & {
  depth: number;
  preferredStar: "primary" | "cascade" | "none";
};

/** Configuration for a destination type (icon and color) */
export interface DestinationTypeConfig {
  icon: LucideIcon;
  color: string;
}

const destinationTypeConfigs: Record<DestinationType, DestinationTypeConfig> = {
  Country: {
    icon: Globe,
    color: "text-sky-600",
  },
  Region: {
    icon: Layers,
    color: "text-lime-600",
  },
  Area: {
    icon: MapIcon,
    color: "text-fuchsia-600",
  },
  City: {
    icon: MapPin,
    color: "text-indigo-600",
  },
  Airport: {
    icon: Plane,
    color: "text-amber-600",
  },
};

/**
 * Gets icon and color configuration for a destination type.
 * Falls back to Region config if the type is unrecognized.
 */
export function getDestinationTypeConfig(
  type: DestinationType
): DestinationTypeConfig {
  return destinationTypeConfigs[type] ?? destinationTypeConfigs.Region;
}

/**
 * Gets all destination types with their configurations.
 * @returns Array of all destination types with type, label, icon, and color
 */
export function getAllDestinationTypes(): Array<{
  type: DestinationType;
  label: string;
  icon: LucideIcon;
  color: string;
}> {
  return Object.entries(destinationTypeConfigs).map(([type, config]) => ({
    type: type as DestinationType,
    label: type,
    icon: config.icon,
    color: config.color,
  }));
}

/**
 * Formats coordinates as "lat, lng" string.
 * @param coordinates - Optional coordinates object
 * @returns Formatted string or empty string if undefined
 */
export function formatCoordinates(
  coordinates?: Destination["coordinates"]
): string {
  if (!coordinates) return "";
  return `${coordinates.lat}, ${coordinates.lng}`;
}

/**
 * Flattens hierarchical destinations into a flat array with depth.
 * Only includes children of expanded nodes.
 * @param destinations - Array of destinations (can be nested)
 * @param expandedIds - Set of expanded destination IDs
 * @param depth - Starting depth (default: 0)
 * @returns Flat array with depth property
 */
export function flattenDestinations(
  destinations: Destination[],
  expandedIds: Set<string> = new Set(),
  depth: number = 0,
  underPreferredCountrySubtree: boolean = false
): FlattenedDestinationNode[] {
  const result: FlattenedDestinationNode[] = [];

  for (const destination of destinations) {
    const isPreferredCountry =
      destination.type === "Country" && !!destination.isPreferred;
    const preferredStar: FlattenedDestinationNode["preferredStar"] =
      isPreferredCountry
        ? "primary"
        : underPreferredCountrySubtree && destination.type !== "Country"
          ? "cascade"
          : "none";

    result.push({ ...destination, depth, preferredStar });

    if (
      destination.children &&
      destination.children.length > 0 &&
      expandedIds.has(destination.id)
    ) {
      const cascadeForChildren =
        destination.type === "Country"
          ? !!destination.isPreferred
          : underPreferredCountrySubtree;
      result.push(
        ...flattenDestinations(
          destination.children,
          expandedIds,
          depth + 1,
          cascadeForChildren
        )
      );
    }
  }

  return result;
}

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks if a string is a valid GUID.
 */
export function isValidGuid(value: string): boolean {
  return GUID_REGEX.test(value.trim());
}

/**
 * Recursively collects all destinations from a tree into a flat array.
 * @param destinations - Array of destinations (can be nested)
 * @returns Flat array of all destinations
 */
export function collectAllDestinations(
  destinations: Destination[]
): Destination[] {
  const result: Destination[] = [];
  for (const d of destinations) {
    result.push(d);
    if (d.children?.length) {
      result.push(...collectAllDestinations(d.children));
    }
  }
  return result;
}

/**
 * Transforms flat array with parentId references into hierarchical tree.
 * Handles root nodes, parent-child relationships, and orphaned nodes.
 * Sorts children alphabetically by name.
 * @param flatDestinations - Array of transformed destination items with parentId
 * @returns Array of root destinations with nested children
 */
export function buildDestinationTree(
  flatDestinations: DestinationWithParentId[]
): Destination[] {
  // Create a map for quick lookup
  const destinationMap: Map<string, Destination> = new Map();
  const rootDestinations: Destination[] = [];

  // First pass: Create Destination objects (without children)
  flatDestinations.forEach((item) => {
    const destination: Destination = {
      id: item.id,
      name: item.name,
      type: item.type,
      code: item.code,
      status: item.status,
      children: [],
      ...(typeof item.isPreferred === "boolean"
        ? { isPreferred: item.isPreferred }
        : {}),
      ...(item.coordinates
        ? {
            coordinates: item.coordinates,
          }
        : {}),
    };

    destinationMap.set(item.id, destination);
  });

  // Second pass: Build parent-child relationships
  flatDestinations.forEach((item) => {
    const destination = destinationMap.get(item.id)!;

    // Root node: parentId is null or parent doesn't exist in map
    if (item.parentId === null || !destinationMap.has(item.parentId)) {
      rootDestinations.push(destination);
    } else {
      // Child node - add to parent's children array
      const parent = destinationMap.get(item.parentId);
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(destination);
      }
    }
  });

  // Sort children by name (optional, but improves UX)
  const sortChildren = (dest: Destination) => {
    if (dest.children && dest.children.length > 0) {
      dest.children.sort((a, b) => a.name.localeCompare(b.name));
      dest.children.forEach(sortChildren);
    }
  };

  rootDestinations.forEach(sortChildren);

  return rootDestinations;
}

/**
 * Names of root-level destinations with type Country (active only), in tree order.
 * Used to prioritize those countries in address country dropdowns. Names that do not
 * match the shared ISO country list (`COUNTRIES`) are ignored at option-build time.
 */
export function getRootDestinationCountryNames(
  destinations: Destination[] | undefined
): string[] {
  if (!destinations?.length) return [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const d of destinations) {
    if (d.type !== "Country") continue;
    if (d.status === "Inactive") continue;
    if (seen.has(d.name)) continue;
    seen.add(d.name);
    names.push(d.name);
  }
  return names;
}

/**
 * Finds a destination anywhere in the tree by id (depth-first).
 */
export function findDestinationById(
  destinations: Destination[] | undefined,
  id: string | null | undefined
): Destination | null {
  if (!destinations?.length || !id?.trim()) {
    return null;
  }
  const needle = id.trim();

  function walk(nodes: Destination[]): Destination | null {
    for (const node of nodes) {
      if (node.id === needle) {
        return node;
      }
      if (node.children?.length) {
        const found = walk(node.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  return walk(destinations);
}

/**
 * Resolves a catalog Country row id from a display name (case-insensitive).
 * Used when copying head office address (HO still stores country as a name string).
 */
export function findCountryDestinationIdByName(
  destinations: Destination[] | undefined,
  countryName: string | null | undefined
): string {
  if (!destinations?.length || !countryName?.trim()) {
    return "";
  }
  const needle = countryName.trim().toLowerCase();

  function walk(nodes: Destination[]): string {
    for (const node of nodes) {
      if (
        node.type === "Country" &&
        node.name.trim().toLowerCase() === needle
      ) {
        return node.id;
      }
      if (node.children?.length) {
        const found = walk(node.children);
        if (found) {
          return found;
        }
      }
    }
    return "";
  }

  return walk(destinations);
}

/**
 * Direct children of the destination tree node whose type is Country and that matches
 * `countryIdOrName` by **id** (exact) or **name** (case-insensitive, legacy).
 * Used to scope location pickers to a country (supplier form, create-supplier-service).
 *
 * Returns an empty array when the key is missing/blank or when no matching country node exists.
 */
export function getDestinationChildrenUnderCountry(
  destinations: Destination[],
  countryIdOrName: string | undefined | null
): Destination[] {
  if (!countryIdOrName?.trim()) {
    return [];
  }

  const key = countryIdOrName.trim();
  const keyLower = key.toLowerCase();
  const seenIds = new Set<string>();
  const matched: Destination[] = [];

  function collectCountryChildren(nodes: Destination[]) {
    for (const node of nodes) {
      if (node.type !== "Country") {
        if (node.children) {
          collectCountryChildren(node.children);
        }
        continue;
      }

      const byId = node.id === key;
      const byName = node.name.toLowerCase() === keyLower;
      if (byId || byName) {
        if (node.children) {
          for (const child of node.children) {
            if (!seenIds.has(child.id)) {
              seenIds.add(child.id);
              matched.push(child);
            }
          }
        }
      }
      if (node.children) {
        collectCountryChildren(node.children);
      }
    }
  }

  collectCountryChildren(destinations);
  return matched;
}

/**
 * Finds a parent destination by parentId in a hierarchical destinations tree.
 * Recursively searches through the tree structure.
 * @param destinations - Array of destinations (can be nested)
 * @param parentId - The parent ID to search for (null for root nodes)
 * @returns The parent destination if found, null otherwise
 */
export function findParentDestination(
  destinations: Destination[],
  parentId: string | null
): Destination | null {
  // Handle root destinations (null parentId)
  if (parentId === null || parentId === "root_id") {
    return null;
  }

  // Recursive search function
  const search = (dests: Destination[]): Destination | null => {
    for (const dest of dests) {
      // Check if this destination matches the parentId
      if (dest.id === parentId) {
        return dest;
      }

      // Recursively search children
      if (dest.children && dest.children.length > 0) {
        const found = search(dest.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  return search(destinations);
}

/**
 * Flattens hierarchical destinations into a flat array of parent destination options.
 * Used for populating parent selection dropdowns.
 * @param destinations - Array of destinations (can be nested)
 * @returns Flat array of parent destination options with parent names
 */
export function flattenDestinationTree(
  destinations: Destination[]
): ParentDestinationOption[] {
  const result: ParentDestinationOption[] = [];

  function traverse(node: Destination, parentName: string | null = null) {
    result.push({
      id: node.id,
      name: node.name,
      type: node.type,
      ...(parentName ? { parent: parentName } : {}),
    });

    if (Array.isArray(node.children)) {
      node.children.forEach((child) => traverse(child, node.name));
    }
  }

  destinations.forEach((dest) => traverse(dest));
  return result;
}

/**
 * Checks if selecting a destination as parent would create a circular relationship.
 * Prevents A being parent of B and B being parent of A.
 * @param destinations - Array of destinations (can be nested)
 * @param parentId - The parent ID to check
 * @param currentDestinationId - The ID of the destination being created/edited (optional)
 * @returns true if circular relationship would be created, false otherwise
 */
export function wouldCreateCircularParent(
  destinations: Destination[],
  parentId: string,
  currentDestinationId?: string
): boolean {
  if (!parentId || parentId === "root_id") {
    return false;
  }

  // If we're editing an existing destination, check if parentId is the same as current ID
  if (currentDestinationId && parentId === currentDestinationId) {
    return true;
  }

  // Recursive function to check if a destination is a descendant of the potential parent
  const isDescendant = (
    targetId: string,
    ancestorId: string,
    dests: Destination[]
  ): boolean => {
    for (const dest of dests) {
      if (dest.id === ancestorId) {
        // Found the ancestor, now check if targetId is in its descendants
        const checkDescendants = (node: Destination): boolean => {
          if (node.id === targetId) {
            return true;
          }
          if (node.children && node.children.length > 0) {
            return node.children.some(checkDescendants);
          }
          return false;
        };
        return checkDescendants(dest);
      }
      // Recursively search in children
      if (dest.children && dest.children.length > 0) {
        if (isDescendant(targetId, ancestorId, dest.children)) {
          return true;
        }
      }
    }
    return false;
  };

  // If we're editing, check if the parent is a descendant of current destination
  if (currentDestinationId) {
    return isDescendant(parentId, currentDestinationId, destinations);
  }

  return false;
}

// Destination type hierarchy: Country > Region > Area > City > Airport
export const DESTINATION_TYPE_HIERARCHY: DestinationType[] = [
  "Country",
  "Region",
  "Area",
  "City",
  "Airport",
];

/**
 * Get the next valid child type for a given parent type
 */
export function getDefaultChildType(
  parentType: DestinationType
): DestinationType {
  const parentIndex = DESTINATION_TYPE_HIERARCHY.indexOf(parentType);

  return DESTINATION_TYPE_HIERARCHY[parentIndex + 1] || "Airport";
}

/**
 * Check if a destination type is disabled based on the parent type
 * Types that are the same as or higher than the parent type are disabled
 */
export function isTypeDisabled(
  type: DestinationType,
  parentType: DestinationType | undefined
): boolean {
  if (!parentType) return false;
  const parentIndex = DESTINATION_TYPE_HIERARCHY.indexOf(parentType);
  const typeIndex = DESTINATION_TYPE_HIERARCHY.indexOf(type);
  // Disable types that are the same level or higher in hierarchy
  return typeIndex <= parentIndex;
}
