import {
  Button,
  Checkbox,
  FilledCaretDownIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { RateRuleResidencyOption } from "@/entities/service-option-rate-plan";
import type { AnyFormApi } from "@/shared/ui";

interface ComponentResidencyProps {
  form: AnyFormApi;
  fieldPrefix: string;
  /** Catalog options from GET /api/catalog/rate-rules/residencies */
  residencyOptions: RateRuleResidencyOption[];
  /** Selected residency ids */
  residencies: string[];
  onDelete: () => void;
  actionsLocked?: boolean;
  actionsLockedTitle?: string;
}

export function ComponentResidency({
  form,
  fieldPrefix,
  residencyOptions,
  residencies,
  onDelete,
  actionsLocked = false,
  actionsLockedTitle,
}: ComponentResidencyProps) {
  const { t } = useTranslation("admin");
  const [open, setOpen] = useState(false);

  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of residencyOptions) {
      m.set(o.id, o.name);
    }
    return m;
  }, [residencyOptions]);

  const toggle = (residencyId: string) => {
    if (residencies.includes(residencyId)) {
      if (residencies.length === 1) {
        return;
      }
      form.setFieldValue(
        fieldPrefix,
        residencies.filter((r) => r !== residencyId)
      );
    } else {
      form.setFieldValue(fieldPrefix, [...residencies, residencyId]);
    }
  };

  const displayText =
    residencies.length > 0
      ? residencies.map((id) => labelById.get(id) ?? id).join(", ")
      : t("labels.select");

  return (
    <div className="overflow-x-auto rounded-[6px] border border-border">
      <Table className="w-full min-w-[20rem] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 bg-gray-300 pl-4 pr-2 text-sm font-semibold text-neutral-900">
              {t("labels.residency")}
            </TableHead>
            <TableHead className="h-9 w-[60px]  border-border bg-gray-300" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-white hover:bg-transparent">
            <TableCell className="p-0">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={actionsLocked}
                    title={actionsLocked ? actionsLockedTitle : undefined}
                    className="flex h-9 w-full items-center justify-between rounded-none rounded-bl-[6px] pl-4 pr-2 text-left text-sm font-medium text-foreground hover:bg-gray-50 focus-visible:rounded-bl-[6px]"
                  >
                    <span className="truncate">{displayText}</span>
                    <FilledCaretDownIcon
                      className={cn(
                        "size-4 shrink-0 text-(--select-icon-fg) transition-transform duration-200",
                        open && "rotate-180"
                      )}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-1 space-y-0.5"
                  align="start"
                  sideOffset={2}
                >
                  {residencyOptions.map((opt) => {
                    const checked = residencies.includes(opt.id);
                    return (
                      <Button
                        key={opt.id}
                        type="button"
                        variant="ghost"
                        disabled={actionsLocked}
                        className="flex w-full items-center justify-start gap-2 rounded-md bg-gray-100 px-2 py-1.5 text-sm font-medium text-foreground hover:bg-gray-200"
                        onClick={() => toggle(opt.id)}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(opt.id)}
                          className="pointer-events-none"
                        />
                        {opt.name}
                      </Button>
                    );
                  })}
                </PopoverContent>
              </Popover>
            </TableCell>
            <TableCell className="border-l border-border p-0 text-right">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-9 w-9 rounded-none rounded-br-[6px] text-brand-red hover:text-destructive focus-visible:rounded-br-[6px]"
                disabled={actionsLocked}
                title={actionsLocked ? actionsLockedTitle : undefined}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
