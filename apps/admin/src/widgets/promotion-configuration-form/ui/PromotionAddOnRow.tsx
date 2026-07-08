import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableCell,
  TableRow,
} from "@sol/ui";
import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PromotionFormAddOnItem } from "@/entities/promotion";
import type { ServiceType } from "@/entities/service-type";
import { FormField, type AnyFormApi } from "@/shared/ui";

interface PromotionAddOnRowProps {
  form: AnyFormApi;
  actionIndex: number;
  item: PromotionFormAddOnItem;
  itemIndex: number;
  serviceTypes: ServiceType[];
  onRemove: () => void;
}

function getOtherServiceTypeId(serviceTypes: ServiceType[]) {
  return (
    serviceTypes.find((serviceType) => {
      const candidates = [
        serviceType.displayName,
        serviceType.name,
        serviceType.code,
      ];

      return candidates.some(
        (candidate) => String(candidate).trim().toLowerCase() === "other"
      );
    })?.id ?? null
  );
}

function isPersistedAddOnItem(item: PromotionFormAddOnItem) {
  return item.version != null || item.actionVersion != null;
}

export function PromotionAddOnRow({
  form,
  actionIndex,
  item,
  itemIndex,
  serviceTypes,
  onRemove,
}: PromotionAddOnRowProps) {
  const { t } = useTranslation(["admin", "common"]);
  const otherServiceTypeId = getOtherServiceTypeId(serviceTypes);

  useEffect(() => {
    if (
      !otherServiceTypeId ||
      item.serviceTypeId ||
      isPersistedAddOnItem(item)
    ) {
      return;
    }

    form.setFieldValue(
      `actions[${actionIndex}].items[${itemIndex}].serviceTypeId`,
      otherServiceTypeId
    );
  }, [
    actionIndex,
    form,
    item.actionVersion,
    item.serviceTypeId,
    item.version,
    itemIndex,
    otherServiceTypeId,
  ]);

  return (
    <TableRow className="bg-white hover:bg-transparent">
      <TableCell className="border-r border-border-tertiary p-0 align-top">
        <FormField
          form={form}
          name={`actions[${actionIndex}].items[${itemIndex}].serviceTypeId`}
          hideError
        >
          {(field) => (
            <Select
              value={
                (field.state.value as string | null | undefined) ?? undefined
              }
              onValueChange={field.handleChange}
            >
              <SelectTrigger
                useFilledCaretIcon
                className="h-9 w-full rounded-none border-none bg-white pl-4 pr-2 shadow-none focus-visible:rounded-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((serviceType) => (
                  <SelectItem key={serviceType.id} value={serviceType.id}>
                    {serviceType.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      </TableCell>
      <TableCell className="border-r border-border-tertiary p-0 align-top">
        <FormField
          form={form}
          name={`actions[${actionIndex}].items[${itemIndex}].value`}
          hideError
        >
          {(field) => (
            <Input
              id={field.name}
              value={field.state.value as string}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t("placeholders.addOn")}
              className="h-9 rounded-none border-none bg-white pl-4 pr-2 shadow-none focus-visible:rounded-none"
            />
          )}
        </FormField>
      </TableCell>
      <TableCell className="w-[85px] p-0 pr-2 text-right align-top">
        <Button
          type="button"
          variant="ghost"
          size="icon-md"
          className="text-brand-red hover:text-destructive"
          onClick={onRemove}
          aria-label={t("admin:buttons.remove")}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
