import { Skeleton } from "@sol/ui";

export function DocumentTemplateBuilderSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-5 w-56" />
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-14" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="h-[720px] w-full rounded-md" />
        <Skeleton className="h-[520px] w-full rounded-md" />
      </div>
    </div>
  );
}
