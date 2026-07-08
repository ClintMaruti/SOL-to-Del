import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  TableCell,
  TableRow,
} from "@sol/ui";
import { MoreVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import type { SupplierHeadOffice } from "@/entities/supplier-head-office/model/types";
import { useHighlightMatch } from "@/shared/hooks";
import { headOfficeDetailPath, ROUTES } from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { CopyableCell } from "@/shared/ui";

interface SupplierHeadOfficesListRowProps {
  isEven: boolean;
  searchQuery: string;
  supplierHeadOffice: SupplierHeadOffice;
  onDelete?: (supplierHeadOffice: SupplierHeadOffice) => void;
  onToggleStatus?: (
    supplierHeadOffice: SupplierHeadOffice,
    isActive: boolean
  ) => void;
  onDuplicate?: (supplierHeadOffice: SupplierHeadOffice) => void;
}

export function SupplierHeadOfficesListRow({
  isEven,
  searchQuery,
  supplierHeadOffice,
  onDelete,
  onToggleStatus,
}: SupplierHeadOfficesListRowProps) {
  const { t } = useTranslation("admin");
  const headOfficeName = useHighlightMatch(
    supplierHeadOffice.name,
    searchQuery
  );
  const email = useHighlightMatch(supplierHeadOffice.email, searchQuery);
  const phone = useHighlightMatch(supplierHeadOffice.phoneNumber, searchQuery);
  const { supplierHeadOfficesStatus } = useLoadingStates(
    useShallow((state) => ({
      supplierHeadOfficesStatus: state.supplierHeadOfficesStatus,
    }))
  );
  return (
    <TableRow
      className={cn(
        isEven ? "bg-gray-50" : "bg-white",
        "h-[40px]! text-neutral-900 text-sm font-medium"
      )}
      key={supplierHeadOffice.id}
    >
      <TableCell className="border-r pl-4 pr-2 py-2">
        <Link
          to={headOfficeDetailPath(supplierHeadOffice.id)}
          className="text-blue-500 hover:underline font-medium text-left text-sm"
        >
          {headOfficeName}
        </Link>
      </TableCell>
      <TableCell className="border-r p-2">
        <Link
          to={`${ROUTES.SUPPLIERS}?headOfficeId=${encodeURIComponent(supplierHeadOffice.id)}`}
          className="text-blue-500 hover:underline font-medium text-left text-sm"
        >
          {supplierHeadOffice.suppliersCount === 1
            ? t("tableHeaders.supplierCountFormat", {
                count: supplierHeadOffice.suppliersCount,
              })
            : t("tableHeaders.suppliersCountFormat", {
                count: supplierHeadOffice.suppliersCount,
              })}
        </Link>
      </TableCell>
      <TableCell className="border-r p-2 max-w-0">
        <CopyableCell
          value={email as string}
          cellId={`${supplierHeadOffice.id}-email`}
        />
      </TableCell>
      <TableCell className="border-r p-2 max-w-0">
        <CopyableCell
          value={phone as string}
          cellId={`${supplierHeadOffice.id}-phone`}
        />
      </TableCell>
      <TableCell className="border-r border-border p-2 align-middle">
        <div className="flex min-h-9 items-center justify-end">
          <Switch
            checked={supplierHeadOffice.isActive}
            onCheckedChange={() =>
              onToggleStatus?.(
                supplierHeadOffice,
                supplierHeadOffice.isActive as boolean
              )
            }
            aria-label={t("aria.toggleActiveStatus", {
              ns: "admin",
              name: supplierHeadOffice.name,
            })}
            size="sm"
            loading={supplierHeadOfficesStatus[supplierHeadOffice.id]}
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
                aria-label={t("aria.actionsFor", {
                  name: supplierHeadOffice.name,
                })}
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
                onClick={() => onDelete?.(supplierHeadOffice)}
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
