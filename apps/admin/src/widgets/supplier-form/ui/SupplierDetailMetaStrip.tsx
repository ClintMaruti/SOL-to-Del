import { useTranslation } from "react-i18next";

import type { SupplierDetail } from "@/entities/suppliers";
import { findDestinationById, useDestinations } from "@/entities/destination";
import { CopyableCell, CopyableCellGroup } from "@/shared/ui";

interface SupplierDetailMetaStripProps {
  supplier: SupplierDetail;
}

function formatLocation(
  supplier: SupplierDetail,
  countryLabel: string | undefined,
  dash: string
): string {
  const parts = [supplier.city, countryLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : dash;
}

function formatLastUpdated(
  value: string | undefined,
  locale: string,
  dash: string
): string {
  if (!value) return dash;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function SupplierDetailMetaStrip({
  supplier,
}: SupplierDetailMetaStripProps) {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const { data: destinations = [] } = useDestinations();
  const dash = t("placeholders.dash");
  const dateLocale = tCommon("intlLocale");
  const countryNode = findDestinationById(destinations, supplier.countryId);
  const countryLabel = countryNode?.name;
  const location = formatLocation(supplier, countryLabel, dash);
  const lastUpdated = formatLastUpdated(supplier.lastUpdated, dateLocale, dash);
  const lastUpdatedBy = supplier.lastUpdatedBy ?? dash;

  return (
    <CopyableCellGroup>
      <div className="form-grid min-w-0 gap-4 overflow-hidden rounded-md border border-border-primary bg-background-secondary p-4 text-sm">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground uppercase text-xs font-semibold">
            {t("labels.location")}
          </span>
          <span className="break-words font-medium text-foreground">
            {location}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground uppercase text-xs font-semibold">
            {t("labels.email")}
          </span>
          <CopyableCell
            cellId="supplier-email"
            value={supplier.email || dash}
            wrap
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground uppercase text-xs font-semibold">
            {t("labels.lastUpdated")}
          </span>
          <span className="break-words font-medium text-foreground">
            {lastUpdated}
          </span>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground uppercase text-xs font-semibold">
            {t("labels.lastUpdatedBy")}
          </span>
          <span className="break-words font-medium text-foreground">
            {lastUpdatedBy}
          </span>
        </div>
      </div>
    </CopyableCellGroup>
  );
}
