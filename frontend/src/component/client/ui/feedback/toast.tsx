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
  useEffect(() => {
    if (!open) return;
    if (!duration || duration <= 0) return;
    const timer = window.setTimeout(() => onClose(), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const colors = {
    info: "bg-info-bg text-info border border-info/30",
    success: "bg-success-bg text-success border border-success/30",
    warning: "bg-warning-bg text-warning border border-warning/30",
    error: "bg-error-bg text-error border border-error/30",
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
            className="ml-1 p-1 rounded hover:bg-bg-hover"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
