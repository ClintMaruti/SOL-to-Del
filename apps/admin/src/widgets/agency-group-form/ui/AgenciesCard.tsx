import { Button, Card, CardContent, CardHeader, CardTitle } from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAgencies } from "@/entities/agency/api/useAgencies";
import { useToggleAgencyStatus } from "@/entities/agency/api/useToggleAgencyStatus";
import type { Agency } from "@/entities/agency/model/types";
import { hasSupplierXeroId } from "@/shared/lib/supplierXeroId";
import { agencyDetailPath } from "@/shared/lib/paths";
import { DropdownMultiSelect } from "@/shared/ui";
import type { AnyFormApi } from "@/shared/ui/form";

import { AgencyListTable } from "./AgencyListTable";

const EMPTY_AGENCY_IDS: string[] = [];

interface AgenciesCardProps {
  form: AnyFormApi;
  agencyGroupId?: string;
  /** Optional prop that overrides the useAgencies hook data (useful for testing and controlled usage). */
  agencies?: Agency[];
}

export function AgenciesCard({
  form,
  agencyGroupId,
  agencies: agenciesProp,
}: AgenciesCardProps) {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const { mutate: toggleAgencyStatus } = useToggleAgencyStatus();
  const { data: agenciesData = [] } = useAgencies();
  const agencies = agenciesProp ?? agenciesData;
  const [selectedAgencyIdsToAdd, setSelectedAgencyIdsToAdd] = useState<
    string[]
  >([]);
  const [membershipError, setMembershipError] = useState<string | undefined>();

  const agencyIds = useStore(
    form.store,
    (state: unknown) =>
      ((state as { values?: { agencies?: string[] } }).values?.agencies ??
        EMPTY_AGENCY_IDS) as string[]
  );
  const selectedAgencies = useMemo(
    () => agencies?.filter((a) => agencyIds?.includes(a.id)) ?? [],
    [agencies, agencyIds]
  );
  const availableAgencyOptions = useMemo(
    () =>
      agencies
        .filter((agency) => !agencyIds.includes(agency.id))
        .sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
        )
        .map((agency) => ({
          value: agency.id,
          label: agency.name,
        })),
    [agencies, agencyIds]
  );
  const availableAgencyIds = useMemo(
    () => new Set(availableAgencyOptions.map((option) => option.value)),
    [availableAgencyOptions]
  );
  const selectedAvailableAgencyIdsToAdd = useMemo(
    () => selectedAgencyIdsToAdd.filter((id) => availableAgencyIds.has(id)),
    [availableAgencyIds, selectedAgencyIdsToAdd]
  );

  const handleToggleStatus = (agency: Agency, checked: boolean) => {
    if (checked && !hasSupplierXeroId(agency.kenXeroId)) {
      return;
    }
    toggleAgencyStatus({
      agencyId: agency.id,
      activate: checked,
    });
  };

  const handleAddAgency = () => {
    if (!selectedAvailableAgencyIdsToAdd.length) return;
    setMembershipError(undefined);
    form.setFieldValue("agencies", [
      ...agencyIds.filter(
        (id) => !selectedAvailableAgencyIdsToAdd.includes(id)
      ),
      ...selectedAvailableAgencyIdsToAdd,
    ]);
    setSelectedAgencyIdsToAdd([]);
  };

  const handleRemoveMembership = (agency: Agency) => {
    if (!agencyGroupId) return;
    if ((agency.agencyGroupIds ?? []).length <= 1) {
      setMembershipError(
        t("validation.agencyMustHaveAtLeastOneGroup", { name: agency.name })
      );
      return;
    }
    setMembershipError(undefined);
    form.setFieldValue(
      "agencies",
      agencyIds.filter((id) => id !== agency.id)
    );
  };

  const handleAgencyClick = (agency: Agency) => {
    navigate(agencyDetailPath(agency.id));
  };

  return (
    <Card id="agencies" className="rounded-md p-6">
      <CardHeader className="p-0 mb-2 flex flex-row items-center justify-between">
        <div className="flex-1">
          <CardTitle className="text-base font-bold leading-6 text-neutral-900 mb-1">
            {t("sections.agencyGroupAgencies")}
          </CardTitle>
          <p className="text-sm text-neutral-600 font-medium leading-6">
            {t("sections.agencyGroupAgenciesDescription")}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="min-w-0 flex-1">
            <DropdownMultiSelect
              id="agencyGroupAgency"
              options={availableAgencyOptions}
              value={selectedAvailableAgencyIdsToAdd}
              onValueChange={setSelectedAgencyIdsToAdd}
              isSearchable
              placeholder={t("placeholders.selectAgencies")}
              searchPlaceholder={t("placeholders.searchAgency")}
              emptyMessage={t("empty.noAgencies")}
              searchAriaLabel={t("placeholders.searchAgency")}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddAgency}
            disabled={!selectedAvailableAgencyIdsToAdd.length}
          >
            {t("buttons.add")}
          </Button>
        </div>
        {membershipError ? (
          <p className="text-sm font-medium text-destructive">
            {membershipError}
          </p>
        ) : null}
        <AgencyListTable
          agencies={selectedAgencies}
          onRemove={handleRemoveMembership}
          onToggleStatus={handleToggleStatus}
          onAgencyClick={handleAgencyClick}
        />
      </CardContent>
    </Card>
  );
}
