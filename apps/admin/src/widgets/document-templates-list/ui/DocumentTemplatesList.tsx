import { getErrorMessage } from "@sol/api-client";
import { useTranslation } from "react-i18next";

import { useDocumentTemplates } from "@/entities/document-template";
import { TableLoadingSkeleton } from "@/shared/ui";

import { useDocumentTemplatesListSort } from "../model/useDocumentTemplatesListSort";

import { DocumentTemplatesTable } from "./DocumentTemplatesTable";

export function DocumentTemplatesList() {
  const { t } = useTranslation("admin");
  const {
    data: documentTemplates = [],
    isLoading,
    error,
  } = useDocumentTemplates();
  const { sortKey, sortDirection, onSort, sortedItems } =
    useDocumentTemplatesListSort(documentTemplates);

  if (isLoading) {
    return <TableLoadingSkeleton columns={["24", "52"]} rows={10} />;
  }

  if (error) {
    return (
      <div className="text-destructive" role="alert">
        {getErrorMessage(error, t("errors.failedToLoadDocumentTemplates"))}
      </div>
    );
  }

  return (
    <DocumentTemplatesTable
      documentTemplates={sortedItems}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={onSort}
    />
  );
}
