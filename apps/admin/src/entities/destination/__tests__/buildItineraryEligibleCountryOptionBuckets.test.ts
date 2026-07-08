import { describe, expect, it } from "vitest";

import { buildItineraryEligibleCountryOptionBuckets } from "../lib/buildItineraryEligibleCountryOptionBuckets";
import type { Destination } from "../model/types";

function country(
  id: string,
  name: string,
  opts?: { isPreferred?: boolean; status?: Destination["status"] }
): Destination {
  return {
    id,
    name,
    type: "Country",
    status: opts?.status ?? "Active",
    ...(typeof opts?.isPreferred === "boolean"
      ? { isPreferred: opts.isPreferred }
      : {}),
  };
}

describe("buildItineraryEligibleCountryOptionBuckets", () => {
  it("splits preferred and other countries, each A→Z, and omits inactive", () => {
    const tree: Destination[] = [
      country("b", "Beta", { isPreferred: true }),
      country("a", "Alpha", { isPreferred: true }),
      country("z", "Zulu", { isPreferred: false }),
      country("x", "Inactive", { isPreferred: true, status: "Inactive" }),
    ];

    const { preferred, other } =
      buildItineraryEligibleCountryOptionBuckets(tree);

    expect(preferred.map((o) => o.label)).toEqual(["Alpha", "Beta"]);
    expect(other.map((o) => o.label)).toEqual(["Zulu"]);
  });

  it("treats missing isPreferred as other segment", () => {
    const tree: Destination[] = [country("k", "Kenya")];
    const { preferred, other } =
      buildItineraryEligibleCountryOptionBuckets(tree);
    expect(preferred).toEqual([]);
    expect(other.map((o) => o.id)).toEqual(["k"]);
  });
});
