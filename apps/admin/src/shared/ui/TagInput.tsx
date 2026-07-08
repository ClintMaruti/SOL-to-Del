import {
  Checkbox,
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@sol/ui";
import { ChevronDown, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  hasError?: boolean;
  id?: string;
}

export function TagInput({
  value,
  onChange,
  onBlur,
  placeholder,
  suggestions,
  className,
  hasError,
  id,
}: TagInputProps) {
  const { t } = useTranslation("admin");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultSuggestions = useMemo(
    () => [
      t("tags.families"),
      t("tags.romance"),
      t("tags.adventure"),
      t("tags.luxury"),
      t("tags.budgetFriendly"),
      t("tags.wildlife"),
      t("tags.cultural"),
      t("tags.beachCoastal"),
      t("tags.wellnessSpa"),
      t("tags.photography"),
    ],
    [t]
  );

  const resolvedSuggestions = useMemo(
    () => suggestions ?? defaultSuggestions,
    [defaultSuggestions, suggestions]
  );
  const availableTags = useMemo(
    () => Array.from(new Set([...resolvedSuggestions, ...value])),
    [resolvedSuggestions, value]
  );

  const selectedSet = useMemo(() => new Set(value), [value]);

  const availableSuggestions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return availableTags.filter((tag) => {
      if (q && !tag.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [availableTags, search]);

  const trimmedSearch = search.trim();
  const canCreate =
    trimmedSearch.length > 0 &&
    !availableTags.some((s) => s.toLowerCase() === trimmedSearch.toLowerCase());

  const addTag = useCallback(
    (tag: string) => {
      if (!selectedSet.has(tag)) {
        onChange([...value, tag]);
      }
      setSearch("");
      inputRef.current?.focus();
    },
    [onChange, value, selectedSet]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [onChange, value]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      if (selectedSet.has(tag)) {
        removeTag(tag);
      } else {
        addTag(tag);
      }
    },
    [selectedSet, addTag, removeTag]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !search && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          onBlur?.();
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-9 w-full items-center gap-[6px] rounded-[6px] border border-[color:var(--dropdown-menu-content-border)] bg-white px-3 py-[6px] text-sm shadow-none transition-colors",
            "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
            hasError && "border-destructive focus-within:ring-destructive/20",
            className
          )}
          onClick={() => setOpen(true)}
        >
          <span
            className={cn(
              "flex-1 truncate text-left text-sm font-medium text-neutral-900",
              value.length === 0 && "text-muted-foreground"
            )}
          >
            {value.length > 0 ? value.join(", ") : placeholder}
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
        className="w-(--radix-popover-trigger-width) overflow-hidden rounded-[6px] border-[color:var(--dropdown-menu-content-border)] bg-[color:var(--dropdown-menu-content-bg)] p-0 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command
          shouldFilter={false}
          className="overflow-hidden rounded-[calc(var(--dropdown-menu-content-radius)-2px)] bg-transparent text-[color:var(--dropdown-menu-item-fg)]"
        >
          <CommandInput
            ref={inputRef}
            placeholder={t("placeholders.searchOrTypeToCreate")}
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleKeyDown}
          />
          <CommandList className="flex flex-col gap-px p-1">
            <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
              {canCreate ? null : t("empty.noTagsFound")}
            </CommandEmpty>
            {canCreate && (
              <CommandItem
                onSelect={() => addTag(trimmedSearch)}
                className="min-h-9 w-full cursor-pointer rounded-[6px] px-[var(--dropdown-menu-item-padding-x)] py-[var(--dropdown-menu-item-padding-y)] text-[length:var(--dropdown-menu-item-font-size)] leading-[var(--dropdown-menu-item-line-height)] font-medium tracking-[var(--dropdown-menu-item-letter-spacing)] text-[color:var(--dropdown-menu-item-fg)] data-[selected=true]:bg-[color:var(--select-item-bg-hover)] data-[selected=true]:text-[color:var(--dropdown-menu-item-fg)] [&_svg:not([class*='text-'])]:text-[color:var(--dropdown-menu-icon-fg)]"
              >
                <Plus className="size-4" />
                <span className="truncate">
                  {t("placeholders.createTag", { value: trimmedSearch })}
                </span>
              </CommandItem>
            )}
            {availableSuggestions.length > 0 && (
              <>
                {availableSuggestions.map((tag) => (
                  <CommandItem
                    key={tag}
                    onSelect={() => toggleTag(tag)}
                    className={cn(
                      "group/tag-option min-h-9 w-full cursor-pointer gap-[var(--dropdown-menu-item-gap)] rounded-[6px] py-[var(--dropdown-menu-item-padding-y)] pr-[var(--dropdown-menu-item-padding-x)] pl-8 text-[length:var(--dropdown-menu-item-font-size)] leading-[var(--dropdown-menu-item-line-height)] font-medium tracking-[var(--dropdown-menu-item-letter-spacing)] text-[color:var(--dropdown-menu-item-fg)] data-[selected=true]:bg-[color:var(--select-item-bg-hover)] data-[selected=true]:text-[color:var(--dropdown-menu-item-fg)]",
                      selectedSet.has(tag)
                        ? "bg-[color:var(--select-item-bg-selected)] data-[selected=true]:bg-[color:var(--select-item-bg-selected)]"
                        : null
                    )}
                    aria-checked={selectedSet.has(tag)}
                  >
                    <Checkbox
                      checked={selectedSet.has(tag)}
                      aria-label={tag}
                      tabIndex={-1}
                      iconClassName="text-white"
                      className="pointer-events-none absolute left-[var(--dropdown-menu-item-padding-x)] top-1/2 -translate-y-1/2 [&_svg]:!size-[14px]"
                    />
                    <span className="truncate">{tag}</span>
                  </CommandItem>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
