import type { CatalogExtraDetail, CatalogExtraPutBody } from "../model/types";

import { deriveCatalogExtraServiceIds } from "./derive-catalog-extra-service-ids";
import { mapContractedDetailToPutItem } from "./map-contracted-detail-to-put-item";

export { mapContractedDetailToPutItem };

export function buildCatalogExtraTogglePutBody(args: {
  detail: CatalogExtraDetail;
  activate: boolean;
}): CatalogExtraPutBody {
  const { detail, activate } = args;

  const contractedExtra = detail.contractedExtra
    ? mapContractedDetailToPutItem(detail.contractedExtra)
    : null;

  const base: CatalogExtraPutBody = {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    isActive: activate,
    version: detail.version ?? 0,
    serviceIds: deriveCatalogExtraServiceIds(detail),
    contractedExtra,
  };

  if (detail.notes) {
    base.notes = detail.notes;
  }

  return base;
}
