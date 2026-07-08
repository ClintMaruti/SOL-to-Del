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
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import type { Agency } from "@/entities/agency/model/types";
import { useHighlightMatch } from "@/shared/hooks";
import { agencyDetailPath, ROUTES } from "@/shared/lib/paths";
import { ActiveStatusSwitchWithXeroGate, AgencyGroupLinks } from "@/shared/ui";
import { useLoadingStates } from "@/shared/stores/loadingStates";

interface AgencyListRowProps {
  isEven: boolean;
  searchQuery: string;
  agency: Agency;
  onDelete?: (agency: Agency) => void;
  onToggleStatus?: (agency: Agency, checked: boolean) => void;
}

export function AgencyListRow({
  isEven,
  searchQuery,
  agency,
  onDelete,
  onToggleStatus,
}: AgencyListRowProps) {
  const { t } = useTranslation("admin");

  const agencyName = useHighlightMatch(agency.name, searchQuery);
  const sourceMarket = useHighlightMatch(
    agency.sourceMarketName ?? "",
    searchQuery
  );
  const assignedSafariPlanner = useHighlightMatch(
    agency.assignedSafariPlannerName ?? "",
    searchQuery
  );
  const { agenciesStatus } = useLoadingStates(
    useShallow((state) => ({ agenciesStatus: state.agenciesStatus }))
  );
  return (
    <TableRow
      className={cn(
        isEven ? "bg-gray-50" : "bg-white",
        "h-[40px]! text-neutral-900 text-sm font-medium"
      )}
      key={agency.id}
    >
      <TableCell className="border-r pl-4 pr-2 py-2">
        <Link
          to={agencyDetailPath(agency.id)}
          className="text-blue-500 hover:underline font-medium text-left text-sm"
        >
          {agencyName}
        </Link>
      </TableCell>
      <TableCell className="border-r p-2">
        {agency?.agentsCount && agency.agentsCount > 0 ? (
          <Link
            to={`${ROUTES.AGENTS}?search=${encodeURIComponent(agency.name)}`}
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
      <TableCell className="border-r p-2">
        <AgencyGroupLinks
          groups={agency.agencyGroups}
          searchQuery={searchQuery}
          fallback="N/A"
        />
      </TableCell>
      <TableCell className="border-r p-2">{sourceMarket}</TableCell>
      <TableCell className="border-r p-2">{assignedSafariPlanner}</TableCell>
      <TableCell className="border-r border-border p-2 align-middle">
        <div className="flex min-h-9 items-center justify-end">
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
      <TableCell className="p-2">
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
                onClick={() => onDelete?.(agency)}
                className="py-1.5 px-2 text-sm font-medium"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
