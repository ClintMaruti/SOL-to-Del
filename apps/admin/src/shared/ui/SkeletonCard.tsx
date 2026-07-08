import { Skeleton } from "@sol/ui";

interface SkeletonCardProps {
  lines?: number;
  hasAvatar?: boolean;
  hasActions?: boolean;
}

export function SkeletonCard({
  lines = 3,
  hasAvatar = false,
  hasActions = false,
}: SkeletonCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      {hasAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
      {hasActions && (
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </div>
  );
}
