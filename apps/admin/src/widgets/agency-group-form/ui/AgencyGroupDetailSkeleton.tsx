import { Skeleton } from "@sol/ui";

import { SkeletonCard } from "@/shared/ui";

export function AgencyGroupDetailSkeleton() {
  return (
    <div className="flex flex-col p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1 flex-1">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      {/* Anchor menu */}
      <div className="mt-6">
        <div className="flex gap-4 border-b">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Form content */}
      <div className="mt-6 grid gap-4 pb-24">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={6} />
      </div>

      {/* Footer actions */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}
