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
      ? "bg-bg-disabled text-text-disabled cursor-not-allowed"
      : "bg-primary hover:bg-primary-dark active:bg-primary-dark text-text-inverse",

    sub1: disabled
      ? "bg-bg-disabled text-text-disabled cursor-not-allowed"
      : "bg-bg-sub hover:bg-bg-hover active:bg-bg-active text-text-main",

    sub2: disabled
      ? "bg-bg-disabled text-text-disabled cursor-not-allowed"
      : "bg-bg hover:bg-bg-hover active:bg-bg-active text-text-main",

    danger: disabled
      ? "bg-red-300 text-white/40 cursor-not-allowed"
      : "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-base gap-2",
    lg: "px-5 py-2.5 text-lg gap-2.5",
  };

  const iconSizeClassMap: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSizeClass = iconSizeClassMap[size];

  const renderIcon = (icon: ReactNode) => {
    if (!icon || !isValidElement(icon)) return null;

    const element = icon as ReactElement<{ className?: string }>;
    const mergedClassName = [iconSizeClass, element.props.className]
      .filter(Boolean)
      .join(" ");

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
