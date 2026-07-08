import { describe, expect, it } from "vitest";

import type { CatalogExtraDetail } from "@/entities/catalog-extra";
import { buildCatalogExtraPutBody } from "../build-catalog-extra-put-body";
import { extraDetailToFormValues } from "../schema";

function createExtra(): CatalogExtraDetail {
  return {
    id: "extra-1",
    title: "Extra title",
    serviceId: "service-1",
    serviceName: "Service",
    description: "Description",
    isActive: true,
    notes: null,
    version: 3,
  };
}

describe("buildCatalogExtraPutBody", () => {
  it("sends contractedExtra as null when contracted section is untouched", () => {
    const extra = createExtra();
    const values = extraDetailToFormValues(extra);
    values.title = "Updated title";
    values.serviceIds = [extra.serviceId!];

    const body = buildCatalogExtraPutBody({ extra, values });

    expect(body.contractedExtra).toBeNull();
  });

  it("sends contractedExtra payload once contract is selected", () => {
    const extra = createExtra();
    const values = extraDetailToFormValues(extra);
    values.title = "Updated title";
    values.serviceIds = [extra.serviceId!];
    values.contracted.contractId = "contract-1";
    values.contracted.validFrom = "2026-01-01";
    values.contracted.validTo = "2026-01-31";
    values.contracted.travelDates[0].travelFrom = "2026-01-05";
    values.contracted.travelDates[0].travelTo = "2026-01-08";

    const body = buildCatalogExtraPutBody({ extra, values });

    expect(body.contractedExtra).not.toBeNull();
    expect(body.contractedExtra?.contractId).toBe("contract-1");
    expect(body.contractedExtra?.travelFrom).toBe("2026-01-05");
    expect(body.contractedExtra?.travelTo).toBe("2026-01-08");
  });
});
