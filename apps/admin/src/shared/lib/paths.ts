/**
 * Centralized route path constants.

 * Use these instead of hardcoded strings to prevent silent breaks when paths change.
 * For dynamic paths (e.g. agency detail by ID), use the helper functions.
 */

export const ROUTES = {
  LOGIN: "/login",
  HOME: "/",
  DATABASE: "/database",
  DATABASE_DESTINATIONS: "/database/destinations",
  DATABASE_DESTINATIONS_INNER: "/database/destinations/:innerPageId",
  DATABASE_SERVICE_TYPES: "/database/service-types",
  DATABASE_RATE_TYPES: "/database/rate-types",
  DATABASE_SOURCE_MARKET: "/database/source-market",
  DATABASE_DOCUMENTS: "/database/documents",
  DATABASE_CONTENT: "/database/destinations/content",
  DATABASE_CONTENT_BLOCK_CREATE: "/database/destinations/content/blocks/create",
  DATABASE_CONTENT_BLOCK_DETAIL:
    "/database/destinations/content/blocks/:contentBlockId",
  DATABASE_DOCUMENT_TEMPLATE_DETAIL:
    "/database/destinations/content/templates/:documentTemplateId",
  DATABASE_LOG: "/database/log",
  // Destinations sub-routes
  DESTINATIONS: "/database/destinations/destinations",
  AGENCY_GROUPS: "/database/destinations/agency-groups",
  AGENCY_GROUPS_CREATE: "/database/destinations/agency-groups/create",
  AGENCY_GROUPS_DETAIL: "/database/destinations/agency-groups/:agencyGroupId",
  AGENCIES: "/database/destinations/agencies",
  AGENCIES_CREATE: "/database/destinations/agencies/create",
  AGENCIES_DETAIL: "/database/destinations/agencies/:agencyId",
  AGENTS: "/database/destinations/agents",
  AGENTS_CREATE: "/database/destinations/agents/create",
  AGENTS_DETAIL: "/database/destinations/agents/:id",
  MARGIN_RULES: "/database/destinations/margin-rules",
  SUPPLIERS: "/database/destinations/suppliers",
  SUPPLIERS_CREATE: "/database/destinations/suppliers/create",
  SUPPLIERS_DETAIL: "/database/destinations/suppliers/:supplierId",
  SUPPLIER_SERVICES: "/database/destinations/suppliers/:supplierId/services",
  SUPPLIER_CONTRACT_DETAIL:
    "/database/destinations/suppliers/:supplierId/contracts/:contractId",
  SUPPLIER_SERVICE_DETAIL:
    "/database/destinations/suppliers/:supplierId/services/:serviceId",
  /** Extra view/edit page (supplier- or service-extras entry; optional `?context=service`). */
  SUPPLIER_EXTRA_DETAIL:
    "/database/destinations/suppliers/:supplierId/extras/:extraId",
  /** Edit a predefined supplier content section (body only). */
  SUPPLIER_CONTENT_BLOCK_DETAIL:
    "/database/destinations/suppliers/:supplierId/content-blocks/:contentBlockId",
  SUPPLIER_HEAD_OFFICES: "/database/destinations/supplier-head-offices",
  SUPPLIER_HEAD_OFFICES_CREATE:
    "/database/destinations/supplier-head-offices/create",
  SUPPLIER_HEAD_OFFICES_DETAIL:
    "/database/destinations/supplier-head-offices/:headOfficeId",
  SUPPLIER_HEAD_OFFICE_PROMOTION_CREATE:
    "/database/destinations/supplier-head-offices/:headOfficeId/promotions/create",
  SUPPLIER_HEAD_OFFICE_PROMOTION_DETAIL:
    "/database/destinations/supplier-head-offices/:headOfficeId/promotions/:promotionId",
  /** Configuration → settings hub (three-segment URLs, see CONFIGURATION_SUB_PAGES). */
  CONFIGURATION_SETTINGS_FUTURE_UPLIFT: "/configuration/settings/future-uplift",
  CONFIGURATION_SETTINGS_SYSTEM: "/configuration/settings/system-settings",
  CONFIGURATION_SETTINGS_USERS: "/configuration/settings/user-management",
  /** Itinerary section (three-segment URLs like database/destinations). */
  ITINERARY_ITINERARIES: "/itinerary/itineraries",
  ITINERARY_ITINERARIES_INNER: "/itinerary/itineraries/:innerPageId",
  ITINERARY_ITINERARIES_LIST: "/itinerary/itineraries/itineraries",
  ITINERARIES_CREATE: "/itinerary/itineraries/create",
  ITINERARY_DETAIL: "/itinerary/itineraries/detail/:id",
} as const;

/** Replace :param segments in a path template with actual values. */
export function buildPath(
  path: string,
  params: Record<string, string>
): string {
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

export function agencyGroupDetailPath(agencyGroupId: string): string {
  return buildPath(ROUTES.AGENCY_GROUPS_DETAIL, { agencyGroupId });
}

export function contentBlockDetailPath(contentBlockId: string): string {
  return buildPath(ROUTES.DATABASE_CONTENT_BLOCK_DETAIL, { contentBlockId });
}

export function documentTemplateDetailPath(documentTemplateId: string): string {
  return buildPath(ROUTES.DATABASE_DOCUMENT_TEMPLATE_DETAIL, {
    documentTemplateId,
  });
}

export function agencyDetailPath(agencyId: string): string {
  return buildPath(ROUTES.AGENCIES_DETAIL, { agencyId });
}

export function agentDetailPath(agentId: string): string {
  return buildPath(ROUTES.AGENTS_DETAIL, { id: agentId });
}

export function supplierDetailPath(supplierId: string): string {
  return buildPath(ROUTES.SUPPLIERS_DETAIL, { supplierId });
}

export function headOfficeDetailPath(headOfficeId: string): string {
  return buildPath(ROUTES.SUPPLIER_HEAD_OFFICES_DETAIL, { headOfficeId });
}

export function headOfficePromotionCreatePath(headOfficeId: string): string {
  return buildPath(ROUTES.SUPPLIER_HEAD_OFFICE_PROMOTION_CREATE, {
    headOfficeId,
  });
}

export function headOfficePromotionDetailPath(
  headOfficeId: string,
  promotionId: string
): string {
  return buildPath(ROUTES.SUPPLIER_HEAD_OFFICE_PROMOTION_DETAIL, {
    headOfficeId,
    promotionId,
  });
}

export function supplierContractDetailPath(
  supplierId: string,
  contractId: string
): string {
  return buildPath(ROUTES.SUPPLIER_CONTRACT_DETAIL, {
    supplierId,
    contractId,
  });
}

export function supplierServiceDetailPath(
  supplierId: string,
  serviceId: string
): string {
  return buildPath(ROUTES.SUPPLIER_SERVICE_DETAIL, {
    supplierId,
    serviceId,
  });
}

/** Query keys for deep-linking into the service detail Options tab (see ServiceOptionsTab). */
export type SupplierServiceOptionsDeepLinkParams = {
  optionId: string;
  innerTab?: "eligibility" | "ratePlan";
  ratePlanId?: string;
};

/** Query keys for deep-linking into the service detail Rates tab. */
export type SupplierServiceRatesDeepLinkParams = {
  contractId?: string;
  rateId?: string;
};

/**
 * Service detail URL with `tab=options` and optional inner navigation (option accordion, rates / rate plan tab, expanded card).
 */
export function supplierServiceOptionsDetailSearch(
  supplierId: string,
  serviceId: string,
  params: SupplierServiceOptionsDeepLinkParams
): string {
  const search = new URLSearchParams();
  search.set("tab", "options");
  search.set("optionId", params.optionId);
  if (params.innerTab) {
    search.set("innerTab", params.innerTab);
  }
  if (params.ratePlanId) {
    search.set("ratePlanId", params.ratePlanId);
  }
  return `${supplierServiceDetailPath(supplierId, serviceId)}?${search.toString()}`;
}

/**
 * Service detail URL with `tab=rates` and optional contract / rate scroll targets.
 */
export function supplierServiceRatesDetailSearch(
  supplierId: string,
  serviceId: string,
  params?: SupplierServiceRatesDeepLinkParams
): string {
  const search = new URLSearchParams();
  search.set("tab", "rates");
  if (params?.contractId) {
    search.set("contractId", params.contractId);
  }
  if (params?.rateId) {
    search.set("rateId", params.rateId);
  }
  return `${supplierServiceDetailPath(supplierId, serviceId)}?${search.toString()}`;
}

export function supplierExtraDetailPath(
  supplierId: string,
  extraId: string
): string {
  return buildPath(ROUTES.SUPPLIER_EXTRA_DETAIL, {
    supplierId,
    extraId,
  });
}

export function supplierContentBlockDetailPath(
  supplierId: string,
  contentBlockId: string
): string {
  return buildPath(ROUTES.SUPPLIER_CONTENT_BLOCK_DETAIL, {
    supplierId,
    contentBlockId,
  });
}

/** Map main sidebar nav segments to ROUTES. Use for MainSidebar and PageSidebar navigation. */
export function getNavPath(
  mainItemId: string,
  childId?: string | null,
  innerPageId?: string | null
): string {
  if (mainItemId === "itinerary" && childId === "itineraries") {
    const innerMap: Record<string, string> = {
      itineraries: ROUTES.ITINERARY_ITINERARIES_LIST,
      create: ROUTES.ITINERARIES_CREATE,
    };
    return innerPageId
      ? (innerMap[innerPageId] ?? `/itinerary/itineraries/${innerPageId}`)
      : ROUTES.ITINERARY_ITINERARIES;
  }

  if (mainItemId !== "database")
    return `/${mainItemId}${childId ? `/${childId}` : ""}${innerPageId ? `/${innerPageId}` : ""}`;

  if (childId === "destinations") {
    // Keep in sync with DESTINATIONS_SUB_PAGES when adding new destinations sub-pages
    const innerMap: Record<string, string> = {
      destinations: ROUTES.DESTINATIONS,
      "agency-groups": ROUTES.AGENCY_GROUPS,
      agencies: ROUTES.AGENCIES,
      agents: ROUTES.AGENTS,
      "margin-rules": ROUTES.MARGIN_RULES,
      suppliers: ROUTES.SUPPLIERS,
      "supplier-head-offices": ROUTES.SUPPLIER_HEAD_OFFICES,
      content: ROUTES.DATABASE_CONTENT,
    };
    return innerPageId
      ? (innerMap[innerPageId] ?? `/database/destinations/${innerPageId}`)
      : ROUTES.DATABASE_DESTINATIONS;
  }
  if (childId === "service-types") return ROUTES.DATABASE_SERVICE_TYPES;
  if (childId === "rate-types") return ROUTES.DATABASE_RATE_TYPES;
  if (childId === "source-market") return ROUTES.DATABASE_SOURCE_MARKET;
  if (childId === "documents") return ROUTES.DATABASE_DOCUMENTS;
  if (childId === "log") return ROUTES.DATABASE_LOG;

  return `/${mainItemId}${childId ? `/${childId}` : ""}${innerPageId ? `/${innerPageId}` : ""}`;
}
