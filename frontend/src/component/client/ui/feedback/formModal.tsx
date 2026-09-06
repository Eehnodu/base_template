// 역할: 폼 입력용 모달. 헤더/푸터 구성이 옵션이고 ESC·오버레이 클릭으로 닫힌다
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "@/component/client/ui/form/button";

type Size = "sm" | "md" | "lg";
type HeaderType = "center" | "left" | "none";
type FooterType = 0 | 1 | 2;
type FooterAlign = "left" | "center" | "right";

interface FormModalProps {
  open: boolean;
  onClose: () => void;

  headerType?: HeaderType;
  title?: string;
  description?: string;

  children?: ReactNode;
  size?: Size;
  className?: string;
  bodyClassName?: string;

  footerType?: FooterType;
  footerAlign?: FooterAlign;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  footerLeft?: ReactNode;

  closeOnOverlay?: boolean;
  showCloseIcon?: boolean;
}

const FormModal = ({
  open,
  onClose,
  headerType = "center",
  title,
  description,
  children,
  size = "md",
  className = "",
  bodyClassName = "",
  footerType = 2,
  footerAlign = "right",
  primaryText = "확인",
  secondaryText = "취소",
  onPrimary,
  onSecondary,
  primaryDisabled = false,
  footerLeft,
  closeOnOverlay = true,
  showCloseIcon = true,
}: FormModalProps) => {
  const sizeClass =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-lg" : "max-w-md";

  const footerJustify =
    footerAlign === "left"
      ? "justify-start"
      : footerAlign === "center"
        ? "justify-center"
        : "justify-end";

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
  };

  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    else onClose();
  };

  const showHeader = headerType !== "none" || showCloseIcon;

  const headerAlignClass =
    headerType === "center"
      ? "items-center text-center"
      : "items-start text-left";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-overlay"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-bg-card rounded-lg shadow-lg
          w-full ${sizeClass} mx-4
          max-h-[90vh] flex flex-col
          ${className}
        `}
        onClick={handleContentClick}
      >
        {showHeader && (
          <div
            className={`
              relative flex w-full
              ${headerType === "none" ? "p-2" : "px-4 py-3 border-b border-line"}
              ${headerAlignClass}
            `}
          >
            {headerType !== "none" && (
              <div className="flex-1 pr-6">
                {title && <div className="text-base font-medium text-text-main">{title}</div>}
                {description && (
                  <div className="text-xs text-text-sub">{description}</div>
                )}
              </div>
            )}

            {showCloseIcon && (
              <button
                type="button"
                onClick={onClose}
                className="
                  absolute top-2 right-2
                  p-1 rounded hover:bg-bg-hover
                "
              >
                <X className="w-4 h-4 text-text-sub" />
              </button>
            )}
          </div>
        )}

        <div
          className={`
            flex-1 min-h-0 px-4 py-3 overflow-auto
            ${bodyClassName}
          `}
        >
          {children}
        </div>

        {footerType !== 0 && (
          <div
            className={`
              px-4 py-3 border-t border-line flex gap-2 items-center
              ${footerLeft ? "justify-between" : footerJustify}
            `}
          >
            {footerLeft && <div>{footerLeft}</div>}
            <div className="flex gap-2 ml-auto">
              {footerType === 1 && (
                <Button variant="main" size="sm" onClick={handlePrimary} disabled={primaryDisabled}>
                  {primaryText}
                </Button>
              )}
              {footerType === 2 && (
                <>
                  <Button variant="sub2" size="sm" onClick={handleSecondary}>
                    {secondaryText}
                  </Button>
                  <Button variant="main" size="sm" onClick={handlePrimary} disabled={primaryDisabled}>
                    {primaryText}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormModal;
