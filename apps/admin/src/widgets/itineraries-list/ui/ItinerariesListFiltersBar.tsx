import { Button, cn } from "@sol/ui";
import { MoreHorizontal, X } from "lucide-react";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";

import type {
  ItinerariesFilterChip,
  ItinerariesFilterChipKey,
} from "@/widgets/itineraries-list/model/types";

const overflowFiltersButtonClassName =
  "size-8 shrink-0 rounded-md border transition-colors";

const chipTriggerClassName =
  "group/chip inline-flex max-w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-text-primary shadow-none transition-colors hover:bg-gray-100";

interface ItinerariesListFiltersBarProps {
  totalCount: number;
  visibleChips: ItinerariesFilterChip[];
  hiddenChips: ItinerariesFilterChip[];
  appliedFilterChips: ItinerariesFilterChip[];
  showHiddenChips: boolean;
  onToggleHiddenChips: () => void;
  onRemoveFilter: (key: ItinerariesFilterChipKey) => void;
  onClearAll: () => void;
  firstLineRef: RefObject<HTMLDivElement | null>;
  countRef: RefObject<HTMLDivElement | null>;
  dotMeasureRef: RefObject<HTMLDivElement | null>;
  setChipMeasureRef: (
    key: ItinerariesFilterChipKey
  ) => (node: HTMLDivElement | null) => void;
}

export function ItinerariesListFiltersBar({
  totalCount,
  visibleChips,
  hiddenChips,
  appliedFilterChips,
  showHiddenChips,
  onToggleHiddenChips,
  onRemoveFilter,
  onClearAll,
  firstLineRef,
  countRef,
  dotMeasureRef,
  setChipMeasureRef,
}: ItinerariesListFiltersBarProps) {
  const { t } = useTranslation(["admin", "common"]);

  return (
    <div className="relative shrink-0 bg-white px-4 py-1.5">
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
                  <div key={chip.key} className={chipTriggerClassName}>
                    <span className="min-w-0 truncate text-sm font-semibold leading-6 text-text-primary">
                      {chip.label}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-gray-200 hover:text-foreground"
                      aria-label={t("itineraries.aria.removeFilter")}
                      onClick={() => onRemoveFilter(chip.key)}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
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
        </div>

        {showHiddenChips && hiddenChips.length > 0 ? (
          <div className="flex min-w-0 w-full flex-wrap items-center gap-x-3 gap-y-1">
            {hiddenChips.map((chip) => (
              <div key={chip.key} className={chipTriggerClassName}>
                <span className="min-w-0 truncate text-sm font-semibold leading-6 text-text-primary">
                  {chip.label}
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-text-tertiary hover:bg-gray-200 hover:text-foreground"
                  aria-label={t("itineraries.aria.removeFilter")}
                  onClick={() => onRemoveFilter(chip.key)}
                >
                  <X className="size-4" />
                </button>
              </div>
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
              className={chipTriggerClassName}
            >
              <span className="truncate text-sm font-semibold leading-6 text-text-primary">
                {chip.label}
              </span>
              <X className="size-4 text-text-tertiary" />
            </div>
          ))}

          <div
            ref={dotMeasureRef}
            className={cn(
              "inline-flex items-center justify-center",
              overflowFiltersButtonClassName,
              showHiddenChips
                ? "border-transparent bg-gray-200 text-brand-red"
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
