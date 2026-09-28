import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationSize = "sm" | "md";

/**
 * - overlay: 테이블 하단 중앙 고정(absolute). 데이터 없으면 렌더 생략.
 * - flow: 문서 흐름에 두어 flex 레이아웃 안에서도 보임. 0건이어도 비활성 UI 표시.
 */
type PaginationVariant = "overlay" | "flow";

interface Props {
  page: number;
  total: number;
  onChange: (page: number) => void;
  visibleCount?: number;
  pageSize?: number;
  size?: PaginationSize;
  className?: string;
  variant?: PaginationVariant;
}

const Pagination = ({
  page,
  total,
  onChange,
  visibleCount = 5,
  pageSize = 10,
  size = "md",

  className = "",

  variant = "overlay",

}: Props) => {

  if (variant === "overlay" && total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const count = Math.max(1, Math.min(visibleCount, totalPages));

  const currentPage = Math.min(Math.max(1, page), totalPages);

  const start = Math.floor((currentPage - 1) / count) * count + 1;

  const end = Math.min(totalPages, start + count - 1);

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const base =
    "inline-flex items-center justify-center rounded-md border text-sm transition";

  const sizeClass = size === "sm" ? "h-7 min-w-7 px-1" : "h-8 min-w-8 px-2";

  const normal =
    "border-input-border text-text-main bg-bg-card hover:bg-bg-hover";

  const active = "!bg-main-active !text-text-inverse !border-main-active";

  const disabled = "opacity-40 pointer-events-none cursor-default";

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  const handlePrevGroup = () => {
    if (start === 1) return;
    onChange(start - 1);
  };

  const handleNextGroup = () => {
    if (end === totalPages) return;
    onChange(Math.min(totalPages, start + count));
  };

  const handleClickPage = (p: number) => {
    if (p !== currentPage) {
      onChange(p);
    }
  };

  const nav = (
    <nav
      className={`flex items-center gap-2 select-none`}
      aria-label="Pagination"
    >
      <button
        type="button"
        className={`${base} ${sizeClass} ${normal} ${
          start === 1 ? disabled : ""
        }`}
        onClick={handlePrevGroup}
        aria-label="Previous pages group"
        disabled={start === 1}
      >
        <ChevronLeft className={iconSize} />
      </button>

      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            type="button"
            onClick={() => handleClickPage(p)}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${sizeClass} ${isActive ? active : normal}`}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        className={`${base} ${sizeClass} ${normal} ${
          end === totalPages ? disabled : ""
        }`}
        onClick={handleNextGroup}
        aria-label="Next pages group"
        disabled={end === totalPages}
      >
        <ChevronRight className={iconSize} />
      </button>
    </nav>
  );

  if (variant === "flow") {
    return (
      <div className={`flex justify-center shrink-0 py-1 ${className}`}>
        {nav}
      </div>
    );
  }

  return (
    <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 ${className}`}>
      {nav}
    </div>
  );
};

export default Pagination;
