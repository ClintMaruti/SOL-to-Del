import { Skeleton } from "@sol/ui";
import { useTranslation } from "react-i18next";

const ROW_COUNT = 4;

export function ServiceOptionsTabSkeleton() {
  const { t } = useTranslation("common");

  return (
    <div
      className="overflow-hidden rounded-[6px] border border-border bg-white"
      role="status"
      aria-busy="true"
      aria-label={t("messages.loading")}
    >
      <div className="grid h-9 grid-cols-[220px_1fr_1fr_85px_115px] items-center gap-0 bg-[#e5e7eb] px-4">
        <Skeleton className="h-4 w-28 rounded-[4px]" />
        <Skeleton className="h-4 w-20 rounded-[4px]" />
        <Skeleton className="h-4 w-20 rounded-[4px]" />
        <Skeleton className="h-4 w-14 rounded-[4px]" />
        <Skeleton className="ml-auto h-4 w-16 rounded-[4px]" />
      </div>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <div
          key={index}
          className="grid min-h-12 grid-cols-[220px_1fr_1fr_85px_115px] items-center border-t border-border px-4"
        >
          <Skeleton className="h-4 w-32 rounded-[4px]" />
          <Skeleton className="h-4 w-4/5 rounded-[4px]" />
          <Skeleton className="h-4 w-3/4 rounded-[4px]" />
          <Skeleton className="h-[18px] w-8 rounded-full" />
          <div className="flex justify-end gap-2">
            <Skeleton className="size-7 rounded-[6px]" />
            <Skeleton className="size-7 rounded-[6px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
