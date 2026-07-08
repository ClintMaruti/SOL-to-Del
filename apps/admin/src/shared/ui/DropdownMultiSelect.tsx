import {
  Checkbox,
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@sol/ui";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface DropdownMultiSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

export interface DropdownMultiSelectProps {
  options?: DropdownMultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  onBlur?: () => void;
  isSearchable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  hasError?: boolean;
  searchAriaLabel?: string;
  contentMaxHeight?: string;
}

export function DropdownMultiSelect({
  options = [],
  value,
  onValueChange,
  onBlur,
  isSearchable = false,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  id,
  className,
  disabled = false,
  hasError = false,
  searchAriaLabel,
  contentMaxHeight = "max-h-80",
}: DropdownMultiSelectProps) {
  const { t } = useTranslation("common");
  const effectivePlaceholder = placeholder ?? t("placeholders.select");
  const effectiveSearchPlaceholder =
    searchPlaceholder ?? t("placeholders.select");
  const effectiveEmptyMessage = emptyMessage ?? t("messages.noResultsFound");
  const effectiveSearchAriaLabel = searchAriaLabel ?? t("aria.searchOptions");
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const selectedLabel = useMemo(() => {
    return options
      .filter((option) => selectedSet.has(option.value))
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
      )
      .map((option) => option.label)
      .join(", ");
  }, [options, selectedSet]);

  const filteredOptions = useMemo(() => {
    if (!isSearchable) return options;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      const haystack = option.searchText ?? option.label;
      return haystack.toLowerCase().includes(q);
    });
  }, [isSearchable, options, searchQuery]);

  useEffect(() => {
    if (!isSearchable || !open) return;

    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement !== searchInputRef.current) {
        searchInputRef.current?.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isSearchable, open, searchQuery]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
      onBlur?.();
    }
  };

  const toggleValue = (optionValue: string) => {
    if (selectedSet.has(optionValue)) {
      onValueChange(value.filter((item) => item !== optionValue));
      return;
    }
    onValueChange([...value, optionValue]);
  };

  const stopSearchEventPropagation = (
    event:
      | React.KeyboardEvent<HTMLInputElement>
      | React.PointerEvent<HTMLInputElement>
  ) => {
    event.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex min-h-9 w-full items-center gap-[6px] rounded-[6px] border border-[color:var(--dropdown-menu-content-border)] bg-white px-3 py-[6px] text-sm shadow-none transition-colors",
            "hover:bg-[color:var(--select-item-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
            hasError && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left text-sm font-medium text-neutral-900",
              !selectedLabel && "text-muted-foreground"
            )}
          >
            {selectedLabel || effectivePlaceholder}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-5 shrink-0 text-[color:var(--Text-Tertiary)] transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) overflow-hidden rounded-[6px] border-[color:var(--dropdown-menu-content-border)] bg-[color:var(--dropdown-menu-content-bg)] p-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command
          shouldFilter={false}
          className="overflow-hidden rounded-[calc(var(--dropdown-menu-content-radius)-2px)] bg-transparent text-[color:var(--dropdown-menu-item-fg)]"
        >
          {isSearchable ? (
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
          ) : null}
          <CommandList className={cn("p-1", contentMaxHeight)}>
            <CommandEmpty className="py-2 text-center text-sm text-muted-foreground">
              {effectiveEmptyMessage}
            </CommandEmpty>
            {filteredOptions.map((option) => {
              const checked = selectedSet.has(option.value);
              return (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => toggleValue(option.value)}
                  className={cn(
                    "group/dropdown-option mb-0.5 min-h-9 w-full cursor-pointer gap-[var(--dropdown-menu-item-gap)] rounded-[6px] py-[var(--dropdown-menu-item-padding-y)] pr-[var(--dropdown-menu-item-padding-x)] pl-8 text-[length:var(--dropdown-menu-item-font-size)] leading-[var(--dropdown-menu-item-line-height)] font-medium tracking-[var(--dropdown-menu-item-letter-spacing)] text-[color:var(--dropdown-menu-item-fg)] data-[selected=true]:bg-[color:var(--select-item-bg-hover)] data-[selected=true]:text-[color:var(--dropdown-menu-item-fg)] last:mb-0",
                    checked
                      ? "bg-[color:var(--select-item-bg-selected)] data-[selected=true]:bg-[color:var(--select-item-bg-selected)]"
                      : null
                  )}
                  aria-checked={checked}
                >
                  <Checkbox
                    checked={checked}
                    aria-label={option.label}
                    tabIndex={-1}
                    iconClassName="text-white"
                    className="pointer-events-none absolute left-[var(--dropdown-menu-item-padding-x)] top-1/2 -translate-y-1/2 [&_svg]:!size-[14px]"
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
