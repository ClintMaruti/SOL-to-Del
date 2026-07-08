import { Card, CardContent, CardHeader, Skeleton } from "@sol/ui";

export function PromotionConfigurationSkeleton() {
  return (
    <div className="space-y-3 p-6 pb-24">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-6 w-10 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>

      {Array.from({ length: 2 }).map((_, index) => (
        <Card
          key={index}
          className="rounded-[6px] border-border-tertiary bg-white shadow-none"
        >
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: index === 0 ? 6 : 5 }).map(
              (__, lineIndex) => (
                <Skeleton key={lineIndex} className="h-12 w-full" />
              )
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
