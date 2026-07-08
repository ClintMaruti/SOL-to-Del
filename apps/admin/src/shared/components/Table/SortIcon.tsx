export type SortDirection = "asc" | "desc";

interface SortIconProps {
  columnKey: string;
  sortKey: string | null;
  sortDirection: SortDirection;
}

export function SortIcon({ columnKey, sortKey, sortDirection }: SortIconProps) {
  const isActive = sortKey === columnKey;
  const ascColor =
    isActive && sortDirection === "asc" ? "currentColor" : "#99A1AF";
  const descColor =
    isActive && sortDirection === "desc" ? "currentColor" : "#99A1AF";

  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-hidden
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
  );
}
