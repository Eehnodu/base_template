import { useState } from "react";

type ToggleSize = "sm" | "md" | "lg";

interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: ToggleSize;
  disabled?: boolean;
  className?: string;
}

const Toggle = ({
  checked,
  defaultChecked = false,
  onChange,
  size = "md",
  disabled = false,
  className = "",
  ...props
}: ToggleProps) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  // checked 가 주어지면 Controlled, 아니면 defaultChecked 로 시작하는 내부 상태를 쓴다
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : internalChecked;

  const sizes: Record<ToggleSize, string> = {
    sm: "w-8 h-4",
    md: "w-10 h-5",
    lg: "w-12 h-6",
  };

  const circleSizes: Record<ToggleSize, string> = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleClick = () => {
    if (disabled) return;
    if (!isControlled) setInternalChecked(!isOn);
    onChange?.(!isOn);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        relative flex items-center rounded-full transition-colors
        ${sizes[size]}
        ${isOn ? "bg-primary" : "bg-gray-300"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      {...props}
    >
      <span
        className={`
          absolute bg-white rounded-full transition-transform
          ${circleSizes[size]}
          ${isOn ? "translate-x-full" : "translate-x-0"}
          ml-1
        `}
      />
    </button>
  );
};

export default Toggle;
