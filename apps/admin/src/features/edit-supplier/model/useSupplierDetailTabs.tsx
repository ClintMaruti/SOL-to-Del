import { Tabs, TabsList, TabsTrigger } from "@sol/ui";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { SUPPLIER_DETAIL_TABS } from "./types";
import type { SupplierDetailTab } from "./types";

const TAB_PARAM = "tab";
const DEFAULT_TAB: SupplierDetailTab = "overview";

export function useSupplierDetailTabs() {
  const { t } = useTranslation("admin");
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get(TAB_PARAM) ??
    DEFAULT_TAB) as SupplierDetailTab;

  const setActiveTab = useCallback(
    (tab: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === DEFAULT_TAB) {
            next.delete(TAB_PARAM);
          } else {
            next.set(TAB_PARAM, tab);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const tabBar = (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="h-auto bg-transparent rounded-none border-b border-border p-0 w-full">
        {SUPPLIER_DETAIL_TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="text-text-primary text-sm font-semibold rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-brand-red data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-text-primary hover:cursor-pointer"
          >
            {t(tab.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  return { activeTab, setActiveTab, tabBar } as const;
}
