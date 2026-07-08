import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from "@sol/ui";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUp, Copy, SquarePen, Trash2 } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from "react";
import { useTranslation } from "react-i18next";

import {
  isMarginRuleDeletable,
  isMarginRuleEditable,
  toLocalIsoDateString,
  type MarginRule,
  type MarginRuleSortBy,
} from "@/entities/margin-rule";
import { formatDate } from "@/shared/lib";
import { SortableHeader } from "@/shared/ui";

const ROW_HEIGHT = 36;
const LOAD_MORE_THRESHOLD_PX = 100;
const LIST_END_BUFFER_PX = 32;
const GRID_TEMPLATE =
  "minmax(240px, 240fr) minmax(170px, 170fr) minmax(280px, 280fr) minmax(180px, 180fr) minmax(190px, 190fr) minmax(132px, 132fr) minmax(132px, 132fr) minmax(130px, 130fr) 90px";
const PAGE_SKELETON_ROWS = 6;

interface MarginRulesVirtualizedTableProps {
  rows: MarginRule[];
  sortBy: MarginRuleSortBy;
  sortDirection: "asc" | "desc";
  onSort: (nextSortBy: MarginRuleSortBy) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  shouldResetToFirstPageOnBackToTop?: boolean;
  onResetToFirstPage?: () => void;
  onDuplicateRule: (rule: MarginRule) => void;
  onEditRule: (rule: MarginRule) => void;
  onDeleteRule: (rule: MarginRule) => void;
}

interface ActionIconButtonProps {
  label: string;
  disabled?: boolean;
  disabledTooltip?: string;
  onClick?: () => void;
  children: ReactNode;
}

function displayAny(value: string | null | undefined, anyLabel: string) {
  return value?.trim() ? value : anyLabel;
}

function formatMarginPercent(value: number) {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value);
}

interface TableSkeletonRowProps {
  className?: string;
  style?: CSSProperties;
}

function TableSkeletonRow({ className, style }: TableSkeletonRowProps) {
  return (
    <TableRow
      className={cn(
        "grid w-full border-b-0 border-t border-border-tertiary bg-white hover:bg-transparent",
        className
      )}
      style={{ ...style, gridTemplateColumns: GRID_TEMPLATE }}
    >
      {Array.from({ length: 9 }).map((_, index) => (
        <TableCell
          key={index}
          className={cn(
            "px-0 py-1.5 pl-4 pr-2",
            index === 0
              ? "border-r border-border-tertiary"
              : "border-l border-border-tertiary"
          )}
        >
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

function ActionIconButton({
  label,
  disabled = false,
  disabledTooltip,
  onClick,
  children,
}: ActionIconButtonProps) {
  const buttonNode = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      className={cn(
        "size-6 text-brand-red hover:bg-brand-tetriary hover:text-brand-red",
        disabled &&
          "cursor-not-allowed text-neutral-300 opacity-100 hover:bg-transparent hover:text-neutral-300"
      )}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );

  if (!disabled || !disabledTooltip) {
    return buttonNode;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-not-allowed">{buttonNode}</span>
      </TooltipTrigger>
      <TooltipContent side="left">{disabledTooltip}</TooltipContent>
    </Tooltip>
  );
}

export function MarginRulesVirtualizedTable({
  rows,
  sortBy,
  sortDirection,
  onSort,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  shouldResetToFirstPageOnBackToTop = false,
  onResetToFirstPage,
  onDuplicateRule,
  onEditRule,
  onDeleteRule,
}: MarginRulesVirtualizedTableProps) {
  const { t } = useTranslation(["admin", "common"]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const anyLabel = t("labels.any").toUpperCase();
  const todayIsoDate = useMemo(() => toLocalIsoDateString(), []);
  const editDisabledTooltip = t("tooltips.marginRuleEditDisabled");
  const deleteDisabledTooltip = t("tooltips.marginRuleDeleteDisabled");

  const itemCount = rows.length + (isFetchingNextPage ? PAGE_SKELETON_ROWS : 0);

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const rowsWithLoadingState = useMemo(
    () =>
      virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];
        return {
          virtualRow,
          row,
          isSkeleton: !row,
        };
      }),
    [rows, virtualRows]
  );

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const distanceToBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    setShowBackToTop(target.scrollTop > 320);

    if (
      distanceToBottom <= LOAD_MORE_THRESHOLD_PX &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      onLoadMore();
    }
  };

  const handleBackToTop = () => {
    scrollRef.current?.scrollTo({ top: 0 });

    if (shouldResetToFirstPageOnBackToTop) {
      onResetToFirstPage?.();
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-b-md border-x border-b border-border-tertiary bg-white">
      <div
        ref={scrollRef}
        className="h-full min-h-0 overflow-auto overscroll-y-contain *:data-[slot=table-container]:min-w-full *:data-[slot=table-container]:w-fit *:data-[slot=table-container]:overflow-visible"
        style={{
          overflowAnchor: "none",
        }}
        onScroll={handleScroll}
      >
        <Table className="w-full min-w-[1544px] border-separate border-spacing-0 ">
          <TableHeader className="sticky top-0 z-30 block bg-background-secondary [&_tr]:border-b-0">
            <TableRow
              className="grid w-full border-b-0 bg-background-secondary hover:bg-transparent"
              style={{ gridTemplateColumns: GRID_TEMPLATE }}
            >
              <TableHead className="sticky left-0 z-40 h-9 bg-background-secondary px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-r border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("tableHeaders.agencyGroup")}
                  field="agencyGroupName"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="h-9 px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-l border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("labels.serviceType")}
                  field="serviceType"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="h-9 px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-l border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("tableHeaders.supplier")}
                  field="supplierName"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="h-9 px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-l border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("tableHeaders.service")}
                  field="serviceName"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="h-9 px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-l border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("labels.option")}
                  field="optionName"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="h-9 px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-l border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("labels.validFrom")}
                  field="validFrom"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="h-9 px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-l border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("labels.validTo")}
                  field="validTo"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="h-9 px-0 py-1.5 pl-4 pr-2 text-text-primary border-b border-l border-border-primary">
                <SortableHeader<MarginRuleSortBy>
                  label={t("labels.marginPercent")}
                  field="marginPercent"
                  currentField={sortBy}
                  currentDirection={sortDirection}
                  onSort={onSort}
                  className="h-full w-full justify-start gap-1.5 text-left font-semibold leading-6 text-text-primary hover:text-text-primary"
                />
              </TableHead>
              <TableHead className="sticky right-0 z-40 flex h-9 items-center justify-center bg-background-secondary px-2 text-sm font-semibold leading-6 text-text-primary border-b border-l border-border-primary">
                {t("table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody
            className="relative block"
            style={{ height: `${totalSize + LIST_END_BUFFER_PX}px` }}
          >
            {rowsWithLoadingState.map(({ virtualRow, row, isSkeleton }) => {
              if (isSkeleton) {
                return (
                  <TableSkeletonRow
                    key={virtualRow.key}
                    className="absolute left-0 top-0"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  />
                );
              }

              const canEdit = isMarginRuleEditable(row, todayIsoDate);
              const canDelete = isMarginRuleDeletable(row, todayIsoDate);

              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    "group/row absolute left-0 top-0 grid w-full border-b-0 bg-white transition-colors hover:bg-muted",
                    virtualRow.index === 0 ? "" : "border-t! border-gray-200!",
                    virtualRow.index === rows.length - 1 &&
                      "border-b! border-gray-200!"
                  )}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns: GRID_TEMPLATE,
                  }}
                >
                  <TableCell className="sticky left-0 z-20 min-w-0 truncate border-r border-border-tertiary bg-white px-0 py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-primary transition-colors group-hover/row:bg-muted">
                    {row.agencyGroupName}
                  </TableCell>
                  <TableCell className="min-w-0 truncate border-l border-border-tertiary px-0 py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-primary">
                    {displayAny(row.serviceTypeName, anyLabel)}
                  </TableCell>
                  <TableCell className="min-w-0 truncate border-l border-border-tertiary px-0 py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-primary">
                    {displayAny(row.supplierName, anyLabel)}
                  </TableCell>
                  <TableCell className="min-w-0 truncate border-l border-border-tertiary px-0 py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-primary">
                    {displayAny(row.serviceName, anyLabel)}
                  </TableCell>
                  <TableCell className="min-w-0 truncate border-l border-border-tertiary px-0 py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-primary">
                    {displayAny(row.optionName, anyLabel)}
                  </TableCell>
                  <TableCell className="min-w-0 truncate border-l border-border-tertiary px-0 py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-primary">
                    {formatDate(row.validFrom)}
                  </TableCell>
                  <TableCell className="min-w-0 truncate border-l border-border-tertiary px-0 py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-primary">
                    {row.validTo
                      ? formatDate(row.validTo)
                      : t("placeholders.dash")}
                  </TableCell>
                  <TableCell className="min-w-0 truncate border-l border-border-tertiary px-0 py-1.5 pl-4 pr-2 text-right text-sm font-medium leading-6 text-text-primary">
                    {formatMarginPercent(row.marginPercent)}
                  </TableCell>
                  <TableCell className="sticky right-0 z-20 border-l border-border-tertiary bg-white px-2 py-1.5 transition-colors group-hover/row:bg-muted">
                    <div className="flex items-center justify-center gap-1">
                      <ActionIconButton
                        onClick={() => onDuplicateRule(row)}
                        label={t("common:buttons.duplicate")}
                      >
                        <Copy className="size-4" />
                      </ActionIconButton>
                      <ActionIconButton
                        disabled={!canEdit}
                        disabledTooltip={
                          canEdit ? undefined : editDisabledTooltip
                        }
                        onClick={() => onEditRule(row)}
                        label={t("common:buttons.edit")}
                      >
                        <SquarePen className="size-4" />
                      </ActionIconButton>
                      <ActionIconButton
                        disabled={!canDelete}
                        disabledTooltip={
                          canDelete ? undefined : deleteDisabledTooltip
                        }
                        onClick={() => onDeleteRule(row)}
                        label={t("common:buttons.delete")}
                      >
                        <Trash2 className="size-4" />
                      </ActionIconButton>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {showBackToTop ? (
        <Button
          type="button"
          variant="outline-secondary"
          size="icon-sm"
          className="absolute bottom-3 right-3 z-40 size-7 shadow-sm"
          onClick={handleBackToTop}
          aria-label={t("buttons.backToTop")}
        >
          <ArrowUp className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
