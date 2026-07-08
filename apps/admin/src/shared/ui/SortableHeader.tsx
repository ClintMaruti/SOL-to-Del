import { cn } from "@sol/ui";

interface SortableHeaderProps<T extends string> {
  label: string;
  field: T;
  currentField: T | null;
  currentDirection?: "asc" | "desc";
  onSort: (field: T) => void;
  className?: string;
}

export function SortableHeader<T extends string>({
  label,
  field,
  currentField,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps<T>) {
  const isActive = currentField === field;
  const ascColor =
    isActive && currentDirection === "asc" ? "currentColor" : "#99A1AF";
  const descColor =
    isActive && currentDirection === "desc" ? "currentColor" : "#99A1AF";

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2 hover:text-text-primary transition-colors text-sm font-medium text-text-secondary",
        className
      )}
      onClick={() => onSort(field)}
    >
      <span>{label}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 5.33341L4.66667 2.66675M4.66667 2.66675L7.33333 5.33341M4.66667 2.66675V13.3334"
          stroke={ascColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 10.6667L11.3333 13.3334M11.3333 13.3334L8.66667 10.6667M11.3333 13.3334V2.66675"
          stroke={descColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
