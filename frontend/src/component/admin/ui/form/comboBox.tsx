import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface ComboBoxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

const ComboBox = ({ value, onChange, options, placeholder = "입력하거나 선택하세요", disabled = false }: ComboBoxProps) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        className={`flex items-center h-10 px-3 gap-2 rounded-md border bg-input-bg text-text-main transition-colors hover:border-line-strong ${
          disabled ? "opacity-40 cursor-not-allowed" : ""
        } ${open ? "border-line-strong" : "border-input-border"}`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 outline-none bg-transparent text-sm text-text-main placeholder:text-text-placeholder"
        />
        <button
          type="button"
          onClick={() => !disabled && setOpen((v) => !v)}
          disabled={disabled}
          className="shrink-0"
        >
          <ChevronDown className={`w-4 h-4 text-text-placeholder transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <div
          className="absolute top-full mt-1 left-0 w-full bg-surface-raised text-text-main border border-line rounded-md shadow-lg z-50 py-1.5 overflow-y-auto"
          style={{ maxHeight: "148px" }}
        >
          {filtered.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-center h-9 text-sm px-3 ${
                value === opt ? "bg-bg-active text-text-main" : "hover:bg-bg-hover"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComboBox;
