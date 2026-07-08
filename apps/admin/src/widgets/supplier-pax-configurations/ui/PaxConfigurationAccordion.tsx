import {
  Button,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
  PAX_TYPE_SHORT_NAME,
  useUpdateSupplierPaxTypeSchedule,
  type SupplierPaxTypeSchedule,
} from "@/entities/supplier-pax-type-schedule";
import { mapUpdateSupplierPaxTypeSchedulePayload } from "@/features/create-supplier-pax-type-schedule";
import { DatePickerGridInput, FormMessage } from "@/shared/ui";

interface PaxConfigurationAccordionProps {
  schedule: SupplierPaxTypeSchedule;
  expanded: boolean;
  onToggle: () => void;
}

function displayAge(value: number | null) {
  return value === null ? "-" : String(value);
}

const tableHeadCellClass =
  "h-9 min-h-9 border-b border-r border-t border-border-primary bg-background-secondary py-1.5 pl-4 pr-2 text-sm font-semibold leading-6 text-text-primary";
const tableBodyCellClass =
  "h-9 min-h-9 border-b border-r border-border-tertiary bg-background-primary py-1.5 pl-4 pr-2 text-sm font-medium leading-6 text-text-secondary";

interface ValidityDateControlProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  closeOnSelect?: boolean;
  popoverContentClassName?: string;
  footer?: Parameters<typeof DatePickerGridInput>[0]["footer"];
}

function ValidityDateControl({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hasError,
  closeOnSelect,
  popoverContentClassName,
  footer,
}: ValidityDateControlProps) {
  return (
    <div className="flex min-w-[220px] flex-[1_1_220px] items-center gap-3">
      <span className="shrink-0 text-sm font-semibold leading-6 text-neutral-900">
        {label}
      </span>
      <DatePickerGridInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        hasError={hasError}
        closeOnSelect={closeOnSelect}
        popoverContentClassName={popoverContentClassName}
        footer={footer}
        className="h-9 min-w-0 flex-1 gap-1.5 border-border-tertiary bg-background-primary px-3 py-1.5 text-sm font-medium leading-6 shadow-none disabled:opacity-100 [&_svg]:size-5"
      />
    </div>
  );
}

export function PaxConfigurationAccordion({
  schedule,
  expanded,
  onToggle,
}: PaxConfigurationAccordionProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [lastSchedule, setLastSchedule] = useState({
    id: schedule.id,
    validTo: schedule.validTo,
  });
  const [draftValidTo, setDraftValidTo] = useState(schedule.validTo ?? "");
  const [dateError, setDateError] = useState<string | undefined>();
  const { mutate: updateSchedule, isPending } =
    useUpdateSupplierPaxTypeSchedule();

  if (
    lastSchedule.id !== schedule.id ||
    lastSchedule.validTo !== schedule.validTo
  ) {
    setLastSchedule({ id: schedule.id, validTo: schedule.validTo });
    setDraftValidTo(schedule.validTo ?? "");
    setDateError(undefined);
  }

  const validToChanged = draftValidTo !== (schedule.validTo ?? "");

  const handleSaveValidTo = (onSuccess?: () => void) => {
    if (!validToChanged) {
      return;
    }

    if (draftValidTo && draftValidTo < schedule.validFrom) {
      setDateError(
        t("admin:validation.supplierPaxEndDateMustBeOnOrAfterStart")
      );
      return;
    }

    updateSchedule(
      mapUpdateSupplierPaxTypeSchedulePayload(schedule, draftValidTo || null),
      {
        onSuccess: () => {
          setDateError(undefined);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <div className="overflow-hidden rounded-[6px]">
      <div
        className={cn(
          "flex min-h-[60px] items-center gap-3 rounded-[6px] border border-border-tertiary bg-background-primary px-4 py-3",
          expanded && "rounded-b-none border-b-0 bg-white"
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 md:gap-6">
          <ValidityDateControl
            label={t("admin:labels.validFrom")}
            value={schedule.validFrom}
            disabled
          />
          <ValidityDateControl
            label={t("admin:labels.validTo")}
            value={draftValidTo}
            onChange={(value) => {
              setDraftValidTo(value);
              setDateError(undefined);
            }}
            placeholder={t("admin:supplierPaxConfigurations.selectDate")}
            hasError={Boolean(dateError)}
            closeOnSelect={false}
            popoverContentClassName="px-5 py-6"
            footer={({ close }) => (
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveValidTo(close)}
                isLoading={isPending}
                disabled={!validToChanged}
                className="h-9"
              >
                {t("admin:supplierPaxConfigurations.confirmAndSave")}
              </Button>
            )}
          />
        </div>
        <Button
          type="button"
          variant="outline-secondary"
          size="icon-sm"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? t("admin:supplierPaxConfigurations.collapse")
              : t("admin:supplierPaxConfigurations.expand")
          }
          className="size-9 shrink-0 bg-white"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>

      {dateError ? (
        <div className="border-x border-border-tertiary bg-destructive/10 px-4 py-3">
          <FormMessage message={dateError} />
        </div>
      ) : null}

      {expanded ? (
        <div className="rounded-b-[6px]">
          <div className="overflow-hidden">
            <Table className="min-w-[678px] table-fixed">
              <colgroup>
                <col />
                <col className="w-[138px]" />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                <col className="w-[120px]" />
              </colgroup>
              <TableHeader className="[&_tr]:border-0">
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead className={cn(tableHeadCellClass, "border-l")}>
                    {t("admin:labels.type")}
                  </TableHead>
                  <TableHead className={tableHeadCellClass}>
                    {t("admin:labels.code")}
                  </TableHead>
                  <TableHead className={tableHeadCellClass}>
                    {t("admin:labels.ageFrom")}
                  </TableHead>
                  <TableHead className={tableHeadCellClass}>
                    {t("admin:labels.ageTo")}
                  </TableHead>
                  <TableHead className={cn(tableHeadCellClass, "text-right")}>
                    {t("admin:labels.status")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.paxTypes.map((row, index) => {
                  const isLastRow = index === schedule.paxTypes.length - 1;

                  return (
                    <TableRow
                      key={row.id}
                      className="border-0 hover:bg-transparent"
                    >
                      <TableCell
                        className={cn(
                          tableBodyCellClass,
                          "border-l",
                          isLastRow && "rounded-bl-[6px]"
                        )}
                      >
                        {t(`admin:paxTypes.${row.paxType.toLowerCase()}`)}
                      </TableCell>
                      <TableCell className={tableBodyCellClass}>
                        {PAX_TYPE_SHORT_NAME[row.paxType]}
                      </TableCell>
                      <TableCell className={tableBodyCellClass}>
                        {displayAge(row.ageFrom)}
                      </TableCell>
                      <TableCell className={tableBodyCellClass}>
                        {displayAge(row.ageTo)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          tableBodyCellClass,
                          isLastRow && "rounded-br-[6px]"
                        )}
                      >
                        <div className="flex justify-end">
                          <Switch checked={row.isActive} disabled />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
