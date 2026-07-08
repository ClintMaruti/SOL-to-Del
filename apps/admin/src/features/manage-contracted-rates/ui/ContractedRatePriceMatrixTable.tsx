import { Checkbox, Input, cn } from "@sol/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { ContractedRatePriceRowFieldErrors } from "../model/contractedRateFormValidation";

export type ContractedRatePriceRowState = {
  key: string;
  /** Present in edit mode — the existing contracted rate row id */
  id?: string;
  /** Present in edit mode — concurrency version for the update call */
  version?: number;
  serviceOptionId: string;
  rateId: string;
  optionLabel: string;
  rateLabel: string;
  checked: boolean;
  net: string;
  rack: string;
  sell: string;
};

const PRICE_INPUT_CLASS =
  "h-full min-h-9 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0";

interface ContractedRatePriceMatrixTableProps {
  priceRows: ContractedRatePriceRowState[];
  priceRowErrors?: Record<string, ContractedRatePriceRowFieldErrors>;
  onPriceRowsChange: (rows: ContractedRatePriceRowState[]) => void;
}

export function ContractedRatePriceMatrixTable({
  priceRows,
  priceRowErrors,
  onPriceRowsChange,
}: ContractedRatePriceMatrixTableProps) {
  const { t } = useTranslation("admin");

  const allChecked = useMemo(
    () => priceRows.length > 0 && priceRows.every((row) => row.checked),
    [priceRows]
  );
  const someChecked = useMemo(
    () => priceRows.some((row) => row.checked),
    [priceRows]
  );

  const toggleAll = (checked: boolean) => {
    onPriceRowsChange(priceRows.map((row) => ({ ...row, checked })));
  };

  return (
    <div className="w-full overflow-hidden rounded-[6px] border border-border-tertiary">
      <div className="grid grid-cols-[48px_1fr_1fr_120px_120px_100px] border-b border-border-tertiary bg-gray-100 text-sm font-semibold">
        <div className="flex items-center justify-center px-2 py-2">
          <Checkbox
            checked={allChecked ? true : someChecked ? "indeterminate" : false}
            onCheckedChange={(value) => toggleAll(value === true)}
            aria-label={t("labels.selectAll")}
          />
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.option")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.rate")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.net")}
          <span className="text-[#f54a00]">*</span>
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.rack")}
          <span className="text-[#f54a00]">*</span>
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.sell")}
        </div>
      </div>
      {priceRows.map((row) => {
        const rowErrors = priceRowErrors?.[row.key];
        return (
          <div
            key={row.key}
            className="border-b border-border-tertiary last:border-b-0"
          >
            <div
              className={cn(
                "grid grid-cols-[48px_1fr_1fr_120px_120px_100px] bg-white",
                rowErrors && "bg-red-50"
              )}
            >
              <div className="flex items-center justify-center px-2">
                <Checkbox
                  checked={row.checked}
                  onCheckedChange={(checked) =>
                    onPriceRowsChange(
                      priceRows.map((p) =>
                        p.key === row.key
                          ? { ...p, checked: checked === true }
                          : p
                      )
                    )
                  }
                />
              </div>
              <div className="flex h-9 items-center border-l border-border-tertiary px-3 text-sm text-foreground">
                {row.optionLabel}
              </div>
              <div className="flex h-9 items-center border-l border-border-tertiary px-3 text-sm text-foreground">
                {row.rateLabel}
              </div>
              <div className="flex h-9 flex-col justify-center border-l border-border-tertiary">
                <Input
                  value={row.net}
                  disabled={!row.checked}
                  onChange={(e) =>
                    onPriceRowsChange(
                      priceRows.map((p) =>
                        p.key === row.key ? { ...p, net: e.target.value } : p
                      )
                    )
                  }
                  className={cn(
                    PRICE_INPUT_CLASS,
                    rowErrors?.net && "text-destructive"
                  )}
                />
              </div>
              <div className="flex h-9 flex-col justify-center border-l border-border-tertiary">
                <Input
                  value={row.rack}
                  disabled={!row.checked}
                  onChange={(e) =>
                    onPriceRowsChange(
                      priceRows.map((p) =>
                        p.key === row.key ? { ...p, rack: e.target.value } : p
                      )
                    )
                  }
                  className={cn(
                    PRICE_INPUT_CLASS,
                    rowErrors?.rack && "text-destructive"
                  )}
                />
              </div>
              <div className="flex h-9 items-center border-l border-border-tertiary">
                <Input
                  value={row.sell}
                  disabled={!row.checked}
                  onChange={(e) =>
                    onPriceRowsChange(
                      priceRows.map((p) =>
                        p.key === row.key ? { ...p, sell: e.target.value } : p
                      )
                    )
                  }
                  className={PRICE_INPUT_CLASS}
                />
              </div>
            </div>
            {rowErrors?.net || rowErrors?.rack ? (
              <p className="border-t border-brand-red/20 bg-red-50 px-3 py-1.5 text-sm text-destructive">
                {[rowErrors.net, rowErrors.rack].filter(Boolean).join(" ")}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
