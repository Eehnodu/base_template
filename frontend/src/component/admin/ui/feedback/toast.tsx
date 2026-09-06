// 역할: 상단 중앙 토스트. duration 이 지나면 자동으로 onClose 를 호출한다
import { useEffect } from "react";
import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from "lucide-react";

/**
 * Toast 종류
 * - info: 정보
 * - success: 성공
 * - warning: 경고
 * - error: 오류
 */
type ToastType = "info" | "success" | "warning" | "error";

/**
 * Toast 컴포넌트 Props
 *
 * @property open         표시 여부
 * @property onClose      닫기 핸들러 (자동/수동 닫기 시 호출)
 *
 * @property type         토스트 유형 (info/success/warning/error)
 * @property title        제목 텍스트
 * @property description  설명 텍스트
 *
 * @property duration     자동 종료 시간(ms). 0 또는 undefined이면 자동 닫힘 없음
 * @property closable     X 버튼 표시 여부
 *
 * @property className    외부 wrapper 스타일 확장
 */
interface ToastProps {
  open: boolean;
  onClose: () => void;

  type?: ToastType;
  title?: string;
  description?: string;

  duration?: number;
  closable?: boolean;
  className?: string;
}

/**
 * Toast 컴포넌트
 *
 * 화면 상단 중앙에 잠시 나타나는 알림 UI입니다.
 *
 * - info/success/warning/error 타입 지원
 * - duration(ms) 설정 시 자동으로 사라짐
 * - closable=true이면 X 버튼으로 직접 닫기 가능
 * - 색상은 soft-tone (50 계열)으로 제공
 * - 기본 위치: top-center
 *
 * @example 기본 사용
 * ```tsx
 * <Toast
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="저장 완료"
 *   description="변경 사항이 저장되었습니다."
 * />
 * ```
 *
 * @example 자동 사라짐 2초
 * ```tsx
 * <Toast
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   duration={2000}
 * />
 * ```
 *
 * @example type 사용
 * ```tsx
 * <Toast
 *   open={open}
 *   onClose={close}
 *   type="error"
 *   title="오류 발생"
 * />
 * ```
 */
const Toast = ({
  open,
  onClose,
  type = "info",
  title,
  description,
  duration = 5000,
  closable = true,
  className = "",
}: ToastProps) => {
  // 자동 닫힘. 닫히거나 언마운트되면 clearTimeout 으로 뒤늦은 onClose 호출을 막는다.
  // onClose 가 매 렌더 새로 만들어지면 타이머가 재시작되므로 호출 측에서 useCallback 으로 고정하는 것이 안전
  useEffect(() => {
    if (!open) return;
    if (!duration || duration <= 0) return;

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  // Soft color tones
  const colors = {
    info: "bg-info-bg text-info border border-info/30",
    success: "bg-success-bg text-success border border-success/30",
    warning: "bg-warning-bg text-warning border border-warning/30",
    error: "bg-error-bg text-error border border-error/30",
  }[type];

  // Icons
  const icon = {
    info: <Info className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
    warning: <TriangleAlert className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
  }[type];

  const hasDescription = !!description;
  const alignClass = hasDescription ? "items-start" : "items-center";

  return (
    <div
      className={`
        fixed top-12 left-1/2 -translate-x-1/2 z-50
        ${className}
      `}
    >
      <div
        className={`
          min-w-[260px] max-w-sm
          rounded-md shadow-md
          px-4 py-3
          flex ${alignClass} gap-3
          ${colors}
        `}
      >
        {/* ICON */}
        <span className="flex-shrink-0 mt-[2px]">{icon}</span>

        {/* TEXT */}
        <div className="flex-1">
          {title && <div className="text-sm font-medium">{title}</div>}
          {description && (
            <div className="mt-0.5 text-xs opacity-90 leading-relaxed">
              {description}
            </div>
          )}
        </div>

        {/* CLOSE BUTTON */}
        {closable && (
          <button
            type="button"
            onClick={onClose}
            className="ml-1 p-1 rounded hover:bg-black/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
