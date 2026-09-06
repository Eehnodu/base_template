import { useState } from "react";

type Size = "sm" | "md" | "lg";

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
  const [focused, setFocused] = useState(false);

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

  const borderColor = (() => {
    if (error) return "border-red-500";
    if (success) return "border-green-500";
    if (focused) return "border-line-focus";
    return "border-line hover:border-line-focus";
  })();

  return (
    <div
      className={`
        rounded-md border bg-input-bg w-full
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
          w-full bg-transparent outline-none resize-none
          ${sizeStyles.text}
        `}
      />
    </div>
  );
};

export default TextareaBox;
