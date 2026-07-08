import {
  Button,
  Input,
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
import { useStore } from "@tanstack/react-form";
import { Calendar, CircleX } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDate } from "@/shared/lib";
import { clearFormScopedOnSubmitFieldErrorsByPrefix } from "@/shared/lib/form";
import { DateRangePicker } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";

export type TravelRow = {
  id: string;
  travelFrom: string;
  travelTo: string;
  net: string;
  rack: string;
  sell: string;
};

interface TravelDatesSectionProps {
  form: AnyFormApi;
}

const PROGRAMMATIC_SET_OPTS = {
  dontUpdateMeta: true,
  dontValidate: true,
} as const;

function sanitizeMoneyInput(value: string): string {
  let v = value.replace(/[^\d.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    const intPart = v.slice(0, firstDot);
    const fracPart = v.slice(firstDot + 1).replace(/\./g, "");
    v = intPart + "." + fracPart;
  }
  return v;
}

type SubmitFieldMeta = Record<string, { errors?: string[] } | undefined>;

export function TravelDatesSection({ form }: TravelDatesSectionProps) {
  const { t } = useTranslation("admin");
  const [travelOpen, setTravelOpen] = useState(false);

  const travelDates = useStore(form.store, (s) => {
    const state = s as {
      values: { contracted: { travelDates: TravelRow[] } };
    };
    return state.values.contracted.travelDates;
  });

  const fieldMeta = useStore(
    form.store,
    (s) => (s as { fieldMeta?: SubmitFieldMeta }).fieldMeta
  );
  const travelDateRangeInvalid = Boolean(
    fieldMeta?.["contracted.travelDates[0].travelFrom"]?.errors?.length ||
    fieldMeta?.["contracted.travelDates[0].travelTo"]?.errors?.length ||
    fieldMeta?.["contracted.travelDates"]?.errors?.length
  );

  const patchTravelDates = (next: TravelRow[]) => {
    form.setFieldValue("contracted.travelDates", next);
  };

  useLayoutEffect(() => {
    if (travelDates.length !== 0) return;
    const rowId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `td-${Date.now()}`;
    form.setFieldValue(
      "contracted.travelDates",
      [
        {
          id: rowId,
          travelFrom: "",
          travelTo: "",
          net: "",
          rack: "",
          sell: "",
        },
      ],
      PROGRAMMATIC_SET_OPTS
    );
  }, [travelDates.length, form]);

  const updateRow = (index: number, patch: Partial<TravelRow>) => {
    const next = travelDates.map((r, i) =>
      i === index ? { ...r, ...patch } : r
    );
    patchTravelDates(next);
  };

  const current = travelDates[0] ?? {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "td-default",
    travelFrom: "",
    travelTo: "",
    net: "",
    rack: "",
    sell: "",
  };

  const updateCurrent = (patch: Partial<TravelRow>) => {
    updateRow(0, patch);
  };

  const travelRange =
    current.travelFrom && current.travelTo
      ? `${formatDate(current.travelFrom)} - ${formatDate(current.travelTo)}`
      : null;

  return (
    <div className="w-full">
      <div className="h-9 rounded-t-md border-x border-t border-border-tertiary bg-gray-300 px-4 py-1.5">
        <p className="text-sm font-semibold leading-6 text-foreground">
          {t("extraDetail.travelDates.heading")}
        </p>
      </div>
      <div className="grid grid-cols-[1fr_36px]">
        <div
          className={cn(
            "flex h-9 items-center gap-2 border-b bg-background-secondary px-4 py-1.5",
            travelDateRangeInvalid
              ? "border-destructive bg-destructive/6"
              : "border-border"
          )}
        >
          <Popover open={travelOpen} onOpenChange={setTravelOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 min-w-0 justify-start gap-2 rounded-none border-0 bg-transparent px-0 py-0 text-sm font-semibold leading-6 text-foreground shadow-none ring-0 outline-none hover:border-0 hover:bg-transparent focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none"
              >
                <Calendar className="size-5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {travelRange ?? t("labels.selectDates")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <DateRangePicker
                from={current.travelFrom || undefined}
                to={current.travelTo || undefined}
                onConfirm={(from, to) => {
                  updateCurrent({ travelFrom: from, travelTo: to });
                  clearFormScopedOnSubmitFieldErrorsByPrefix(
                    form,
                    "contracted.travelDates"
                  );
                  setTravelOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex h-9 items-center justify-center border-b border-border bg-background-secondary">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-none border-0 bg-transparent text-brand-red shadow-none ring-0 outline-none hover:border-0 hover:bg-background-secondary/90 hover:text-destructive focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none"
            aria-label={t("extraDetail.travelDates.removeRow")}
            onClick={() =>
              patchTravelDates([
                {
                  ...current,
                  travelFrom: "",
                  travelTo: "",
                  net: "",
                  rack: "",
                  sell: "",
                },
              ])
            }
          >
            <CircleX className="size-4" />
          </Button>
        </div>
      </div>

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-9 border-b border-l border-r border-border-tertiary bg-background-primary pl-4 pr-2 py-1.5 text-right text-sm font-semibold leading-6 text-text-secondary">
              {t("extraDetail.travelDates.net")}
            </TableHead>
            <TableHead className="h-9 border-b border-r border-border-tertiary bg-background-primary pl-4 pr-2 py-1.5 text-right text-sm font-semibold leading-6 text-text-secondary">
              {t("extraDetail.travelDates.rack")}
            </TableHead>
            <TableHead className="h-9 border-b border-r border-border-tertiary bg-background-primary pl-4 pr-2 py-1.5 text-right text-sm font-semibold leading-6 text-text-secondary">
              {t("extraDetail.travelDates.sell")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="h-9 rounded-bl-[6px] border-b border-l border-r border-border-tertiary p-0">
              <Input
                type="text"
                inputMode="decimal"
                value={current.net}
                onChange={(e) =>
                  updateCurrent({ net: sanitizeMoneyInput(e.target.value) })
                }
                className="h-9 rounded-none border-0 bg-white pl-4 pr-2 py-1.5 text-right text-sm font-medium leading-6 text-foreground shadow-none focus-visible:ring-0"
              />
            </TableCell>
            <TableCell className="h-9 border-b border-r border-border-tertiary p-0">
              <Input
                type="text"
                inputMode="decimal"
                value={current.rack}
                onChange={(e) =>
                  updateCurrent({ rack: sanitizeMoneyInput(e.target.value) })
                }
                className="h-9 rounded-none border-0 bg-white pl-4 pr-2 py-1.5 text-right text-sm font-medium leading-6 text-foreground shadow-none focus-visible:ring-0"
              />
            </TableCell>
            <TableCell className="h-9 rounded-br-[6px] border-b border-r border-border-tertiary p-0">
              <Input
                type="text"
                inputMode="decimal"
                value={current.sell}
                onChange={(e) =>
                  updateCurrent({ sell: sanitizeMoneyInput(e.target.value) })
                }
                className="h-9 rounded-none border-0 bg-white pl-4 pr-2 py-1.5 text-right text-sm font-medium leading-6 text-foreground shadow-none focus-visible:ring-0"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
