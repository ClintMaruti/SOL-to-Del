import { describe, expect, it } from "vitest";

import {
  normalizeAgency,
  type AgencyApiResponse,
} from "../lib/normalizeAgency";
import { createAgency } from "../testing/factories";

describe("normalizeAgency", () => {
  it("derives agencyGroupIds from agencyGroups and removes duplicate groups", () => {
    const agency = createAgency("agency-1", "Test Agency", {
      agencyGroupIds: [],
      agencyGroups: [
        { id: "group-2", name: "Beta Group" },
        { id: "group-1", name: "Alpha Group" },
        { id: "group-2", name: "Beta Group" },
      ],
    }) as AgencyApiResponse;
    delete agency.agencyGroupIds;

    const normalized = normalizeAgency(agency);

    expect(normalized.agencyGroups).toEqual([
      { id: "group-1", name: "Alpha Group" },
      { id: "group-2", name: "Beta Group" },
    ]);
    expect(normalized.agencyGroupIds).toEqual(["group-1", "group-2"]);
  });
});
