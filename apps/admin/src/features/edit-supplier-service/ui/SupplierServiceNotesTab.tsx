import { useTranslation } from "react-i18next";

import { EntityNotesField } from "@/widgets/entity-notes-field";

interface SupplierServiceNotesTabProps {
  text: string;
  onTextChange: (value: string) => void;
  disabled?: boolean;
}

export function SupplierServiceNotesTab({
  text,
  onTextChange,
  disabled,
}: SupplierServiceNotesTabProps) {
  const { t } = useTranslation("admin");

  return (
    <EntityNotesField
      id="supplier-service-notes"
      title={t("supplierServiceDetail.notes.title")}
      description={t("supplierServiceDetail.notes.description")}
      label={t("supplierServiceDetail.notes.fieldLabel")}
      placeholder={t("supplierServiceDetail.notes.placeholder")}
      value={text}
      onChange={onTextChange}
      disabled={disabled}
    />
  );
}
