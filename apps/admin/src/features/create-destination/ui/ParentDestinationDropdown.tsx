import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  cn,
} from "@sol/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  flattenDestinationTree,
  getAllDestinationTypes,
} from "@/entities/destination/lib/destination-utils";
import type {
  Destination,
  DestinationType,
} from "@/entities/destination/model/types";
import { FormMessage } from "@/shared/ui/form";

interface ParentFieldApi {
  state: {
    value: string;
    meta: {
      errors: Array<string | undefined>;
      isValid: boolean;
    };
  };
  handleChange: (value: string) => void;
}

interface ParentDestinationDropdownProps {
  destinations: Destination[];
  parentDestination?: Destination | null;
  field: ParentFieldApi;
  isParentOptional: boolean;
}

export function ParentDestinationDropdown({
  destinations,
  parentDestination,
  field,
  isParentOptional,
}: ParentDestinationDropdownProps) {
  const { t } = useTranslation("admin");
  const [parentNode, setParentNode] = useState<HTMLDivElement | null>(null);
  const [parentSearch, setParentSearch] = useState("");

  const parentId = field.state.value as string;

  const parentDestinations = useMemo(() => {
    return flattenDestinationTree(destinations);
  }, [destinations]);

  const filteredParentDestinations = useMemo(() => {
    return parentDestinations.filter(
      (dest) =>
        dest.name.toLowerCase().includes(parentSearch.toLowerCase()) ||
        dest.parent?.toLowerCase().includes(parentSearch.toLowerCase())
    );
  }, [parentDestinations, parentSearch]);

  const count = filteredParentDestinations.length;

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentNode,
    estimateSize: (index) => {
      const dest = filteredParentDestinations[index];
      // Items with a parent subtitle are taller
      return dest?.parent ? 50 : 36;
    },
    overscan: 5,
  });

  const isParentLocked = !!parentDestination;

  const selectedParentForTrigger = useMemo(
    () =>
      parentId && parentId !== "root_id"
        ? parentDestinations.find((d) => d.id === parentId)
        : null,
    [parentDestinations, parentId]
  );

  const typeConfigMap = useMemo(() => {
    const types = getAllDestinationTypes();
    return new Map(types.map((item) => [item.type, item]));
  }, []);

  const renderSelectedParentDestination = () => {
    if (!parentId || parentId === "root_id") {
      return (
        <span className="text-neutral-400 text-sm font-medium">
          {t("placeholders.selectParentDestination")}
        </span>
      );
    }

    // If parentDestination prop is provided and matches, use it directly
    if (parentDestination && parentId === parentDestination.id) {
      return (
        <div className="text-sm font-medium text-neutral-900">
          <span>{parentDestination.name}</span>
        </div>
      );
    }

    const selected = selectedParentForTrigger;
    if (!selected) return null;

    return (
      <div className="text-sm font-medium text-neutral-900">
        <span>{selected.name}</span>
      </div>
    );
  };

  const items = rowVirtualizer.getVirtualItems();
  const hasErrors = field.state.meta.errors.length > 0;

  return (
    <div className="space-y-2">
      <Label
        className={cn(isParentLocked || (isParentOptional && "opacity-50"))}
        htmlFor="parent"
      >
        {t("labels.parentDestination")}
        {!isParentOptional && <span className="text-destructive">*</span>}
      </Label>
      <Select
        value={parentId || "root_id"}
        onValueChange={(value: string) => {
          field.handleChange(value === "root_id" ? "root_id" : value);
        }}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            setParentSearch("");
          }
        }}
        disabled={isParentLocked || isParentOptional}
      >
        <SelectTrigger
          id="parent"
          className="w-full"
          filled={Boolean(parentId && parentId !== "root_id")}
          aria-invalid={hasErrors}
        >
          {renderSelectedParentDestination()}
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="max-h-[300px]"
          header={
            <div className="flex items-center gap-2 border-b shrink-0">
              <InputGroup className="border-0">
                <InputGroupAddon>
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                </InputGroupAddon>
                <InputGroupInput
                  type="text"
                  placeholder={t("placeholders.search")}
                  value={parentSearch}
                  onChange={(e) => {
                    setParentSearch(e.target.value);
                  }}
                  className="h-auto border-0 shadow-none p-0 focus-visible:ring-0 text-sm placeholder:text-muted-foreground px-3 py-2"
                  onKeyDown={(e: KeyboardEvent) => e.stopPropagation()}
                  onPointerDown={(e: PointerEvent) => e.stopPropagation()}
                  onClick={(e: MouseEvent) => e.stopPropagation()}
                />
              </InputGroup>
            </div>
          }
        >
          <div ref={setParentNode} className="h-full overflow-auto p-1">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {items.map((virtualRow) => {
                const dest = filteredParentDestinations[virtualRow.index];
                const typeConfig = typeConfigMap.get(
                  dest.type as unknown as DestinationType
                );
                return (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    key={virtualRow.key}
                  >
                    <SelectItem key={dest.id} value={dest.id}>
                      <div className={cn("flex items-start gap-x-2")}>
                        {typeConfig && (
                          <typeConfig.icon
                            className={cn(
                              "text-base shrink-0 mt-1",
                              typeConfig.color
                            )}
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-6">
                            {dest.name}
                          </span>
                          {dest.parent && (
                            <span className="text-xs text-neutral-400">
                              {dest.parent}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  </div>
                );
              })}
            </div>
          </div>
        </SelectContent>
      </Select>
      {hasErrors && <FormMessage errors={field.state.meta.errors} />}
    </div>
  );
}
