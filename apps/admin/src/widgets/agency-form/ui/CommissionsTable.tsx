import { Button, Tooltip, TooltipContent, TooltipTrigger, cn } from "@sol/ui";
import { SquarePen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { isCommissionEditable, type Commission } from "@/entities/commission";
import {
  AdminTable,
  type AdminTableColumn,
  type SortDirection,
} from "@/shared/components/Table";
import { formatDate } from "@/shared/lib";

interface CommissionsTableProps {
  commissions: Commission[];
  onEditCommission: (commission: Commission) => void;
  onDeleteCommission: (commission: Commission) => void;
}

function formatCommissionPercent(value: number): string {
  return Number.isFinite(value) ? String(Number(value)) : "—";
}

function CommissionActionButton({
  ariaLabel,
  icon,
  locked,
  onClick,
}: {
  ariaLabel: string;
  icon: React.ReactNode;
  locked: boolean;
  onClick?: () => void;
}) {
  const { t } = useTranslation("admin");

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      aria-disabled={locked}
      className={cn(
        "h-5 w-5 rounded-none border-none bg-transparent p-0 shadow-none",
        locked
          ? "cursor-not-allowed text-text-tertiary hover:bg-transparent hover:text-text-tertiary"
          : "text-brand-red hover:bg-transparent hover:text-destructive"
      )}
      onClick={(event) => {
        event.preventDefault();
        if (!locked) {
          onClick?.();
        }
      }}
    >
      {icon}
    </Button>
  );

  if (!locked) {
    return button;
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[424px] py-4 text-left">
        <p className="font-bold leading-6 text-white">
          {t("tooltips.commissionLockedActions")}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function CommissionsTable({
  commissions,
  onEditCommission,
  onDeleteCommission,
}: CommissionsTableProps) {
  const { t } = useTranslation("admin");
  const [sortKey, setSortKey] = useState<string | null>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedCommissions = useMemo(() => {
    if (!sortKey) return commissions;

    const dir = sortDirection === "asc" ? 1 : -1;
    return [...commissions].sort((a, b) => {
      if (sortKey !== "effectiveFrom") return 0;
      return dir * a.effectiveFrom.localeCompare(b.effectiveFrom);
    });
  }, [commissions, sortDirection, sortKey]);

  const columns: AdminTableColumn<Commission>[] = [
    {
      header: t("tableHeaders.effectiveFrom"),
      sortField: "effectiveFrom",
      headerClassName: "px-4 py-1.5 leading-6 h-auto!",
      cell: (commission) => formatDate(commission.effectiveFrom),
      cellClassName: "pl-4 pr-2 py-1.5 text-text-primary leading-6",
    },
    {
      header: t("tableHeaders.commissionPercent"),
      headerClassName: "text-right py-1.5 leading-6 h-auto!",
      cell: (commission) =>
        formatCommissionPercent(commission.commissionPercent),
      cellClassName: "pl-4 pr-2 py-1.5 text-right text-text-primary leading-6",
    },
    {
      header: t("table.actions"),
      headerClassName: "w-[115px] text-right py-1.5 leading-6 h-auto!",
      cell: (commission) => {
        const locked = !isCommissionEditable(commission.effectiveFrom);

        return (
          <div className="flex items-center justify-end gap-1">
            <CommissionActionButton
              ariaLabel={t("aria.editCommission")}
              icon={<SquarePen className="size-4" />}
              locked={locked}
              onClick={() => onEditCommission(commission)}
            />
            <CommissionActionButton
              ariaLabel={t("aria.deleteCommission")}
              icon={<Trash2 className="size-4" />}
              locked={locked}
              onClick={() => onDeleteCommission(commission)}
            />
          </div>
        );
      },
      cellClassName: "w-[115px] px-2 py-1.5 text-right leading-6",
    },
  ];

  return (
    <AdminTable<Commission>
      data={sortedCommissions}
      columns={columns}
      getRowKey={(row) => row.id}
      striped={false}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={(key, direction) => {
        setSortKey(key);
        setSortDirection(direction);
      }}
    />
  );
}
