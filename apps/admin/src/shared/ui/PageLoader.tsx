import { cn, Spinner } from "@sol/ui";

export interface PageLoaderProps {
  /** "page" = min-h-400 centered, "fullscreen" = min-h-screen centered, "inline" = spinner only */
  variant?: "page" | "fullscreen" | "inline";
  className?: string;
  /** Accessible label for screen readers. Pass to wrapper when variant is page/fullscreen. */
  "aria-label"?: string;
}

/**
 * Unified loading indicator for the admin app.
 * Use instead of duplicating Loader2/Spinner with hardcoded styles.
 */
export function PageLoader({
  variant = "page",
  className,
  "aria-label": ariaLabel,
}: PageLoaderProps) {
  const spinner = <Spinner className="size-8 text-muted-foreground" />;

  if (variant === "inline") {
    return spinner;
  }

  const wrapperClass =
    variant === "fullscreen"
      ? "flex min-h-screen items-center justify-center"
      : "flex min-h-[400px] items-center justify-center px-6";

  return (
    <div
      className={cn(wrapperClass, className)}
      role="status"
      aria-label={ariaLabel}
    >
      {spinner}
    </div>
  );
}
