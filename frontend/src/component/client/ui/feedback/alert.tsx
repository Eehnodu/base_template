import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from "lucide-react";

type AlertType = "info" | "success" | "warning" | "error";
type AlertSize = "sm" | "md" | "lg";

interface AlertProps {
  type?: AlertType;
  size?: AlertSize;
  title?: string;
  description?: string;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

const Alert = ({
  type = "info",
  size = "md",
  title,
  description,
  closable = false,
  onClose,
  className = "",
}: AlertProps) => {
  const colors = {
    info: "bg-blue-50 border-blue-400 text-blue-800",
    success: "bg-green-50 border-green-400 text-green-800",
    warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
    error: "bg-red-50 border-red-400 text-red-800",
  }[type];

  const sizeStyles = {
    sm: {
      wrapper: "px-3 py-2 text-xs gap-2",
      title: "text-xs font-medium",
      desc: "text-[11px]",
      icon: "w-3.5 h-3.5",
      iconTop: "mt-[1px]",
    },
    md: {
      wrapper: "px-4 py-3 text-sm gap-3",
      title: "text-sm font-medium",
      desc: "text-xs",
      icon: "w-4 h-4",
      iconTop: "mt-[2px]",
    },
    lg: {
      wrapper: "px-5 py-4 text-base gap-4",
      title: "text-base font-medium",
      desc: "text-sm",
      icon: "w-5 h-5",
      iconTop: "mt-[3px]",
    },
  }[size];

  const icon = {
    info: <Info className={sizeStyles.icon} />,
    success: <CheckCircle className={sizeStyles.icon} />,
    warning: <TriangleAlert className={sizeStyles.icon} />,
    error: <AlertCircle className={sizeStyles.icon} />,
  }[type];

  const hasDescription = !!description;
  const containerAlignClass = hasDescription ? "items-start" : "items-center";
  const iconWrapperClass = hasDescription ? sizeStyles.iconTop : "";

  return (
    <div
      className={`
        border rounded-md flex ${containerAlignClass} relative
        ${colors} ${sizeStyles.wrapper} ${className}
      `}
    >
      <span className={`flex-shrink-0 ${iconWrapperClass}`}>{icon}</span>

      <div className="flex-1">
        {title && <div className={sizeStyles.title}>{title}</div>}
        {description && (
          <div className={`${sizeStyles.desc} opacity-90 leading-relaxed`}>
            {description}
          </div>
        )}
      </div>

      {closable && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
