import { getErrorMessage } from "@sol/api-client";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sol/ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAgencyGroups } from "@/entities/agency-group";
import { useCreateSupplierContract } from "@/entities/supplier-contract";
import { supplierContractDetailPath } from "@/shared/lib/paths";
import { optionalUrlSchema } from "@/shared/lib/validation/url";
import { DatePickerGridInput } from "@/shared/ui";
import { FormField, FormMessage, VALIDATION_MESSAGES } from "@/shared/ui/form";

import { ANY_AGENCY_GROUP_VALUE } from "../model/schema";
import { useCreateSupplierContractForm } from "../model/useCreateSupplierContractForm";

interface AttachContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
}

export function AttachContractModal({
  open,
  onOpenChange,
  supplierId,
}: AttachContractModalProps) {
  const { t } = useTranslation(["admin", "common"]);
  const {
    mutate: createSupplierContract,
    isPending,
    error: apiError,
    reset: resetMutation,
  } = useCreateSupplierContract();
  const [schemaError, setSchemaError] = useState<string | undefined>();
  const navigate = useNavigate();
  const { data: agencyGroups = [], isLoading: agencyGroupsLoading } =
    useAgencyGroups({ enabled: open });
  const activeAgencyGroups = useMemo(
    () => agencyGroups.filter((group) => group.isActive),
    [agencyGroups]
  );

  const { form } = useCreateSupplierContractForm(
    (submitData) => {
      createSupplierContract(
        { ...submitData, supplierId },
        {
          onSuccess: (data) => {
            onOpenChange(false);
            navigate(supplierContractDetailPath(supplierId, data.id));
          },
        }
      );
    },
    (message) => setSchemaError(message)
  );

  useEffect(() => {
    if (!open) {
      form.reset();
      setSchemaError(undefined);
      resetMutation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCancel = () => {
    form.reset();
    setSchemaError(undefined);
    resetMutation();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[474px]! px-5 py-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900 leading-7">
            {t("admin:modals.attachContract")}
          </DialogTitle>
          <DialogDescription className="text-neutral-600 text-sm leading-6 font-medium">
            {t("admin:modals.attachContractDescription")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSchemaError(undefined);
            form.handleSubmit();
          }}
          className="space-y-2"
        >
          <FormField
            form={form}
            name="name"
            label={t("admin:labels.contractName")}
            required
            validators={{
              onSubmit: ({ value }: { value: string }) =>
                !value.trim()
                  ? VALIDATION_MESSAGES.required(t("admin:labels.contractName"))
                  : undefined,
            }}
          >
            {(field) => (
              <Input
                id="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t("admin:placeholders.contractNameExample")}
                aria-invalid={!field.state.meta.isValid}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name="link"
            label={t("admin:labels.linkToTheFile")}
            validators={{
              onChange: optionalUrlSchema(t("admin:validation.invalidUrl")),
            }}
          >
            {(field) => (
              <Input
                id="link"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("admin:placeholders.linkToFileExample")}
              />
            )}
          </FormField>

          <FormField
            form={form}
            name="agencyGroupId"
            label={t("admin:labels.agencyGroup")}
          >
            {(field) => (
              <Select
                value={field.state.value || ANY_AGENCY_GROUP_VALUE}
                onValueChange={(value) => field.handleChange(value)}
                disabled={agencyGroupsLoading}
              >
                <SelectTrigger id="agencyGroupId" className="w-full">
                  <SelectValue
                    placeholder={t("admin:placeholders.selectAgencyGroup")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_AGENCY_GROUP_VALUE}>
                    {t("admin:labels.anyScope")}
                  </SelectItem>
                  {activeAgencyGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-2">
            <FormField
              form={form}
              name="validFrom"
              label={t("admin:labels.validFrom")}
              required
              validators={{
                onSubmit: ({ value }: { value: string }) =>
                  !value
                    ? VALIDATION_MESSAGES.required(t("admin:labels.validFrom"))
                    : undefined,
              }}
            >
              {(field) => (
                <DatePickerGridInput
                  id={field.name}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder={t("common:placeholders.selectDate")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive",
                    "bg-white/70"
                  )}
                />
              )}
            </FormField>

            <FormField
              form={form}
              name="validTo"
              label={t("admin:labels.validTo")}
              required
              validators={{
                onSubmit: ({ value }: { value: string }) =>
                  !value
                    ? VALIDATION_MESSAGES.required(t("admin:labels.validTo"))
                    : undefined,
              }}
            >
              {(field) => (
                <DatePickerGridInput
                  id={field.name}
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder={t("common:placeholders.selectDate")}
                  className={cn(
                    field.state.meta.errors.length > 0 && "border-destructive",
                    "bg-white/70"
                  )}
                />
              )}
            </FormField>
          </div>
          {(apiError || schemaError) && (
            <div className="rounded-md bg-destructive/10 p-3">
              <FormMessage
                message={
                  schemaError ??
                  getErrorMessage(
                    apiError,
                    t("admin:errors.failedToCreateContract")
                  )
                }
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isPending}
              className="bg-gray-200 hover:bg-gray-100"
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button type="submit" isLoading={isPending}>
              {t("admin:buttons.saveAndConfigure")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
