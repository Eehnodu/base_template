// 역할: 확인/취소형 모달. ESC·오버레이 클릭으로 닫힌다
import { useEffect, useRef, type MouseEvent } from "react";
import Button from "@/component/admin/ui/form/button";

/**
 * 모달 크기 타입
 */
type Size = "sm" | "md" | "lg";

/**
 * 버튼 개수 타입
 * - 0: 버튼 없음
 * - 1: 기본 버튼 한 개
 * - 2: 보조 + 기본 버튼 두 개
 */
type ButtonCount = 0 | 1 | 2;

/**
 * 기본 알럿/확인용 Modal 컴포넌트 Props
 *
 * @property open            모달 열림 여부
 * @property onClose         모달 닫기 핸들러
 *
 * @property title           제목(필수)
 * @property description     설명(선택)
 *
 * @property size            모달 크기(sm/md/lg)
 *
 * @property buttonCount     버튼 개수 (0/1/2)
 * @property primaryText     기본(확인) 버튼 텍스트
 * @property secondaryText   보조(취소) 버튼 텍스트
 * @property onPrimary       기본 버튼 클릭 시 호출
 * @property onSecondary     보조 버튼 클릭 시 호출
 *
 * @property closeOnOverlay  오버레이 클릭 시 닫을지 여부
 * @property className       모달 컨테이너에 추가할 클래스
 * @property bodyClassName   내용 래퍼에 추가할 클래스
 */
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

/**
 * 단순 확인/취소 타입의 기본 Modal 컴포넌트
 *
 * - 제목 + 설명 + 버튼 한 줄 구성
 * - ESC / 오버레이 클릭으로 닫기 지원
 * - 버튼 개수(0/1/2) 및 텍스트 커스터마이징 가능
 *
 * @example 기본 사용
 * ```tsx
 * <Modal
 *   open={open}
 *   onClose={handleClose}
 *   title="저장하시겠습니까?"
 *   description="변경 사항이 적용됩니다."
 * />
 * ```
 *
 * @example 버튼 한 개만
 * ```tsx
 * <Modal
 *   open={open}
 *   onClose={handleClose}
 *   title="완료되었습니다."
 *   buttonCount={1}
 *   primaryText="확인"
 * />
 * ```
 */
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
    else onClose();
  };

  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    else onClose();
  };

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40"
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-bg-card text-text-main rounded-lg shadow-lg
          ${sizeClass} p-4 py-2
          flex flex-col
          ${className}
        `}
        onClick={handleContentClick}
      >
        {/* title / description / button 한 컬럼으로 */}
        <div
          className={`
            px-5 pt-5 pb-4
            flex flex-col items-center text-center gap-3
            ${bodyClassName}
          `}
        >
          {icon && <div>{icon}</div>}
          {/* Title */}
          <div className="text-text-main font-medium">{title}</div>

          {/* Description */}
          {description && (
            <div className="text-sm text-text-sub whitespace-pre-wrap w-full">
              {description}
            </div>
          )}

          {/* Buttons */}
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
