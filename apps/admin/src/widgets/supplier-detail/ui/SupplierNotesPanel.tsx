import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Label,
  Skeleton,
  Textarea,
} from "@sol/ui";
import { useTranslation } from "react-i18next";

import type { UseSupplierNotesTabResult } from "@/features/edit-supplier";
import { FormPageActionButtons } from "@/shared/ui";

import { SupplierDetailLayout } from "./SupplierDetailLayout";

export type SupplierNotesPanelProps = {
  title: string;
  description: string;
  subHeader: React.ReactNode;
  tabs: React.ReactNode;
  notesTab: UseSupplierNotesTabResult;
  onCancel: () => void;
};

export function SupplierNotesPanel({
  title,
  description,
  subHeader,
  tabs,
  notesTab,
  onCancel,
}: SupplierNotesPanelProps) {
  const { t } = useTranslation(["admin", "common"]);
  const { text, setText, isLoading, loadError, handleSave, isPending, formId } =
    notesTab;

  return (
    <SupplierDetailLayout
      title={title}
      description={description}
      subHeader={subHeader}
      tabs={tabs}
      footerActions={
        <FormPageActionButtons
          formId={formId}
          submitButtonLabel={t("common:buttons.save")}
          isPending={isPending}
          onCancel={onCancel}
        />
      }
    >
      {loadError ? (
        <div
          className="flex min-h-[200px] items-center justify-center pt-6 text-sm text-destructive"
          role="alert"
        >
          {t("admin:errors.failedToLoadSupplierNotes")}
        </div>
      ) : isLoading ? (
        <div className="space-y-3 pt-6">
          <Skeleton className="h-8 w-48 rounded-[6px]" />
          <Skeleton className="h-24 w-full rounded-[6px]" />
        </div>
      ) : (
        <form
          id={formId}
          onSubmit={handleSave}
          className="space-y-4 pt-6"
          noValidate
        >
          <Card className="rounded-[6px]">
            <CardHeader className="space-y-1">
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {t("admin:supplierNotes.sectionTitle")}
              </h2>
              <CardDescription id="supplier-notes-help">
                {t("admin:supplierNotes.sectionDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="supplier-notes-field" className="text-sm">
                {t("admin:supplierNotes.fieldLabel")}
              </Label>
              <Textarea
                id="supplier-notes-field"
                name="supplierNotes"
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("admin:supplierNotes.fieldPlaceholder")}
                dir="auto"
                spellCheck
                className="max-w-full resize-y whitespace-pre-wrap rounded-[6px] [field-sizing:content] min-h-40 text-sm"
                aria-describedby="supplier-notes-help"
              />
            </CardContent>
          </Card>
        </form>
      )}
    </SupplierDetailLayout>
  );
}
