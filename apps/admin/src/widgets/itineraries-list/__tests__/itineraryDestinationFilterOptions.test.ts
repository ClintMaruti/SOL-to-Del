import { describe, expect, it } from "vitest";

import type { Destination } from "@/entities/destination";

import {
  flattenActiveCountryDestinationsForFilter,
  getDestinationFilterLegacyOption,
} from "../model/itineraryDestinationFilterOptions";

describe("flattenActiveCountryDestinationsForFilter", () => {
  it("collects active Country nodes in preorder and skips Region/City/Inactive", () => {
    const tree: Destination[] = [
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        status: "Active",
        children: [
          {
            id: "southern",
            name: "Southern",
            type: "Region",
            status: "Active",
            children: [
              {
                id: "amboseli",
                name: "Amboseli",
                type: "City",
                status: "Active",
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "uganda",
        name: "Uganda",
        type: "Country",
        status: "Active",
        children: [],
      },
      {
        id: "xland",
        name: "Inactive Land",
        type: "Country",
        status: "Inactive",
        children: [],
      },
    ];

    expect(flattenActiveCountryDestinationsForFilter(tree)).toEqual([
      { id: "kenya", name: "Kenya" },
      { id: "uganda", name: "Uganda" },
    ]);
  });

  it("returns empty array for empty tree", () => {
    expect(flattenActiveCountryDestinationsForFilter([])).toEqual([]);
  });
});

describe("getDestinationFilterLegacyOption", () => {
  it("returns non-country node when id is not among country ids", () => {
    const tree: Destination[] = [
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        status: "Active",
        children: [
          {
            id: "amboseli",
            name: "Amboseli",
            type: "City",
            status: "Active",
            children: [],
          },
        ],
      },
    ];
    const countryIds = new Set(["kenya"]);

    expect(
      getDestinationFilterLegacyOption(tree, "amboseli", countryIds)
    ).toEqual({ id: "amboseli", name: "Amboseli" });
  });

  it("returns null when id is a listed country", () => {
    const tree: Destination[] = [
      {
        id: "kenya",
        name: "Kenya",
        type: "Country",
        status: "Active",
        children: [],
      },
    ];

    expect(
      getDestinationFilterLegacyOption(tree, "kenya", new Set(["kenya"]))
    ).toBeNull();
  });
});
