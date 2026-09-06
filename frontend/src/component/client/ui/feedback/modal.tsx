// 역할: 확인/취소형 모달. ESC·오버레이 클릭으로 닫힌다
import { useEffect, useRef, type MouseEvent } from "react";
import Button from "@/component/client/ui/form/button";

type Size = "sm" | "md" | "lg";
type ButtonCount = 0 | 1 | 2;

interface ModalProps {
  open: boolean;
  onClose?: () => void;

  title: string;
  description?: React.ReactNode;

  size?: Size;

  buttonCount?: ButtonCount;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;

  closeOnOverlay?: boolean;
  className?: string;
  bodyClassName?: string;

  icon?: React.ReactNode;

  primaryFull?: boolean;
  primaryDisabled?: boolean;
  primaryVariant?: "main" | "sub1" | "sub2" | "danger";
}

const Modal = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  buttonCount = 2,
  primaryText = "확인",
  secondaryText = "취소",
  onPrimary,
  onSecondary,
  closeOnOverlay = true,
  className = "",
  bodyClassName = "",
  icon,
  primaryFull = false,
  primaryDisabled = false,
  primaryVariant = "main",
}: ModalProps) => {
  const sizeClass =
    size === "sm"
      ? "min-w-56 max-w-64"
      : size === "lg"
        ? "min-w-80 max-w-[32rem]"
        : "min-w-[361px] p-5";

  const mouseDownOnOverlay = useRef(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // 모달 안에서 드래그를 시작해 바깥에서 마우스를 떼면 click 이 오버레이에서 발생한다.
  // mousedown 위치까지 확인해 그 경우에는 닫히지 않게 한다
  const handleOverlayMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    mouseDownOnOverlay.current = e.target === e.currentTarget;
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlay) return;
    if (mouseDownOnOverlay.current && e.target === e.currentTarget) onClose();
  };

  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handlePrimary = () => {
    if (onPrimary) onPrimary();
    else onClose();
  };

  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-bg-card rounded-lg shadow-lg
          ${sizeClass} p-4 py-2
          flex flex-col
          ${className}
        `}
        onClick={handleContentClick}
      >
        <div
          className={`
            px-5 pt-5 pb-4
            flex flex-col items-center text-center gap-3
            ${bodyClassName}
          `}
        >
          {icon && <div>{icon}</div>}

          <div className="text-text-main font-medium">{title}</div>

          {description && (
            <div className="text-sm text-text-sub whitespace-pre-wrap w-full">
              {description}
            </div>
          )}

          {buttonCount > 0 && (
            <div className="mt-2 flex justify-center gap-5 w-full">
              <div className={buttonCount === 2 ? "flex-1" : ""}>
                <Button
                  full={buttonCount === 2 ? true : primaryFull}
                  variant={primaryVariant}
                  className="text-sm"
                  onClick={handlePrimary}
                  disabled={primaryDisabled}
                >
                  {primaryText}
                </Button>
              </div>
              {buttonCount === 2 && (
                <div className="flex-1">
                  <Button
                    full
                    variant="sub1"
                    className="text-sm"
                    onClick={handleSecondary}
                  >
                    {secondaryText}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
