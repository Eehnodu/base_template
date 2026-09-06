// 역할: 상단 중앙 토스트. duration 이 지나면 자동으로 onClose 를 호출한다
import { useEffect } from "react";
import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from "lucide-react";

type ToastType = "info" | "success" | "warning" | "error";

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
    const timer = window.setTimeout(() => onClose(), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const colors = {
    info: "bg-blue-50 text-blue-800 border border-blue-200",
    success: "bg-green-50 text-green-800 border border-green-200",
    warning: "bg-yellow-50 text-yellow-800 border border-yellow-300",
    error: "bg-red-50 text-red-800 border border-red-200",
  }[type];

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
        <span className="flex-shrink-0 mt-[2px]">{icon}</span>

        <div className="flex-1">
          {title && <div className="text-sm font-medium">{title}</div>}
          {description && (
            <div className="mt-0.5 text-xs opacity-90 leading-relaxed">
              {description}
            </div>
          )}
        </div>

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
