import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ComponentCondition } from "@/entities/service-option-rate-plan";
import { FormField, type AnyFormApi } from "@/shared/ui";

const FIELDS = [
  "ageFrom",
  "ageTo",
  "paxFrom",
  "paxTo",
  "unitFrom",
  "unitTo",
  "nightFrom",
  "nightTo",
] as const;

interface ComponentConditionsTableProps {
  form: AnyFormApi;
  fieldPrefix: string;
  htmlIdPrefix?: string;
  conditions: ComponentCondition[];
  actionsLocked?: boolean;
  actionsLockedTitle?: string;
}

export function ComponentConditionsTable({
  form,
  fieldPrefix,
  htmlIdPrefix,
  conditions,
  actionsLocked = false,
  actionsLockedTitle,
}: ComponentConditionsTableProps) {
  const { t } = useTranslation("admin");

  const removeRow = (index: number) => {
    form.setFieldValue(
      fieldPrefix,
      conditions.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="overflow-x-auto rounded-[6px] border border-border">
      <Table className="w-full min-w-[48rem] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {FIELDS.map((field, idx) => (
              <TableHead
                key={field}
                className={cn(
                  "h-9 w-[11%] bg-gray-300 text-sm font-semibold text-neutral-900",
                  field === "nightFrom" || field === "nightTo"
                    ? "px-2 text-center"
                    : "pl-4 pr-2 text-left",
                  idx > 0 && "border-l border-border"
                )}
              >
                {t(`labels.${field}`)}
              </TableHead>
            ))}
            <TableHead className="h-9 w-[12%] border-l border-border bg-gray-300 pl-4 pr-2 text-right text-sm font-semibold text-neutral-900">
              {t("labels.action")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conditions.map((cond, i) => {
            const rowPrefix = `${fieldPrefix}[${i}]`;
            return (
              <TableRow
                key={cond.id}
                className="border-b border-border bg-white last:border-b-0 hover:bg-transparent"
              >
                {FIELDS.map((field, idx) => (
                  <TableCell
                    key={field}
                    className={cn(
                      "p-0",
                      idx > 0 && "border-l border-border",
                      (field === "nightFrom" || field === "nightTo") &&
                        "text-center"
                    )}
                  >
                    <FormField
                      form={form}
                      name={`${rowPrefix}.${field}`}
                      htmlIdPrefix={htmlIdPrefix}
                      hideError
                      className="w-full"
                    >
                      {(fieldApi) => (
                        <Input
                          type="number"
                          squareFocus
                          className={cn(
                            "h-9 w-full rounded-none border-none bg-white text-sm shadow-none hover:bg-gray-50 focus:border focus:border-brand-red focus-visible:ring-2! focus-visible:ring-inset focus-visible:ring-brand-red! focus-visible:ring-offset-0! [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                            field === "nightFrom" || field === "nightTo"
                              ? "px-2 text-center"
                              : "pl-4 pr-2 text-left"
                          )}
                          value={(fieldApi.state.value as number | null) ?? ""}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            fieldApi.handleChange(
                              e.target.value === "" || Number.isNaN(n)
                                ? null
                                : n
                            );
                          }}
                          onBlur={fieldApi.handleBlur}
                        />
                      )}
                    </FormField>
                  </TableCell>
                ))}
                <TableCell className="border-l border-border p-0">
                  <div className="flex h-9 items-center justify-end pl-4 pr-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-brand-red hover:text-destructive"
                      disabled={actionsLocked}
                      title={actionsLocked ? actionsLockedTitle : undefined}
                      onClick={() => removeRow(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
