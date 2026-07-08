import { Skeleton } from "@sol/ui";

import { SkeletonCard } from "@/shared/ui";

export function SupplierDetailSkeleton() {
  return (
    <div className="flex flex-col p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1 flex-1">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      {/* Meta strip */}
      <div className="mt-4 -mb-2">
        <div className="flex gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-4">
        <div className="flex gap-2 border-b">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Main content - using SkeletonCard */}
      <div className="mt-6 grid gap-4">
        <SkeletonCard lines={5} />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={6} />
      </div>
    </div>
  );
}
