import type { Destination } from "@/entities/destination";
import type { Location } from "@/entities/locations/types";
import type { DropdownSelectOption } from "@/shared/ui";

type DestinationType = "Country" | "Region" | "Area" | "City" | "Airport";

const DESTINATION_TYPES: readonly DestinationType[] = [
  "Country",
  "Region",
  "Area",
  "City",
  "Airport",
];

function normalizeDestinationType(type: string | number): DestinationType {
  if (typeof type === "number") {
    return DESTINATION_TYPES[type] ?? "Area";
  }
  const normalized = type.trim().toLowerCase();
  if (normalized === "country") return "Country";
  if (normalized === "region") return "Region";
  if (normalized === "area") return "Area";
  if (normalized === "city") return "City";
  if (normalized === "airport") return "Airport";
  return "Area";
}

function buildSubLabel(type: DestinationType, parentPath: string[]): string {
  if (parentPath.length === 0) return type;
  return `${type} - ${parentPath.join(" > ")}`;
}

function buildOption(
  id: string,
  name: string,
  type: DestinationType,
  depth: number,
  parentPath: string[],
  parentValue: string | undefined,
  hasChildren: boolean
): DropdownSelectOption {
  const fullPath = [...parentPath, name].join(" > ");
  return {
    value: id,
    label: name,
    type,
    indentLevel: depth,
    subLabel: buildSubLabel(type, parentPath),
    searchText: `${name} ${type} ${fullPath}`,
    parentValue,
    hasChildren,
  };
}

export function buildHierarchicalLocationOptionsFromFlatLocations(
  locations: Location[]
): DropdownSelectOption[] {
  if (!Array.isArray(locations) || locations.length === 0) return [];

  const byId = new Map(locations.map((loc) => [loc.id, loc]));
  const childrenByParent = new Map<string | null, Location[]>();

  for (const loc of locations) {
    const parentKey =
      loc.parentId && byId.has(loc.parentId) ? loc.parentId : null;
    const bucket = childrenByParent.get(parentKey) ?? [];
    bucket.push(loc);
    childrenByParent.set(parentKey, bucket);
  }

  const options: DropdownSelectOption[] = [];
  const visited = new Set<string>();

  function traverse(node: Location, depth: number, parentPath: string[]) {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    const type = normalizeDestinationType(node.type);
    const children = childrenByParent.get(node.id) ?? [];
    options.push(
      buildOption(
        node.id,
        node.name,
        type,
        depth,
        parentPath,
        node.parentId && byId.has(node.parentId) ? node.parentId : undefined,
        children.length > 0
      )
    );
    for (const child of children) {
      traverse(child, depth + 1, [...parentPath, node.name]);
    }
  }

  const roots = childrenByParent.get(null) ?? [];
  for (const root of roots) {
    traverse(root, 0, []);
  }

  // Include any disconnected nodes to keep full selectability.
  for (const loc of locations) {
    if (!visited.has(loc.id)) {
      traverse(loc, 0, []);
    }
  }

  return options;
}

export function buildHierarchicalLocationOptionsFromDestinationTree(
  destinations: Destination[]
): DropdownSelectOption[] {
  if (!Array.isArray(destinations) || destinations.length === 0) return [];

  const options: DropdownSelectOption[] = [];

  function traverse(
    node: Destination,
    depth: number,
    parentPath: string[],
    parentId?: string
  ): void {
    const type = normalizeDestinationType(node.type);
    const childCount = Array.isArray(node.children) ? node.children.length : 0;
    options.push(
      buildOption(
        node.id,
        node.name,
        type,
        depth,
        parentPath,
        parentId,
        childCount > 0
      )
    );

    if (!Array.isArray(node.children) || node.children.length === 0) return;
    for (const child of node.children) {
      traverse(child, depth + 1, [...parentPath, node.name], node.id);
    }
  }

  for (const root of destinations) {
    traverse(root, 0, []);
  }

  return options;
}
