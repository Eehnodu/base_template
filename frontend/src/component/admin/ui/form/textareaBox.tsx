import { useState } from "react";

/**
 * TextareaBox 크기 타입
 */
type Size = "sm" | "md" | "lg";

/**
 * TextareaBox 컴포넌트 Props
 *
 * @property value        입력된 값
 * @property onChange     값 변경 시 호출되는 콜백
 * @property placeholder  표시할 placeholder
 * @property className    외부 wrapper 커스텀 클래스
 * @property size         입력창 크기(sm/md/lg)
 * @property disabled     비활성화 여부
 * @property success      성공 상태(border 초록)
 * @property error        오류 상태(border 빨강)
 * @property rows         textarea 기본 줄 수
 */
interface TextareaBoxProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: Size;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  rows?: number;
}

/**
 * 재사용 가능한 Textarea 컴포넌트
 *
 * - 상태(success/error)에 따라 border 색상 변경
 * - 크기(sm/md/lg)에 따라 패딩, 폰트 크기, 최소 높이 자동 조절
 * - resize 불가능한 고정형 textarea
 *
 * @example 기본 사용
 * ```tsx
 * <TextareaBox
 *   value={text}
 *   onChange={setText}
 * />
 * ```
 *
 * @example 상태 표시
 * ```tsx
 * <TextareaBox success value="완료됨" />
 * <TextareaBox error value="오류 발생" />
 * ```
 *
 * @example 큰 사이즈 + 5줄
 * ```tsx
 * <TextareaBox size="lg" rows={5} />
 * ```
 */
const TextareaBox = ({
  value = "",
  onChange,
  placeholder = "내용을 입력하세요",
  className = "",
  size = "md",
  disabled = false,
  success = false,
  error = false,
  rows = 3,
}: TextareaBoxProps) => {
  /**
   * focus 활성화를 위한 내부 상태
   */
  const [focused, setFocused] = useState(false);

  /**
   * size에 따른 스타일 맵
   */
  const sizeStyles = {
    sm: {
      wrapper: "px-2 py-1.5",
      text: "text-xs",
      minHeight: "min-h-[72px]",
    },
    md: {
      wrapper: "px-3 py-2",
      text: "text-sm",
      minHeight: "min-h-[96px]",
    },
    lg: {
      wrapper: "px-3 py-3",
      text: "text-base",
      minHeight: "min-h-[120px]",
    },
  }[size];

  /**
   * border 색 상태 계산
   */
  const borderColor = (() => {
    if (error) return "border-error";
    if (success) return "border-success";
    if (focused) return "border-line-focus";
    return "border-input-border hover:border-line-strong";
  })();

  return (
    <div
      className={`
        flex flex-col rounded-md border bg-input-bg w-full text-text-main placeholder:text-text-placeholder
        transition-colors
        ${sizeStyles.wrapper}
        ${sizeStyles.minHeight}
        ${borderColor}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-text"}
        ${className}
      `}
      onClick={() => !disabled && setFocused(true)}
    >
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          h-full w-full flex-1 bg-transparent outline-none resize-none
          ${sizeStyles.text}
        `}
      />
    </div>
  );
};

export default TextareaBox;
