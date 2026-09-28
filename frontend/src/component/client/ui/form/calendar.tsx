import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import Button from "@/component/client/ui/form/button";

export type RangeValue = {
  start: Date | null;
  end: Date | null;
};

type Position = "top" | "bottom" | "left" | "right";
type Size = "sm" | "md" | "lg";

interface CalendarProps {
  value?: RangeValue;
  onChange?: (value: RangeValue) => void;
  className?: string;
  position?: Position;
  size?: Size;
  showIcon?: boolean;
  disabled?: boolean;
}

const months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const days = ["일","월","화","수","목","금","토"];

const Calendar = ({
  value,
  onChange,
  className = "",
  position = "bottom",
  size = "md",
  showIcon = true,
  disabled = false,
}: CalendarProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const start = value?.start ?? null;
  const end = value?.end ?? null;

  const now = start || new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [draft, setDraft] = useState<RangeValue>({ start, end });

  const draftStart = draft.start;
  const draftEnd = draft.end;

  const sizeStyles = {
    sm: {
      input: "min-w-[220px] h-8 text-xs",
      calendar: "w-60 p-2 text-xs",
      dayHeight: "h-7",
      icon: "w-3.5 h-3.5",
      textSize: "text-[10px]",
    },
    md: {
      input: "min-w-[240px] h-10 text-sm",
      calendar: "w-72 p-3 text-sm",
      dayHeight: "h-8",
      icon: "w-4 h-4",
      textSize: "text-[12px]",
    },
    lg: {
      input: "min-w-[300px] h-12 text-base",
      calendar: "w-80 p-4 text-base",
      dayHeight: "h-10",
      icon: "w-5 h-5",
      textSize: "text-[14px]",
    },
  }[size];

  const prevMonth = () => {
    let y = viewYear;
    let m = viewMonth - 1;
    if (m < 0) { m = 11; y -= 1; }
    setViewYear(y);
    setViewMonth(m);
  };

  const nextMonth = () => {
    let y = viewYear;
    let m = viewMonth + 1;
    if (m > 11) { m = 0; y += 1; }
    setViewYear(y);
    setViewMonth(m);
  };

  const getDates = () => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);
    const dates: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i += 1) dates.push(null);
    for (let d = 1; d <= last.getDate(); d += 1) dates.push(new Date(viewYear, viewMonth, d));
    return dates;
  };

  const dates = getDates();

  const handlePick = (picked: Date) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraft({ start: picked, end: null });
      return;
    }
    if (picked < draftStart) {
      setDraft({ start: picked, end: draftStart });
    } else {
      setDraft({ start: draftStart, end: picked });
    }
  };

  const isInRange = (date: Date) => {
    if (!draftStart || !draftEnd) return false;
    return date >= draftStart && date <= draftEnd;
  };

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return a.toDateString() === b.toDateString();
  };

  const format = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const formatOrStartPlaceholder = (d: Date | null) => d ? format(d) : "2026-01-01";
  const formatOrEndPlaceholder = (d: Date | null) => d ? format(d) : "2026-12-31";

  const displayText = () => `${formatOrStartPlaceholder(start)} ~ ${formatOrEndPlaceholder(end)}`;

  const getPositionClass = () => {
    if (position === "top") return "bottom-full mb-2 left-0";
    if (position === "left") return "right-full mr-2 top-0";
    if (position === "right") return "left-full ml-2 top-0";
    return "top-full mt-2 left-0";
  };

  const popupPositionClass = getPositionClass();

  const handleToggleOpen = () => {
    if (disabled) return;
    const nextOpen = !open;
    if (!open && nextOpen) setDraft({ start, end });
    setOpen(nextOpen);
  };

  const handleCancel = () => {
    onChange?.({ start: null, end: null });
    setDraft({ start: null, end: null });
    setOpen(false);
  };

  const handleConfirm = () => {
    const confirmed = draft.start && !draft.end
      ? { start: draft.start, end: draft.start }
      : draft;
    onChange?.(confirmed);
    setOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`
          ${sizeStyles.input}
          border border-line px-3 rounded-md bg-input-bg flex items-center gap-2
          text-sm text-text-main
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-bg-hover"}
        `}
      >
        {showIcon && (
          <CalendarIcon className={`${sizeStyles.icon} text-text-sub`} />
        )}
        <span
          className={`flex-1 text-center whitespace-nowrap
          ${!start && !end && "text-text-placeholder"}
          `}
        >
          {displayText()}
        </span>
      </button>

      {open && (
        <div
          className={`
            absolute z-10 bg-bg-card border border-line rounded-lg shadow-lg
            ${sizeStyles.calendar}
            ${popupPositionClass}
          `}
        >
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-bg-hover"
            >
              <ChevronLeft className={sizeStyles.icon} />
            </button>

            <div className="font-semibold text-text-main">
              {viewYear}년 {months[viewMonth]}
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded hover:bg-bg-hover"
            >
              <ChevronRight className={sizeStyles.icon} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-text-sub mb-1">
            {days.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 text-center gap-y-1">
            {dates.map((d, i) => {
              if (!d) return <div key={i} className={sizeStyles.dayHeight} />;

              const selectedStart = isSameDay(d, draftStart);
              const selectedEnd = isSameDay(d, draftEnd);
              const inRange = isInRange(d);

              let classes = `${sizeStyles.dayHeight} flex items-center justify-center`;

              if (selectedStart && selectedEnd) {
                classes += " bg-primary text-text-inverse rounded-md";
              } else if (selectedStart) {
                classes += " bg-primary text-text-inverse rounded-l-md";
              } else if (selectedEnd) {
                classes += " bg-primary text-text-inverse rounded-r-md";
              } else if (inRange) {
                classes += " bg-primary/20";
              } else {
                classes += " hover:bg-bg-hover";
              }

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePick(d)}
                  className={classes}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-line">
            <Button variant="sub2" size="sm" onClick={handleCancel}>
              <span className={sizeStyles.textSize}>취소</span>
            </Button>
            <Button variant="main" size="sm" onClick={handleConfirm}>
              <span className={sizeStyles.textSize}>확인</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
