import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@sol/ui";

const GRID_TEMPLATE =
  "minmax(170px, 170fr) minmax(163px, 163fr) minmax(280px, 280fr) minmax(150px, 150fr) minmax(156px, 156fr) minmax(132px, 132fr) minmax(132px, 132fr) minmax(120px, 120fr) 90px";
const SKELETON_ROWS = 14;

export function MarginRulesTableSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-b-md border-x border-b border-border-tertiary bg-white">
      <div
        className="h-full min-h-0 overflow-auto overscroll-y-contain [&>[data-slot=table-container]]:min-w-full [&>[data-slot=table-container]]:w-fit [&>[data-slot=table-container]]:overflow-visible"
        style={{
          overflowAnchor: "none",
        }}
      >
        <Table className="w-full min-w-[1393px] border-separate border-spacing-0">
          <TableHeader className="block bg-background-secondary [&_tr]:border-b-0">
            <TableRow
              className="grid w-full border-b-0 bg-background-secondary hover:bg-transparent"
              style={{ gridTemplateColumns: GRID_TEMPLATE }}
            >
              {Array.from({ length: 9 }).map((_, index) => (
                <TableHead
                  key={`header-${index}`}
                  className={cn(
                    "h-9 px-0 py-1.5 pl-4 pr-2",
                    index === 0
                      ? "border-b border-border-primary"
                      : "border-b border-l border-border-primary"
                  )}
                >
                  <Skeleton className="h-6 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="block">
            {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
              <TableRow
                key={`row-${rowIndex}`}
                className={cn(
                  "grid w-full border-b-0 bg-white hover:bg-transparent",
                  rowIndex === 0 ? "" : "border-t border-border-tertiary"
                )}
                style={{ gridTemplateColumns: GRID_TEMPLATE }}
              >
                {Array.from({ length: 9 }).map((__, columnIndex) => (
                  <TableCell
                    key={`cell-${rowIndex}-${columnIndex}`}
                    className={cn(
                      "px-0 py-1.5 pl-4 pr-2",
                      columnIndex === 0 ? "" : "border-l border-border-tertiary"
                    )}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
