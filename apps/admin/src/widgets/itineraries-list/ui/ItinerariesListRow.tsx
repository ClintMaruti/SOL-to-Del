import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
} from "@sol/ui";
import { Copy, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

import type {
  ItineraryListItem,
  ItineraryStatus,
  PaymentStatus,
} from "@/entities/itinerary";
import { ROUTES } from "@/shared/lib/paths";

interface ItinerariesListRowProps {
  item: ItineraryListItem;
  isLast?: boolean;
  onCopy?: (item: ItineraryListItem) => void;
}

const STATUS_BADGE: Record<
  ItineraryStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  PREPARED: { label: "Prepared", className: "bg-blue-100 text-blue-700" },
  QUOTED: { label: "Quoted", className: "bg-purple-100 text-purple-700" },
  APPROVED: { label: "Approved", className: "bg-amber-100 text-amber-700" },
  INVOICED: { label: "Invoiced", className: "bg-orange-100 text-orange-700" },
  VOUCHERED: { label: "Vouchered", className: "bg-teal-100 text-teal-700" },
  CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-700" },
  TRAVEL_IN_PROGRESS: {
    label: "In Progress",
    className: "bg-green-100 text-green-700",
  },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
  LOST: { label: "Lost", className: "bg-red-100 text-red-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  SUPERSEDED: { label: "Superseded", className: "bg-slate-100 text-slate-400" },
};

const PAYMENT_BADGE: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  UNPAID: { label: "Unpaid", className: "bg-slate-100 text-slate-600" },
  DEPOSIT_PAID: {
    label: "Deposit Paid",
    className: "bg-blue-100 text-blue-700",
  },
  PARTIALLY_PAID: {
    label: "Partial",
    className: "bg-amber-100 text-amber-700",
  },
  FULLY_PAID: { label: "Paid", className: "bg-green-100 text-green-700" },
  OVERPAID: { label: "Overpaid", className: "bg-orange-100 text-orange-700" },
  REFUND_PENDING: {
    label: "Refund Pending",
    className: "bg-purple-100 text-purple-700",
  },
};

const TERMINAL_STATUSES = new Set<ItineraryStatus>([
  "LOST",
  "CANCELLED",
  "SUPERSEDED",
]);
const CONFIRMED_STATUSES = new Set<ItineraryStatus>([
  "CONFIRMED",
  "TRAVEL_IN_PROGRESS",
  "COMPLETED",
]);

function StatusChip({ status }: { status: ItineraryStatus }) {
  const { label, className } = STATUS_BADGE[status];
  const isPulsing = status === "TRAVEL_IN_PROGRESS";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      {isPulsing && (
        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
      )}
      {label}
    </span>
  );
}

function PaymentChip({ status }: { status: PaymentStatus }) {
  const { label, className } = PAYMENT_BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      {label}
    </span>
  );
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTravelDates(from: string, to: string | null) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const fromDate = new Date(from + "T00:00:00Z");
  if (!to) return `${fmt.format(fromDate)} –`;
  const toDate = new Date(to + "T00:00:00Z");
  if (fromDate.getUTCFullYear() === toDate.getUTCFullYear()) {
    const fmtShort = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    });
    return `${fmtShort.format(fromDate)} – ${fmt.format(toDate)}`;
  }
  return `${fmt.format(fromDate)} – ${fmt.format(toDate)}`;
}

function formatRelative(isoDatetime: string) {
  const diff = Date.now() - new Date(isoDatetime).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ItinerariesListRow({
  item,
  isLast = false,
  onCopy,
}: ItinerariesListRowProps) {
  const isTerminal = TERMINAL_STATUSES.has(item.status);
  const isConfirmed = CONFIRMED_STATUSES.has(item.status);

  return (
    <TableRow
      className={cn(
        "h-[44px]! text-sm text-neutral-900 hover:bg-slate-50 transition-colors",
        isTerminal && "bg-slate-50/60 text-neutral-400",
        !isTerminal && "bg-white",
        isLast && "!border-b !border-border-tertiary"
      )}
    >
      {/* Left accent for confirmed */}
      <TableCell className="relative border-r py-2 pl-4 pr-3 font-mono text-xs">
        {isConfirmed && (
          <span className="absolute left-0 top-0 h-full w-0.5 rounded-r bg-green-500" />
        )}
        <Link
          to={
            item.status === "DRAFT"
              ? ROUTES.ITINERARY_DETAIL.replace(
                  ":id",
                  encodeURIComponent(item.id)
                )
              : `${ROUTES.ITINERARY_ITINERARIES_LIST}?itineraryId=${encodeURIComponent(item.id)}`
          }
          className="font-semibold text-[#8B1515] hover:underline"
        >
          {item.reference}
        </Link>
      </TableCell>

      <TableCell className="border-r p-2 max-w-[160px]">
        {item.title ? (
          <span className="block truncate" title={item.title}>
            {item.title}
          </span>
        ) : (
          <span className="text-neutral-400 italic">Untitled Itinerary</span>
        )}
      </TableCell>

      <TableCell className="border-r p-2">
        <div className="text-sm leading-tight">{item.agency}</div>
        {item.agent && (
          <div className="text-xs text-neutral-400 leading-tight">
            {item.agent}
          </div>
        )}
      </TableCell>

      <TableCell className="border-r p-2 text-sm">
        {item.safariPlanner}
      </TableCell>

      <TableCell className="border-r p-2 text-xs whitespace-nowrap">
        {formatTravelDates(item.travelDateFrom, item.travelDateTo)}
      </TableCell>

      <TableCell className="border-r p-2">
        <StatusChip status={item.status} />
      </TableCell>

      <TableCell className="border-r p-2">
        <PaymentChip status={item.paymentStatus} />
      </TableCell>

      <TableCell className="border-r p-2 text-right font-medium text-sm">
        {formatUsd(item.totalUsd)}
      </TableCell>

      <TableCell
        className={cn(
          "border-r p-2 text-right font-medium text-sm",
          item.balanceUsd < 0 && "text-red-600"
        )}
      >
        {formatUsd(item.balanceUsd)}
      </TableCell>

      <TableCell
        className="border-r p-2 text-xs text-neutral-500 whitespace-nowrap"
        title={new Date(item.updatedAt).toLocaleString()}
      >
        {formatRelative(item.updatedAt)}
      </TableCell>

      <TableCell className="p-2 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-7 text-neutral-400 hover:text-neutral-700"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link
                to={`${ROUTES.ITINERARY_ITINERARIES_LIST}?itineraryId=${encodeURIComponent(item.id)}`}
                className="flex items-center gap-2"
              >
                <Eye className="size-4" />
                View Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={() => onCopy?.(item)}
            >
              <Copy className="size-4" />
              Copy Itinerary
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
