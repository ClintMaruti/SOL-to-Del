import { Button } from "@sol/ui";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  SquarePen,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import type { ContractedRate } from "@/entities/contracted-rate";
import type { ServiceRate } from "@/entities/service-rate";
import { formatDate } from "@/shared/lib";
import type { ServiceOption } from "@/entities/supplier-service-options";

import {
  groupContractedRates,
  type ContractedRateSeasonGroup,
} from "../lib/groupContractedRates";

/**
 * Column template matching Figma proportions:
 * Season(~299) | Priority(72) | Option(~298) | Rate(160) | Net(100) | Rack(100) | Sell(100) | Actions(72)
 */
const COL_TEMPLATE =
  "minmax(140px,1.5fr) 72px minmax(140px,1.5fr) 160px 100px 100px 100px 72px";

/** Bottom border only for the group boundary row (row 1 / parent row). */
const GROUP_BORDER = "border-b border-border-tertiary";
/** No bottom border on child rows — groups separate via the parent row border. */
const CHILD_BORDER = "";

function optionTitle(options: ServiceOption[], id: string): string {
  return options.find((o) => o.id === id)?.title ?? id;
}

function rateName(rates: ServiceRate[], id: string): string {
  return rates.find((r) => r.id === id)?.name ?? id;
}

function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface ContractedRatesTableProps {
  rows: ContractedRate[];
  options: ServiceOption[];
  rates: ServiceRate[];
  onDuplicateSeason: (group: ContractedRateSeasonGroup) => void;
  onEditSeason?: (group: ContractedRateSeasonGroup) => void;
}

export function ContractedRatesTable({
  rows,
  options,
  rates,
  onDuplicateSeason,
  onEditSeason,
}: ContractedRatesTableProps) {
  const { t } = useTranslation(["admin", "common"]);
  const groups = useMemo(() => groupContractedRates(rows), [rows]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isExpanded = (key: string) => expanded[key] !== false;

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? true),
    }));
  };

  if (groups.length === 0) return null;

  return (
    <div className="overflow-hidden border-x border-b border-border-tertiary rounded-b-[6px]">
      {/* Table header — matches bg-background-primary / text-text-secondary like project TableHead */}
      <div
        className="grid border-b border-border-tertiary bg-background-primary text-sm font-medium text-foreground"
        style={{ gridTemplateColumns: COL_TEMPLATE }}
      >
        <div className="px-3 py-2">{t("serviceRates.seasonName")}</div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.priority")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.option")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.rate")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.net")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.rack")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2">
          {t("labels.sell")}
        </div>
        <div className="border-l border-border-tertiary px-3 py-2 text-center">
          {t("tableHeaders.actions")}
        </div>
      </div>

      {groups.map((group, idx) => {
        const open = isExpanded(group.key);
        return (
          <SeasonGroup
            key={group.key}
            group={group}
            open={open}
            options={options}
            rates={rates}
            t={t}
            isLast={idx === groups.length - 1}
            onToggle={() => toggleExpanded(group.key)}
            onDuplicate={() => onDuplicateSeason(group)}
            onEdit={() => onEditSeason?.(group)}
          />
        );
      })}
    </div>
  );
}

type TranslateFn = TFunction<["admin", "common"]>;

interface SeasonGroupProps {
  group: ContractedRateSeasonGroup;
  open: boolean;
  options: ServiceOption[];
  rates: ServiceRate[];
  t: TranslateFn;
  isLast?: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onEdit: () => void;
}

/**
 * Layout (expanded):
 *
 *  Row 1  │ Season name (gray bg) │ Priority (white bg, border-l) │ ← EMPTY → │ Actions (span N rows)
 *  Row 2  │ Travel Date 1 (gray)  │ (empty, no border-l)          │ price row 1 │
 *  Row 3  │ Travel Date 2 (gray)  │ (empty)                       │ price row 2 │
 *  Row N  │ Weekdays (gray)       │ (empty)                       │ price row M │
 *
 * totalRows = max(leftSlots.length, 1 + priceRows.length)
 * Right section starts at gridRow 2 so the season header row is always empty for option/rate/prices.
 * All cells (except Actions) carry border-b to create row separators.
 */
function SeasonGroup({
  group,
  open,
  options,
  rates,
  t,
  isLast = false,
  onToggle,
  onDuplicate,
  onEdit,
}: SeasonGroupProps) {
  const bookingWindowDates = useMemo(
    () => group.dates.filter((d) => d.bookingWindowFrom || d.bookingWindowTo),
    [group.dates]
  );
  const hasBookingWindow = bookingWindowDates.length > 0;

  type LeftSlot =
    | { kind: "header" }
    | { kind: "date"; from: string; to: string }
    | { kind: "weekdays"; days: string[] }
    | { kind: "bwLabel" }
    | { kind: "bwDate"; from: string; to: string };

  const leftSlots: LeftSlot[] = useMemo(() => {
    const slots: LeftSlot[] = [{ kind: "header" }];
    for (const d of group.dates) {
      slots.push({ kind: "date", from: d.travelDateFrom, to: d.travelDateTo });
      if (d.weekdays && d.weekdays.length > 0) {
        slots.push({ kind: "weekdays", days: d.weekdays });
      }
    }
    if (hasBookingWindow) {
      slots.push({ kind: "bwLabel" });
      for (const d of bookingWindowDates) {
        slots.push({
          kind: "bwDate",
          from: d.bookingWindowFrom ?? "",
          to: d.bookingWindowTo ?? "",
        });
      }
    }
    return slots;
  }, [group.dates, hasBookingWindow, bookingWindowDates]);

  const rightCount = group.rows.length;

  /**
   * totalRows = max(leftSlots.length, 1 + rightCount)
   * Right price rows occupy rows 2..(1+rightCount).
   * Row 1 (parent/header) has empty right cells.
   */
  const totalRows = open ? Math.max(leftSlots.length, 1 + rightCount) : 1;

  const cells: React.ReactNode[] = [];

  // ─── Left section ──────────────────────────────────────────────────────────
  if (!open) {
    // ── Collapsed: single row ──────────────────────────────────────────────────
    cells.push(
      <div
        key="season-hdr"
        style={{ gridRow: 1, gridColumn: 1 }}
        className={`flex min-h-9 items-center gap-1 bg-gray-100 px-3 text-sm font-semibold text-foreground ${GROUP_BORDER}`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-foreground"
          aria-label={t("aria.expand")}
          onClick={onToggle}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <span className="truncate">{group.seasonName}</span>
      </div>
    );
    cells.push(
      <div
        key="priority-hdr"
        style={{ gridRow: 1, gridColumn: 2 }}
        className={`flex min-h-9 items-center border-l border-border-tertiary bg-white px-3 text-sm ${GROUP_BORDER}`}
      >
        {group.priority}
      </div>
    );
  } else {
    // ── Expanded left section ─────────────────────────────────────────────────
    leftSlots.forEach((slot, i) => {
      const row = i + 1;
      // Add a thin separator after the last slot of a date group when the
      // next slot starts another date group, so they don't blend visually.
      const nextSlot = leftSlots[i + 1];
      const isDateGroupBoundary =
        (slot.kind === "date" || slot.kind === "weekdays") &&
        nextSlot?.kind === "date";
      const border =
        row === 1
          ? GROUP_BORDER
          : isDateGroupBoundary
            ? "border-b border-border-tertiary"
            : CHILD_BORDER;

      if (slot.kind === "header") {
        cells.push(
          <div
            key="season-hdr"
            style={{ gridRow: row, gridColumn: 1 }}
            className={`flex min-h-9 items-center gap-1 bg-gray-100 px-3 text-sm font-semibold text-foreground ${border}`}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-foreground"
              aria-label={t("aria.collapse")}
              onClick={onToggle}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className="truncate">{group.seasonName}</span>
          </div>
        );
        {
          /* Row 1 Priority: border-l + white bg */
        }
        cells.push(
          <div
            key="priority-hdr"
            style={{ gridRow: row, gridColumn: 2 }}
            className={`flex min-h-9 items-center border-l border-border-tertiary bg-white px-3 text-sm ${border}`}
          >
            {group.priority}
          </div>
        );
      } else if (slot.kind === "date") {
        cells.push(
          <div
            key={`date-${i}`}
            style={{ gridRow: row, gridColumn: 1 }}
            className={`flex min-h-9 items-center gap-2 bg-gray-100 px-3 text-sm text-secondary-foreground ${border}`}
          >
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {slot.from ? formatDate(slot.from) : "—"} –{" "}
              {slot.to ? formatDate(slot.to) : "—"}
            </span>
          </div>
        );
        {
          /* Child priority: merged with season column (grey), NO border-l */
        }
        cells.push(
          <div
            key={`priority-${i}`}
            style={{ gridRow: row, gridColumn: 2 }}
            className={`min-h-9 bg-gray-100 ${border}`}
          />
        );
      } else if (slot.kind === "weekdays") {
        cells.push(
          <div
            key="weekdays"
            style={{ gridRow: row, gridColumn: 1 }}
            className={`flex min-h-9 items-center bg-gray-100 px-3 text-sm font-medium text-secondary-foreground ${border}`}
          >
            {slot.days.join(", ")}
          </div>
        );
        cells.push(
          <div
            key="priority-wd"
            style={{ gridRow: row, gridColumn: 2 }}
            className={`min-h-9 bg-gray-100 ${border}`}
          />
        );
      } else if (slot.kind === "bwLabel") {
        cells.push(
          <div
            key="bw-label"
            style={{ gridRow: row, gridColumn: 1 }}
            className={`flex min-h-9 items-center bg-gray-100 px-3 text-sm font-semibold text-secondary-foreground ${border}`}
          >
            {t("labels.bookingWindow")}
          </div>
        );
        cells.push(
          <div
            key="priority-bwLabel"
            style={{ gridRow: row, gridColumn: 2 }}
            className={`min-h-9 bg-gray-100 ${border}`}
          />
        );
      } else if (slot.kind === "bwDate") {
        cells.push(
          <div
            key={`bw-date-${i}`}
            style={{ gridRow: row, gridColumn: 1 }}
            className={`flex min-h-9 items-center gap-2 bg-gray-100 px-3 text-sm text-secondary-foreground ${border}`}
          >
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {slot.from ? formatDate(slot.from) : "—"} –{" "}
              {slot.to ? formatDate(slot.to) : "—"}
            </span>
          </div>
        );
        cells.push(
          <div
            key={`priority-bw-${i}`}
            style={{ gridRow: row, gridColumn: 2 }}
            className={`min-h-9 bg-gray-100 ${border}`}
          />
        );
      }
    });

    // Fill empty left cells if right section extends beyond left
    for (let i = leftSlots.length; i < totalRows; i++) {
      const row = i + 1;
      cells.push(
        <div
          key={`fill-season-${row}`}
          style={{ gridRow: row, gridColumn: 1 }}
          className="min-h-9 bg-gray-100"
        />
      );
      cells.push(
        <div
          key={`fill-priority-${row}`}
          style={{ gridRow: row, gridColumn: 2 }}
          className="min-h-9 bg-gray-100"
        />
      );
    }
  }

  // ─── Row 1 empty cells for right section (parent row always empty) ──────────
  for (const [colIdx, key] of [
    [3, "opt"],
    [4, "rate"],
    [5, "net"],
    [6, "rack"],
    [7, "sell"],
  ] as [number, string][]) {
    cells.push(
      <div
        key={`hdr-empty-${key}`}
        style={{ gridRow: 1, gridColumn: colIdx }}
        className={`min-h-9 border-l border-border-tertiary bg-white ${GROUP_BORDER}`}
      />
    );
  }

  // ─── Right section price rows (start at gridRow 2) ──────────────────────────
  if (open) {
    group.rows.forEach((row, i) => {
      const gridRow = i + 2;
      // Add row separator between child price rows (not on the last one — group border handles that)
      const childRowBorder =
        i < group.rows.length - 1 ? "border-b border-border-tertiary" : "";
      cells.push(
        <div
          key={`opt-${row.id}`}
          style={{ gridRow: gridRow, gridColumn: 3 }}
          className={`flex min-h-9 items-center border-l border-border-tertiary bg-white px-3 text-sm ${childRowBorder}`}
        >
          {optionTitle(options, row.serviceOptionId)}
        </div>
      );
      cells.push(
        <div
          key={`rate-${row.id}`}
          style={{ gridRow: gridRow, gridColumn: 4 }}
          className={`flex min-h-9 items-center border-l border-border-tertiary bg-white px-3 text-sm ${childRowBorder}`}
        >
          {rateName(rates, row.rateId)}
        </div>
      );
      cells.push(
        <div
          key={`net-${row.id}`}
          style={{ gridRow: gridRow, gridColumn: 5 }}
          className={`flex min-h-9 items-center border-l border-border-tertiary bg-white px-3 text-sm tabular-nums ${childRowBorder}`}
        >
          {formatPrice(row.net?.value)}
        </div>
      );
      cells.push(
        <div
          key={`rack-${row.id}`}
          style={{ gridRow: gridRow, gridColumn: 6 }}
          className={`flex min-h-9 items-center border-l border-border-tertiary bg-white px-3 text-sm tabular-nums ${childRowBorder}`}
        >
          {formatPrice(row.rack?.value)}
        </div>
      );
      cells.push(
        <div
          key={`sell-${row.id}`}
          style={{ gridRow: gridRow, gridColumn: 7 }}
          className={`flex min-h-9 items-center border-l border-border-tertiary bg-white px-3 text-sm tabular-nums ${childRowBorder}`}
        >
          {formatPrice(row.sell?.value)}
        </div>
      );
    });

    // Fill empty right cells if left section extends beyond right price rows
    for (let i = rightCount + 1; i < totalRows; i++) {
      const gridRow = i + 1;
      cells.push(
        <div
          key={`rfill-opt-${gridRow}`}
          style={{ gridRow: gridRow, gridColumn: 3 }}
          className="min-h-9 border-l border-border-tertiary bg-white"
        />
      );
      cells.push(
        <div
          key={`rfill-rate-${gridRow}`}
          style={{ gridRow: gridRow, gridColumn: 4 }}
          className="min-h-9 border-l border-border-tertiary bg-white"
        />
      );
      cells.push(
        <div
          key={`rfill-net-${gridRow}`}
          style={{ gridRow: gridRow, gridColumn: 5 }}
          className="min-h-9 border-l border-border-tertiary bg-white"
        />
      );
      cells.push(
        <div
          key={`rfill-rack-${gridRow}`}
          style={{ gridRow: gridRow, gridColumn: 6 }}
          className="min-h-9 border-l border-border-tertiary bg-white"
        />
      );
      cells.push(
        <div
          key={`rfill-sell-${gridRow}`}
          style={{ gridRow: gridRow, gridColumn: 7 }}
          className="min-h-9 border-l border-border-tertiary bg-white"
        />
      );
    }
  }

  // ─── Actions cell — spans ALL rows, side-by-side, TOP-aligned ───────────────
  cells.push(
    <div
      key="actions"
      style={{ gridRow: `1 / ${totalRows + 1}`, gridColumn: 8 }}
      className="flex flex-row items-start justify-center gap-0 border-l border-border-tertiary bg-white pt-0"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label={t("buttons.duplicate")}
        onClick={onDuplicate}
      >
        <Copy className="h-4 w-4 text-brand-red" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label={t("buttons.edit")}
        onClick={onEdit}
      >
        <SquarePen className="h-4 w-4 text-brand-red" />
      </Button>
    </div>
  );

  return (
    <div
      className={`grid ${isLast ? "" : "border-b border-gray-400"}`}
      style={{
        gridTemplateColumns: COL_TEMPLATE,
        gridTemplateRows: `repeat(${totalRows}, 36px)`,
      }}
    >
      {cells}
    </div>
  );
}
