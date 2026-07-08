import {
  cn,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sol/ui";

const SKELETON_ROWS = 16;

/**
 * A skeleton component for loading tables.
 * @param columns - An array of column widths in percentage.
 * @param rows - The number of rows to display. Defaults to 16.
 */
interface TableLoadingSkeletonProps {
  columns: string[];
  rows?: number;
}

export function TableLoadingSkeleton({
  columns,
  rows = SKELETON_ROWS,
}: TableLoadingSkeletonProps) {
  return (
    <div className="rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 border-b-0!">
            {columns.map((column, index) => {
              const width = `w-[${column}%]`;
              return (
                <TableHead
                  key={`${column}-${index}-header`}
                  className={cn("px-0", width)}
                >
                  <Skeleton className="h-9 w-full" />
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index} className="border-b-0!">
              {columns.map((column, index) => (
                <TableCell
                  key={`${column}-${index}-cell`}
                  className="px-0 py-[2.5px]"
                >
                  <Skeleton className="h-9 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
