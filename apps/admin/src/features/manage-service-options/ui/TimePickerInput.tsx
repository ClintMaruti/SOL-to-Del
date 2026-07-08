import {
  Button,
  Input,
  Popover,
  PopoverAnchor,
  PopoverContent,
  cn,
} from "@sol/ui";
import {
  type AriaAttributes,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { canonicalize12HourTime } from "../model/scheduleApiTime";

type TimePeriod = "AM" | "PM";
type TimeParts = {
  hour: number;
  minute: number;
  period: TimePeriod;
};

const TIME_PICKER_HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const TIME_PICKER_MINUTES = Array.from({ length: 60 }, (_, index) => index);
const TIME_PICKER_PERIODS: TimePeriod[] = ["AM", "PM"];

function parseTimeParts(value: string | undefined | null): TimeParts {
  const canonical = canonicalize12HourTime(String(value ?? ""));
  const match = /^(\d{1,2}):(\d{2})\s(AM|PM)$/.exec(canonical);

  if (!match) {
    return { hour: 12, minute: 0, period: "AM" };
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
    period: match[3] as TimePeriod,
  };
}

function formatTimeParts(parts: TimeParts) {
  return `${parts.hour}:${String(parts.minute).padStart(2, "0")} ${parts.period}`;
}

function handleTimeGridWheel(event: WheelEvent) {
  if (event.deltaY === 0) return;
  if (!(event.currentTarget instanceof HTMLDivElement)) return;

  const target = event.currentTarget;
  const previousScrollTop = target.scrollTop;
  target.scrollTop += event.deltaY;

  if (target.scrollTop !== previousScrollTop) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function useScrollableTimeGrid() {
  const dragStateRef = useRef({
    active: false,
    dragged: false,
    pointerId: -1,
    scrollTop: 0,
    startY: 0,
  });
  const wheelCleanupRef = useRef<(() => void) | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const setScrollElement = useCallback((node: HTMLDivElement | null) => {
    wheelCleanupRef.current?.();
    wheelCleanupRef.current = null;

    if (!node) return;

    node.addEventListener("wheel", handleTimeGridWheel, { passive: false });
    wheelCleanupRef.current = () => {
      node.removeEventListener("wheel", handleTimeGridWheel);
    };
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    dragStateRef.current = {
      active: true,
      dragged: false,
      pointerId: event.pointerId,
      scrollTop: event.currentTarget.scrollTop,
      startY: event.clientY,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) return;

    const deltaY = event.clientY - dragState.startY;
    if (Math.abs(deltaY) > 3) {
      dragState.dragged = true;
      setIsDragging(true);
    }

    if (dragState.dragged) {
      event.preventDefault();
      event.currentTarget.scrollTop = dragState.scrollTop - deltaY;
    }
  };

  const endPointerDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState.active || dragState.pointerId !== event.pointerId) return;

    dragState.active = false;
    setIsDragging(false);
  };

  const shouldSuppressClick = () => {
    if (!dragStateRef.current.dragged) return false;

    dragStateRef.current.dragged = false;
    return true;
  };

  return {
    isDragging,
    props: {
      ref: setScrollElement,
      onPointerCancel: endPointerDrag,
      onPointerDown: handlePointerDown,
      onPointerLeave: endPointerDrag,
      onPointerMove: handlePointerMove,
      onPointerUp: endPointerDrag,
    },
    shouldSuppressClick,
  };
}

export interface TimePickerInputProps {
  id?: string;
  name?: string;
  value: string;
  label: string;
  placeholder: string;
  className?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function TimePickerInput({
  id,
  name,
  value,
  label,
  placeholder,
  className,
  "aria-invalid": ariaInvalid,
  onChange,
  onBlur,
}: TimePickerInputProps) {
  const { t } = useTranslation("admin");
  const [open, setOpen] = useState(false);
  const hourScroll = useScrollableTimeGrid();
  const minuteScroll = useScrollableTimeGrid();
  const parts = parseTimeParts(value);

  const updateTime = (next: Partial<TimeParts>) => {
    onChange(formatTimeParts({ ...parts, ...next }));
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          onBlur?.();
        }
      }}
    >
      <PopoverAnchor asChild>
        <Input
          id={id}
          name={name}
          value={value}
          aria-invalid={ariaInvalid}
          aria-haspopup="dialog"
          aria-expanded={open}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
          onClick={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className={cn("cursor-pointer bg-white", className)}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[304px] p-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div className="grid grid-cols-[1fr_1fr_64px] gap-2">
          <div
            role="group"
            aria-label={`${label} ${t("labels.hour").toLowerCase()}`}
            className="space-y-1"
          >
            <p className="text-xs font-semibold leading-4 text-text-secondary">
              {t("labels.hour")}
            </p>
            <div
              data-time-picker-scroll="hour"
              className={cn(
                "grid max-h-[180px] cursor-grab select-none grid-cols-3 gap-1 overflow-y-auto overscroll-contain pr-1",
                hourScroll.isDragging && "cursor-grabbing"
              )}
              {...hourScroll.props}
            >
              {TIME_PICKER_HOURS.map((hour) => (
                <Button
                  key={hour}
                  type="button"
                  variant={parts.hour === hour ? "primary" : "outline"}
                  size="sm"
                  className="h-8 rounded-[4px] px-0"
                  aria-label={`${hour} ${t("labels.hour").toLowerCase()}`}
                  onClick={(event) => {
                    if (hourScroll.shouldSuppressClick()) {
                      event.preventDefault();
                      event.stopPropagation();
                      return;
                    }

                    updateTime({ hour });
                  }}
                >
                  {hour}
                </Button>
              ))}
            </div>
          </div>

          <div
            role="group"
            aria-label={`${label} ${t("labels.minute").toLowerCase()}`}
            className="space-y-1"
          >
            <p className="text-xs font-semibold leading-4 text-text-secondary">
              {t("labels.minute")}
            </p>
            <div
              data-time-picker-scroll="minute"
              className={cn(
                "grid max-h-[180px] cursor-grab select-none grid-cols-3 gap-1 overflow-y-auto overscroll-contain pr-1",
                minuteScroll.isDragging && "cursor-grabbing"
              )}
              {...minuteScroll.props}
            >
              {TIME_PICKER_MINUTES.map((minute) => (
                <Button
                  key={minute}
                  type="button"
                  variant={parts.minute === minute ? "primary" : "outline"}
                  size="sm"
                  className="h-8 rounded-[4px] px-0"
                  aria-label={`${String(minute).padStart(2, "0")} ${t("labels.minute").toLowerCase()}`}
                  onClick={(event) => {
                    if (minuteScroll.shouldSuppressClick()) {
                      event.preventDefault();
                      event.stopPropagation();
                      return;
                    }

                    updateTime({ minute });
                  }}
                >
                  {String(minute).padStart(2, "0")}
                </Button>
              ))}
            </div>
          </div>

          <div
            role="group"
            aria-label={`${label} ${t("labels.period").toLowerCase()}`}
            className="space-y-1"
          >
            <p className="text-xs font-semibold leading-4 text-text-secondary">
              {t("labels.period")}
            </p>
            <div className="grid gap-1">
              {TIME_PICKER_PERIODS.map((period) => (
                <Button
                  key={period}
                  type="button"
                  variant={parts.period === period ? "primary" : "outline"}
                  size="sm"
                  className="h-8 rounded-[4px] px-0"
                  onClick={() => updateTime({ period })}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 h-8 px-0"
          onClick={() => onChange("")}
        >
          {t("buttons.clearTime")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
