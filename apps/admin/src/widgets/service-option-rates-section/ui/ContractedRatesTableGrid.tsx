import { useTranslation } from "@sol/i18n";
import { cn } from "@sol/ui";
import type { ReactNode } from "react";

export const OUTER_GRID = "grid grid-cols-12";
export const INNER_GRID = "grid grid-cols-12";

interface CellProps {
  className?: string;
  children?: ReactNode;
}

export function Cell({ className, children }: CellProps) {
  return (
    <div className={cn("flex h-9 items-center px-3 py-2 text-sm", className)}>
      {children}
    </div>
  );
}

interface TableGridLayoutProps {
  priority: ReactNode;
  travelDates: ReactNode;
  bookingWindow: ReactNode;
  net?: ReactNode;
  rack?: ReactNode;
  sell?: ReactNode;
  containerClassName?: string;
  priorityClassName?: string;
  travelDatesClassName?: string;
  bookingWindowClassName?: string;
  netClassName?: string;
  rackClassName?: string;
  sellClassName?: string;
}

export const TableGridLayout: React.FC<TableGridLayoutProps> = ({
  priority,
  travelDates,
  bookingWindow,
  net,
  rack,
  sell,
  containerClassName,
  priorityClassName,
  travelDatesClassName,
  bookingWindowClassName,
  netClassName,
  rackClassName,
  sellClassName,
}) => {
  const { t } = useTranslation("admin");
  return (
    <div
      className={cn(
        "grid grid-cols-12 divide-x divide-gray-300",
        containerClassName
      )}
    >
      <div className={cn("col-span-1 min-w-0", priorityClassName)}>
        {priority}
      </div>
      <div className="col-span-11 grid min-w-0 grid-cols-12">
        <div
          className={cn(
            "col-span-8 flex h-full min-h-0 flex-col min-w-0",
            travelDatesClassName
          )}
        >
          {travelDates}
        </div>
        <div className={cn("col-span-4 min-w-0", bookingWindowClassName)}>
          {bookingWindow}
        </div>
        {net && rack && sell && (
          <div className="col-span-12 flex min-w-0 flex-col">
            {/* Flex (not 12-col grid) avoids subpixel gaps between Net / Rack / Sell */}
            <div className="flex min-w-0">
              <Cell
                className={cn(
                  "min-w-0 flex-1 basis-0 justify-end text-xs border-r border-b-0 font-medium text-text-secondary"
                )}
              >
                {t("labels.net")}
              </Cell>
              <Cell
                className={cn(
                  "min-w-0 flex-1 basis-0 justify-end text-xs border-r border-b-0 font-medium text-text-secondary"
                )}
              >
                {t("labels.rack")}
              </Cell>
              <Cell
                className={cn(
                  "min-w-0 flex-1 basis-0 justify-end border-r-0 border-b-0 text-xs font-medium text-text-secondary"
                )}
              >
                {t("labels.sell")}
              </Cell>
            </div>
            <div className="flex min-w-0 rounded-none! focus-within:rounded-none!">
              <div
                className={cn(
                  "min-w-0 flex-1 basis-0 border-r border-gray-300 rounded-none! focus-within:rounded-none!",
                  netClassName
                )}
              >
                {net}
              </div>
              <div
                className={cn(
                  "min-w-0 flex-1 basis-0 border-r border-gray-300 rounded-none! focus-within:rounded-none!",
                  rackClassName
                )}
              >
                {rack}
              </div>
              <div
                className={cn(
                  "min-w-0 flex-1 basis-0 rounded-none! focus-within:rounded-none!",
                  sellClassName
                )}
              >
                {sell}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
