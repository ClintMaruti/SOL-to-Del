import {
  FieldGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";
import { useStore } from "@tanstack/react-form";
import { useTranslation } from "react-i18next";

import { DatePickerGridInput } from "./DatePicker";
import type { AnyFormApi } from "./form";
import { FormField, VALIDATION_MESSAGES } from "./form";
import { fieldDomId } from "./form/fieldDomId";

type SubmitFieldMeta = Record<string, { errors?: string[] } | undefined>;

function validityFieldPaths(contractFieldName: string): {
  validFrom: string;
  validTo: string;
} {
  const dot = contractFieldName.lastIndexOf(".");
  if (dot === -1) {
    return { validFrom: "validFrom", validTo: "validTo" };
  }
  const parent = contractFieldName.slice(0, dot);
  return {
    validFrom: `${parent}.validFrom`,
    validTo: `${parent}.validTo`,
  };
}

export interface ContractSelectWithValidityRowProps {
  form: AnyFormApi;
  /** Contract options (id + display name; validity dates are passed as display props). */
  contracts: Array<{ id: string; name: string }>;
  /** TanStack field path, e.g. `contractId` or `contracted.contractId`. */
  contractFieldName: string;
  /** Namespace for DOM ids when multiple instances exist on one page. */
  htmlIdPrefix: string;
  /** Read-only contract validity start (YYYY-MM-DD or empty). */
  displayValidFrom: string;
  /** Read-only contract validity end (YYYY-MM-DD or empty). */
  displayValidTo: string;
  /**
   * When true, the select value also tracks `selectedContractId` and notifies
   * `onContractChange` (service option contract row + deep-link flows).
   */
  controlledContractSelect?: boolean;
  selectedContractId?: string | null;
  onContractChange?: (contractId: string | null) => void;
  /**
   * When false, the contract field is not required on submit (service options,
   * extras). Defaults to true when omitted for callers that still require a contract.
   */
  contractRequired?: boolean;
}

/**
 * Gray card row: contract select + read-only validity dates.
 * Shared by service option contract section and extra contracted-extra form.
 */
export function ContractSelectWithValidityRow({
  form,
  contracts,
  contractFieldName,
  htmlIdPrefix,
  displayValidFrom,
  displayValidTo,
  controlledContractSelect = false,
  selectedContractId,
  onContractChange,
  contractRequired = true,
}: ContractSelectWithValidityRowProps) {
  const { t } = useTranslation("admin");

  const { validFrom: validFromPath, validTo: validToPath } =
    validityFieldPaths(contractFieldName);

  const fieldMeta = useStore(
    form.store,
    (s) => (s as { fieldMeta?: SubmitFieldMeta }).fieldMeta
  );
  const validFromInvalid = Boolean(fieldMeta?.[validFromPath]?.errors?.length);
  const validToInvalid = Boolean(fieldMeta?.[validToPath]?.errors?.length);

  const contractTriggerId = fieldDomId(htmlIdPrefix, contractFieldName);
  const displayValidFromId = fieldDomId(
    htmlIdPrefix,
    "contract-display-valid-from"
  );
  const displayValidToId = fieldDomId(
    htmlIdPrefix,
    "contract-display-valid-to"
  );

  return (
    <div className="rounded-md bg-gray-200 p-4">
      <div className="flex flex-wrap items-start gap-4">
        <FormField
          form={form}
          name={contractFieldName}
          htmlIdPrefix={htmlIdPrefix}
          required={contractRequired}
          suppressDomId
          label={t("labels.contract")}
          className="min-w-[min(100%,22rem)] flex-1"
          validators={
            contractRequired
              ? {
                  onSubmit: ({ value }: { value: string }) => {
                    if (!value?.trim()) {
                      return VALIDATION_MESSAGES.required(t("labels.contract"));
                    }
                    return undefined;
                  },
                }
              : undefined
          }
        >
          {(field) => (
            <Select
              value={
                controlledContractSelect
                  ? (selectedContractId ?? field.state.value) || undefined
                  : field.state.value || undefined
              }
              onValueChange={(v) => {
                if (controlledContractSelect) {
                  const nextValue = v || null;
                  field.handleChange(nextValue);
                  onContractChange?.(nextValue);
                } else {
                  field.handleChange(v);
                }
              }}
            >
              <SelectTrigger id={contractTriggerId} className="w-full">
                <SelectValue placeholder={t("placeholders.selectContract")} />
              </SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        <div className="grid min-w-[min(100%,21rem)] flex-1 grid-cols-2 gap-3">
          <FieldGroup
            htmlFor={displayValidFromId}
            label={t("labels.validFrom")}
            labelClassName="opacity-50"
          >
            <DatePickerGridInput
              id={displayValidFromId}
              value={displayValidFrom}
              disabled
              placeholder=""
              hasError={validFromInvalid}
              className="opacity-50 bg-white/70"
            />
          </FieldGroup>
          <FieldGroup
            htmlFor={displayValidToId}
            label={t("labels.validTo")}
            labelClassName="opacity-50"
          >
            <DatePickerGridInput
              id={displayValidToId}
              value={displayValidTo}
              disabled
              placeholder=""
              hasError={validToInvalid}
              className="opacity-50 bg-white/70"
            />
          </FieldGroup>
        </div>
      </div>
    </div>
  );
}
