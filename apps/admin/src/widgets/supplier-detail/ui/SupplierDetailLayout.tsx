import { useTranslation } from "react-i18next";

import { FORM_PAGE_FOOTER_HEIGHT } from "@/shared/ui";

export interface SupplierDetailLayoutProps {
  title: string;
  description?: string;
  headerExtra?: React.ReactNode;
  headerActions?: React.ReactNode;
  subHeader: React.ReactNode;
  tabs: React.ReactNode;
  /** When provided, render fixed footer (e.g. Cancel/Save for overview). Uses FORM_PAGE_FOOTER_HEIGHT. */
  footerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function SupplierDetailLayout({
  title,
  description,
  headerExtra,
  headerActions,
  subHeader,
  tabs,
  footerActions,
  children,
}: SupplierDetailLayoutProps) {
  const { t } = useTranslation("common");
  const hasFooter = footerActions != null;

  return (
    <div
      className="flex flex-col p-6"
      style={
        hasFooter
          ? {
              paddingBottom: `calc(1.5rem + ${FORM_PAGE_FOOTER_HEIGHT}px)`,
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground leading-6">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {headerExtra}
          {headerActions && (
            <div className="flex justify-end gap-2">{headerActions}</div>
          )}
        </div>
      </div>

      {/* Meta strip */}
      <div className="mt-4 -mb-2">{subHeader}</div>

      {/* Tab bar */}
      <div className="mt-4">{tabs}</div>

      {/* Main content */}
      {children}

      {/* Fixed footer when actions provided */}
      {hasFooter && (
        <footer
          className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background"
          aria-label={t("aria.formActions")}
        >
          <div className="flex items-center justify-end gap-2 px-6 py-4">
            {footerActions}
          </div>
        </footer>
      )}
    </div>
  );
}
