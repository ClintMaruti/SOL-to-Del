import {
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@sol/ui";
import { Check, Search, X } from "lucide-react";
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import type { DropdownSelectOption } from "@/shared/ui";
import { DatePicker } from "@/shared/ui/date-picker/DatePicker";
import { parseISODate, toISODateString } from "@/shared/ui/date-picker/utils";

import type {
  MarginRulesFilterChip,
  MarginRulesFilterKey,
} from "../model/types";

interface MarginRulesFilterChipEditorProps {
  chip: MarginRulesFilterChip;
  options?: DropdownSelectOption[];
  onChange: (key: MarginRulesFilterKey, value: string | null) => void;
  onRemove: (key: MarginRulesFilterKey) => void;
}

const SELECT_FILTER_KEYS: MarginRulesFilterKey[] = [
  "agencyGroupId",
  "serviceTypeId",
  "supplierId",
  "serviceId",
  "optionId",
];

export const marginRulesFilterChipTriggerClassName =
  "group/chip inline-flex max-w-full items-center gap-3 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-text-primary shadow-none transition-colors hover:bg-gray-100";

function handleTriggerKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  onOpenChange: (open: boolean) => void
) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onOpenChange(true);
  }
}

export function MarginRulesFilterChipEditor({
  chip,
  options = [],
  onChange,
  onRemove,
}: MarginRulesFilterChipEditorProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [marginPercentValue, setMarginPercentValue] = useState(chip.rawValue);

  const isSelectChip = SELECT_FILTER_KEYS.includes(chip.key);
  const isDateChip = chip.key === "validFrom" || chip.key === "validTo";
  const isMarginChip = chip.key === "marginPercent";

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setMarginPercentValue(chip.rawValue);
    }
  }, [chip.rawValue, open]);

  const filteredOptions = useMemo(() => {
    const allOptions = [
      { value: "__all__", label: t("labels.all") },
      ...options,
    ];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return allOptions;
    }

    return allOptions.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [options, searchQuery, t]);

  const selectedDate = useMemo(
    () => (chip.rawValue ? parseISODate(chip.rawValue) : null),
    [chip.rawValue]
  );

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove(chip.key);
  };

  const handleSelectOption = (nextValue: string) => {
    onChange(chip.key, nextValue === "__all__" ? null : nextValue);
    setOpen(false);
  };

  const handleApplyMarginPercent = () => {
    onChange(chip.key, marginPercentValue.trim() || null);
    setOpen(false);
  };

  const chipLabel = `${chip.label}: ${chip.value}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-label={chipLabel}
          onKeyDown={(event) => handleTriggerKeyDown(event, setOpen)}
          className={cn(
            marginRulesFilterChipTriggerClassName,
            open && "border-brand-red bg-gray-100"
          )}
        >
          <div className="inline-flex min-w-0 items-center gap-1">
            <span className="truncate text-sm font-semibold leading-6 text-text-primary">
              {chip.label}:
            </span>
            <span className="truncate text-sm font-medium leading-6 text-text-primary">
              {chip.value}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              "size-4 p-0 transition-colors hover:bg-transparent hover:text-brand-red",
              open
                ? "text-brand-red"
                : "text-text-tertiary group-hover/chip:text-brand-red"
            )}
            onClick={handleRemove}
            aria-label={t("buttons.removeFilter", {
              filter: chipLabel,
            })}
          >
            <X className="size-4" />
          </Button>
        </div>
      </PopoverTrigger>

      {isSelectChip ? (
        <PopoverContent
          align="start"
          sideOffset={4}
          className="flex w-[326px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden border-border-tertiary p-0 shadow-sm"
          style={{
            maxHeight:
              "min(24rem, var(--radix-popover-content-available-height))",
          }}
        >
          <div className="shrink-0 border-b border-border-tertiary px-3 py-3">
            <InputGroup className="border-0 bg-transparent shadow-none">
              <InputGroupAddon>
                <Search className="size-4 shrink-0 text-text-tertiary" />
              </InputGroupAddon>
              <InputGroupInput
                autoFocus
                value={searchQuery}
                placeholder={t("placeholders.search")}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-auto border-0 bg-transparent px-0 py-0 text-sm font-medium leading-6 text-text-primary shadow-none focus-visible:ring-0"
              />
            </InputGroup>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto p-1">
            {filteredOptions.map((option) => {
              const isSelected =
                option.value === "__all__"
                  ? chip.rawValue.length === 0
                  : option.value === chip.rawValue;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm font-medium leading-6 text-text-primary",
                    isSelected
                      ? "bg-[var(--select-item-bg-selected)]"
                      : "bg-background-primary hover:bg-muted/40"
                  )}
                  onClick={() => handleSelectOption(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <Check className="size-4 text-brand-red" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      ) : null}

      {isDateChip ? (
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-auto border-border-tertiary bg-white p-3 shadow-sm"
        >
          <DatePicker
            value={selectedDate}
            onChange={(date) => {
              onChange(chip.key, toISODateString(date));
              setOpen(false);
            }}
          />
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-xs font-medium text-link no-underline hover:no-underline"
              onClick={() => {
                onChange(chip.key, null);
                setOpen(false);
              }}
            >
              {t("buttons.clear")}
            </Button>
          </div>
        </PopoverContent>
      ) : null}

      {isMarginChip ? (
        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-[240px] border-border-tertiary bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-3">
            <Input
              autoFocus
              inputMode="decimal"
              value={marginPercentValue}
              placeholder={t("placeholders.typeMargin")}
              onChange={(event) => setMarginPercentValue(event.target.value)}
            />
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onChange(chip.key, null);
                  setOpen(false);
                }}
              >
                {t("buttons.clear")}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleApplyMarginPercent}
              >
                {t("buttons.apply")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      ) : null}
    </Popover>
  );
}
