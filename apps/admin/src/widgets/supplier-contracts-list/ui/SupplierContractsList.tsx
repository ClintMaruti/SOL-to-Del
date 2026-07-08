import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sol/ui";
import { Calendar } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

import { useSupplierContracts } from "@/entities/supplier-contract/api/useSupplierContracts";
import { useToggleSupplierContractStatus } from "@/entities/supplier-contract/api/useToggleSupplierContractStatus";
import {
  getSupplierContractAgencyGroupDisplayName,
  type SupplierContract,
} from "@/entities/supplier-contract/model/types";
import { AttachContractModal } from "@/features/create-supplier-contract";
import {
  AdminTable,
  type AdminTableColumn,
  type SortDirection,
} from "@/shared/components/Table";
import { formatDate } from "@/shared/lib/formatDate";
import { supplierContractDetailPath } from "@/shared/lib/paths";
import { useLoadingStates } from "@/shared/stores/loadingStates";
import { ConfirmDialog, TableLoadingSkeleton } from "@/shared/ui";

import { SupplierContractsListEmpty } from "./SupplierContractsListEmpty";

interface SupplierContractsListProps {
  supplierId: string;
}

function getContractSortValue(contract: SupplierContract, key: string): string {
  switch (key) {
    case "name":
      return contract.name.toLowerCase();
    case "agencyGroup":
      return getSupplierContractAgencyGroupDisplayName(contract).toLowerCase();
    case "validFrom":
      return contract.validFrom;
    case "validTo":
      return contract.validTo;
    default:
      return "";
  }
}

export function SupplierContractsList({
  supplierId,
}: SupplierContractsListProps) {
  const { t } = useTranslation("admin");
  const {
    data: contracts = [],
    isLoading,
    error,
  } = useSupplierContracts(supplierId);
  const navigate = useNavigate();
  const { mutate: toggleContractStatus, isPending: isToggling } =
    useToggleSupplierContractStatus();
  const { supplierContractsStatus } = useLoadingStates(
    useShallow((state) => ({
      supplierContractsStatus: state.supplierContractsStatus,
    }))
  );

  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const onAttachContract = () => setAttachModalOpen(true);

  const [sortKey, setSortKey] = useState<string | null>("validFrom");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [contractToActivate, setContractToActivate] =
    useState<SupplierContract | null>(null);

  const sortedContracts = useMemo(() => {
    if (!sortKey) return contracts;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...contracts].sort((a, b) => {
      const va = getContractSortValue(a, sortKey);
      const vb = getContractSortValue(b, sortKey);
      return dir * va.localeCompare(vb);
    });
  }, [contracts, sortKey, sortDirection]);

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const handleContractNameClick = (contract: SupplierContract) => {
    navigate(supplierContractDetailPath(supplierId, contract.id));
  };

  const renderDateCell = (date: string) => (
    <span className="inline-flex items-center gap-1 text-text-primary font-medium">
      <Calendar className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{formatDate(date)}</span>
    </span>
  );

  const columns: AdminTableColumn<SupplierContract>[] = [
    {
      header: t("tableHeaders.contractName"),
      sortField: "name",
      headerClassName: "w-[280px] pl-4 pr-2",
      sortableHeaderClassName: "gap-2",
      cell: (contract) => (
        <Button
          variant="link"
          className="h-auto max-w-full justify-start p-0 text-link font-medium hover:text-link/90"
          onClick={() => handleContractNameClick(contract)}
        >
          <span className="truncate">{contract.name}</span>
        </Button>
      ),
      cellClassName: "w-[280px] pl-4 pr-2",
    },
    {
      header: t("tableHeaders.agencyGroup"),
      sortField: "agencyGroup",
      headerClassName: "w-[240px] pl-4 pr-2",
      sortableHeaderClassName: "gap-2",
      cell: (contract) => {
        const agencyGroupName =
          getSupplierContractAgencyGroupDisplayName(contract);

        return (
          <span className="block truncate text-text-primary font-medium">
            {agencyGroupName === "ANY" ? t("labels.anyScope") : agencyGroupName}
          </span>
        );
      },
      cellClassName: "w-[240px] pl-4 pr-2",
    },
    {
      header: t("tableHeaders.contractLink"),
      headerClassName: "w-[280px] pl-4 pr-2",
      cell: (contract) =>
        contract.link ? (
          <a
            href={contract.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-link font-medium hover:text-link/90 hover:underline"
          >
            {contract.link}
          </a>
        ) : (
          <span className="text-text-secondary font-medium">
            {t("placeholders.dash")}
          </span>
        ),
      cellClassName: "w-[280px] pl-4 pr-2",
    },
    {
      header: t("tableHeaders.validFrom"),
      sortField: "validFrom",
      headerClassName: "w-[140px] pl-4 pr-2",
      sortableHeaderClassName: "gap-2",
      cell: (contract) => renderDateCell(contract.validFrom),
      cellClassName: "w-[140px] pl-4 pr-2",
    },
    {
      header: t("tableHeaders.validTo"),
      sortField: "validTo",
      headerClassName: "w-[140px] pl-4 pr-2",
      sortableHeaderClassName: "gap-2",
      cell: (contract) => renderDateCell(contract.validTo),
      cellClassName: "w-[140px] pl-4 pr-2",
    },
    {
      header: t("tableHeaders.status"),
      headerClassName: "w-[90px] pl-4 pr-2 text-right",
      cell: (contract) => (
        <div className="flex min-h-6 items-center justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex cursor-default">
                <Switch
                  checked={contract.isActive}
                  disabled={contract.isActive}
                  onCheckedChange={(checked) => {
                    if (checked) setContractToActivate(contract);
                  }}
                  aria-label={t("aria.toggleActiveStatus", {
                    name: contract.name,
                  })}
                  size="sm"
                  loading={supplierContractsStatus[contract.id]}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8} className="py-4">
              <p className="font-semibold text-white">
                {t("tooltips.contractStatus")}
              </p>
              <p className="text-white/90 font-normal mt-0.5">
                {t("tooltips.contractStatusDescription")}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      cellClassName: "w-[90px] pl-4 pr-2",
    },
  ];

  const canRender = !isLoading && !error;

  return (
    <div className="py-4">
      <AttachContractModal
        open={attachModalOpen}
        onOpenChange={setAttachModalOpen}
        supplierId={supplierId}
      />
      <ConfirmDialog
        open={!!contractToActivate}
        onOpenChange={(open) => !open && setContractToActivate(null)}
        title={t("modals.confirmActivateContract")}
        description={t("modals.confirmActivateContractDescription")}
        confirmLabel={t("buttons.activate")}
        isPending={isToggling}
        onConfirm={() => {
          if (!contractToActivate) return;
          toggleContractStatus(
            {
              supplierId,
              contractId: contractToActivate.id,
              isActive: false,
            },
            { onSuccess: () => setContractToActivate(null) }
          );
        }}
      />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base text-neutral-900 font-bold leading-6 mb-1">
            {t("sections.contracts")}
          </h2>
          <p className="text-sm text-neutral-600 font-medium leading-6">
            {t("sections.contractsDescription")}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onAttachContract}>
          {t("buttons.attachContract")}
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columns={["28", "18", "24", "12", "12", "6"]} />
      ) : null}

      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadContracts"))}
        </div>
      ) : null}

      {canRender && !contracts.length ? (
        <SupplierContractsListEmpty onAttachContract={onAttachContract} />
      ) : null}

      {canRender && contracts.length ? (
        <AdminTable<SupplierContract>
          data={sortedContracts}
          columns={columns}
          getRowKey={(row) => row.id}
          striped={false}
          tableClassName="table-fixed"
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      ) : null}
    </div>
  );
}
