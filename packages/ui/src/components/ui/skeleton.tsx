import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-linear-to-r from-background-primary to-background-secondary rounded-[6px]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
