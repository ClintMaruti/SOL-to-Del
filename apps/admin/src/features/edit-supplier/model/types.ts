export { type TabController } from "@/shared/types";

export const SUPPLIER_DETAIL_TABS = [
  { value: "overview", labelKey: "tabs.overview" },
  { value: "configuration", labelKey: "tabs.configuration" },
  { value: "contracts", labelKey: "tabs.contracts" },
  { value: "services", labelKey: "tabs.services" },
  { value: "extras", labelKey: "tabs.extras" },
  { value: "content", labelKey: "tabs.content" },
  { value: "notes", labelKey: "tabs.notes" },
  { value: "logs", labelKey: "tabs.logs" },
] as const;

export type SupplierDetailTab = (typeof SUPPLIER_DETAIL_TABS)[number]["value"];
