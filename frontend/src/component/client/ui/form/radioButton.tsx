type Size = "sm" | "md" | "lg";

interface RadioButtonProps {
  label?: string;
  name?: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: Size;
  className?: string;
}

const RadioButton = ({
  label = "",
  name,
  value,
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}: RadioButtonProps) => {
  const sizeStyles = {
    sm: { radio: "w-3 h-3", text: "text-xs", gap: "gap-1.5" },
    md: { radio: "w-4 h-4", text: "text-sm", gap: "gap-2" },
    lg: { radio: "w-5 h-5", text: "text-base", gap: "gap-2.5" },
  }[size];

  const handleChange = () => {
    if (disabled) return;
    onChange?.(value);
  };

  return (
    <label
      className={`
        inline-flex items-center select-none
        ${sizeStyles.gap}
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={`
          ${sizeStyles.radio}
          accent-primary
          border-gray-400
        `}
      />

      {label && <span className={sizeStyles.text}>{label}</span>}
    </label>
  );
};

export default RadioButton;
