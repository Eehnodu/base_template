// 역할: 폼 입력용 모달. 헤더/푸터 구성이 옵션이고 ESC·오버레이 클릭으로 닫힌다
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "@/component/admin/ui/form/button";

/**
 * 모달 크기 타입
 */
type Size = "sm" | "md" | "lg";

/**
 * 헤더 정렬/타입
 * - center: 가운데 정렬
 * - left: 왼쪽 정렬
 * - none: 헤더 영역 숨김
 */
type HeaderType = "center" | "left" | "none";

/**
 * 푸터 버튼 개수 타입
 * - 0: 없음
 * - 1: 한 개(주 버튼만)
 * - 2: 두 개(보조 + 주 버튼)
 */
type FooterType = 0 | 1 | 2;

/**
 * 푸터 버튼 정렬
 */
type FooterAlign = "left" | "center" | "right";

/**
 * FormModal 컴포넌트 Props
 *
 * @property open            모달 열림 여부
 * @property onClose         모달 닫힘 시 호출되는 함수
 *
 * @property headerType      헤더 타입(center/left/none)
 * @property title           제목 텍스트
 * @property description     설명 텍스트
 *
 * @property children        모달 본문 영역에 렌더링할 내용
 * @property size            모달 전체 크기(sm/md/lg)
 * @property className       모달 컨테이너 커스텀 클래스
 * @property bodyClassName   바디 영역 커스텀 클래스
 *
 * @property footerType      푸터 버튼 개수 (0/1/2)
 * @property footerAlign     푸터 버튼 정렬(left/center/right)
 * @property primaryText     주 버튼 텍스트
 * @property secondaryText   보조 버튼 텍스트
 * @property onPrimary       주 버튼 클릭 핸들러
 * @property onSecondary     보조 버튼 클릭 핸들러
 *
 * @property closeOnOverlay  오버레이(배경) 클릭 시 닫을지 여부
 * @property showCloseIcon   우측 상단 X 아이콘 표시 여부
 */
interface FormModalProps {
  open: boolean;
  onClose: () => void;

  // header
  headerType?: HeaderType;
  title?: string;
  description?: string;

  // body
  children?: ReactNode;
  size?: Size;
  className?: string;
  bodyClassName?: string;

  // footer
  footerType?: FooterType;
  footerAlign?: FooterAlign;
  primaryText?: string;
  secondaryText?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
  primaryDisabled?: boolean;
  footerLeft?: ReactNode;

  // 기타
  closeOnOverlay?: boolean;
  showCloseIcon?: boolean;
}

/**
 * 폼/컨텐츠 입력용 모달 컴포넌트
 *
 * - 헤더 타입(center/left/none) 선택 가능
 * - 푸터 버튼 개수(0/1/2) 및 정렬 지정 가능
 * - ESC / 오버레이 클릭으로 닫기 지원
 *
 * @example 기본 사용
 * ```tsx
 * <FormModal open={open} onClose={handleClose} title="제목">
 *   내용...
 * </FormModal>
 * ```
 *
 * @example 확인/취소 버튼
 * ```tsx
 * <FormModal
 *   open={open}
 *   onClose={handleClose}
 *   footerType={2}
 *   primaryText="저장"
 *   secondaryText="취소"
 *   onPrimary={handleSave}
 * />
 * ```
 */
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

  /**
   * ESC 키로 모달 닫기
   */
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
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

  // header 렌더 여부
  const showHeader = headerType !== "none" || showCloseIcon;

  const headerAlignClass =
    headerType === "center"
      ? "items-center text-center"
      : "items-start text-left";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-bg-card text-text-main rounded-lg shadow-lg
          w-full ${sizeClass} mx-4
          max-h-[90vh] flex flex-col
          ${className}
        `}
        onClick={handleContentClick}
      >
        {/* HEADER */}
        {showHeader && (
          <div
            className={`
              relative flex w-full
              ${headerType === "none" ? "p-2" : "px-4 py-3 border-b border-line"}
              ${headerAlignClass}
            `}
          >
            {/* headerType=none이면 title/description 숨김 */}
            {headerType !== "none" && (
              <div className="flex-1 pr-6">
                {title && <div className="text-base font-medium">{title}</div>}
                {description && (
                  <div className="text-xs text-text-sub">{description}</div>
                )}
              </div>
            )}

            {/* X 버튼: 모든 headerType에서 동일한 위치 */}
            {showCloseIcon && (
              <button
                type="button"
                onClick={onClose}
                className="
                  absolute top-2 right-2
                  p-1 rounded hover:bg-bg-hover
                "
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* BODY */}
        <div
          className={`
            flex-1 min-h-0 px-4 py-3 overflow-auto
            ${bodyClassName}
          `}
        >
          {children}
        </div>

        {/* FOOTER */}
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
