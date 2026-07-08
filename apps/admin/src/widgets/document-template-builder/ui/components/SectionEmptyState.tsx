import { cn } from "@sol/ui";
import { useTranslation } from "react-i18next";

type SectionEmptyStateProps = {
  hasError: boolean;
};

export function SectionEmptyState({ hasError }: SectionEmptyStateProps) {
  const { t } = useTranslation("admin");

  return (
    <div
      className={cn(
        "flex h-20 items-center justify-center gap-2 rounded-md border border-dashed text-sm leading-6",
        hasError
          ? "border-destructive bg-destructive/5 text-destructive"
          : "border-border-primary bg-background-primary text-text-tertiary"
      )}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 6C0 2.68629 2.68629 0 6 0H22C25.3137 0 28 2.68629 28 6V22C28 25.3137 25.3137 28 22 28H6C2.68629 28 0 25.3137 0 22V6Z"
          fill="#F3F4F6"
        />
        <path
          d="M9.33301 11.9987L7.33301 13.9987M7.33301 13.9987L9.33301 15.9987M7.33301 13.9987H20.6663M11.9997 9.33203L13.9997 7.33203M13.9997 7.33203L15.9997 9.33203M13.9997 7.33203V20.6654M15.9997 18.6654L13.9997 20.6654M13.9997 20.6654L11.9997 18.6654M18.6663 11.9987L20.6663 13.9987M20.6663 13.9987L18.6663 15.9987"
          stroke="#A1A1A1"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <span>{t("documentTemplates.builder.dragBlocksHere")}</span>
    </div>
  );
}
