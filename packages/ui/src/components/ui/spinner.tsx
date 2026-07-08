import { cn } from "../../lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    >
      <rect x="11" y="1.75" width="2" height="5" rx="1" fill="currentColor" />
      <rect
        x="11"
        y="1.75"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.875"
        transform="rotate(45 12 12)"
      />
      <rect
        x="11"
        y="1.75"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.75"
        transform="rotate(90 12 12)"
      />
      <rect
        x="11"
        y="1.75"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.625"
        transform="rotate(135 12 12)"
      />
      <rect
        x="11"
        y="1.75"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.5"
        transform="rotate(180 12 12)"
      />
      <rect
        x="11"
        y="1.75"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.375"
        transform="rotate(225 12 12)"
      />
      <rect
        x="11"
        y="1.75"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.25"
        transform="rotate(270 12 12)"
      />
      <rect
        x="11"
        y="1.75"
        width="2"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.125"
        transform="rotate(315 12 12)"
      />
    </svg>
  );
}

export { Spinner };
