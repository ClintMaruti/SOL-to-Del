import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from "@sol/ui";
import { MoreVertical } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import type { Agency } from "@/entities/agency/model/types";
import { useSourceMarkets } from "@/entities/source-market/api/useSourceMarkets";
import { ROUTES } from "@/shared/lib/paths";
import { ActiveStatusSwitchWithXeroGate } from "@/shared/ui";
import { useLoadingStates } from "@/shared/stores/loadingStates";

interface AgencyListTableRowProps {
  isEven: boolean;
  agency: Agency;
  onRemove?: (agency: Agency) => void;
  onToggleStatus?: (agency: Agency, checked: boolean) => void;
  onAgencyClick?: (agency: Agency) => void;
}

export function AgencyListTableRow({
  isEven,
  agency,
  onRemove,
  onToggleStatus,
  onAgencyClick,
}: AgencyListTableRowProps) {
  const { t } = useTranslation("admin");
  const { data: sourceMarkets = [] } = useSourceMarkets();
  const { agenciesStatus } = useLoadingStates(
    useShallow((state) => ({ agenciesStatus: state.agenciesStatus }))
  );
  const sourceMarketDisplay = useMemo(() => {
    const raw = agency.sourceMarketId ?? "";
    if (!raw) return "";
    const lower = raw.toLowerCase();
    const sm = sourceMarkets.find(
      (m) =>
        m.id === raw ||
        m.id.toLowerCase() === lower ||
        (m.code && (m.code === raw || m.code.toLowerCase() === lower)) ||
        m.name === raw ||
        m.name.toLowerCase() === lower
    );
    return sm?.code ?? sm?.name ?? raw;
  }, [sourceMarkets, agency.sourceMarketId]);

  return (
    <TableRow
      className={cn(
        isEven ? "bg-gray-50" : "bg-white",
        "h-[40px]! text-neutral-900 text-sm font-medium"
      )}
      key={agency.id}
    >
      <TableCell className="border-r pl-4 pr-2 py-2">
        <button
          type="button"
          className="text-blue-500 hover:underline font-medium text-left text-sm cursor-pointer"
          onClick={() => onAgencyClick?.(agency)}
        >
          {agency.name}
        </button>
      </TableCell>
      <TableCell className="border-r p-2">
        {agency?.agentsCount && agency.agentsCount > 0 ? (
          <Link
            to={`${ROUTES.AGENTS}?search=${encodeURIComponent(agency.name || "")}`}
            className="text-blue-500 hover:underline font-medium text-left text-sm"
          >
            {agency.agentsCount === 1
              ? t("tableHeaders.agentCountFormat", {
                  count: agency.agentsCount,
                })
              : t("tableHeaders.agentsCountFormat", {
                  count: agency.agentsCount,
                })}
          </Link>
        ) : (
          <span className="text-sm font-medium text-left text-neutral-300">
            {t("tableHeaders.agentsCountFormat", { count: agency.agentsCount })}
          </span>
        )}
      </TableCell>
      <TableCell className="border-r p-2">{sourceMarketDisplay}</TableCell>
      <TableCell className="border-r p-2 align-middle">
        <div className="flex justify-end">
          <ActiveStatusSwitchWithXeroGate
            variant="agency"
            xeroId={agency.kenXeroId}
            checked={agency.isActive}
            onCheckedChange={(checked) => onToggleStatus?.(agency, checked)}
            ariaLabel={t("aria.toggleActiveStatus", { name: agency.name })}
            size="sm"
            loading={agenciesStatus[agency.id]}
          />
        </div>
      </TableCell>
      <TableCell className="p-2 align-middle">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={t("aria.actionsFor", { name: agency.name })}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-sm shadow-none border-gray-200 px-1"
            >
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onRemove?.(agency)}
                className="py-1.5 px-2 text-sm font-medium"
              >
                {t("buttons.remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
