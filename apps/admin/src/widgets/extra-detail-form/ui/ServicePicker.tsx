import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@sol/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

import type { SupplierService } from "@/entities/supplier-services/types";
import {
  filterServicesByQuery,
  getServiceLabel,
} from "@/features/create-extra/lib/filter-services";

/** Minimal field API used by TanStack Form field render props */
interface ServicePickerField {
  state: { value: string; meta: { errors: unknown[] } };
  handleChange: (value: string) => void;
}

export interface ServicePickerProps {
  field: ServicePickerField;
  services: SupplierService[];
  servicesLoading: boolean;
  servicePopoverOpen: boolean;
  setServicePopoverOpen: (open: boolean) => void;
  selectServiceLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  activeHeading: string;
  inactiveHeading: string;
}

export function ServicePicker({
  field,
  services,
  servicesLoading,
  servicePopoverOpen,
  setServicePopoverOpen,
  selectServiceLabel,
  searchPlaceholder,
  emptyLabel,
  activeHeading,
  inactiveHeading,
}: ServicePickerProps) {
  const selectedService = useMemo(
    () => services.find((s) => s.id === field.state.value),
    [services, field.state.value]
  );
  const selectedLabel = selectedService
    ? getServiceLabel(selectedService)
    : selectServiceLabel;

  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => filterServicesByQuery(services, search),
    [services, search]
  );

  const active = useMemo(
    () =>
      [...filtered.filter((s) => s.isActive)].sort((a, b) =>
        getServiceLabel(a).localeCompare(getServiceLabel(b))
      ),
    [filtered]
  );

  const inactive = useMemo(
    () =>
      [...filtered.filter((s) => !s.isActive)].sort((a, b) =>
        getServiceLabel(a).localeCompare(getServiceLabel(b))
      ),
    [filtered]
  );

  const showEmpty = active.length === 0 && inactive.length === 0;

  /** Stale submit errors can linger in meta after a value is chosen; only show error chrome when still empty. */
  const showInvalidOutline =
    field.state.meta.errors.length > 0 &&
    !String(field.state.value ?? "").trim();

  return (
    <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={servicePopoverOpen}
          aria-label={selectServiceLabel}
          aria-invalid={showInvalidOutline ? true : undefined}
          disabled={servicesLoading || services.length === 0}
          className={cn(
            "h-9 w-full justify-between rounded-[6px] border border-border bg-muted/50 px-3 py-1.5 text-left font-normal",
            // outline variant defaults to --button-tertiary-fg (brand red); match Input / Title styling.
            "text-foreground hover:bg-muted/60 hover:text-foreground",
            "[&_svg]:text-muted-foreground"
          )}
        >
          <span className="truncate">
            {servicesLoading ? "…" : selectedLabel}
          </span>
          {servicePopoverOpen ? (
            <ChevronUp className="ml-2 size-5 shrink-0 opacity-50" />
          ) : (
            <ChevronDown className="ml-2 size-5 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-11"
          />
          <CommandList className="max-h-[280px]">
            {showEmpty ? (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </CommandEmpty>
            ) : (
              <>
                {active.length > 0 ? (
                  <CommandGroup heading={activeHeading}>
                    {active.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={s.id}
                        onSelect={() => {
                          field.handleChange(s.id);
                          setServicePopoverOpen(false);
                        }}
                        className="cursor-pointer bg-gray-50 data-[selected=true]:bg-gray-100 data-[selected=true]:text-foreground"
                      >
                        {getServiceLabel(s)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
                {inactive.length > 0 ? (
                  <CommandGroup heading={inactiveHeading}>
                    {inactive.map((s) => (
                      <CommandItem
                        key={s.id}
                        value={s.id}
                        onSelect={() => {
                          field.handleChange(s.id);
                          setServicePopoverOpen(false);
                        }}
                        className="cursor-pointer bg-gray-50 data-[selected=true]:bg-gray-100 data-[selected=true]:text-foreground"
                      >
                        {getServiceLabel(s)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
