// 역할: 커스텀 드롭다운. 바깥 클릭으로 닫히고, 목록 높이는 size 별 기본값 또는 listMaxHeight 를 따른다
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * SelectBox의 옵션 타입
 */
type Option = {
  label: string;
  value: string | number;
};

type Size = "sm" | "md" | "lg";
type Position = "top" | "bottom";

/**
 * SelectBox 컴포넌트 Props
 * @property listMaxHeight 옵션 리스트의 최대 높이 (입력 안 할 시 size별 기본값 적용)
 */
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

  /**
   * 사이즈별 스타일 및 기본 높이(maxHeight) 맵
   */
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

  /** 최종 적용될 최대 높이 결정: Prop 우선 -> 없으면 사이즈별 기본값 */
  const finalMaxHeight = listMaxHeight || sizeStyles.defaultMaxHeight;

  const selectedOption = options.find((o) => o.value === value);
  const popupPosition = position === "top" ? "bottom-full mb-1 left-0" : "top-full mt-1 left-0";

  // 바깥 클릭 감지. document 에 mousedown 을 걸어 다른 요소가 click 전파를 막아도 닫힌다
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
      {/* Input 영역 */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`border border-input-border rounded-md bg-input-bg w-full flex items-center justify-between text-text-main hover:bg-bg-hover whitespace-nowrap transition-colors
          ${sizeStyles.input}
          ${disabled ? "opacity-40 cursor-not-allowed" : "border-sub2"}
        `}
      >
        <span className={selectedOption ? "text-main" : "text-main/40"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={`${sizeStyles.arrow} text-main/40 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"
            }`}
        />
      </button>

      {/* 옵션 리스트 */}
      {open && (
        <div
          className={`
            absolute border border-line bg-surface-raised shadow-lg rounded-md z-50
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
                  value === opt.value ? "bg-sub1 text-white font-semibold" : "hover:bg-main/5 text-main",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))
          ) : (
            <div className={`${sizeStyles.item} flex items-center justify-center text-main/30`}>
              데이터가 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SelectBox;