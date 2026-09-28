import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import Button from "@/component/admin/ui/form/button";

/**
 * 날짜 범위 값 타입
 *
 * - start 또는 end가 null이면 미선택 상태
 * - Datepicker 내외부의 value 타입으로 사용됨
 */
export type RangeValue = {
  start: Date | null;
  end: Date | null;
};

/** 캘린더 팝업이 열릴 위치 */
type Position = "top" | "bottom" | "left" | "right";

/** Datepicker 크기 사이즈 */
type Size = "sm" | "md" | "lg";

interface CalendarProps {
  /**
   * 현재 선택된 날짜 범위
   *
   * - `{ start: Date | null, end: Date | null }`
   * - 둘 다 null이면 선택되지 않은 상태
   */
  value?: RangeValue;

  /**
   * 날짜 범위가 확정되었을 때 호출되는 콜백
   *
   * - "확인" 버튼을 눌렀을 때만 호출됨
   * - "취소" 시에는 `{ start: null, end: null }`로 초기화 콜백 호출
   */
  onChange?: (value: RangeValue) => void;

  /**
   * 외부 래퍼 커스텀 클래스
   *
   * - `relative inline-block` 컨테이너에 추가로 붙는 클래스
   */
  className?: string;

  /**
   * 캘린더 팝업이 열리는 방향
   *
   * - "top"    : 인풋 위쪽
   * - "bottom" : 인풋 아래쪽 (기본)
   * - "left"   : 인풋 왼쪽
   * - "right"  : 인풋 오른쪽
   */
  position?: Position;

  /**
   * Datepicker 및 캘린더의 크기
   *
   * - "sm" | "md" | "lg"
   * - 인풋 높이 / 캘린더 전체 사이즈 / 날짜 셀 높이 등에 반영
   */
  size?: Size;

  /**
   * 인풋 왼쪽에 캘린더 아이콘 표시 여부
   *
   * - true : lucide-react Calendar 아이콘 표시 (기본값)
   * - false: 아이콘 없이 텍스트만 표시
   */
  showIcon?: boolean;

  /** true면 열기·날짜 변경 불가 */
  disabled?: boolean;
}

const months = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];
const days = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * Range Datepicker 컴포넌트
 *
 * - 한 컴포넌트 안에서 시작일(start)과 종료일(end)을 선택
 * - 팝업 위치 조절 (top / bottom / left / right)
 * - 크기 조절 (sm / md / lg)
 * - 인풋 왼쪽 캘린더 아이콘 옵션(showIcon)
 *
 * @example 기본 사용
 * ```tsx
 * const [range, setRange] = useState<RangeValue>({ start: null, end: null });
 *
 * <Calendar
 *   value={range}
 *   onChange={(v) => setRange(v)}
 * />
 * ```
 *
 * @example 위치 조절
 * ```tsx
 * <Calendar position="top" />
 * ```
 *
 * @example 크기 조절
 * ```tsx
 * <Calendar size="lg" />
 * ```
 *
 * @example 아이콘 숨기기
 * ```tsx
 * <Calendar showIcon={false} />
 * ```
 */
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

  // 초기 보이는 월은 start 기준, 없으면 오늘 기준
  const now = start || new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  /**
   * draft: 캘린더 UI 안에서만 사용하는 임시 선택 상태
   * - 사용자 확인을 누르기 전까지 외부 value에는 반영되지 않음
   */
  const [draft, setDraft] = useState<RangeValue>({
    start,
    end,
  });

  const draftStart = draft.start;
  const draftEnd = draft.end;

  /**
   * 사이즈에 따른 스타일 맵
   */
  const sizeStyles = {
    sm: {
      input: "min-w-[220px] h-8 text-xs",
      calendar: "w-full p-2 text-xs",
      dayHeight: "h-7",
      icon: "w-3.5 h-3.5",
      textSize: "text-[10px]",
    },
    md: {
      input: "min-w-[240px] h-10 text-sm",
      calendar: "w-full p-3 text-sm",
      dayHeight: "h-8",
      icon: "w-4 h-4",
      textSize: "text-[12px]",
    },
    lg: {
      input: "min-w-[300px] h-12 text-base",
      calendar: "w-full p-4 text-base",
      dayHeight: "h-10",
      icon: "w-5 h-5",
      textSize: "text-[14px]",
    },
  }[size];

  /** 이전 달로 이동 */
  const prevMonth = () => {
    let y = viewYear;
    let m = viewMonth - 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setViewYear(y);
    setViewMonth(m);
  };

  /** 다음 달로 이동 */
  const nextMonth = () => {
    let y = viewYear;
    let m = viewMonth + 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  };

  /**
   * 현재 연/월 기준으로 달력에 표시할 날짜 배열 생성
   *
   * @returns Date 또는 빈 칸(null)
   */
  const getDates = () => {
    const first = new Date(viewYear, viewMonth, 1);
    const last = new Date(viewYear, viewMonth + 1, 0);

    const dates: (Date | null)[] = [];

    // 달력 첫 주 앞부분 빈칸
    for (let i = 0; i < first.getDay(); i += 1) {
      dates.push(null);
    }
    // 날짜 채우기
    for (let d = 1; d <= last.getDate(); d += 1) {
      dates.push(new Date(viewYear, viewMonth, d));
    }
    return dates;
  };

  const dates = getDates();

  /**
   * 날짜 클릭 처리 (draft 상태만 변경)
   */
  const handlePick = (picked: Date) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraft({ start: picked, end: null });
      return;
    }

    // start만 있는 상태
    if (picked < draftStart) {
      setDraft({ start: picked, end: draftStart });
    } else {
      setDraft({ start: draftStart, end: picked });
    }
  };

  /** 범위 사이 날짜인지 체크 */
  const isInRange = (date: Date) => {
    if (!draftStart || !draftEnd) return false;
    return date >= draftStart && date <= draftEnd;
  };

  /** 날짜가 같은지 체크 */
  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return a.toDateString() === b.toDateString();
  };

  /** yyyy-mm-dd 포맷 */
  const format = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;

  /** 날짜 또는 placeholder */
  const formatOrStartPlaceholder = (d: Date | null) =>
    d ? format(d) : "2026-01-01";

  const formatOrEndPlaceholder = (d: Date | null) =>
    d ? format(d) : "2026-12-31";

  /** 인풋 박스에 표시될 텍스트 */
  const displayText = () =>
    `${formatOrStartPlaceholder(start)} ~ ${formatOrEndPlaceholder(end)}`;

  /** 팝업 위치 클래스 */
  const getPositionClass = () => {
    if (position === "top") return "bottom-full mb-2 left-0";
    if (position === "left") return "right-full mr-2 top-0";
    if (position === "right") return "left-full ml-2 top-0";
    return "top-full mt-2 left-0";
  };

  const popupPositionClass = getPositionClass();

  /**
   * 팝업 열고 닫기
   * - 열릴 때 draft를 현재 값으로 초기화함
   */
  const handleToggleOpen = () => {
    if (disabled) return;
    const nextOpen = !open;
    if (!open && nextOpen) {
      setDraft({ start, end });
    }
    setOpen(nextOpen);
  };

  /** 선택 취소 (전부 초기화) */
  const handleCancel = () => {
    onChange?.({ start: null, end: null });
    setDraft({ start: null, end: null });
    setOpen(false);
  };

  /** 선택 확정 */
  const handleConfirm = () => {
    const confirmed = draft.start && !draft.end
      ? { start: draft.start, end: draft.start }
      : draft;
    onChange?.(confirmed);
    setOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Input */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggleOpen}
        className={`
          ${sizeStyles.input}
          border border-input-border px-3 rounded-md bg-input-bg text-text-main flex items-center gap-2
          text-sm
          ${disabled ? "opacity-50 cursor-not-allowed" : "border-sub2 hover:bg-bg-hover"}
        `}
      >
        {showIcon && (
          <CalendarIcon className={`${sizeStyles.icon} text-text-placeholder`} />
        )}
        <span
          className={`flex-1 text-center whitespace-nowrap
          ${!start && !end && "text-text-placeholder"}
          `}
        >
          {displayText()}
        </span>
      </button>

      {/* Calendar */}
      {open && (
        <div
          className={`
            absolute z-10 bg-surface-raised border border-sub2 rounded-lg shadow-lg
            ${sizeStyles.calendar}
            ${popupPositionClass}
          `}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-bg-hover"
            >
              <ChevronLeft className={sizeStyles.icon} />
            </button>

            <div className="font-semibold">
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

          {/* 요일 */}
          <div className="grid grid-cols-7 text-center text-text-sub mb-1">
            {days.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* 날짜 */}
          <div className="grid grid-cols-7 text-center gap-y-1">
            {dates.map((d, i) => {
              if (!d) {
                return <div key={i} className={sizeStyles.dayHeight} />;
              }

              const selectedStart = isSameDay(d, draftStart);
              const selectedEnd = isSameDay(d, draftEnd);
              const inRange = isInRange(d);

              let classes = `${sizeStyles.dayHeight} flex items-center justify-center`;

              if (selectedStart && selectedEnd) {
                classes += " bg-main text-text-inverse rounded-md";
              } else if (selectedStart) {
                classes += " bg-main text-text-inverse rounded-l-md";
              } else if (selectedEnd) {
                classes += " bg-main text-text-inverse rounded-r-md";
              } else if (inRange) {
                classes += " bg-main/20";
              } else {
                classes += " hover:bg-main/10";
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

          {/* 취소 / 확인 */}
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
