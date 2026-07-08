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

import type { Supplier } from "@/entities/suppliers/model/types";
import { useHighlightMatch } from "@/shared/hooks";
import { parsePhoneForDisplay, ROUTES } from "@/shared/lib";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { ActiveStatusSwitchWithXeroGate, CopyableCell } from "@/shared/ui";

interface SupplierListRowProps {
  isEven: boolean;
  searchQuery: string;
  supplier: Supplier;
  onSupplierClick?: (supplier: Supplier) => void;
  onToggleStatus?: (supplier: Supplier, checked: boolean) => void;
  onDelete?: (supplier: Supplier) => void;
}

export function SupplierListRow({
  isEven,
  searchQuery,
  supplier,
  onSupplierClick,
  onToggleStatus,
  onDelete,
}: SupplierListRowProps) {
  const { t } = useTranslation("admin");
  const name = useHighlightMatch(supplier.name, searchQuery);
  const code = useHighlightMatch(supplier.code ?? "", searchQuery);
  const headOffice = useHighlightMatch(
    supplier.headOfficeName ?? "",
    searchQuery
  );
  const location = supplier.locationName ?? t("placeholders.dash");
  const { value: phoneDisplay, isPresent: hasDisplayablePhone } =
    parsePhoneForDisplay(supplier.phone);
  const { suppliersStatus } = useLoadingStates(
    useShallow((state) => ({ suppliersStatus: state.suppliersStatus }))
  );
  return (
    <TableRow
      className={cn(
        isEven ? "bg-gray-50" : "bg-white",
        "h-[40px]! text-neutral-900 text-sm font-medium"
      )}
      key={supplier.id}
    >
      <TableCell className="border-r pl-4 pr-2 py-2">
        <button
          type="button"
          className="text-blue-500 hover:underline font-medium text-left text-sm"
          onClick={() => onSupplierClick?.(supplier)}
        >
          {name}
        </button>
      </TableCell>
      <TableCell className="border-r p-2">
        <Link
          to={`${ROUTES.SUPPLIER_HEAD_OFFICES}?search=${encodeURIComponent(supplier.headOfficeName || "")}`}
          className="text-blue-500 hover:underline font-medium text-left text-sm"
        >
          {headOffice}
        </Link>
      </TableCell>
      <TableCell className="border-r p-2">{code}</TableCell>
      <TableCell className="border-r p-2">{location}</TableCell>
      <TableCell className="border-r p-2 max-w-0">
        <CopyableCell
          value={supplier.email ?? ""}
          cellId={`${supplier.id}-email`}
        />
      </TableCell>
      <TableCell className="border-r p-2 max-w-0">
        {hasDisplayablePhone ? (
          <CopyableCell value={phoneDisplay} cellId={`${supplier.id}-phone`} />
        ) : (
          <span className="truncate">{t("placeholders.dash")}</span>
        )}
      </TableCell>
      <TableCell className="border-r border-border p-2 align-middle">
        <div className="flex min-h-9 items-center justify-end">
          <ActiveStatusSwitchWithXeroGate
            xeroId={supplier.xeroId}
            checked={supplier.isActive}
            onCheckedChange={(checked) => onToggleStatus?.(supplier, checked)}
            ariaLabel={t("aria.toggleActiveStatus", { name: supplier.name })}
            size="sm"
            loading={suppliersStatus[supplier.id]}
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
                aria-label={t("aria.actionsFor", { name: supplier.name })}
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
                onClick={() => onDelete?.(supplier)}
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
