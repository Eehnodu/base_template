// 역할: 공통 텍스트 입력. 아이콘 슬롯과 error/success 테두리 상태를 가진다
import { useState } from "react";

type Size = "sm" | "md" | "lg";

type InputType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "search";

interface InputBoxProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: InputType;
  className?: string;
  size?: Size;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftIconClick?: () => void;
  onRightIconClick?: () => void;
  full?: boolean;
  width?: number; // full=false 일 때 px 고정 너비
  onBlur?: () => void;
  iconWidth?: number;
}

const InputBox = ({
  value = "",
  onChange,
  placeholder = "입력하세요",
  type = "text",
  className = "",
  size = "md",
  disabled = false,
  success = false,
  error = false,
  errorMessage = "",
  leftIcon,
  rightIcon,
  full = true,
  width,
  onBlur,
  iconWidth = 4,
}: InputBoxProps) => {
  const [focused, setFocused] = useState(false);

  const sizeStyles = {
    sm: {
      wrapper: "h-8 text-xs px-2 gap-1",
      input: "text-xs",
      icon: "w-3 h-3",
    },
    md: {
      wrapper: "h-10 text-sm px-3 gap-2",
      input: "text-sm",
      icon: `w-${iconWidth} h-4`,
    },
    lg: {
      wrapper: "h-12 text-base px-3 gap-3",
      input: "text-base",
      icon: "w-5 h-5",
    },
  }[size];

  const borderColor = (() => {
    if (error) return "border-errorColor";
    if (success) return "border-green-500";
    if (focused) return "border-line-focus";
    return "border hover:border-line-focus";
  })();

  const widthStyle = full ? "w-full" : width ? undefined : "inline-flex";

  // className 에 배경색이 오면 기본 배경을 빼서 클래스 충돌을 막는다
  const baseBg = className.includes("bg-") ? "" : "bg-input-bg";

  return (
    <>
      <div
        className={`
        flex items-center rounded-md border
        transition-colors
        ${baseBg}
        ${widthStyle}
        ${sizeStyles.wrapper}
        ${borderColor}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-text"}
        ${className}
        `}
        style={!full && width ? { width: `${width}px` } : undefined}
        onClick={() => !disabled && setFocused(true)}
      >
        {leftIcon && (
          <div
            className={`
          flex items-center justify-center
          ${sizeStyles.icon}
          leading-none shrink-0
          `}
          >
            {leftIcon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          className={`
          flex-1 min-w-0 outline-none bg-transparent
          ${sizeStyles.input}
          `}
        />

        {rightIcon && (
          <div
            className={`
            flex items-center justify-center
            ${sizeStyles.icon}
            leading-none shrink-0
            `}
          >
            {error ? (
              <div className="flex cursor-none rounded-full bg-[#CE3535] w-4 h-4 items-center justify-center text-white">
                <span>!</span>
              </div>
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
      {error && (
        <span className="text-[12px] text-errorColor">{errorMessage}</span>
      )}
    </>
  );
};

export default InputBox;
