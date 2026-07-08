export const SUPPLIER_SERVICE_DETAIL_TABS = [
  { value: "general", labelKey: "tabs.general" },
  { value: "options", labelKey: "tabs.options" },
  { value: "rates", labelKey: "tabs.rates" },
  { value: "ratePlan", labelKey: "tabs.ratePlan" },
  { value: "eligibility", labelKey: "tabs.eligibility" },
  { value: "closeout", labelKey: "tabs.closeout" },
  { value: "notes", labelKey: "tabs.notes" },
  { value: "extras", labelKey: "tabs.extras" },
] as const;

export type SupplierServiceDetailTab =
  (typeof SUPPLIER_SERVICE_DETAIL_TABS)[number]["value"];
