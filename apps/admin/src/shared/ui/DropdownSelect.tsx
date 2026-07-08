import {
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  cn,
} from "@sol/ui";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DropdownSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  indentLevel?: number;
  searchText?: string;
  type?: string;
  parentValue?: string;
  hasChildren?: boolean;
}

export interface DropdownSelectOptionGroup {
  label: string;
  options: DropdownSelectOption[];
}

export interface DropdownSelectProps {
  /** Flat options (ignored when `optionGroups` is provided). */
  options?: DropdownSelectOption[];
  /** Grouped options (e.g. country lists). When set, takes precedence over `options`. */
  optionGroups?: DropdownSelectOptionGroup[];
  /** Controlled value (option value). */
  value: string | undefined;
  /** Called when selection changes. */
  onValueChange: (value: string) => void;
  /** When true, shows a search input in the dropdown and filters options. */
  isSearchable?: boolean;
  /** Placeholder when no value is selected. */
  placeholder?: string;
  /** Placeholder for the search input when isSearchable. */
  searchPlaceholder?: string;
  /** Message shown when isSearchable and filter has no matches. */
  emptyMessage?: string;
  /** Id for the trigger (e.g. for form labels). */
  id?: string;
  /** Class name for the trigger. */
  className?: string;
  /** Disable the trigger. */
  disabled?: boolean;
  /** Aria label for the search input when isSearchable. */
  searchAriaLabel?: string;
  /** Max height class for the content (default max-h-60). */
  contentMaxHeight?: string;
  /** Enables hierarchical row collapse/expand controls for flat options. */
  isHierarchical?: boolean;
}

export function DropdownSelect({
  options = [],
  optionGroups,
  value,
  onValueChange,
  isSearchable = false,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  id,
  className,
  disabled = false,
  searchAriaLabel,
  contentMaxHeight = "max-h-80",
  isHierarchical = false,
}: DropdownSelectProps) {
  const { t } = useTranslation("common");
  const effectivePlaceholder = placeholder ?? t("placeholders.select");
  const effectiveSearchPlaceholder =
    searchPlaceholder ?? t("placeholders.select");
  const effectiveEmptyMessage = emptyMessage ?? t("messages.noResultsFound");
  const effectiveSearchAriaLabel = searchAriaLabel ?? t("aria.searchOptions");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [collapsedValues, setCollapsedValues] = useState<Set<string>>(
    new Set()
  );

  const useGrouped =
    optionGroups != null &&
    optionGroups.some((g) => g.options && g.options.length > 0);
  const useHierarchy = !useGrouped && isHierarchical;

  const filteredOptions = useMemo(() => {
    if (useGrouped) return [];
    if (!isSearchable) return options;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const haystack =
        opt.searchText ?? `${opt.label} ${opt.subLabel ?? ""}`.trim();
      return haystack.toLowerCase().includes(q);
    });
  }, [options, searchQuery, isSearchable, useGrouped]);

  const optionByValue = useMemo(() => {
    const map = new Map<string, DropdownSelectOption>();
    for (const opt of options) map.set(opt.value, opt);
    return map;
  }, [options]);

  const valuesWithChildren = useMemo(() => {
    if (!useHierarchy) return new Set<string>();
    const set = new Set<string>();
    for (const opt of options) {
      if (opt.parentValue) set.add(opt.parentValue);
    }
    return set;
  }, [options, useHierarchy]);

  useEffect(() => {
    if (!useHierarchy) return;
    setCollapsedValues((previous) => {
      const next = new Set<string>();
      for (const value of previous) {
        if (optionByValue.has(value)) next.add(value);
      }
      return next;
    });
  }, [useHierarchy, optionByValue]);

  const visibleFlatOptions = useMemo(() => {
    if (!useHierarchy) return filteredOptions;
    const hasSearchQuery = searchQuery.trim().length > 0;
    if (hasSearchQuery) return filteredOptions;

    return filteredOptions.filter((opt) => {
      let parent = opt.parentValue;
      while (parent) {
        if (collapsedValues.has(parent)) return false;
        parent = optionByValue.get(parent)?.parentValue;
      }
      return true;
    });
  }, [
    useHierarchy,
    filteredOptions,
    searchQuery,
    collapsedValues,
    optionByValue,
  ]);

  const filteredOptionGroups = useMemo(() => {
    if (!useGrouped || !optionGroups) return [];
    if (!isSearchable) return optionGroups;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return optionGroups;
    return optionGroups
      .map((group) => ({
        ...group,
        options: group.options.filter((opt) =>
          (opt.searchText ?? `${opt.label} ${opt.subLabel ?? ""}`.trim())
            .toLowerCase()
            .includes(q)
        ),
      }))
      .filter((group) => group.options.length > 0);
  }, [optionGroups, searchQuery, isSearchable, useGrouped]);

  const handleOpenChange = isSearchable
    ? (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearchQuery("");
      }
    : undefined;

  useEffect(() => {
    if (!isSearchable || !open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement !== searchInputRef.current) {
        searchInputRef.current?.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isSearchable, open, searchQuery]);

  const stopSearchEventPropagation = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.PointerEvent<HTMLInputElement>
  ) => {
    event.stopPropagation();
  };

  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => {
        if (v) onValueChange(v);
      }}
      {...(isSearchable && {
        open,
        onOpenChange: handleOpenChange,
      })}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={effectivePlaceholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className={cn(
          contentMaxHeight,
          useGrouped &&
            "p-0 shadow-sm [--select-content-padding:4px] [--select-item-padding-x:8px] [--select-item-padding-y:6px] [--select-item-radius:6px]"
        )}
        header={
          isSearchable ? (
            <div className="border-b px-3 py-0">
              <div className="flex items-center gap-2 py-3">
                <Search className="size-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  autoFocus
                  aria-label={effectiveSearchAriaLabel}
                  size="sm"
                  placeholder={effectiveSearchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={stopSearchEventPropagation}
                  onKeyDownCapture={stopSearchEventPropagation}
                  onKeyUp={stopSearchEventPropagation}
                  onKeyUpCapture={stopSearchEventPropagation}
                  onPointerDown={stopSearchEventPropagation}
                  onPointerDownCapture={stopSearchEventPropagation}
                  className="h-auto! border-0! bg-transparent! px-0! py-0 text-sm shadow-none focus-visible:border-0! focus-visible:shadow-none"
                />
              </div>
            </div>
          ) : undefined
        }
      >
        {useGrouped ? (
          filteredOptionGroups.length === 0 ? (
            <SelectGroup>
              <SelectLabel className="py-2 text-center text-muted-foreground">
                {effectiveEmptyMessage}
              </SelectLabel>
            </SelectGroup>
          ) : (
            filteredOptionGroups.map((group, index) => (
              <SelectGroup key={group.label}>
                <SelectLabel
                  className={cn(
                    "px-2 pb-1.5 text-xs leading-5 font-semibold text-foreground/70",
                    index === 0 ? "pt-0" : "pt-4"
                  )}
                >
                  {group.label}
                </SelectLabel>
                {group.options.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    textValue={opt.label}
                    className="mb-0.5 bg-muted/40 text-sm leading-6 last:mb-0"
                  >
                    <span
                      className="block min-w-0"
                      style={
                        opt.indentLevel && opt.indentLevel > 0
                          ? { paddingLeft: `${opt.indentLevel * 16}px` }
                          : undefined
                      }
                    >
                      <span className="block truncate">{opt.label}</span>
                      {opt.subLabel ? (
                        <span className="block truncate text-xs leading-4 text-muted-foreground">
                          {opt.subLabel}
                        </span>
                      ) : null}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          )
        ) : visibleFlatOptions.length === 0 ? (
          <SelectGroup>
            <SelectLabel className="py-2 text-center text-muted-foreground">
              {effectiveEmptyMessage}
            </SelectLabel>
          </SelectGroup>
        ) : (
          visibleFlatOptions.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              textValue={opt.label}
              className="mb-0.5 last:mb-0"
            >
              <span
                className="inline-flex min-w-0 items-start gap-1"
                style={
                  opt.indentLevel && opt.indentLevel > 0
                    ? { paddingLeft: `${opt.indentLevel * 16}px` }
                    : undefined
                }
              >
                {useHierarchy ? (
                  valuesWithChildren.has(opt.value) ? (
                    <span
                      role="button"
                      aria-label={
                        collapsedValues.has(opt.value)
                          ? `Expand ${opt.label}`
                          : `Collapse ${opt.label}`
                      }
                      tabIndex={-1}
                      data-dropdown-chevron="true"
                      className="mt-0.5 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center text-muted-foreground"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onPointerUp={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCollapsedValues((previous) => {
                          const next = new Set(previous);
                          if (next.has(opt.value)) next.delete(opt.value);
                          else next.add(opt.value);
                          return next;
                        });
                      }}
                    >
                      {collapsedValues.has(opt.value) ? (
                        <ChevronRight className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  ) : null
                ) : null}
                <span className="min-w-0">
                  <span className="block truncate">{opt.label}</span>
                  {opt.subLabel ? (
                    <span className="block truncate text-xs leading-4 text-muted-foreground">
                      {opt.subLabel}
                    </span>
                  ) : null}
                </span>
              </span>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
