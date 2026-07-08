import { Button, Checkbox, cn } from "@sol/ui";
import { MoreHorizontal, X } from "lucide-react";
import type { RefObject } from "react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import type { DropdownSelectOption } from "@/shared/ui";

import type { MarginRulesFilterChip } from "../model/types";

import {
  MarginRulesFilterChipEditor,
  marginRulesFilterChipTriggerClassName,
} from "./MarginRulesFilterChipEditor";

const overflowFiltersButtonClassName =
  "size-8 shrink-0 rounded-md border transition-colors";

interface MarginRulesListFiltersBarProps {
  totalCount: number;
  visibleChips: MarginRulesFilterChip[];
  hiddenChips: MarginRulesFilterChip[];
  appliedFilterChips: MarginRulesFilterChip[];
  chipOptionsMap: Partial<
    Record<MarginRulesFilterChip["key"], DropdownSelectOption[]>
  >;
  showHiddenChips: boolean;
  onToggleHiddenChips: () => void;
  onUpdateFilter: (
    key: MarginRulesFilterChip["key"],
    value: string | null
  ) => void;
  onRemoveFilter: (key: MarginRulesFilterChip["key"]) => void;
  onClearAll: () => void;
  hideExpired: boolean;
  onHideExpiredChange: (checked: boolean) => void;
  firstLineRef: RefObject<HTMLDivElement | null>;
  countRef: RefObject<HTMLDivElement | null>;
  dotMeasureRef: RefObject<HTMLDivElement | null>;
  setChipMeasureRef: (
    key: MarginRulesFilterChip["key"]
  ) => (node: HTMLDivElement | null) => void;
}

export function MarginRulesListFiltersBar({
  totalCount,
  visibleChips,
  hiddenChips,
  appliedFilterChips,
  chipOptionsMap,
  showHiddenChips,
  onToggleHiddenChips,
  onUpdateFilter,
  onRemoveFilter,
  onClearAll,
  hideExpired,
  onHideExpiredChange,
  firstLineRef,
  countRef,
  dotMeasureRef,
  setChipMeasureRef,
}: MarginRulesListFiltersBarProps) {
  const { t } = useTranslation(["admin", "common"]);
  const hideExpiredId = useId();

  return (
    <div className="relative shrink-0 rounded-t-md border-x border-t border-border-tertiary bg-white px-4 py-1.5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-x-14 gap-y-1.5">
          <div className="min-w-0 flex-1">
            <div ref={firstLineRef} className="flex min-w-0 items-center gap-3">
              <div
                ref={countRef}
                className="inline-flex shrink-0 items-center gap-1"
              >
                <span className="text-sm font-semibold leading-6 text-text-primary">
                  {totalCount}
                </span>
                <span className="text-sm font-medium leading-6 text-text-secondary">
                  {t("labels.records")}
                </span>
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                {visibleChips.map((chip) => (
                  <MarginRulesFilterChipEditor
                    key={chip.key}
                    chip={chip}
                    options={chipOptionsMap[chip.key]}
                    onChange={onUpdateFilter}
                    onRemove={onRemoveFilter}
                  />
                ))}

                {hiddenChips.length > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className={cn(
                      overflowFiltersButtonClassName,
                      showHiddenChips
                        ? "border-transparent bg-gray-200 text-brand-red"
                        : "border-gray-200 bg-white text-neutral-400",
                      "hover:border-transparent hover:bg-brand-subtle hover:text-brand-red"
                    )}
                    onClick={onToggleHiddenChips}
                    aria-label={t("buttons.showMoreFilters")}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 py-1">
            <Checkbox
              id={hideExpiredId}
              checked={hideExpired}
              onCheckedChange={(checked) =>
                onHideExpiredChange(Boolean(checked))
              }
            />
            <label
              htmlFor={hideExpiredId}
              className="cursor-pointer text-sm font-medium leading-6 text-text-primary"
            >
              {t("labels.hideExpiredMarginRules")}
            </label>
          </div>
        </div>

        {showHiddenChips && hiddenChips.length > 0 ? (
          <div className="flex min-w-0 w-full flex-wrap items-center gap-x-3 gap-y-1">
            {hiddenChips.map((chip) => (
              <MarginRulesFilterChipEditor
                key={chip.key}
                chip={chip}
                options={chipOptionsMap[chip.key]}
                onChange={onUpdateFilter}
                onRemove={onRemoveFilter}
              />
            ))}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm font-medium leading-6 text-link no-underline hover:no-underline"
              onClick={onClearAll}
            >
              {t("buttons.clearAll")}
            </Button>
          </div>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-4 top-1.5 -z-10"
      >
        <div className="inline-flex items-center gap-1">
          {appliedFilterChips.map((chip) => (
            <div
              key={`measure-${chip.key}`}
              ref={setChipMeasureRef(chip.key)}
              className={marginRulesFilterChipTriggerClassName}
            >
              <div className="inline-flex min-w-0 items-center gap-1">
                <span className="truncate text-sm font-semibold leading-6 text-text-primary">
                  {chip.label}:
                </span>
                <span className="truncate text-sm font-medium leading-6 text-text-primary">
                  {chip.value}
                </span>
              </div>
              <X className="size-4 text-text-tertiary" />
            </div>
          ))}

          <div
            ref={dotMeasureRef}
            className={cn(
              "inline-flex items-center justify-center",
              overflowFiltersButtonClassName,
              showHiddenChips
                ? "border-transparent bg-(--select-item-bg-selected) text-brand-red"
                : "border-border-tertiary bg-white text-text-tertiary"
            )}
          >
            <MoreHorizontal className="size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
