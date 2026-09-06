type Size = "sm" | "md" | "lg";

interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: Size;
  className?: string;
}

const Checkbox = ({
  label = "",
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  className = "",
}: CheckboxProps) => {
  const sizeStyles = {
    sm: { box: "w-3 h-3", text: "text-xs", gap: "gap-1.5" },
    md: { box: "w-4 h-4", text: "text-sm", gap: "gap-2" },
    lg: { box: "w-5 h-5", text: "text-base", gap: "gap-2.5" },
  }[size];

  const handleChange = () => {
    if (disabled) return;
    onChange?.(!checked);
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
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={`
          ${sizeStyles.box}
          accent-primary
          border-gray-400 rounded
        `}
      />

      {label && <span className={sizeStyles.text}>{label}</span>}
    </label>
  );
};

export default Checkbox;
