import { getErrorMessage } from "@sol/api-client";
import { Button } from "@sol/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useSupplierExtras } from "@/entities/catalog-extra";
import { CreateExtraModal } from "@/features/create-extra";
import { TableLoadingSkeleton } from "@/shared/ui";
import { ExtrasTable, useExtrasListSort } from "@/widgets/extras-table";

interface SupplierExtrasListProps {
  supplierId: string | undefined;
}

export function SupplierExtrasList({ supplierId }: SupplierExtrasListProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [createOpen, setCreateOpen] = useState(false);
  const {
    data: extras = [],
    isLoading: extrasLoading,
    error,
  } = useSupplierExtras(supplierId ?? null);

  const { sortState, handleSort, sortedExtras } = useExtrasListSort(extras);

  const isLoading = extrasLoading;
  const canRender = !extrasLoading && !error;

  if (!supplierId) {
    return null;
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base text-neutral-900 font-bold leading-6 mb-1">
            {t("sections.extras")}
          </h2>
          <p className="text-sm text-neutral-600 font-medium leading-6">
            {t("sections.extrasDescription")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setCreateOpen(true)}
        >
          {t("buttons.createExtra")}
        </Button>
      </div>

      {isLoading ? (
        <TableLoadingSkeleton columns={["14", "14", "24", "8"]} />
      ) : null}

      {error ? (
        <div className="text-destructive">
          {getErrorMessage(error, t("errors.failedToLoadExtras"))}
        </div>
      ) : null}

      {canRender && extras.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("empty.noExtras")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("empty.noExtrasDescription")}
          </p>
        </div>
      ) : null}

      {canRender && extras.length > 0 ? (
        <ExtrasTable
          variant="supplier"
          supplierId={supplierId}
          extras={sortedExtras}
          sortState={sortState}
          onSort={handleSort}
        />
      ) : null}

      <CreateExtraModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        supplierId={supplierId}
      />
    </div>
  );
}
