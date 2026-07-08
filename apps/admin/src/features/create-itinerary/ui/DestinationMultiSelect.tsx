import {
  Button,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@sol/ui";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { buildItineraryEligibleCountryOptionBuckets } from "@/entities/destination";
import type { Destination } from "@/entities/destination";

interface DestinationOption {
  id: string;
  label: string;
}

interface DestinationMultiSelectProps {
  destinations: Destination[];
  value: string[];
  onValueChange: (value: string[]) => void;
  id?: string;
  disabled?: boolean;
  hasError?: boolean;
  /**
   * When true, eligible countries are shown in two A→Z groups (preferred, then other).
   * Omit empty preferred group (AC-8).
   */
  groupByPreferred?: boolean;
}

function flattenActiveCountryDestinations(
  destinations: Destination[]
): DestinationOption[] {
  const options: DestinationOption[] = [];

  for (const destination of destinations) {
    if (destination.status !== "Inactive" && destination.type === "Country") {
      options.push({
        id: destination.id,
        label: destination.name,
      });
    }

    if (destination.children?.length) {
      options.push(...flattenActiveCountryDestinations(destination.children));
    }
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function DestinationMultiSelect({
  destinations,
  value,
  onValueChange,
  id,
  disabled,
  hasError,
  groupByPreferred = false,
}: DestinationMultiSelectProps) {
  const { t } = useTranslation("admin");
  const { flatOptions, preferredOptions, otherOptions } = useMemo(() => {
    if (!groupByPreferred) {
      return {
        flatOptions: flattenActiveCountryDestinations(destinations),
        preferredOptions: [] as DestinationOption[],
        otherOptions: [] as DestinationOption[],
      };
    }
    const { preferred, other } =
      buildItineraryEligibleCountryOptionBuckets(destinations);
    return {
      flatOptions: [] as DestinationOption[],
      preferredOptions: preferred.map((o) => ({ id: o.id, label: o.label })),
      otherOptions: other.map((o) => ({ id: o.id, label: o.label })),
    };
  }, [destinations, groupByPreferred]);

  const options = groupByPreferred
    ? [...preferredOptions, ...otherOptions]
    : flatOptions;

  const optionById = useMemo(() => {
    const map = new Map<string, DestinationOption>();
    for (const option of options) {
      map.set(option.id, option);
    }
    return map;
  }, [options]);
  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedLabels = value
    .map((id) => optionById.get(id)?.label)
    .filter((label): label is string => Boolean(label));
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null
  );

  const summary =
    selectedLabels.length === 0
      ? t("itineraries.create.placeholders.destination")
      : selectedLabels.length <= 2
        ? selectedLabels.join(", ")
        : t("itineraries.create.destinationSummaryMore", {
            first: selectedLabels[0],
            second: selectedLabels[1],
            count: selectedLabels.length - 2,
          });

  const handleToggle = (destinationId: string, checked: boolean) => {
    if (checked) {
      if (!selectedSet.has(destinationId)) {
        onValueChange([...value, destinationId]);
      }
      return;
    }

    onValueChange(value.filter((id) => id !== destinationId));
  };

  const renderOptionRow = (option: DestinationOption) => {
    const checked = selectedSet.has(option.id);
    return (
      <label
        key={option.id}
        className={cn(
          "flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60",
          checked && "bg-[color:var(--select-item-bg-selected)]"
        )}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={(nextChecked) =>
            handleToggle(option.id, nextChecked === true)
          }
          aria-label={option.label}
        />
        <span className="min-w-0 flex-1 truncate font-medium text-text-primary">
          {option.label}
        </span>
      </label>
    );
  };

  return (
    <div ref={setPortalContainer} className="w-full">
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            type="button"
            id={id}
            variant="outline-secondary"
            className={cn(
              "h-9 w-full justify-between bg-white px-3 text-left text-sm font-normal shadow-none",
              selectedLabels.length === 0 && "text-muted-foreground",
              hasError && "border-destructive ring-destructive/20 ring-1"
            )}
            aria-invalid={hasError ? "true" : undefined}
          >
            <span className="truncate">{summary}</span>
            <ChevronDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          portalContainer={portalContainer}
          className="flex w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden p-0"
          style={{
            maxHeight:
              "min(18rem, var(--radix-popover-content-available-height))",
          }}
        >
          {options.length === 0 ? (
            <div className="px-2 py-2 text-center text-sm text-muted-foreground">
              {t("itineraries.create.empty.destinations")}
            </div>
          ) : groupByPreferred ? (
            <div className="flex min-h-0 max-h-72 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain p-1">
              {preferredOptions.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {t("labels.destinationCountries")}
                  </div>
                  {preferredOptions.map(renderOptionRow)}
                </div>
              )}
              {otherOptions.length > 0 && (
                <div
                  className={cn(
                    "flex flex-col gap-0.5",
                    preferredOptions.length > 0 && "pt-1"
                  )}
                >
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                    {t("labels.otherCatalogDestinations")}
                  </div>
                  {otherOptions.map(renderOptionRow)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-y-contain p-1">
              {options.map(renderOptionRow)}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
