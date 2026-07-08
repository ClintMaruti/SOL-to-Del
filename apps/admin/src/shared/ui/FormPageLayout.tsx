import { Button } from "@sol/ui";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { scrollToSection } from "@/shared/lib";
import { FormMessage } from "@/shared/ui/form";

import { ActiveZoneOverlay } from "./ActiveZoneOverlay";
import type { SectionAnchorItem } from "./SectionAnchorMenu";
import { SectionAnchorMenu } from "./SectionAnchorMenu";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";

export const FORM_PAGE_FOOTER_HEIGHT = 72;

const LAYOUT_RESERVED_FOOTER_HEIGHT_VAR = "--layout-reserved-footer-height";

export interface FormPageActionButtonsProps {
  formId: string;
  submitButtonLabel: string;
  isPending: boolean;
  isSubmitDisabled?: boolean;
  onCancel: () => void;
  /** Optional Delete button (rendered first when provided). */
  onDelete?: () => void;
  isDeletePending?: boolean;
}

export function FormPageActionButtons({
  formId,
  submitButtonLabel,
  isPending,
  isSubmitDisabled = false,
  onCancel,
  onDelete,
  isDeletePending = false,
}: FormPageActionButtonsProps) {
  const { t } = useTranslation(["common", "admin"]);
  const disableAll = isPending || isDeletePending;

  return (
    <>
      {onDelete && (
        <Button
          type="button"
          variant="danger"
          onClick={onDelete}
          disabled={disableAll}
        >
          {t("common:buttons.delete")}
        </Button>
      )}
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={disableAll}
      >
        {t("common:buttons.cancel")}
      </Button>
      <Button
        type="submit"
        variant="primary"
        form={formId}
        disabled={disableAll || isSubmitDisabled}
        isLoading={isPending}
        aria-label={isPending ? submitButtonLabel : undefined}
      >
        {submitButtonLabel}
      </Button>
    </>
  );
}

export interface FormPageLayoutProps {
  title?: string;
  description?: string;
  formId: string;
  submitButtonLabel: string;
  isPending: boolean;
  isSubmitDisabled?: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;

  sections: readonly SectionAnchorItem[];
  activeSectionId: string | null;
  /** Called when a spy-scroll section link is clicked. Use to highlight that section immediately when the form is short. */
  onSectionClick?: (sectionId: string) => void;

  unsavedDialogOpen?: boolean;
  onUnsavedDiscard?: () => void;
  onUnsavedStay?: () => void;

  schemaError?: string;

  /** Rendered before the Cancel/Submit buttons in the header (e.g. Active toggle) */
  headerExtra?: React.ReactNode;

  /** Rendered between the page header and the form body (e.g. a metadata strip) */
  subHeader?: React.ReactNode;

  /** Tab bar rendered between subHeader and the form body */
  tabs?: React.ReactNode;
  /** Controls sidebar visibility (default true) */
  showSidebar?: boolean;
  /** Wraps children in a <form> tag (default true). Set false for non-form tab content. */
  wrapInForm?: boolean;

  /** When true, render only content area + sidebar + unsaved dialog; no header, subHeader, tabs, or footer. Caller provides chrome. */
  contentOnly?: boolean;

  children: React.ReactNode;
}

export function FormPageLayout({
  title,
  description,
  formId,
  submitButtonLabel,
  isPending,
  isSubmitDisabled = false,
  onCancel,
  onSubmit,
  sections,
  activeSectionId,
  onSectionClick,
  unsavedDialogOpen,
  onUnsavedDiscard,
  onUnsavedStay,
  schemaError,
  headerExtra,
  subHeader,
  tabs,
  showSidebar = true,
  wrapInForm = true,
  contentOnly = false,
  children,
}: FormPageLayoutProps) {
  const { t } = useTranslation("common");
  const [searchParams] = useSearchParams();
  const showActiveZoneDebug = searchParams.get("debug") === "activeZone";

  useEffect(() => {
    document.documentElement.style.setProperty(
      LAYOUT_RESERVED_FOOTER_HEIGHT_VAR,
      `${FORM_PAGE_FOOTER_HEIGHT}px`
    );
    return () => {
      document.documentElement.style.removeProperty(
        LAYOUT_RESERVED_FOOTER_HEIGHT_VAR
      );
    };
  }, []);

  // When schemaError is shown (e.g. after zod validation failure), scroll to it so the user sees the message
  useEffect(() => {
    if (!schemaError) return;
    const id = requestAnimationFrame(() => {
      scrollToSection("form-schema-error");
    });
    return () => cancelAnimationFrame(id);
  }, [schemaError]);

  const actionButtons = (
    <FormPageActionButtons
      formId={formId}
      submitButtonLabel={submitButtonLabel}
      isPending={isPending}
      isSubmitDisabled={isSubmitDisabled}
      onCancel={onCancel}
    />
  );

  const bodyContent = (
    <>
      {showActiveZoneDebug && <ActiveZoneOverlay />}
      {/* Body: form + sidebar */}
      <div className="flex gap-4 pt-6 pb-6">
        <div className="flex-1 min-w-0">
          {wrapInForm ? (
            <form id={formId} onSubmit={onSubmit} className="space-y-3">
              {children}

              {schemaError && (
                <div
                  id="form-schema-error"
                  className="rounded-md bg-destructive/10 p-3"
                  role="alert"
                >
                  <FormMessage message={schemaError} />
                </div>
              )}
            </form>
          ) : (
            children
          )}
        </div>

        {showSidebar && (
          <SectionAnchorMenu
            sections={sections}
            activeSectionId={activeSectionId}
            onSectionClick={onSectionClick}
          />
        )}
      </div>

      {/* Unsaved changes dialog: omit when contentOnly; caller (e.g. SupplierDetailPage) renders it at page level */}
      {!contentOnly &&
        unsavedDialogOpen !== undefined &&
        onUnsavedDiscard !== undefined &&
        onUnsavedStay !== undefined && (
          <UnsavedChangesDialog
            open={unsavedDialogOpen}
            onOpenChange={(open) => !open && onUnsavedStay()}
            onStay={onUnsavedStay}
            onDiscard={onUnsavedDiscard}
          />
        )}
    </>
  );

  if (contentOnly) {
    // No outer wrapper: caller (e.g. SupplierDetailLayout) provides padding. Only body + unsaved dialog.
    return <>{bodyContent}</>;
  }

  return (
    <div
      className="flex flex-col p-6"
      style={{
        paddingBottom: `calc(1.5rem + ${FORM_PAGE_FOOTER_HEIGHT}px)`,
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-6">
              {description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:justify-end">
          {headerExtra}
          <div className="flex flex-wrap justify-end gap-2">
            {actionButtons}
          </div>
        </div>
      </div>

      {/* Optional metadata strip */}
      {subHeader && <div className="mt-4 -mb-2">{subHeader}</div>}

      {/* Optional tab bar */}
      {tabs && <div className="mt-4">{tabs}</div>}

      {bodyContent}

      {/* Fixed footer */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background"
        aria-label={t("aria.formActions")}
      >
        <div className="flex flex-wrap items-center justify-end gap-2 px-6 py-4">
          {actionButtons}
        </div>
      </footer>
    </div>
  );
}
