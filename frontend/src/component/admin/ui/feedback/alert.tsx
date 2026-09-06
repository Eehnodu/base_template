import { AlertCircle, CheckCircle, Info, TriangleAlert, X } from "lucide-react";

/**
 * Alert의 타입
 * - info: 정보
 * - success: 성공
 * - warning: 경고
 * - error: 오류
 */
type AlertType = "info" | "success" | "warning" | "error";

/**
 * Alert의 사이즈 (텍스트/아이콘/패딩 비율 조절)
 */
type AlertSize = "sm" | "md" | "lg";

/**
 * Alert 컴포넌트 Props
 *
 * @property type          알럿 종류(info/success/warning/error)
 * @property size          알럿 크기(sm/md/lg)
 * @property title         알럿 제목 (굵은 텍스트)
 * @property description   제목 아래 설명 텍스트
 * @property closable      닫기(X) 버튼 표시 여부
 * @property onClose       closable=true일 때 X 버튼 클릭 핸들러
 * @property className     외부 래퍼 스타일 추가
 */
interface AlertProps {
  type?: AlertType;
  size?: AlertSize;
  title?: string;
  description?: string;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * Alert 컴포넌트
 *
 * - 타입(info/success/warning/error)에 따라 색상/아이콘 자동 변경
 * - 사이즈(sm/md/lg)에 맞춰 padding, text-size, icon-size 조정
 * - description 유무에 따라 아이콘 정렬 자동 조절
 * - closable 옵션으로 X 버튼 표시 가능
 *
 * @example 기본 사용
 * ```tsx
 * <Alert type="success" title="저장 완료" />
 * ```
 *
 * @example 설명 포함
 * ```tsx
 * <Alert
 *   type="warning"
 *   title="주의가 필요합니다"
 *   description="입력하신 정보에 문제가 있을 수 있습니다."
 * />
 * ```
 *
 * @example 닫기 버튼 포함
 * ```tsx
 * <Alert closable onClose={() => setShow(false)} />
 * ```
 */
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
    info: "bg-info-bg border-info text-info",
    success: "bg-success-bg border-success text-success",
    warning: "bg-warning-bg border-warning text-warning",
    error: "bg-error-bg border-error text-error",
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

  // 설명이 있으면 위 정렬, 없으면 세로 중앙 정렬
  const containerAlignClass = hasDescription ? "items-start" : "items-center";
  const iconWrapperClass = hasDescription ? sizeStyles.iconTop : "";

  return (
    <div
      className={`
        border rounded-md flex ${containerAlignClass} relative
        ${colors} ${sizeStyles.wrapper} ${className}
      `}
    >
      {/* ICON */}
      <span className={`flex-shrink-0 ${iconWrapperClass}`}>{icon}</span>

      {/* TEXT */}
      <div className="flex-1">
        {title && <div className={sizeStyles.title}>{title}</div>}
        {description && (
          <div className={`${sizeStyles.desc} opacity-90 leading-relaxed`}>
            {description}
          </div>
        )}
      </div>

      {/* CLOSE BUTTON */}
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
