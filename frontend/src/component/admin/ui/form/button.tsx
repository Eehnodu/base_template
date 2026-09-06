// 역할: 공통 버튼. leftIcon/rightIcon 은 cloneElement 로 size 에 맞는 크기 클래스를 덧입힌다
import {
  ButtonHTMLAttributes,
  ReactNode,
  ReactElement,
  cloneElement,
  isValidElement,
} from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "main" | "sub1" | "sub2" | "danger";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  full?: boolean;
  className?: string;
}

const Button = ({
  children,
  variant = "main",
  size = "md",
  leftIcon = null,
  rightIcon = null,
  full = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const base =
    "inline-flex shrink-0 items-center justify-center rounded-lg transition-colors";

  const width = full ? "w-full" : "w-max min-w-fit";

  const variants = {
    main: disabled
      ? "bg-main-active text-text-inverse/40 cursor-not-allowed"
      : "bg-main hover:bg-main-hover active:bg-main-active text-text-inverse",

    sub1: disabled
      ? "bg-sub1-active text-white/40 cursor-not-allowed"
      : "bg-sub1 hover:bg-sub1-hover active:bg-sub1-active text-white",

    sub2: disabled
      ? "border border-line-strong bg-sub2-active text-black/30 cursor-not-allowed"
      : "border border-line-strong bg-sub2 hover:bg-sub2-hover active:bg-sub2-active text-black",

    danger: disabled
      ? "bg-red-300 text-white/40 cursor-not-allowed"
      : "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-5 py-2.5 text-lg gap-2.5",
  };

  // 버튼 size 에 맞는 아이콘 크기
  const iconSizeClassMap: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "w-4 h-4", // 16px
    md: "w-5 h-5", // 20px
    lg: "w-6 h-6", // 24px
  };

  const iconSizeClass = iconSizeClassMap[size];

  const renderIcon = (icon: ReactNode) => {
    if (!icon || !isValidElement(icon)) return null;

    const element = icon as ReactElement<{ className?: string }>;
    const mergedClassName = [iconSizeClass, element.props.className]
      .filter(Boolean)
      .join(" ");

    // 기존 아이콘에 className이 있어도 합쳐서 넘겨줌
    return cloneElement(element, {
      className: mergedClassName,
    });
  };

  return (
    <button
      disabled={disabled}
      className={`
        ${base}
        ${width}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? "opacity-60 pointer-events-none" : ""}
        ${className}
      `}
      {...props}
    >
      {leftIcon && (
        <span className="flex items-center">{renderIcon(leftIcon)}</span>
      )}
      {children}
      {rightIcon && (
        <span className="flex items-center">{renderIcon(rightIcon)}</span>
      )}
    </button>
  );
};

export default Button;
