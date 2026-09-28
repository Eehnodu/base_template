import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = {
  label: string;
  value: string | number;
};

type Size = "sm" | "md" | "lg";
type Position = "top" | "bottom";

interface SelectBoxProps {
  value?: string | number | null;
  onChange?: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  size?: Size;
  position?: Position;
  disabled?: boolean;
  listMaxHeight?: string;
}

const SelectBox = ({
  value,
  onChange,
  options,
  placeholder = "선택하세요",
  className = "",
  size = "md",
  position = "bottom",
  disabled = false,
  listMaxHeight,
}: SelectBoxProps) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const sizeStyles = {
    sm: {
      input: "h-8 text-xs px-2",
      item: "h-7 text-xs px-2",
      list: "text-xs py-1",
      arrow: "w-3 h-3",
      defaultMaxHeight: "124px",
    },
    md: {
      input: "h-10 text-sm px-3",
      item: "h-9 text-sm px-3",
      list: "text-sm py-1.5",
      arrow: "w-4 h-4",
      defaultMaxHeight: "192px",
    },
    lg: {
      input: "h-12 text-base px-3",
      item: "h-10 text-base px-3",
      list: "text-base py-2",
      arrow: "w-5 h-5",
      defaultMaxHeight: "172px",
    },
  }[size];

  const finalMaxHeight = listMaxHeight || sizeStyles.defaultMaxHeight;

  const selectedOption = options.find((o) => o.value === value);
  const popupPosition = position === "top" ? "bottom-full mb-1 left-0" : "top-full mt-1 left-0";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val: string | number) => {
    onChange?.(val);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className={`relative inline-block w-full ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`border rounded-md bg-input-bg w-full flex items-center justify-between hover:bg-bg-hover whitespace-nowrap transition-colors
          ${sizeStyles.input}
          ${disabled ? "opacity-40 cursor-not-allowed" : "border-line"}
        `}
      >
        <span className={selectedOption ? "text-text-main" : "text-text-placeholder"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={`${sizeStyles.arrow} text-text-placeholder transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"
            }`}
        />
      </button>

      {open && (
        <div
          className={`
            absolute border border-line bg-bg-card shadow-lg rounded-md z-50
            min-w-full overflow-y-auto scrollbar-hide
            ${sizeStyles.list}
            ${popupPosition}
          `}
          style={{ maxHeight: finalMaxHeight }}
        >
          {options.length > 0 ? (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={[
                  sizeStyles.item,
                  "w-full text-center transition-colors",
                  value === opt.value ? "bg-primary text-text-inverse font-semibold" : "hover:bg-bg-hover text-text-main",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className={`${sizeStyles.item} flex items-center justify-center text-text-placeholder`}>
              데이터가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectBox;
