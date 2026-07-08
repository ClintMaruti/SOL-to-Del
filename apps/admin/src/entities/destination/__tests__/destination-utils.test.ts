import { Globe, Layers, MapPin, Map as MapIcon, Plane } from "lucide-react";
import { describe, it, expect } from "vitest";

import {
  buildDestinationTree,
  flattenDestinations,
  formatCoordinates,
  getAllDestinationTypes,
  getDestinationChildrenUnderCountry,
  getDestinationTypeConfig,
  getRootDestinationCountryNames,
} from "../lib/destination-utils";
import type { Destination } from "../model/types";

// Type for transformed destination items with parentId (what buildDestinationTree expects)
type DestinationWithParentId = Omit<Destination, "children"> & {
  parentId: string | null;
};

describe("buildDestinationTree", () => {
  it("should convert flat array with root nodes to hierarchical tree", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
      {
        id: "uganda",
        parentId: null,
        name: "Uganda",
        type: "Country",
        code: "UGA",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("kenya");
    expect(result[1].id).toBe("uganda");
    expect(result[0].children).toEqual([]);
    expect(result[1].children).toEqual([]);
  });

  it("should build parent-child relationships correctly", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
      {
        id: "southern-kenya",
        parentId: "kenya",
        name: "Southern Kenya",
        type: "Region",
        code: "SKE",
        status: "Active",
      },
      {
        id: "amboseli",
        parentId: "southern-kenya",
        name: "Amboseli",
        type: "City",
        code: "AM6",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("kenya");
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0].id).toBe("southern-kenya");
    expect(result[0].children![0].children).toHaveLength(1);
    expect(result[0].children![0].children![0].id).toBe("amboseli");
  });

  it("should convert coordinates object correctly", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
        coordinates: {
          lat: -0.0236,
          lng: 37.9062,
        },
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result[0].coordinates).toEqual({
      lat: -0.0236,
      lng: 37.9062,
    });
  });

  it("should not include coordinates when coordinates are missing", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
        // coordinates missing
      },
      {
        id: "uganda",
        parentId: null,
        name: "Uganda",
        type: "Country",
        code: "UGA",
        status: "Active",
        // coordinates missing
      },
      {
        id: "tanzania",
        parentId: null,
        name: "Tanzania",
        type: "Country",
        code: "TZA",
        status: "Active",
        // coordinates missing
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result[0].coordinates).toBeUndefined();
    expect(result[1].coordinates).toBeUndefined();
    expect(result[2].coordinates).toBeUndefined();
  });

  it("should handle orphaned nodes (parent doesn't exist)", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "orphan",
        parentId: "non-existent-parent",
        name: "Orphan Node",
        type: "City",
        code: "ORP",
        status: "Active",
      },
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    // Orphaned node should be treated as root
    expect(result).toHaveLength(2);
    expect(result.some((d) => d.id === "orphan")).toBe(true);
    expect(result.some((d) => d.id === "kenya")).toBe(true);
  });

  it("should preserve optional fields (code, status)", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
      {
        id: "inactive",
        parentId: null,
        name: "Inactive Destination",
        type: "City",
        status: "Inactive",
      },
      {
        id: "no-code",
        parentId: null,
        name: "No Code",
        type: "Region",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result[0].code).toBe("KEN");
    expect(result[0].status).toBe("Active");
    expect(result[1].status).toBe("Inactive");
    expect(result[2].code).toBeUndefined();
  });

  it("should sort children alphabetically by name", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
      {
        id: "region-c",
        parentId: "kenya",
        name: "Central Region",
        type: "Region",
        code: "CR",
        status: "Active",
      },
      {
        id: "region-a",
        parentId: "kenya",
        name: "Northern Region",
        type: "Region",
        code: "NR",
        status: "Active",
      },
      {
        id: "region-b",
        parentId: "kenya",
        name: "Southern Region",
        type: "Region",
        code: "SR",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result[0].children).toHaveLength(3);
    expect(result[0].children![0].name).toBe("Central Region");
    expect(result[0].children![1].name).toBe("Northern Region");
    expect(result[0].children![2].name).toBe("Southern Region");
  });

  it("should sort nested children recursively", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
      {
        id: "region-1",
        parentId: "kenya",
        name: "Region B",
        type: "Region",
        code: "RB",
        status: "Active",
      },
      {
        id: "city-2",
        parentId: "region-1",
        name: "City Z",
        type: "City",
        code: "CZ",
        status: "Active",
      },
      {
        id: "city-1",
        parentId: "region-1",
        name: "City A",
        type: "City",
        code: "CA",
        status: "Active",
      },
      {
        id: "region-2",
        parentId: "kenya",
        name: "Region A",
        type: "Region",
        code: "RA",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    // Top level should be sorted
    expect(result[0].children![0].name).toBe("Region A");
    expect(result[0].children![1].name).toBe("Region B");

    // Nested level should also be sorted
    const regionB = result[0].children!.find((c) => c.id === "region-1");
    expect(regionB?.children![0].name).toBe("City A");
    expect(regionB?.children![1].name).toBe("City Z");
  });

  it("should handle empty array", () => {
    const result = buildDestinationTree([]);
    expect(result).toEqual([]);
  });

  it("should handle single root node", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("kenya");
    expect(result[0].children).toEqual([]);
  });

  it("should handle complex nested structure", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
        coordinates: {
          lat: -0.0236,
          lng: 37.9062,
        },
      },
      {
        id: "southern-kenya",
        parentId: "kenya",
        name: "Southern Kenya",
        type: "Region",
        code: "SKE",
        status: "Active",
      },
      {
        id: "amboseli",
        parentId: "southern-kenya",
        name: "Amboseli",
        type: "City",
        code: "AM6",
        status: "Active",
        coordinates: {
          lat: -2.6531,
          lng: 37.2631,
        },
      },
      {
        id: "amboseli-park",
        parentId: "amboseli",
        name: "Amboseli National Park",
        type: "Area",
        code: "ANP",
        status: "Active",
      },
      {
        id: "airstrip",
        parentId: "amboseli-park",
        name: "Amboseli Airstrip",
        type: "Airport",
        code: "ASV",
        status: "Active",
        coordinates: {
          lat: -2.6453,
          lng: 37.2531,
        },
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("kenya");
    expect(result[0].coordinates).toEqual({ lat: -0.0236, lng: 37.9062 });

    const region = result[0].children![0];
    expect(region.id).toBe("southern-kenya");

    const city = region.children![0];
    expect(city.id).toBe("amboseli");
    expect(city.coordinates).toEqual({ lat: -2.6531, lng: 37.2631 });

    const area = city.children![0];
    expect(area.id).toBe("amboseli-park");

    const airport = area.children![0];
    expect(airport.id).toBe("airstrip");
    expect(airport.coordinates).toEqual({ lat: -2.6453, lng: 37.2531 });
  });

  it("should initialize children as empty array for all nodes", () => {
    const flatData: DestinationWithParentId[] = [
      {
        id: "kenya",
        parentId: null,
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
      },
      {
        id: "region",
        parentId: "kenya",
        name: "Region",
        type: "Region",
        code: "REG",
        status: "Active",
      },
    ];

    const result = buildDestinationTree(flatData);

    expect(result[0].children).toBeDefined();
    expect(Array.isArray(result[0].children)).toBe(true);
    expect(result[0].children![0].children).toBeDefined();
    expect(Array.isArray(result[0].children![0].children)).toBe(true);
  });
});

describe("getDestinationTypeConfig", () => {
  it("should return correct config for Country type", () => {
    const config = getDestinationTypeConfig("Country");
    expect(config.icon).toBe(Globe);
    expect(config.color).toBe("text-sky-600");
  });

  it("should return correct config for Region type", () => {
    const config = getDestinationTypeConfig("Region");
    expect(config.icon).toBe(Layers);
    expect(config.color).toBe("text-lime-600");
  });

  it("should return correct config for Area type", () => {
    const config = getDestinationTypeConfig("Area");
    expect(config.icon).toBe(MapIcon);
    expect(config.color).toBe("text-fuchsia-600");
  });

  it("should return correct config for City type", () => {
    const config = getDestinationTypeConfig("City");
    expect(config.icon).toBe(MapPin);
    expect(config.color).toBe("text-indigo-600");
  });

  it("should return correct config for Airport type", () => {
    const config = getDestinationTypeConfig("Airport");
    expect(config.icon).toBe(Plane);
    expect(config.color).toBe("text-amber-600");
  });
});

describe("getAllDestinationTypes", () => {
  it("should return all destination types", () => {
    const types = getAllDestinationTypes();

    expect(types).toHaveLength(5);
  });

  it("should include Country type with correct properties", () => {
    const types = getAllDestinationTypes();
    const country = types.find((t) => t.type === "Country");

    expect(country).toBeDefined();
    expect(country?.label).toBe("Country");
    expect(country?.icon).toBe(Globe);
    expect(country?.color).toBe("text-sky-600");
  });

  it("should include Region type with correct properties", () => {
    const types = getAllDestinationTypes();
    const region = types.find((t) => t.type === "Region");

    expect(region).toBeDefined();
    expect(region?.label).toBe("Region");
    expect(region?.icon).toBe(Layers);
    expect(region?.color).toBe("text-lime-600");
  });

  it("should include Area type with correct properties", () => {
    const types = getAllDestinationTypes();
    const area = types.find((t) => t.type === "Area");

    expect(area).toBeDefined();
    expect(area?.label).toBe("Area");
    expect(area?.icon).toBe(MapIcon);
    expect(area?.color).toBe("text-fuchsia-600");
  });

  it("should include City type with correct properties", () => {
    const types = getAllDestinationTypes();
    const city = types.find((t) => t.type === "City");

    expect(city).toBeDefined();
    expect(city?.label).toBe("City");
    expect(city?.icon).toBe(MapPin);
    expect(city?.color).toBe("text-indigo-600");
  });

  it("should include Airport type with correct properties", () => {
    const types = getAllDestinationTypes();
    const airport = types.find((t) => t.type === "Airport");

    expect(airport).toBeDefined();
    expect(airport?.label).toBe("Airport");
    expect(airport?.icon).toBe(Plane);
    expect(airport?.color).toBe("text-amber-600");
  });

  it("should return types in consistent order", () => {
    const types = getAllDestinationTypes();

    expect(types[0].type).toBe("Country");
    expect(types[1].type).toBe("Region");
    expect(types[2].type).toBe("Area");
    expect(types[3].type).toBe("City");
    expect(types[4].type).toBe("Airport");
  });

  it("should return objects with all required properties", () => {
    const types = getAllDestinationTypes();

    types.forEach((type) => {
      expect(type).toHaveProperty("type");
      expect(type).toHaveProperty("label");
      expect(type).toHaveProperty("icon");
      expect(type).toHaveProperty("color");
      expect(typeof type.type).toBe("string");
      expect(typeof type.label).toBe("string");
      expect(typeof type.color).toBe("string");
    });
  });

  it("should have matching type and label for each entry", () => {
    const types = getAllDestinationTypes();

    types.forEach((type) => {
      expect(type.type).toBe(type.label);
    });
  });

  it("should return unique types only", () => {
    const types = getAllDestinationTypes();
    const typeSet = new Set(types.map((t) => t.type));

    expect(typeSet.size).toBe(types.length);
  });
});

describe("formatCoordinates", () => {
  it("should format coordinates correctly", () => {
    const coordinates = { lat: -0.0236, lng: 37.9062 };
    const result = formatCoordinates(coordinates);
    expect(result).toBe("-0.0236, 37.9062");
  });

  it("should handle negative coordinates", () => {
    const coordinates = { lat: -2.6531, lng: -37.2631 };
    const result = formatCoordinates(coordinates);
    expect(result).toBe("-2.6531, -37.2631");
  });

  it("should handle zero coordinates", () => {
    const coordinates = { lat: 0, lng: 0 };
    const result = formatCoordinates(coordinates);
    expect(result).toBe("0, 0");
  });

  it("should handle decimal precision", () => {
    const coordinates = { lat: 1.23456789, lng: 9.87654321 };
    const result = formatCoordinates(coordinates);
    expect(result).toBe("1.23456789, 9.87654321");
  });

  it("should return empty string when coordinates are undefined", () => {
    const result = formatCoordinates(undefined);
    expect(result).toBe("");
  });

  it("should return empty string when coordinates are not provided", () => {
    const result = formatCoordinates();
    expect(result).toBe("");
  });
});

describe("flattenDestinations", () => {
  const createDestination = (
    id: string,
    name: string,
    children?: Destination[]
  ): Destination => ({
    id,
    name,
    type: "Country",
    children,
  });

  it("should flatten destinations without expanded nodes", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya", [
        createDestination("region", "Region"),
      ]),
      createDestination("uganda", "Uganda"),
    ];

    const result = flattenDestinations(destinations);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("kenya");
    expect(result[0].depth).toBe(0);
    expect(result[1].id).toBe("uganda");
    expect(result[1].depth).toBe(0);
  });

  it("should include children when parent is expanded", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya", [
        createDestination("region", "Region"),
      ]),
    ];

    const expandedIds = new Set(["kenya"]);
    const result = flattenDestinations(destinations, expandedIds);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("kenya");
    expect(result[0].depth).toBe(0);
    expect(result[1].id).toBe("region");
    expect(result[1].depth).toBe(1);
  });

  it("should exclude children when parent is collapsed", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya", [
        createDestination("region", "Region"),
      ]),
    ];

    const expandedIds = new Set<string>(); // Empty set = all collapsed
    const result = flattenDestinations(destinations, expandedIds);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("kenya");
    expect(result[0].depth).toBe(0);
  });

  it("should handle nested children with correct depth", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya", [
        createDestination("region", "Region", [
          createDestination("city", "City"),
        ]),
      ]),
    ];

    const expandedIds = new Set(["kenya", "region"]);
    const result = flattenDestinations(destinations, expandedIds);

    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("kenya");
    expect(result[0].depth).toBe(0);
    expect(result[1].id).toBe("region");
    expect(result[1].depth).toBe(1);
    expect(result[2].id).toBe("city");
    expect(result[2].depth).toBe(2);
  });

  it("should handle partial expansion (some nodes expanded, some not)", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya", [
        createDestination("region1", "Region 1", [
          createDestination("city1", "City 1"),
        ]),
        createDestination("region2", "Region 2", [
          createDestination("city2", "City 2"),
        ]),
      ]),
    ];

    // Only kenya and region1 are expanded
    const expandedIds = new Set(["kenya", "region1"]);
    const result = flattenDestinations(destinations, expandedIds);

    expect(result).toHaveLength(4);
    expect(result[0].id).toBe("kenya");
    expect(result[0].depth).toBe(0);
    expect(result[1].id).toBe("region1");
    expect(result[1].depth).toBe(1);
    expect(result[2].id).toBe("city1");
    expect(result[2].depth).toBe(2);
    expect(result[3].id).toBe("region2");
    expect(result[3].depth).toBe(1);
    // city2 should not be included because region2 is not expanded
  });

  it("should handle empty destinations array", () => {
    const result = flattenDestinations([]);
    expect(result).toEqual([]);
  });

  it("should handle destinations without children", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya"),
      createDestination("uganda", "Uganda"),
    ];

    const result = flattenDestinations(destinations);

    expect(result).toHaveLength(2);
    expect(result[0].depth).toBe(0);
    expect(result[1].depth).toBe(0);
  });

  it("should use default empty Set when expandedIds not provided", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya", [
        createDestination("region", "Region"),
      ]),
    ];

    const result = flattenDestinations(destinations);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("kenya");
  });

  it("should use default depth of 0 when not provided", () => {
    const destinations: Destination[] = [createDestination("kenya", "Kenya")];

    const result = flattenDestinations(destinations);

    expect(result[0].depth).toBe(0);
  });

  it("should handle custom starting depth", () => {
    const destinations: Destination[] = [
      createDestination("kenya", "Kenya", [
        createDestination("region", "Region"),
      ]),
    ];

    const expandedIds = new Set(["kenya"]);
    const result = flattenDestinations(destinations, expandedIds, 2);

    expect(result[0].depth).toBe(2);
    expect(result[1].depth).toBe(3);
  });

  it("should preserve all destination properties in flattened result", () => {
    const destinations: Destination[] = [
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        code: "KEN",
        status: "Active",
        coordinates: { lat: -0.0236, lng: 37.9062 },
        children: [
          {
            id: "region",
            name: "Region",
            type: "Region",
            code: "REG",
          },
        ],
      },
    ];

    const expandedIds = new Set(["kenya"]);
    const result = flattenDestinations(destinations, expandedIds);

    expect(result[0].id).toBe("kenya");
    expect(result[0].name).toBe("Kenya");
    expect(result[0].type).toBe("Country");
    expect(result[0].code).toBe("KEN");
    expect(result[0].status).toBe("Active");
    expect(result[0].coordinates).toEqual({ lat: -0.0236, lng: 37.9062 });
    expect(result[0].depth).toBe(0);
    expect(result[0].preferredStar).toBe("none");

    expect(result[1].id).toBe("region");
    expect(result[1].name).toBe("Region");
    expect(result[1].type).toBe("Region");
    expect(result[1].code).toBe("REG");
    expect(result[1].depth).toBe(1);
    expect(result[1].preferredStar).toBe("none");
  });

  it("marks preferred countries and cascades star state to descendants", () => {
    const destinations: Destination[] = [
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        isPreferred: true,
        children: [
          {
            id: "region",
            name: "Southern Kenya",
            type: "Region",
            children: [],
          },
        ],
      },
    ];
    const expandedIds = new Set(["kenya"]);
    const result = flattenDestinations(destinations, expandedIds);
    expect(result[0].preferredStar).toBe("primary");
    expect(result[1].preferredStar).toBe("cascade");
  });
});

describe("getRootDestinationCountryNames", () => {
  it("returns active root Country names in tree order and skips inactive", () => {
    const destinations: Destination[] = [
      {
        id: "1",
        name: "Kenya",
        type: "Country",
        status: "Active",
        children: [],
      },
      {
        id: "2",
        name: "Tanzania",
        type: "Country",
        status: "Inactive",
        children: [],
      },
      {
        id: "3",
        name: "South Africa",
        type: "Country",
        status: "Active",
        children: [],
      },
      {
        id: "4",
        name: "Some Region",
        type: "Region",
        status: "Active",
        children: [],
      },
    ];

    expect(getRootDestinationCountryNames(destinations)).toEqual([
      "Kenya",
      "South Africa",
    ]);
  });

  it("returns empty array for undefined or empty input", () => {
    expect(getRootDestinationCountryNames(undefined)).toEqual([]);
    expect(getRootDestinationCountryNames([])).toEqual([]);
  });

  it("dedupes duplicate root country names", () => {
    const destinations: Destination[] = [
      {
        id: "1",
        name: "Kenya",
        type: "Country",
        status: "Active",
      },
      {
        id: "2",
        name: "Kenya",
        type: "Country",
        status: "Active",
      },
    ];

    expect(getRootDestinationCountryNames(destinations)).toEqual(["Kenya"]);
  });
});

describe("getDestinationChildrenUnderCountry", () => {
  it("returns direct children of the matching country (case-insensitive)", () => {
    const destinations: Destination[] = [
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        status: "Active",
        children: [
          {
            id: "r1",
            name: "Southern Kenya",
            type: "Region",
            status: "Active",
            children: [],
          },
          {
            id: "r2",
            name: "Northern Kenya",
            type: "Region",
            status: "Active",
            children: [],
          },
        ],
      },
    ];

    const result = getDestinationChildrenUnderCountry(destinations, "kenya");
    expect(result.map((d) => d.id)).toEqual(["r1", "r2"]);
  });

  it("finds country nodes nested in the tree", () => {
    const destinations: Destination[] = [
      {
        id: "root",
        name: "Catalog",
        type: "Region",
        status: "Active",
        children: [
          {
            id: "kenya",
            name: "Kenya",
            type: "Country",
            status: "Active",
            children: [
              {
                id: "c1",
                name: "Child",
                type: "City",
                status: "Active",
                children: [],
              },
            ],
          },
        ],
      },
    ];

    expect(getDestinationChildrenUnderCountry(destinations, "Kenya")).toEqual([
      expect.objectContaining({
        id: "c1",
        name: "Child",
      }),
    ]);
  });

  it("returns empty array when country name is missing or no match", () => {
    const destinations: Destination[] = [
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        status: "Active",
        children: [],
      },
    ];

    expect(getDestinationChildrenUnderCountry(destinations, "")).toEqual([]);
    expect(getDestinationChildrenUnderCountry(destinations, "   ")).toEqual([]);
    expect(getDestinationChildrenUnderCountry(destinations, "Uganda")).toEqual(
      []
    );
  });
});
