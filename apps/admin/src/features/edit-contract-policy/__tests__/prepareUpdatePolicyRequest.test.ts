import { describe, expect, it } from "vitest";

import { prepareUpdatePolicyRequest } from "../lib/prepareUpdatePolicyRequest";

describe("prepareUpdatePolicyRequest", () => {
  it("maps existing travel date rows to backend travelDates with id and version", () => {
    const body = prepareUpdatePolicyRequest(
      {
        policyName: "Festive Policy",
        description: "Festive season terms",
        refundable: false,
        travelDates: [
          {
            id: "range-1",
            version: 7,
            from: "2026-05-18",
            to: "2026-05-20",
          },
          {
            from: "2026-06-01",
            to: null,
          },
        ],
        conditions: [],
      },
      false,
      "policy-1",
      "contract-1"
    );

    expect(body.travelDates).toEqual([
      {
        id: "range-1",
        version: 7,
        dateFrom: "2026-05-18",
        dateTo: "2026-05-20",
      },
      {
        id: undefined,
        version: undefined,
        dateFrom: "2026-06-01",
        dateTo: null,
      },
    ]);
  });
});
